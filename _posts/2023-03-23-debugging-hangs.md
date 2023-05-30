---
layout: post
title: Debugging hangs - piecing together why nothing happens
author: lukasz.rokita
tags: [tech, java, jvm, debugging, dependency hell]
---

As a part of a broader initiative of refreshing Allegro platform, we are upgrading our internal libraries to Spring Boot 3.0 and Java 17.
The task is daunting and filled with challenges,
however overall progress is steady and thanks to the modular nature of our code it should end in finite time. 
Everyone who has performed such an upgrade knows that you need to expect the unexpected and at the end of the day prepare for lots of debugging.
No amount of migration guide would prepare you for what’s coming in the field.
In the words of Donald Rumsfeld there are unknown unknowns and we need to be equipped with the tools to uncover these unknowns and patch them up.
In this blog post I’d like to walk you through a process that should show where the application hangs,
although there seems to be nothing wrong with it. I will also show that you don’t always know what code you have – problem known as dependecy hell,
place we got quite cosy in during this upgrade.  

## The change
Note that we keep versions as separate key–value pairs in `build.gradle` files and reference them in dependencies by key. 
Updating often means a single line change. The upgrade is trivial and git diff looks like this. 
```
ext.versions = [
-        spring         : '5.3.24',
-        spock          : '2.3-groovy-3.0',
-        groovy         : '3.0.14',
]

ext.versions = [
+        spring         : '6.0.5',
+        spock          : '2.4-M1-groovy-4.0',
+        groovy         : '4.0.9',
]
```
Nothing much happens. We upgrade Spring and since there are some problems with Spock not working well with the newest Spring
we need to upgrade it as well, along with Groovy. This is the easy part.
Now we run the tests and expect to be either elated with the sight of a successful build or greeted with descriptive error messages
that help us quickly patch the issue. Nobody expects anything and in this case this is an unknown unknown. 
```
97% EXECUTING [15m 55s]
> :platform-libraries-webclient:integrationTest > 1 test completed, 1 failed
> :platform-libraries-webclient:integrationTest > Executing test pl.allegro....WebClientContextContainerInterceptorSpec
```
After 15 minutes we expect the process to end. A quick cross-check with the master branch confirms that tests run and execute in less than a minute.
Something is wrong and it’s on us. However, no error is presented. Adding logging does not help, nothing streams to standard output.
Something hangs and refuses to budge. When that happenes there is only one way to inspect what is going on and
that is to pop the hood open and look into JVM to see what the threads are doing or where they are slacking.

## Thread theory

Let's interrupt this story with a short summary of threading in JVM. You can skip this chapter if you are familiar with the topic.
As the priceless book Java Concurrency in Practice by Brian Goetz et al. teaches us:
> "Threads may block, or pause, for several reasons: waiting for I/O completion, waiting to acquire a lock,
> waiting to wake up from Thread.sleep, or waiting for the result of a computation in another thread.
> When a thread blocks, it is usually suspended and placed in one of the blocked thread states
> (BLOCKED, WAITING, or TIMED_WAITING). (...) blocked thread must wait for an event beyond its control before it can proceed".

This sounds exactly like the situation we are in. So there is hope. Let’s educate ourselves further.
Another excerpt that would prove insightful reads as follows:
> "(...) tasks can block for exteded periods of time, even if deadlock is not a possibility. 
> (...) One technique that can mitigate the ill effects of long–running tasks is for tasks to use timed resource waits instead of 
> unbound waits."
This seems like an answer to our woes. However, two mysteries remain.
Where to put the timeout? What the thread is waiting for? To answer these questions we need to inspect the threads in the JVM itself. 

## The investigation
At this point we did two things. First we pushed our code to a branch.
After all at any moment our laptops could burst into flames and all the work would go to waste.
The remote CI confirmed our suspicion since it also hung. The problem was real and not only confined to the local machine.
The second thing is to scout for the offending thread. This is easy with the help of some JDK binaries:
```
jps -lv | grep platform-libraries
38983 worker.org.gradle.process.internal.worker.GradleWorkerMain -Dorg.gradle.internal.worker.tmpdir=/path/to/code/platform-libraries/platform-libraries-webclient/build/tmp/integrationTest/work -Dorg.gradle.native=false -Xmx512m -Dfile.encoding=UTF-8
```
So we have the a lvmid – local JVM identifier, which will help us locate the offending thread in jconsole.
In the screen below we can see that the thread waits on `Mono.block()` which is left unbounded in a happy path scenario.
Well, we are in the worst case so first of all we add a simple timeout `Mono.block(Duration.ofSeconds(10))`.

