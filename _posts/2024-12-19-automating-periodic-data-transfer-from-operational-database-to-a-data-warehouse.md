---
layout: post
title: Automating Periodic Data Transfer from an Operational Database to a Data Warehouse
author: [ dariusz.zbyrad ]
tags: [ gcp, bigquery, bigdata ]
---

Many companies face the challenge of efficiently processing large datasets for analytics.
Using an operational database for such purposes can lead to performance issues or, in extreme cases, system failures.
This highlights the need to transfer data from operational databases to data warehouses.
This approach allows heavy analytical queries without overburdening transactional systems and supports shorter retention periods in production databases.

## Requirements

For this article, let’s assume the following:

-   **Source/Operational Database**: PostgreSQL
-   **Target/Data Warehouse**: BigQuery
-   **Table Structure**: Rows are immutable - added sequentially and cannot be modified or deleted.
-   **Connection Restrictions**: Google Cloud Platform (GCP) cannot connect directly to PostgreSQL.
-   **Data Delay**: New rows in the source database must appear in BigQuery within two hours.
-   **Consistency**: Every row saved in PostgreSQL must appear in BigQuery. Losing even a single row is unacceptable.

## Potential Solutions

### Built-in GCP Tools

Google offers several solutions for automating the data transfer:

1.  **Google Dataflow** (based on Apache Beam): Allows creating data pipelines (ETL/ELT) to synchronize data between PostgreSQL and BigQuery.
2.  **BigQuery Data Transfer Service (BDTS)**: Automates data imports from various sources to BigQuery.
However, since it doesn’t natively support PostgreSQL, you’d need an intermediary step,
such as exporting data to a CSV file on Cloud Storage and then importing it into BigQuery.
3.  **Datastream (CDC)**: A change data capture service that supports PostgreSQL as a source for real-time data streaming.

Due to our inability to connect GCP directly to PostgreSQL (even via network tunneling like Cloud VPN or Cloud Interconnect),
these options are not viable. In scenarios where such a connection is possible, one of these tools could be considered.

### Outbox pattern

