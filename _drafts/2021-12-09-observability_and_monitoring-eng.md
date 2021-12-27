# Intro

In a complex microservice system, we are not able to avoid problems. However, we can try to anticipate them and react to
them as quickly as possible. To achieve this, it is necessary to use specialized tools to assess the current condition
of our components. They are provided for by the microservice architecture model and implement one of its main
postulates- *Observability*.

# Observability

Let's try to answer ourselve, how the term *Observability* should be understood.

I would like to quote a very simple definition found on _[Wikipedia](https://en.wikipedia.org/wiki/Observability)_

> Observability is the ability to collect data about program execution, internal states of modules, and communication
> between components.

The observable system provides precise data describing the condition of its components. This data can take many forms-
from numeric telemetry data to text logs. Thanks to them, we are able to understand the characteristics of the system
behavior and the detailed way of data flow. This allows us to catch subtle anomalies, that may not be a problem at this
moment, but we can assume, they will become it soon. Effective developer intervention taken at this point of time allows
preserve system stability and reliability. And that this is what it's all about. We have the opportunity to act on the
cause before the negative effect occurs.

# Observability - implementation patterns

![](../img/articles/2021-12-09-observability_and_monitoring/observability.png)

# System monitorowania i informowania

# Service Mesh

![](../img/articles/2021-12-09-observability_and_monitoring/service-mesh-observability.png)

# Piątkowe popołudnie

![](../img/articles/2021-12-09-observability_and_monitoring/storage_metric.png)

![](../img/articles/2021-12-09-observability_and_monitoring/incomming_traffic.png)

![](../img/articles/2021-12-09-observability_and_monitoring/p99_response_time_before_failure..png)

![](../img/articles/2021-12-09-observability_and_monitoring/gc_spent_per_minute_before_fail.png)

```
exception java.lang.RuntimeException: Hystrix circuit short-circuited and is OPEN
    at com.netflix.hystrix.AbstractCommand.handleShortCircuitViaFallback(AbstractCommand.java:979)
    at com.netflix.hystrix.AbstractCommand.applyHystrixSemantics(AbstractCommand.java:557)
```

![](../img/articles/2021-12-09-observability_and_monitoring/kibana.png)

![](../img/articles/2021-12-09-observability_and_monitoring/clients.png)

```
Error while extracting response for type
    [java.util.List<xxx.xxx.xxx.Dto>] and content type [application/vnd.allegro.public.v1+json]; nested exception is
    org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error
    ...
```

![](../img/articles/2021-12-09-observability_and_monitoring/gc_spent_per_minute_after_fail.png)

![](../img/articles/2021-12-09-observability_and_monitoring/storage_after_fail.png)