![jconsole](/img/articles/2023-03-23-debugging-hangs/jconsole.png)

This fails our tests and for the first time the error appears:
```
	08:13:39.556 [Test worker] WARN reactor.core.Exceptions - throwIfFatal detected a jvm fatal exception, which is thrown and logged below:
java.lang.NoSuchMethodError: 'reactor.core.publisher.Mono reactor.core.publisher.Mono.subscriberContext(reactor.util.context.Context)'
	at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool.drainLoop(SimpleDequePool.java:403)
	at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool.pendingOffer(SimpleDequePool.java:558)
	at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool.doAcquire(SimpleDequePool.java:268)
	at reactor.netty.internal.shaded.reactor.pool.AbstractPool$Borrower.request(AbstractPool.java:427)
	at reactor.netty.resources.PooledConnectionProvider$DisposableAcquire.onSubscribe(PooledConnectionProvider.java:533)
	at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool$QueueBorrowerMono.subscribe(SimpleDequePool.java:676)
	at reactor.netty.resources.PooledConnectionProvider.disposableAcquire(PooledConnectionProvider.java:219)
	at reactor.netty.resources.PooledConnectionProvider.lambda$acquire$3(PooledConnectionProvider.java:183)
	at reactor.core.publisher.MonoCreate.subscribe(MonoCreate.java:58)
	at reactor.netty.http.client.HttpClientConnect$MonoHttpConnect.lambda$subscribe$0(HttpClientConnect.java:326)
	at reactor.core.publisher.MonoCreate.subscribe(MonoCreate.java:58)
	at reactor.core.publisher.FluxRetryWhen.subscribe(FluxRetryWhen.java:77)
	at reactor.core.publisher.MonoRetryWhen.subscribeOrReturn(MonoRetryWhen.java:46)
	at reactor.core.publisher.InternalMonoOperator.subscribe(InternalMonoOperator.java:57)
	at reactor.netty.http.client.HttpClientConnect$MonoHttpConnect.subscribe(HttpClientConnect.java:329)
	at reactor.core.publisher.InternalMonoOperator.subscribe(InternalMonoOperator.java:64)
	at reactor.core.publisher.MonoFlatMap$FlatMapMain.onNext(MonoFlatMap.java:165)
	at reactor.core.publisher.FluxMapFuseable$MapFuseableSubscriber.onNext(FluxMapFuseable.java:129)
	at reactor.core.publisher.Operators$ScalarSubscription.request(Operators.java:2545)
	at reactor.core.publisher.FluxMapFuseable$MapFuseableSubscriber.request(FluxMapFuseable.java:171)
	at reactor.core.publisher.MonoFlatMap$FlatMapMain.request(MonoFlatMap.java:194)
	at reactor.core.publisher.FluxOnAssembly$OnAssemblySubscriber.request(FluxOnAssembly.java:649)
	at reactor.core.publisher.Operators$MultiSubscriptionSubscriber.set(Operators.java:2341)
	at reactor.core.publisher.Operators$MultiSubscriptionSubscriber.onSubscribe(Operators.java:2215)
	at reactor.core.publisher.FluxOnAssembly$OnAssemblySubscriber.onSubscribe(FluxOnAssembly.java:633)
	at reactor.core.publisher.MonoFlatMap$FlatMapMain.onSubscribe(MonoFlatMap.java:117)
	at reactor.core.publisher.FluxMapFuseable$MapFuseableSubscriber.onSubscribe(FluxMapFuseable.java:96)
	at reactor.core.publisher.MonoJust.subscribe(MonoJust.java:55)
	at reactor.core.publisher.InternalMonoOperator.subscribe(InternalMonoOperator.java:64)
	at reactor.core.publisher.MonoDeferContextual.subscribe(MonoDeferContextual.java:55)
	at reactor.core.publisher.Mono.subscribe(Mono.java:4485)
	at reactor.core.publisher.Mono.block(Mono.java:1733)
	at org.codehaus.groovy.vmplugin.v8.IndyInterface.fromCache(IndyInterface.java:321)
	at pl.allegro....WebClientContextContainerAdapterConfiguration$Trait$Helper.makeRequest(WebClientContextContainerAdapterConfiguration.groovy:22)
	at org.codehaus.groovy.vmplugin.v8.IndyInterface.fromCache(IndyInterface.java:321)
	at pl.allegro....WebClientContextContainerInterceptorSpec.makeRequest(WebClientContextContainerInterceptorSpec.groovy)
	at pl.allegro....WebClientContextContainerAdapterConfiguration$makeRequest.call(Unknown Source)
	at org.codehaus.groovy.runtime.callsite.CallSiteArray.defaultCall(CallSiteArray.java:45)
	at org.codehaus.groovy.runtime.callsite.AbstractCallSite.call(AbstractCallSite.java:125)
	at org.codehaus.groovy.runtime.callsite.AbstractCallSite.call(AbstractCallSite.java:166)
	at pl.allegro....AdapterConfiguration$Trait$Helper.makeRequest(AdapterConfiguration.groovy:11)
	at org.codehaus.groovy.vmplugin.v8.IndyInterface.fromCache(IndyInterface.java:321)
	at pl.allegro....WebClientContextContainerInterceptorSpec.makeRequest(WebClientContextContainerInterceptorSpec.groovy)
	at pl.allegro....SharedInterceptorSpec$makeRequest.callCurrent(Unknown Source)
	at org.codehaus.groovy.runtime.callsite.CallSiteArray.defaultCallCurrent(CallSiteArray.java:49)
	at org.codehaus.groovy.runtime.callsite.AbstractCallSite.callCurrent(AbstractCallSite.java:171)
	at org.codehaus.groovy.runtime.callsite.AbstractCallSite.callCurrent(AbstractCallSite.java:203)
	at pl.allegro....SharedInterceptorSpec.$spock_feature_0_0(SharedInterceptorSpec.groovy:44)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)
	at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.base/java.lang.reflect.Method.invoke(Method.java:568)
	at org.spockframework.util.ReflectionUtil.invokeMethod(ReflectionUtil.java:196)
	at org.spockframework.runtime.model.MethodInfo.lambda$new$0(MethodInfo.java:49)
	at org.spockframework.runtime.model.MethodInfo.invoke(MethodInfo.java:156)
	at org.spockframework.runtime.extension.MethodInvocation.proceed(MethodInvocation.java:102)
	at org.spockframework.junit4.ExceptionAdapterInterceptor.intercept(ExceptionAdapterInterceptor.java:13)
	at org.spockframework.runtime.extension.MethodInvocation.proceed(MethodInvocation.java:101)
	at org.spockframework.runtime.PlatformSpecRunner.invoke(PlatformSpecRunner.java:398)
	at org.spockframework.runtime.PlatformSpecRunner.runFeatureMethod(PlatformSpecRunner.java:324)
	at org.spockframework.runtime.IterationNode.execute(IterationNode.java:50)
	at org.spockframework.runtime.SimpleFeatureNode.execute(SimpleFeatureNode.java:58)
	at org.spockframework.runtime.SimpleFeatureNode.execute(SimpleFeatureNode.java:15)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$6(NodeTestTask.java:151)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$8(NodeTestTask.java:141)
	at org.spockframework.runtime.SpockNode.sneakyInvoke(SpockNode.java:40)
	at org.spockframework.runtime.IterationNode.lambda$around$0(IterationNode.java:67)
	at org.spockframework.runtime.PlatformSpecRunner.lambda$createMethodInfoForDoRunIteration$5(PlatformSpecRunner.java:236)
	at org.spockframework.runtime.model.MethodInfo.invoke(MethodInfo.java:156)
	at org.spockframework.runtime.extension.MethodInvocation.proceed(MethodInvocation.java:102)
	at org.spockframework.junit4.ExceptionAdapterInterceptor.intercept(ExceptionAdapterInterceptor.java:13)
	at org.spockframework.runtime.extension.MethodInvocation.proceed(MethodInvocation.java:101)
	at org.spockframework.junit4.AbstractRuleInterceptor$1.evaluate(AbstractRuleInterceptor.java:46)
	at com.github.tomakehurst.wiremock.junit.WireMockRule$1.evaluate(WireMockRule.java:79)
	at org.spockframework.junit4.MethodRuleInterceptor.intercept(MethodRuleInterceptor.java:40)
	at org.spockframework.runtime.extension.MethodInvocation.proceed(MethodInvocation.java:101)
	at org.spockframework.runtime.PlatformSpecRunner.invoke(PlatformSpecRunner.java:398)
	at org.spockframework.runtime.PlatformSpecRunner.runIteration(PlatformSpecRunner.java:218)
	at org.spockframework.runtime.IterationNode.around(IterationNode.java:67)
	at org.spockframework.runtime.SimpleFeatureNode.lambda$around$0(SimpleFeatureNode.java:52)
	at org.spockframework.runtime.SpockNode.sneakyInvoke(SpockNode.java:40)
	at org.spockframework.runtime.FeatureNode.lambda$around$0(FeatureNode.java:41)
	at org.spockframework.runtime.PlatformSpecRunner.lambda$createMethodInfoForDoRunFeature$4(PlatformSpecRunner.java:199)
	at org.spockframework.runtime.model.MethodInfo.invoke(MethodInfo.java:156)
	at org.spockframework.runtime.PlatformSpecRunner.invokeRaw(PlatformSpecRunner.java:407)
	at org.spockframework.runtime.PlatformSpecRunner.invoke(PlatformSpecRunner.java:390)
	at org.spockframework.runtime.PlatformSpecRunner.runFeature(PlatformSpecRunner.java:192)
	at org.spockframework.runtime.FeatureNode.around(FeatureNode.java:41)
	at org.spockframework.runtime.SimpleFeatureNode.around(SimpleFeatureNode.java:52)
	at org.spockframework.runtime.SimpleFeatureNode.around(SimpleFeatureNode.java:15)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$9(NodeTestTask.java:139)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.executeRecursively(NodeTestTask.java:138)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.execute(NodeTestTask.java:95)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1511)
	at org.junit.platform.engine.support.hierarchical.SameThreadHierarchicalTestExecutorService.invokeAll(SameThreadHierarchicalTestExecutorService.java:41)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$6(NodeTestTask.java:155)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$8(NodeTestTask.java:141)
	at org.spockframework.runtime.SpockNode.sneakyInvoke(SpockNode.java:40)
	at org.spockframework.runtime.SpecNode.lambda$around$0(SpecNode.java:63)
	at org.spockframework.runtime.PlatformSpecRunner.lambda$createMethodInfoForDoRunSpec$0(PlatformSpecRunner.java:61)
	at org.spockframework.runtime.model.MethodInfo.invoke(MethodInfo.java:156)
	at org.spockframework.runtime.PlatformSpecRunner.invokeRaw(PlatformSpecRunner.java:407)
	at org.spockframework.runtime.PlatformSpecRunner.invoke(PlatformSpecRunner.java:390)
	at org.spockframework.runtime.PlatformSpecRunner.runSpec(PlatformSpecRunner.java:55)
	at org.spockframework.runtime.SpecNode.around(SpecNode.java:63)
	at org.spockframework.runtime.SpecNode.around(SpecNode.java:11)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$9(NodeTestTask.java:139)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.executeRecursively(NodeTestTask.java:138)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.execute(NodeTestTask.java:95)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1511)
	at org.junit.platform.engine.support.hierarchical.SameThreadHierarchicalTestExecutorService.invokeAll(SameThreadHierarchicalTestExecutorService.java:41)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$6(NodeTestTask.java:155)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$8(NodeTestTask.java:141)
	at org.junit.platform.engine.support.hierarchical.Node.around(Node.java:137)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$9(NodeTestTask.java:139)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.executeRecursively(NodeTestTask.java:138)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.execute(NodeTestTask.java:95)
	at org.junit.platform.engine.support.hierarchical.SameThreadHierarchicalTestExecutorService.submit(SameThreadHierarchicalTestExecutorService.java:35)
	at org.junit.platform.engine.support.hierarchical.HierarchicalTestExecutor.execute(HierarchicalTestExecutor.java:57)
	at org.junit.platform.engine.support.hierarchical.HierarchicalTestEngine.execute(HierarchicalTestEngine.java:54)
	at org.junit.platform.launcher.core.EngineExecutionOrchestrator.execute(EngineExecutionOrchestrator.java:147)
	at org.junit.platform.launcher.core.EngineExecutionOrchestrator.execute(EngineExecutionOrchestrator.java:127)
	at org.junit.platform.launcher.core.EngineExecutionOrchestrator.execute(EngineExecutionOrchestrator.java:90)
	at org.junit.platform.launcher.core.EngineExecutionOrchestrator.lambda$execute$0(EngineExecutionOrchestrator.java:55)
	at org.junit.platform.launcher.core.EngineExecutionOrchestrator.withInterceptedStreams(EngineExecutionOrchestrator.java:102)
	at org.junit.platform.launcher.core.EngineExecutionOrchestrator.execute(EngineExecutionOrchestrator.java:54)
	at org.junit.platform.launcher.core.DefaultLauncher.execute(DefaultLauncher.java:114)
	at org.junit.platform.launcher.core.DefaultLauncher.execute(DefaultLauncher.java:86)
	at org.junit.platform.launcher.core.DefaultLauncherSession$DelegatingLauncher.execute(DefaultLauncherSession.java:86)
	at org.junit.platform.launcher.core.SessionPerRequestLauncher.execute(SessionPerRequestLauncher.java:53)
	at org.gradle.api.internal.tasks.testing.junitplatform.JUnitPlatformTestClassProcessor$CollectAllTestClassesExecutor.processAllTestClasses(JUnitPlatformTestClassProcessor.java:99)
	at org.gradle.api.internal.tasks.testing.junitplatform.JUnitPlatformTestClassProcessor$CollectAllTestClassesExecutor.access$000(JUnitPlatformTestClassProcessor.java:79)
	at org.gradle.api.internal.tasks.testing.junitplatform.JUnitPlatformTestClassProcessor.stop(JUnitPlatformTestClassProcessor.java:75)
	at org.gradle.api.internal.tasks.testing.SuiteTestClassProcessor.stop(SuiteTestClassProcessor.java:62)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)
	at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.base/java.lang.reflect.Method.invoke(Method.java:568)
	at org.gradle.internal.dispatch.ReflectionDispatch.dispatch(ReflectionDispatch.java:36)
	at org.gradle.internal.dispatch.ReflectionDispatch.dispatch(ReflectionDispatch.java:24)
	at org.gradle.internal.dispatch.ContextClassLoaderDispatch.dispatch(ContextClassLoaderDispatch.java:33)
	at org.gradle.internal.dispatch.ProxyDispatchAdapter$DispatchingInvocationHandler.invoke(ProxyDispatchAdapter.java:94)
	at jdk.proxy1/jdk.proxy1.$Proxy2.stop(Unknown Source)
	at org.gradle.api.internal.tasks.testing.worker.TestWorker$3.run(TestWorker.java:193)
	at org.gradle.api.internal.tasks.testing.worker.TestWorker.executeAndMaintainThreadName(TestWorker.java:129)
	at org.gradle.api.internal.tasks.testing.worker.TestWorker.execute(TestWorker.java:100)
	at org.gradle.api.internal.tasks.testing.worker.TestWorker.execute(TestWorker.java:60)
	at org.gradle.process.internal.worker.child.ActionExecutionWorker.execute(ActionExecutionWorker.java:56)
	at org.gradle.process.internal.worker.child.SystemApplicationClassLoaderWorker.call(SystemApplicationClassLoaderWorker.java:113)
	at org.gradle.process.internal.worker.child.SystemApplicationClassLoaderWorker.call(SystemApplicationClassLoaderWorker.java:65)
	at worker.org.gradle.process.internal.worker.GradleWorkerMain.run(GradleWorkerMain.java:69)
	at worker.org.gradle.process.internal.worker.GradleWorkerMain.main(GradleWorkerMain.java:74)
```
For the first time we force the entire reactive code to finally execute itself and present us with the result,
even if it is an error this moves us in the right direction. 

