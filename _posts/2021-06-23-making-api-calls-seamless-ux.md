---
layout: post
title: Making API calls a seamless user experience
author: [pawel.wolak]
tags: [javascript, frontend, ajax, rest, http]
---

Almost every modern web application somehow interacts with a backend - be it loading data, doing background sync, submitting form or publishing the metrics.
Making API requests is not an easy task - we have to consider multiple outcomes and handle them properly. Otherwise, we might end up with confused users and
decreased conversion. Although a potential stake is high, it is still very likely to encounter an application designed with only a happy path scenario in
mind. The question is - how can we improve it?

### Make the request state visible
Back in the old days submitting the form would result in a full page reload. Until the page was ready there was a clear sign that something was happening. If
something went wrong typically there was an unstyled generic error message.

This approach served its purpose very well - it was easy to tell that the page was still loading and it was easy to tell when there was an error. Then
[AJAX](https://developer.mozilla.org/en-US/docs/Web/Guide/AJAX) became popular, bringing with its benefits also certain drawbacks - it was up to the
programmer to handle loading and error state indicators, which were often omitted. In order to prevent user’s confusion you should always remember about
clearly presenting the request state to the user.

### Retry failed requests
As mentioned above errors do happen sometimes. Usually users are faced with a message and an option to retry the request. This approach is far better than
failing silently and not informing the user, but still can lead to abandoned actions. Maybe we can do better than that?

What if instead of asking the user to retry the failed request we could do it automatically? There is another follow-up question: is every request worth
retrying? Imagine a server responding with status code [403 (forbidden)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403),
[422 (unprocessable entity)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) or 4xx in general. These are the client’s faults and usually
retrying those requests will yield the same result. Now let’s consider 5xx status codes which are often caused by temporary database unavailability or server
resource exhaustion. Especially in multi server environments chances are that the next request will be rerouted to the healthy instance, resulting in a
successful response.

On the other hand, in case of increased traffic, repeating failed requests instantly could possibly make things worse. In order to prevent that it is a good
practice to introduce exponential delay between consecutive retry attempts. Another solution, more common in inter-service communication is a circuit breaker
mechanism which prevents further requests until service becomes available.

Also, keep in mind that network conditions might not be stable, particularly on mobile devices. If there is no connection instead of making pointless API
calls you could queue the requests and observe for
[online/offline events](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events).

Finally, not every request is safe to retry. Sometimes when you receive 5xx there is no guarantee that it has not been processed. Imagine retrying a request
to make a money transfer from one account to another - handling it twice would be a disaster! In order to prevent these mistakes from happening you have to
make sure your API is [idempotent](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent). This is usually achieved by using adequate HTTP methods
(like [PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT)) or passing additional identifier with the request.

### Do not wait forever
Have you ever wondered how long does it take before API call times out due to no response from the server? If not, I have bad news for you -
[default timeout value in XMLHttpRequest is 0](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout), which basically means the browser will wait forever.
With [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) there is no parameter responsible for timeouts - it relies on browser defaults (which
is 300 seconds for [Chrome](https://source.chromium.org/chromium/chromium/src/+/master:net/socket/client_socket_pool.cc;l=29) and
[Firefox](https://searchfox.org/mozilla-central/source/netwerk/protocol/http/nsHttpHandler.cpp#219).

The good news is that you can actually implement timeout functionality using
[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController):

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

fetch("/api/something", { signal: controller.signal })
  .then(response => {
    clearTimeout(timeout);
    // process the response
  });
```

Another useful application of AbortController is cancelling straggler requests (requests still in progress at the time response is no longer needed). This is
particularly useful in libraries like [React](https://reactjs.org/) where receiving a response after unmounting a component results in an error:

```javascript
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/something", { signal: controller.signal })
    .then(response => {
      // process the response
    });

  return () => controller.abort(); // cancel the request when un-mounting the component
}, []);
```

### Be optimistic
As funny as it may sound, there is an actual pattern called “optimistic UI”. The idea behind it is very straightforward: given that most of the time an API
request will result in a successful response we can skip the “loading” part and go straight to a result stage. In an unlikely event of failure we can still
rollback our changes and inform the user about the error.

Let’s consider a popular example of a counter (eg. Facebook/Twitter like button). For the sake of simplicity I will skip the actual request and return a
promise after 1 second so that approximately 25% of requests will fail:

```html
Counter value: <span id="counter">0</span> <button id="button">Increase</button>

<script>
  let counter = 0;

  const updateView = () => document.querySelector("#counter").innerText = counter;

  const makeRequest = () => new Promise((resolve, reject) => {
    const outcome = Math.random() > 0.25 ? resolve : reject;
    setTimeout(outcome, 1000);
  });

  document.querySelector("#button").addEventListener("click", async () => {
    counter++;
    updateView();

    try {
      await makeRequest();
    } catch (e) {
      counter--;
      updateView();
    }
  });
</script>
```

By simply assuming the positive outcome we drastically reduce the amount of time spent on the interactions, making the whole experience more swift. If you are
further interested I recommend reading a [more comprehensive article about optimistic UI](https://www.smashingmagazine.com/2016/11/true-lies-of-optimistic-user-interfaces/).

### Summary
In this article I presented the basics of requests handling. Some of these ideas (like retries and timeouts) also apply to the backend service-to-service
communication. Additionally, there are other interesting techniques which I encourage you to study (eg. preconnecting, batching). In the end, in my opinion,
everything that improves UX is worth a try.