The **Outbox Pattern** can be implemented using tools like [**Debezium**](https://debezium.io/),
which captures database changes (CDC) and streams them to [**Apache Kafka**](https://kafka.apache.org/).

**How Debezium Works with PostgreSQL**:

 - Uses PostgreSQL’s Write-Ahead Logs (WAL) to track table changes.
 - Can monitor specific tables (e.g., an `outbox` table).
 - Publishes changes to Kafka topics as JSON events.

**Example Workflow**:

1. The `outbox` table acts as an event buffer.
2. Debezium monitors the `outbox` table and sends events to Kafka.
3. Kafka consumers process these events and write data to BigQuery.

Although Debezium offers real-time streaming, which is excellent for low-latency applications, it’s not ideal for our requirements.
Ensuring 100% data consistency between source and destination is critical.
Streaming approaches like Debezium can introduce complexities in handling connection failures or consumer errors,
potentially resulting in data loss or duplication. While compensatory mechanisms exist, they increase system complexity.

In contrast, a batch processing approach provides greater control over data transfers, ensuring atomicity and accuracy for each batch.
Accepting a delay of a few minutes to hours is reasonable since:

-   Data is copied atomically within a specific time range.
-   We can verify data consistency between systems after each transfer.

### “Kopiowaczka“ Solution

The chosen solution, called **Kopiowaczka** (Polish for “the copier“), was named humorously by the development team.
The name reflects its core functionality: repeatedly copying data from one source to another in a reliable and systematic way.
“Kopiowaczka“ emerged as an internal nickname during early discussions, as the team joked about the simplicity yet monotony of its purpose — “just copy and copy“.
The name stuck, eventually becoming an official term used in documentation and team conversations.

The solution is based on cyclic or manual data transfer tasks. Each task specifies the table to copy and the date range of the data.
A dedicated task table tracks the process and its status:

```sql
CREATE TABLE task_table (
    id UUID PRIMARY KEY,
    table_name VARCHAR NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    status VARCHAR CHECK (status IN ('NEW', 'IN_PROGRESS', 'SUCCESS', 'ERROR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

New tasks start with a `NEW` status. A cyclic scheduler processes tasks with this status. The process involves:

1.  Extracting data from PostgreSQL and saving it as a CSV file.
2.  Uploading the CSV file to Google Cloud Storage (GCS).
3.  Importing the CSV data into a temporary BigQuery table.
4.  Copying data from the temporary table to the final table in BigQuery, ensuring no duplicates (via `LEFT JOIN`).
5.  Verifying the record count between the source and destination tables.

If an error occurs at any stage (e.g., exceptions or record count mismatches), the task is retried up to three times before being marked as `ERROR`.
Failed tasks trigger monitoring alerts to notify the appropriate teams.


**Step 1: Extract Data from PostgreSQL to CSV**

Data is queried from PostgreSQL based on the table name and date range, then saved as a CSV file:

```java
String query = "SELECT * FROM ? WHERE date_column BETWEEN ? AND ?";

try (Connection connection = DriverManager.getConnection(connectionUrl);
    PreparedStatement stmt = connection.prepareStatemen

    stmt.setString(1, tableNameToCopy);
    stmt.setDate(2, startDate);
    stmt.setDate(3, endDate);

    try (ResultSet rs = stmt.executeQuery();
        BufferedWriter writer = Files.newBufferedWriter(Paths.get(csvFilePath))) {
        CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(rs));

        int batchSize = 10000;
        int rowCount = 0;

        while (rs.next()) {
            csvPrinter.printRecord(
                rs.getString(1), // Remember to adjust the number and types of columns
                rs.getString(2),
                rs.getString(3)
            if (rowCount % batchSize == 0) {
                csvPrinter.flush();
                System.out.println("Flushed " + rowCount + " rows.");
            }
        csvPrinter.flush();
    }
} catch (Exception e) {
    retryOrMarkAsError(taskId);
}
```

**Step 2: Upload CSV to Google Cloud Storage**

The CSV file is uploaded to GCS with minimal code:

```java
BlobInfo blobInfo = BlobInfo.newBuilder(gcsBucketName, csvFileName).build();
storage.create(blobInfo, Files.readAllBytes(Paths.get(csvFilePath)));
```

**Step 3: Import CSV into a Temporary BigQuery Table**

The CSV is imported into a temporary BigQuery table:

```java
// Creating a temporary table `temp_table` in BigQuery according to the data schema, if the table needs to be created each time

TableId tempTableId = TableId.of(datasetName, "temp_table");
String gcsPath = String.format("gs://%s/%s", stagingBucketName, csvFileName);

LoadJobConfiguration loadConfig = LoadJobConfiguration.builder(tempTableId, gcsPath)
    .setFormatOptions(FormatOptions.csv())
    .setNullMarker("null")
    .setJobTimeoutMs(loadJobTimeout())
    .build();

Job loadJob = bigquery.create(JobInfo.of(loadConfig));
loadJob.waitFor();

if (!job.isDone()) {
   retryOrMarkAsError(taskId);
}
```

**Step 4: Copy Data to the Final Table (Avoiding Duplicates)**

Data can be copied with overlap, or even repeatedly, for the same date range. However, the final table in BigQuery should not contain duplicates.
Unfortunately, BigQuery does not have a built-in mechanism to enforce a unique key constraint.
There are various ways to ensure that duplicates are avoided.
One effective approach is to copy the data into a temporary table, as done in the previous step.
Then, use a `LEFT JOIN` operation to insert only those records that do not already exist in the final table.

```sql
INSERT INTO final_table
SELECT * FROM temp_table AS t
LEFT JOIN final_table AS f ON t.unique_key = f.unique_key
WHERE f.unique_key IS NULL;
```

**Step 5: Verify Record Count**

After copying the data to the final table in BigQuery, the next step is to verify the correctness of the entire transfer process.
To ensure that all data has been accurately copied, the number of records in the source PostgreSQL table is
compared with the number in the target BigQuery table. This comparison is done for the specified date range. Alternatively,
verification can be done by summing values in selected columns. The choice of verification method depends on the nature and structure of the data.

This verification step is intended to catch discrepancies between the source and destination. While the issue of mismatched row counts is rare,
it could happen if someone schedules a manual migration process with a `date_to` date in the future.
If new rows are inserted into PostgreSQL after the data copy but before verification, PostgreSQL may contain more rows than BigQuery,
causing the verification to fail. However, such cases are uncommon and typically easy to avoid with careful scheduling or improved validation.

```java
// PostgreSQL count
String postgresCountQuery = "SELECT COUNT(*) FROM ? WHERE date_column BETWEEN ? AND ?";
PreparedStatement stmt = postgresConnection.prepareStatement(postgresCountQuery);
stmt.setString(1, tableNameToCopy);
stmt.setDate(2, startDate);
stmt.setDate(3, endDate);

ResultSet rs = stmt.executeQuery();
int postgresCount = rs.next() ? rs.getInt(1) : 0;

// BigQuery count
String bigQueryCountQuery = String.format(
    "SELECT COUNT(*) AS row_count FROM `%s` WHERE date_column BETWEEN @start_date AND @end_date",
    bigQueryFinalTable
);

QueryParameterValue startDateParam = QueryParameterValue.string(startDate.toString());
QueryParameterValue endDateParam = QueryParameterValue.string(endDate.toString());
QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(bigQueryCountQuery)
    .addNamedParameter("start_date", startDateParam)
    .addNamedParameter("end_date", endDateParam)
    .build();

TableResult bigQueryResult = bigquery.query(queryConfig);
long bigQueryCount = bigQueryResult.iterateAll().iterator().next().get("row_count").getLongValue();

if (postgresCount == bigQueryCount) {
    updateTaskStatus(taskId, "SUCCESS");
} else {
    retryOrMarkAsError(taskId);
}
```

## Conclusion

This solution provides full control over the data transfer processes, minimizes risks of inconsistencies, and is more stable than streaming approaches.
While the described implementation is conceptual and requires adaptation to specific business needs, it emphasizes reliability and simplicity,
making it suitable for many real-world scenarios.