## Result

Like in any good crime story uncovering one mystery presents another.
A quick `grep` shows that there are no calls to `reactor.core.publisher.Mono.subscriberContext`.
Where could this call be hiding, if it’s not present in our code?

The answer is simple but I assure you that it took us some time to come up with it.
If it isn’t in our code and it runs inside our JVM then this must be dependency code.
The observant reader is able to spot it from afar. The stack trace confirms where the error lies:
```    
    at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool.drainLoop(SimpleDequePool.java:403)
	at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool.pendingOffer(SimpleDequePool.java:558)
	at reactor.netty.internal.shaded.reactor.pool.SimpleDequePool.doAcquire(SimpleDequePool.java:268)
```
We need to patch `reactor–netty` which in this version still used deprecated code. Referring back to our diff:
```
ext.versions = [
-        spring         : '5.3.24',
-        reactorNetty   : '0.9.25.RELEASE',
-        spock          : '2.3-groovy-3.0',
-        groovy         : '3.0.14',
]

ext.versions = [
+        spring        : '6.0.5',
+        spock         : '2.4-M1-groovy-4.0',
+        groovy        : '4.0.9',
+        reactorNetty  : '1.1.3',
]
```
We escape the dependency hell and are delighted to see the green letters `BUILD SUCCESSFUL in 24s`.   

## Summary
Well this was quite a thrilling journey one doesn’t often embark on. 
The odd peculiarity of the problem combined with peculiarity of the task provided us with a great challange and satisfaction.
Dependency hell is no joke, but armed with the JDK tools and thinking the problem through, there is no obstacle that could not be overcome.
Next time your code hangs with no apparent reason this is a perfect opportunity to dust off the swiss army knife of JDK binaries and dig in.
