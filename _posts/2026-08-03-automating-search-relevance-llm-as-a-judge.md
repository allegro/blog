---
layout: post
title: "Automating Search Relevance Assessment at Scale with LLM-as-a-Judge"
author: [joanna.marhula, mateusz.a.sidor]
tags: [tech, search relevance, relevance evaluation, llm, llm-as-a-judge, ai product, local llms]
---

At the heart of any e-commerce platform lies the search bar — the critical bridge between user intent and the right product.
The backbone of the search bar is search relevance — it ensures the search engine’s long-term health, determines user
engagement and, ultimately, drives platform retention.

However, the evaluation of search relevance remains a complex, ongoing challenge. For years, the industry standard relied on a
mix of subjective “vibe checks” — which often proved too narrow to provide actionable insights — and detailed human
annotations, which were costly and time-consuming to scale.

With the rise of the “LLM-as-a-judge” paradigm, the landscape of search evaluation is shifting: automated, systematic
frameworks may finally bridge the gap between quality and scale. Search teams now have the tools to move away from occasional
“vibe checks” toward continuous, scalable relevance studies. In this post, we’ll walk through our journey of designing an
internal Relevance Assessment Tool (RAT), detailing how we used LLMs to benchmark our search performance with precision and
efficiency.

## The complexities of evaluating search relevance

Before we could even consider automating our search evaluations, we began with human annotations, and it quickly became clear
that search relevance is rarely a straightforward binary decision.

The primary challenge was our scale: [Allegro](https://allegro.pl) spans 13 distinct departments (Automotive, Home and Garden,
Fashion, Supermarket, etc.), each with its own domain-specific nuances, search patterns, and user expectations. Creating a
unified set of search relevance annotation criteria that could accommodate everything from a straightforward electronics
purchase to a highly ambiguous query in the home decor category was a challenging task. We had to build detailed guidelines
that covered a vast range of scenarios — differentiating between simple and vague queries, standard products, and complex
product sets.

