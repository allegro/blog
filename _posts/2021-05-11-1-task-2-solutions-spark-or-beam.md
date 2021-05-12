---
layout: post
title: 1 Task - 2 Solutions: Apache Spark or Apache Beam?
author: [yevgeniya.li]
tags: [tech, Apache Spark, Apache Beam, BigFlow, BigData, GCP]
---
Some time ago, our team faced the issue to move an existing Apache Spark job from an on-premise Hadoop cluster to public cloud. While working on the transition
we came across another way to process data that is Apache Beam. We were curious whether this tool has more advantages in comparison to traditional Apache Spark.
We wanted to find the relatively quick answer with minimal effort. Hence, we built two projects to process the same data using these technologies.  Below you
can get to know the architecture of the jobs written in Apache Spark and Apache Beam.

* Given: 4 input tables (~2.5 Tb/day).
* Task: join and clean data.
* Result: 4 output tables.

![scripting](/img/articles/2021-05-11-1-task-2-solutions-spark-or-beam/bigdata-projects-architecture.png)

Note: Below I described our solution and used tools and technologies which do not pretend to be 100% the right approach so your results might be different.

#### Programming model

<table>
    <tr>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>
        Based on the in-memory MapReduce model evolutioned from Hadoop MapReduce. This fact forces developers to take care more of executors memory, as
        mapping operations occur there. And you still need to remember about shuffling at the Join moment and how to split data to make right repartitioning
        (too big data chunk causes overwhelmness of machines, too small means more shuffling over the net). How did we tune this job? The only way we knew how
        to do it was applying some “a-la best practices” Spark configurations, running the job with production data volume (just imagine how it reflects machine
        resource cost!), looking at the metrics and crossing fingers that executors will stand. Finally after n-th attempts it started working.
        </td>
        <td>
        It pretends to be a unified processing model. What does it mean? Apache Beam is based on so-called abstract pipelines that can be run on different
        executors (you can even switch to the Spark execution environment). In our case we're using a DataFlow runner. This pipeline includes every stage of
        processing starting from data fetching, transformation, ending with the result output. With these pipelines Apache Beam hides low-level things like
        shuffling, repartitioning, etc. from the developer. Additionally we used [BigFlow](https://github.com/allegro/bigflow) open-source framework developed
        internally in Allegro which is built to support Apache Beam data processing technology (simplifies building packages, configuration and deployment
        processes).
        </td>
    </tr>
    <tr>
        <td colspan="2">
        Summary: Apache Beam looks more like a framework as it abstracts the complexity of processing and hides technical details, and Spark is the technology
        where you literally need to dive deeper.
        </td>
    </tr>
</table>

#### Programming language and build tool

<table>
    <tr>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>
        For the main processing part we chose Scala as it looks similar to our background in Java, although there is PySpark - version in Python. Python was
        used only for composing a DAG file, which is basically a description of steps to be performed by Airflow (the tool which automates running the job in
        the cluster).
        </td>
        <td>
        Natively available in Java and Python, but since we took advantage of the BigFlow framework, then Python was used for everything.
        </td>
    </tr>
    <tr>
        <td>
        Because of Scala, Sbt is used for building the package and running the tests. Java developers can associate it with Gradle, it also has a build.sbt file
        which is similar to build.gradle as it contains dependencies, Scala version, etc.
        </td>
        <td>
        [Setuptools](https://packaging.python.org/key_projects/#setuptools) (tool for building Python packages) is run by script.py build script provided by
        BigFlow. This framework also gives additional mechanism for managing dependencies which is based on the standard
        [pip-tool](https://github.com/jazzband/pip-tools). Additionally running tests with Bigflow CLI is more convenient and faster compared with sbt.
        </td>
    </tr>
    <tr>
        <td colspan="2">
        Summary: Scala is much closer to our team (mostly Java developers), especially at the beginning when we needed to get used to working with Python
        without static typing. Also Scala is more natural for Spark, so all upcoming features will be firstly supported for this programming language,
        educational resources and examples in Scala for Spark are more exhausted.
        </td>
    </tr>
</table>

#### Batch and stream data processing

In our projects we did not implement stream data processing, we have batch processing only, but anyway it is probable that business requirements could change so
we must also consider how to do it in a better way.

<table>
    <tr>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>
        Two different APIs for batch/stream data processing. You need to split data yourself by grouping by the time and it is not truly real-time processing,
        as basically Spark divides the data stream into micro batches of X seconds called Dstreams, which is a sequence of RDDs under the hood.
        </td>
        <td>
        Due to the unified model, processing is carried out in the same way for both batch and stream data. An additional bonus here is the useful feature for
        windowing (a way to split data during stream processing), watermarks and triggers (handling events that come late or out-of-order).
        </td>
    </tr>
    <tr>
        <td colspan="2">
        Summary: Although we didn’t try it ourselves, we’d bet on Apache Beam in this comparison. It looks more adapted for Streaming than Spark. Despite there
        is Streaming extension since Spark 2.2 but with quite limited libraries of streaming functions. For us this means the need to apply more efforts.
        </td>
    </tr>
</table>

#### Testing
<table>
    <tr>
        <th></th>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>Unit tests (local environment without access to real infrastructure, validation of business logic)</td>
        <td>
        Embedded Spark
        </td>
        <td>
        TestPipeline
        </td>
    </tr>
    <tr>
        <td>Integration tests (validation proper read/write from/to BigQuery)</td>
        <td colspan="2">No official support for mocking BigQuery/Google Storage or embedded/test container version</td>
    </tr>
    <tr>
        <td>E2E tests (ensure job is executed, run in Cloud and has integration with GCP infrastructure)</td>
        <td colspan="2">
        Due to the missing implementation of testing the whole flow, we were running locally jobs to load production data, process them and store into BigQuery
        tables for development purposes. In this way we were ensuring introduced changes do not impact performance and obtained results from both of them are
        identical. Note: recently BigFlow provided [solution](https://github.com/allegro/bigflow/blob/master/docs/e2e_testing.md) by setting real
        Dataflow/BigQuery infrastructure while running e2e tests
        </td>
    </tr>
    <tr>
        <td colspan="3">
        Summary: a solution is to minimize the ratio of missing test coverage and isolate classes responsible for loading/writing data from/to these
        dependencies as much as possible. Another issue is to inject all this stuff into CI pipeline but this is completely another story. So, in both cases, it
        was a quite tedious process. To ensure there are no performance issues and jobs are not broken we run them on a dev environment using the production
        data which also took us a lot of time.
        </td>
    </tr>
</table>

#### Local run

Note: local run in our case does not mean 100% execution on the laptop: job is triggered from the local machine, but actually it has a place on the real cluster
in Google Cloud.

<table>
    <tr>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>
        Natively via Spark submit command, in our case we automated this by using Terraform: setting necessary infrastructure in GCP and running the job on the
        cluster.
        </td>
        <td>
        BigFlow CLI
        </td>
    </tr>
    <tr>
        <td colspan="2">
        Summary: No absolute winner here, depends on your preferences. Beside this we found Terraform as a fine separate tool to set up a local environment for
        running the job and could be equally used for Apache Beam job as well.
        </td>
    </tr>
</table>

#### Running on the GCP

<table>
    <tr>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>
        Dataproc (Hadoop under the hood which is required to run Spark). As we do not need to have it running all the time, we deployed it for each job
        execution, luckily we again have benefited from Terraform to do it. Also we used it to spin up the network, subnetwork, router and other things that are
        needed to run the Spark job within Dataproc, so I would generally recommend it as a useful tool to automate things in GCP. Dataproc has autoscaling
        feature, but it requires more actions: creating autoscaling policy in GCP and integrating it into the job. Moreover, to achieve good performance we
        needed to play a lot with Spark configuration like tuning memory on workers, choosing appropriate number of shuffle partitions, executor instances and
        so on.
        </td>
        <td>
        Dataflow. Due to its serverless nature we didn’t need to make a cluster up and running each time when we wanted to process data. The next big advantage
        of Dataflow is the Shuffle service, which addresses the shuffle issue on Spark executors as it moves heavy operation out of the worker virtual machine
        to the service backend. Moreover there is autoscaling out-of-the-box, Streaming engine for streaming pipeline support. Generally, Dataflow pretends to
        be a self-managed platform, so less effort is required to configure compared to Dataproc.
        </td>
    </tr>
    <tr>
        <td colspan="2">
        Summary: Dataflow wins in terms of ease of the setup. However, there is one more drawback here: limitation to run on the public cloud. It was too
        convenient for us to profit from Dataflow services that it would be hard to find appropriate substitution for them. Moreover, Bigflow framework
        positions itself as a Python framework for data processing pipelines on GCP. So if we want to migrate to another platform, this would cause an issue to
        configure another runner to run the job properly.
        </td>
    </tr>
</table>

#### Monitoring

In addition to the process itself, it is crucial to have an option to observe its workflow, collect metrics and have access to logs from the machines.

<table>
    <tr>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>
        Familiar dashboard with Yarn metrics at our disposal - Spark UI is the same that we had in the Hadoop cluster on-premise. The inconvenience was that we
        had to switch between different tabs in the browser. Another issue was with Spark logs, as if you open it by clicking on the particular running job, you
        can see only the part of them. The rest can be found in GCP Logger where you need to know how to build queries to fetch them. Also Dataproc does not
        keep the history of metrics once the cluster is shut down. You need to spin up a separate Spark history server to collect them and then configure its
        visualisation in GCP Monitoring.
        </td>
        <td>
        Logs from workers and metrics are displayed on the same UI and are available even after the job is finished.
        </td>
    </tr>
    <tr>
        <td colspan="2">
        Summary: Dataflow beats Dataproc here and that is it. No comments are required.
        </td>
    </tr>
</table>

#### Cost

Last but not least is the pricing of used GCP resources needed to process data like setting and running a cluster, storing data and queries execution in
BigQuery, etc. Here we are most likely talking not only about the money, but also about the time. As it was basically a pilot project, we calculated the cost of
non-optimized jobs to see how much it is without significant tuning.

<table>
    <tr>
        <th></th>
        <th>Apache Spark</th>
        <th>Apache Beam</th>
    </tr>
    <tr>
        <td>Cost</td>
        <td colspan="2">
        Approximately on the same level
        </td>
    </tr>
    <tr>
        <td>Time</td>
        <td>1.5h</td>
        <td>1h</td>
    </tr>
    <tr>
        <td colspan="3">
        Summary: cost is almost equal to each other, however we need to highlight that Spark job has much more space to optimize while Apache Beam job already
        contains Dataflow optimizations out-of-the-box. For example: playing more with Spark configuration, experimenting with Dataproc workers number, etc, so
        probably it would cost less and run faster if you know how to tune it properly.
        </td>
    </tr>
</table>

#### Conclusion

At the end we’d like to say that Spark Job could be more beneficial if you have good knowledge about it. Additionally Dataproc requires advanced skills close to
the experienced DevOps engineer to organize all necessary infrastructure. But if you do not have a good BigData engineer in your team or you run out of time and
you are ready to pay a little bit more for out-of-the-box optimizations, then Apache Beam + Dataflow is your choice. Also remember even if you pay a little bit
more, it means that you can spare the developers time spent on the Spark tweaking that may bring some value.

Below you can find how we’d estimate entry level for skills that were necessary for us to develop in mentioned technologies.

|                                         | Apache Spark                            | Apache Beam                             |
|-----------------------------------------|-----------------------------------------|-----------------------------------------|
| Programming languages                   |Scala (Intermediate)                     |Python (Intermediate)                    |
|                                         |Python(Basic)                            |                                         |
|                                         |SQL (depends on your data and constraints in the executed query, generally it is recommended to load only necessary data)||
| Technology stack                        |Apache Spark (Advanced)                  |Apache Beam (Intermediate)               |
|                                         |Google Dataproc (Intermediate)           |BigFlow (Advanced)                       |
|                                         |Google Logging (Basic)                   |Google DataFlow (Intermediate)           |
|                                         |Google Monitoring (Basic)                |                                         |
|                                         |Terraform (Intermediate)                 |                                         |
|                                         | Google BigQuery (Basic)                                                          ||
|                                         | Google Composer to schedule jobs in GCP (Basic)                                  ||
|                                         | Google Cloud Storage (Basic)                                                     ||