To ensure consistency across multiple annotation tasks, we designed rigorous annotation guidelines covering canonical and
borderline cases. Our nomenclature was heavily inspired by the ESCI (Exact, Substitute, Complement, Irrelevant) scale
described in [this paper](https://arxiv.org/pdf/2206.06588), but we aimed for slightly higher granularity to capture the
subtleties of our catalog.

<figure>
<img alt="Canonical example of search relevance annotations mapping user intent to retrieved products" src="/assets/img/articles/2026-08-03-automating-search-relevance-llm-as-a-judge/annotation-canonical-example.png" />
<figcaption>
Canonical example of search relevance annotations: labels reflect the relationship between the user intent and the retrieved
product.
</figcaption>
</figure>

<figure>
<img alt="Challenging example of labeling products retrieved for an ambiguous user query" src="/assets/img/articles/2026-08-03-automating-search-relevance-llm-as-a-judge/annotation-ambiguous-example.png" />
<figcaption>
More challenging example: how to label products retrieved for an ambiguous user query? Do they all deserve the <em>Exact
product</em> label?
</figcaption>
</figure>

Maintaining quality of human annotations required a strict oversight process:

* **Expert calibration:** We relied on internal search experts to set the standard and collaborated with a team of annotators
  that consistently annotated all datasets. To maximize precision, for each user search query-product pair we had labels from
  two blind annotators (independent annotators who label data without knowledge of previous assessments) and an expert
  arbitrator who solved any label disagreements.
* **Continuous alignment:** We monitored annotation agreement metrics (e.g. [Cohen’s kappa](https://en.wikipedia.org/wiki/Cohen%27s_kappa)) over time across various tasks. As our team became more aligned on edge cases and consistently followed Allegro’s specific business logic, we saw our
  consistency improve significantly over time.

<figure>
<img alt="Chart showing Cohen's kappa scores rising between the 2023 and 2024 annotation tasks" src="/assets/img/articles/2026-08-03-automating-search-relevance-llm-as-a-judge/cohen-kappa-evolution.png" />
<figcaption>
Evolution of Cohen’s kappa scores across two iterations of the search relevance annotation task. Cohen’s kappa is a statistical metric that measures agreement between two annotators on categorical data while accounting for the agreement that
could occur purely by chance. The shift in kappa highlights the positive impact of structured feedback loops and granular
annotation guidelines on team alignment (conceptual difficulty of the dataset — measured by the ratio of canonical cases to
complex edge examples — remained comparable between both tasks).
</figcaption>
</figure>

The whole process was resource-intensive: we collaborated with approximately 30 experts working on query-product pairs in four
languages: Polish (PL), Czech (CZ), Slovak (SK) and Hungarian (HU). The result was a multilingual 380K+ dataset that not only
gave us immediate insights into our search quality but eventually provided the essential training and validation data needed to
benchmark and refine our move toward the “LLM-as-a-judge” paradigm (to read more about annotation processes at Allegro, see
also [How to create a synthetic annotator]({% post_url 2025-03-07-how-to-create-a-synthetic-annotator %})).

## LLM-as-a-Judge: prompt design and model selection

Our transition to “LLM-as-a-Judge” was driven by the need to scale our evaluation while maintaining the precision of human
annotation. Thus the prompt for the task was designed directly on the basis of human annotation instructions, ensuring the LLM
followed the same business logic and treated edge cases uniformly. These instructions were handwritten by human experts —
product and data annotation managers who understand the underlying business logic. We learned that prompt optimization
libraries like [sammo](https://github.com/microsoft/sammo) or [gepa](https://gepa-ai.github.io/gepa/) can refine such
expert-written prompts even further to maximize LLM annotation precision and human-LLM alignment — though they deliver this
benefit when building on a solid expert-written prompt rather than generating a strong prompt on their own. Furthermore, we
intentionally relied strictly on textual modality — specifically the product name — as it already contains the necessary
product information. Experiments with adding explicit department and product category information were ultimately excluded, as
they did not improve output quality (department and product category details can typically be inferred from the product name
itself).

### The paradox of examples

Initially, we also experimented with few-shot prompting to guide the model. Surprisingly, our ablation experiments revealed
that removing few-shot examples actually improved model performance. The prompt without few-shot examples yielded higher
accuracy and agreement scores compared to the few-shot version (for more on metrics used to rate LLM performance see section
below). This suggests that for complex relevance tasks, providing too many examples can introduce noise or bias the model away
from the core logic.

### The power of reasoning

The most critical discovery was the value of structured logical constraints. Our benchmarks showed a large performance decline
when we removed “critical rules” and “step-by-step” interpretation instructions. In a search relevance assessment task, the
model relies heavily on a structured reasoning framework — analyzing intent, interpreting product characteristics, and applying
specific heuristics — rather than pattern-matching examples. For example, by embedding our domain-specific business logic
directly into the system prompt, we ensure that a compatible third-party mobile phone case is correctly labeled as an “Exact
product,” while a third-party printer toner is categorized as “Highly substitutable.”

### Model selection and per-class metrics

We tested various online models, including GPT 4.1 mini, Gemini 2.5 Flash, Gemini 3.1 Flash Lite and Gemini 2.5 Pro. While
Gemini Pro consistently delivered the highest performance, Gemini 3.1 Flash Lite proved to be an excellent candidate for
production workloads, offering a compelling cost-to-performance ratio. We benchmarked the models using an array of metrics,
focusing on model accuracy and agreement scores with human ground truth values (see section below). Our analyses revealed that
the model is highly reliable at identifying exact matches and complementary items, showing it understands product
relationships (e.g. phone cases matching a phone). “Middle-class” relevance remains the most challenging area — the model
struggles more to differentiate between “Highly substitutable” and “Substitutable” classes.

| Class | Precision | Recall | F1-Score | Support |
| :---- | ----: | ----: | ----: | ----: |
| Exact product | 0.95 | 0.93 | 0.94 | 10413 |
| Highly substitutable product | 0.49 | 0.54 | 0.51 | 607 |
| Substitutable product | 0.32 | 0.34 | 0.33 | 387 |
| Complementary product | 0.87 | 0.80 | 0.83 | 719 |
| Irrelevant product | 0.57 | 0.48 | 0.52 | 480 |
| Hard to say | 0.14 | 1.00 | 0.25 | 43 |
| Weighted Avg | 0.89 | 0.87 | 0.88 | 12649 |

**Table 1: per-class metrics on a selected dataset split for Gemini 3.1 Flash Lite.** Precision, recall and F1-score point at
“easy” and “difficult” classes. Also, the support values indicate that this dataset split is imbalanced.

## Relevance Assessment Tool: a dedicated framework for continuous search evaluation

To monitor the search quality, we designed an automated evaluation framework that captures Allegro production data and
leverages LLMs to conduct regular performance assessments and ensure a comprehensive evaluation of the end-user experience. The
system evaluates how effectively the retrieved products fulfill the user intent encoded in the search text query, using
LLM-as-a-judge evaluation metrics — such as relevance label-based NDCG — to score search results.

The framework serves as a source of quality signals that complement qualitative UX interviews and A/B testing metrics, and it
effectively is a core driver for continuous search optimization. It also gathers high-quality training data to enrich and
retrain relevance models. Additionally, the tool pinpoints the areas of underperformance and highlights the most challenging
query types, allowing engineering teams to focus their efforts efficiently.

## Building a dual-speed LLM annotation pipeline: from real-time to batch processing

Building a reliable LLM-powered system means balancing completely different operational requirements. On the one hand, you need
sub-second responses for live, user-facing features; on the other, you need cost-efficient throughput for heavy background
analysis. One size definitely does not fit all.

Our system is designed to handle exactly the above challenge. At its core, the application can be split into two categories:
on-demand listing annotation and batched model requests for daily search quality verification.

While these two workflows serve different business and product goals, they share the exact same underlying engineering
backbone. Whether we are processing a single listing in real-time or running thousands of search queries through a nightly cron
job, the data follows a strict, predictable path.

To visualize how this works in practice, let’s look at the high-level data flow of our application as shown in this diagram:

<figure>
<img alt="High-level data flow of the Relevance Assessment Tool pipeline" src="/assets/img/articles/2026-08-03-automating-search-relevance-llm-as-a-judge/data-flow-pipeline.png" />
<figcaption>
High-level data flow of the Relevance Assessment Tool pipeline.
</figcaption>
</figure>

In the simplest way, the pipeline highlights four key processes.

### Fetching the context

The first job of the LLM-as-a-judge application is to fetch a production Allegro listing and preserve the correct product
order.

### LLM labeling and reasoning

Following listing fetching, we combine our system prompt with the product details, formatting everything into an
OpenAI-compatible structure. The message is constructed like this:

```json
{
  "model": "gemini-3.1-flash-lite",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert search quality evaluator. Analyze the user's search query against the list of retrieved products. [...]"
    },
    {
      "role": "user",
      "content": "Search Query: 'running shoes'\nProducts: [Product X, Product Y]"
    }
  ]
}
```

**Key engineering takeaway.** Notice that we provide the model with the entire product page (Products A through Z) in a single
API request, rather than firing individual requests for each product. Packing the full context into one session dramatically
reduces network roundtrips, optimizes token usage, and cuts costs.

The trade-off: while batching optimizes throughput and latency, single-product requests usually offer higher output precision
and quality by preventing context dilution. It’s a classic balance between performance and accuracy.

### Business metrics calculation

At this analytical stage, raw LLM classifications are transformed into actionable business insights. To evaluate the true
quality of a search listing, it is not enough to just know if a product is relevant — we need to know on which position in
search results it appears. In search engineering, a mismatch at position #1 is a critical failure, while a mismatch at position
#20 is far less severe. By correlating the LLM’s semantic labels with the exact position of each product on the page, the
system calculates core search quality metrics. Ultimately, combining the model’s qualitative reasoning with positional metadata
gives us an automated, mathematically sound way to score how well a listing matches the user’s explicit search intent.

### Dual-route execution and persistence

To operationalize this pipeline, our single engineering backbone seamlessly splits to serve two different operational needs.
The core logic and transformations remain 100% identical, but the execution vehicle and data persistence layer adapt
dynamically:

* For on-demand annotations (real-time): the system executes a direct, asynchronous API call to the LLM. Once the business
  metrics are calculated, the results are returned to the user.
* For search quality verification (batch): to process thousands of queries without hitting rate limits or blowing the budget,
  we pivot to asynchronous batch prediction jobs. The final metrics are then dumped using optimized bulk insertions into our
  analytical data warehouse.

This simple abstraction allows us to reuse our entire prompt engineering and validation pipeline, while maximizing cost
efficiency and throughput at scale.

## Shifting from cloud to local infrastructure for scale and cost-effectiveness

Our preliminary “LLM-as-a-judge” framework successfully validated the concept and delivered the precision we needed. However,
running large-scale evaluations on cloud-based LLM APIs is resource-intensive, so moving to local models was the natural next
step.

Our approach was to benchmark local models against our existing human-labeled multilingual datasets, testing multiple model
variants to make sure we wouldn’t compromise the quality established by our cloud baseline (Gemini 3.1 Flash Lite). Across all
four languages, one model stood out — Gemma 4 26B (AWQ 4-bit, no-thinking) — which for the Polish language exceeded the quality
of our Gemini 3.1 Flash Lite baseline. On CZ, SK and HU datasets the cloud baseline retained an edge (see the table below).

| Language (dataset) | Best local model | κ-quad | Accuracy | F1 | MAE | Cloud baseline (Gemini 3.1 Flash Lite) |
|---|---|---|---|---|---|---|
| PL | cyankiwi-gemma (26B, no-thinking) | 0.69 | 0.87 | 0.87 | 0.27 | 0.67 |
| CZ | cyankiwi-gemma (26B, no-thinking) | 0.52 | 0.80 | 0.82 | 0.45 | 0.58 |
| SK | cyankiwi-gemma (26B, no-thinking) | 0.59 | 0.78 | 0.80 | 0.41 | 0.65 |
| HU | cyankiwi-gemma (26B, no-thinking) | 0.67 | 0.83 | 0.83 | 0.35 | 0.73 |

**Table 2: best model per language** (Cohen’s κ quadratic — primary metric). All local models use single-item processing with
the default prompt. Higher κ = better agreement with human ground truth. `cyankiwi-gemma` (Gemma 4 26B AWQ 4-bit, no-thinking)
is the best local model for Polish. Because the cloud baseline continues to outperform local options for the remaining
languages (CZ, SK, HU), Gemini 3.1 Flash Lite is still suggested as the primary reliable choice.

Metrics in this table: **κ-quad** (Cohen’s Kappa quadratic) — agreement with human labels on our ordinal scale, penalizing
large rating disagreements much more than near misses (−1 to 1, higher is better). Unlike standard (unweighted) Cohen’s kappa, which treats every disagreement equally, the [quadratic weighted variant](https://www.sciencedirect.com/science/article/abs/pii/S1572312711000773)
weights each disagreement by the squared distance between ratings, so mislabeling an *Exact product* as *Irrelevant* is
penalized far more heavily than confusing two adjacent classes. **Accuracy** — share of exactly correct
labels; **F1** — balanced score that rewards getting all classes right rather than over-predicting the majority class; **MAE** —
average distance between the model’s rating and the true rating (0–4, lower is better).

Along the way, several experiments with local LLMs shaped our final configuration:

* **Prompting**: adding few-shot examples did not meaningfully improve accuracy for local LLMs, so we kept our baseline prompt.
* **The “thinking” model paradox**: we compared “thinking” and “no-thinking” model variants and found that “no-thinking” models
  consistently delivered higher accuracy. This suggests our search relevance assessment task favors direct judgment over
  multi-step inference chains.
* **Product list size**: for Gemini models, the prompt includes the whole first page of Allegro’s listing products to reduce
  model costs. We tried this approach with local models, to overcome the number of requests and to achieve higher throughput.
  We tested three ways of passing products to the prompt — the whole product page, 10 products per prompt and 1 product per
  prompt. The whole-product-page variant proved ineffective as most of the model requests failed to parse the response. In the
  10-products-per-prompt variant some responses also resulted in parse errors — the total product number was different and the
  JSON response was corrupted. We therefore opted for single-item requests to bypass these parsing errors and ensure output
  reliability.
* **Throughput**: despite being our largest local model, Gemma 4 26B (no-thinking) was also the fastest in practice, sustaining
  around 16 query-product pairs per second — roughly 2.5x the throughput of the smaller 12B variant — which made wide-scale,
  continuous evaluation feasible without sacrificing quality.
* **Multilingual performance**: our evaluation spanned four languages (PL, CZ, SK, HU). Polish served as our primary benchmark
  thanks to the largest volume of labeled data. Among the other languages, Hungarian performed especially well, while Czech
  proved the hardest for every model. Notably, online models retain an edge on other languages — Gemini 3.1 Flash Lite
  outperformed our best local model on Slovak and Hungarian, making it a cost-effective reliable alternative for those
  languages.

The transition to the local models came with engineering challenges. We hit periodic parsing errors when models struggled with
strict output formatting, which we mitigated through robust schema enforcement and refined post-processing so outputs could be
cleanly ingested into our pipelines. Models that couldn’t meet this reliability bar (e.g. 20% parse-error rate for Mellum 2 12B
AWQ or class-imbalance exploitation for PLLuM 8B — predicted “Exact product” in ~94.5% of cases, κ-quad only 0.17) were ruled
out regardless of high accuracy (see the table below).

| Model | Type | κ-quad | Accuracy | Throughput | Notes |
|---|---|---|---|---|---|
| cyankiwi-gemma (26B, no-thinking) | local | 0.69 | 0.87 | ~16 it/s | Best local model — matches cloud quality |
| Qwen 3.6 27B (no-thinking) | local | 0.70 | 0.86 | n/a | High κ but ~5% parse errors — unreliable |
| Gemini 3.1 Flash Lite (single) | cloud | 0.69 | 0.87 | n/a | Cloud baseline |
| Gemma 4 qat 12B (no-thinking) | local | 0.68 | 0.86 | ~5–7 it/s | Solid, but weaker on languages other than PL |
| Gemma 4 26B AWQ (thinking) | local | 0.65 | 0.86 | ~16 it/s | 2nd place — thinking variant underperforms |
| Gemma 4 4B | local | 0.56 | 0.86 | n/a | Smaller model, lower agreement |
| GPT-OSS 20B | local | 0.64 | 0.88 | n/a | 5% parse errors |
| Bielik minitron 7B | local | 0.53 | 0.83 | n/a | 0.6% parse errors, clearly below Gemma |
| PLLuM 8B | local | 0.17 | 0.84 | n/a | Exploits class imbalance — unusable |
| Mellum 2 12B AWQ | local | 0.17 | 0.76 | n/a | 20% parse errors — unusable |

**Table 3: model comparison on the primary benchmark (PL).** Ranked by **κ-quad** (Cohen’s Kappa quadratic — alignment with
human annotators, with bigger rating gaps penalized more heavily); **Accuracy** is the raw share of correct labels and can be
misleading on its own when classes are imbalanced (see PLLuM metrics).

| Lever | Finding |
|---|---|
| Thinking vs no-thinking | No-thinking consistently wins (e.g. Gemma 4 26B: κ-quad 0.69 vs 0.65 on PL) |
| Few-shot prompting | No meaningful gain over the baseline prompt — kept baseline |
| Product list size | Severe penalty: Gemma 4 4B drops from κ-quad 0.56 (single) to 0.34–0.37 (batch of 10) |
| Throughput | cyankiwi-gemma reaches ~16 items/s (batch 512) vs ~5–7 items/s for 12B |
| Parse errors | cyankiwi-gemma stays <0.2% across all languages; PLLuM/Mellum/GPT-OSS unreliable |

**Table 4: model configuration findings.**

The result was clear: by deploying the best-performing local model, we replicated the quality of our cloud baseline while
cutting costs by 60%. This lets us run continuous, wide-scale relevance assessment — without the linear cost scaling that cloud
APIs demand.

## Future directions

Our journey with the Relevance Assessment Tool is far from complete. While we have achieved a significant milestone in
automating evaluation at scale, a primary area of development is the transition toward multimodal inputs. Currently, our system
relies on textual data, which provides a strong baseline, but we see significant potential in incorporating product images. By
enabling the model to “see” the products, we aim to improve relevance accuracy for departments like fashion and home design,
where visual cues are often as crucial as textual descriptions for inspirational searches (e.g. *boho dress*, *industrial home
decor*).

Beyond visual integration, we are also moving toward a more granular understanding of both search queries and product
specifications. Obviously, this requires the constant development of LLM-as-a-Judge evaluators and is based upon data assets
containing manual annotations of gold ground-truth datasets, which must cover growing business complexity (different
departments, diverse user needs, and personalization strategies). Finally, we remain committed to refining our continuous
benchmarking pipelines to be even more robust, ensuring we maintain high-performance standards across our entire multilingual
catalog as we continue to grow.

## Model links

* [Gemma 4 12B](https://huggingface.co/google/gemma-4-12B-it)
* [Gemma 4 E4B](https://huggingface.co/google/gemma-4-E4B-it)
* [Gemma 4 E2B](https://huggingface.co/google/gemma-4-E2B-it)
* [Qwen 3.6 27B (AWQ INT4)](https://huggingface.co/cyankiwi/Qwen3.6-27B-AWQ-INT4)
* [cyankiwi-gemma (Gemma 4 26B AWQ 4-bit)](https://huggingface.co/cyankiwi/gemma-4-26B-A4B-it-AWQ-4bit)
* [Bielik Minitron 7B](https://huggingface.co/speakleash/Bielik-Minitron-7B-v3.0-Instruct)
* [GPT-OSS 20B](https://huggingface.co/openai/gpt-oss-20b)
* [PLLuM 8B](https://huggingface.co/CYFRAGOVPL/Llama-PLLuM-8B-instruct-2412)
* [Qwen 3.5 9B](https://huggingface.co/Qwen/Qwen3.5-9B)
* [Mellum 2 12B (AWQ INT4)](https://huggingface.co/cyankiwi/Mellum2-12B-A2.5B-Instruct-AWQ-INT4)
* [Gemma 4 12B (QAT q4_0)](https://huggingface.co/google/gemma-4-12B-it-qat-q4_0-unquantized)

## Credits

We extend our sincere thanks to the DAQAS, Pytia, Phi and LTR teams for their invaluable contributions to accuracy metrics, RAT
development, UX design, and the collection of our foundational datasets.
