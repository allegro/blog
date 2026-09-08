---
layout: post
title: How to create a synthetic annotator? The process of developing a domain-specific LLM-as-a-Judge.
author: [zuzanna.rekawek,agata.hajduk-smak]
tags: [tech,mlr,llm,llm-as-a-judge,research,ml,machine learning,ai]
excerpt: In this blogpost we want to introduce the topic of using a Large Language Model (LLM) as an evaluator — a novel approach to tackling the complexities
    of evaluating advanced machine learning systems, particularly in tasks like Automatic Summarization, Text Generation, and Machine Translation, where
    traditional metrics struggle to capture nuances like cross-lingual accuracy and bias detection.
---
Every *Information Technology* (IT) system used in a production setting needs to be tested.
This is no different for solutions that are *Machine Learning* (ML) based.
In fact, ML models face an additional layer of complexity: they must be trained, evaluated during the development
process, and monitored continuously after deployment. While this judgment process may be relatively straightforward
for simple ML systems, more complex use cases, such as *Automatic Summarization*, *Text Generation* or
*Machine Translation* (MT) systems, present significant challenges. In this type of task it is necessary to ensure
accuracy between different languages, and to address potential biases in translations which is hard to achieve with traditional metrics.

In this blogpost we want to introduce the topic of using a *Large Language Model* (LLM) as an evaluator — a
novel approach to tackling these challenges.

<figure style="display:flex;justify-content:center">
    <img alt="Image of a robot acting as a judge" src="/assets/img/articles/2025-03-07-how-to-create-a-synthetic-annotator/judge.svg"/>
</figure>


## Why model evaluation may be a problem
In recent years it has become evident that major global tech companies are committed to, and will continue
leveraging, *Artificial Intelligence* (AI) in both internal and external products. This is hardly surprising,
as current advancements in *Deep Learning* (DL) technologies made it possible to efficiently solve numerous
complex tasks that involve the usage of very large datasets. The variety of available AI approaches necessitates
the use of diverse data types, but each model’s output must be thoroughly evaluated to assess its performance.
Evaluating simple, tabular data is generally straightforward; however, more intricate outputs demand significantly
more effort. Traditional automatic evaluation metrics for Natural Language Processing (NLP) tasks, such as [BLEU](https://en.wikipedia.org/wiki/BLEU)
and [ROUGE](https://en.wikipedia.org/wiki/ROUGE_(metric)), typically rely on exact matches of tokens or phrases. These metrics, however, fail to account for
important aspects like semantic meaning and fluency. Subtle details, such as synonyms, paraphrasing, or contextual
understanding, are often overlooked. Furthermore, they tend to prioritize superficial aspects over a deeper
understanding, failing to accurately reflect the quality or relevance of the generated content.

Evaluating machine learning systems that generate natural language output, as opposed to specific numerical or categorical values, presents unique challenges.
For instance, MT systems can produce multiple valid and contextually appropriate translations, each differing slightly yet still correct. Due to the inherent
subjectivity in assessing translation quality, traditional ML metrics such as accuracy or prediction error are not suitable, and thus, specialized human
evaluators are required to perform this task effectively.


Human feedback has long been regarded as the most reliable method for evaluating model-generated content in NLP
tasks. Although widely accepted as the gold standard, this approach is not without its drawbacks. Human annotations
are typically high-quality (but it is not always the case) but come at a considerable cost and require significant
time to procure. In a commercial setting, with rapid-paced AI model development, it is essential for their results
to be rated quickly and with a high degree of quality — a feat that is difficult to achieve through human
evaluation alone.

The solution to automating the evaluation process, while retaining the advantages of human oversight,
lies in the deployment of *state-of-the-art* (SOTA) LLMs. Annotations produced by these models exhibit a high
correlation with human evaluations, making them a promising alternative [^1]. In the literature this methodology is commonly referred to as `LLM-as-a-Judge`.


## What is LLM-as-a-Judge?
The term `LLM-as-a-Judge` describes a family of methods which use LLM-based solutions in the process of evaluation
or assessment of various types of content, responses, or general AI model performance.

<figure style="display:flex;justify-content:center">
    <img alt="A table showing pros and cons of using LLM-as-a-judge" src="/assets/img/articles/2025-03-07-how-to-create-a-synthetic-annotator/pros_cons.svg"/>
</figure>

The main advantages of this solution are:
- **Speed and high-quality**: LLMs offer significant efficiency gains by analyzing data rapidly and with high accuracy, surpassing the time-intensive process of
human evaluation.
- **Scalability**: Handles high volumes of tasks or data.
- **Cost efficiency**: Automates repetitive tasks, reducing the costs of hiring human annotators.

This approach is based on the hypothesis that evaluations generated by a powerful enough LLM can be
indistinguishable from human evaluations. Importantly, LLMs can evaluate not only tabular and textual data, but
also audio, video or even other AI models. LLM-powered evaluations became viable especially after the release of
**GPT-4**, which was demonstrated to be suitable for this task in many comprehensive studies [^2].

Unfortunately, this promising solution is not without disadvantage:.
- **High costs during development**: The subscription fees for using advanced models like GPT-4 to annotate data can be
costly, especially for large datasets.
- **Lack of transparency and explainability**: The opacity of LLMs’ decision-making process can undermine trust in the
system, as it is difficult to understand how they reach their annotations or judgments.
- **Time-consuming and expertise-intensive**: The development and fine-tuning of LLM-based systems demands expertise in
machine learning and can be a time-consuming and resource-intensive endeavor, particularly when optimizing for specific domains.


### Short literature review
In this section, we present the main principles and definitions of `LLM-as-a-Judge` methods, through a survey of relevant academic and industry research.

#### Data to evaluate

`LLM-as-a-Judge` systems score diverse data types, such as text, images, multimodal content
and even other models. The input structure significantly influences the evaluation process.

#### Type of evaluation tasks
These systems address a wide range of evaluation tasks, including:
- **Generating scores**: Assigning numerical values to responses or content based on predefined criteria.
- **Solving yes/no questions**: Determining whether a given statement is correct or if some content meets
certain conditions.
- **Conducting pairwise comparisons**: Evaluating two or more responses to determine which is better based on
specific quality measures.
- **Making multiple-choice selections**: Selecting the best option from a set of possible answers.
- **Creating a ranking**: Ordering responses based on a specific criterion or set of criteria.

#### Model selection
Choosing the right LLM for evaluation tasks is crucial. Two primary approaches exist:
- **General-purpose models**: Large-scale models like GPT-4 and LLaMA are often used for broad evaluations due
to their extensive training data and generalization capabilities [^1] [^3].
- **Fine-tuned models**: Domain-specific LLMs are trained on specialized datasets to improve performance in
targeted domains [^4] [^5].

#### Post-Processing
Post-processing enhances the reliability of LLM-based judgments by normalizing and interpreting outputs.
Common techniques include:
- **Logit normalization**: Adjusting confidence scores to improve evaluation consistency. [^6]
- **Extracting specific tokens**: Extracting score from generated text. [^7]

#### Evaluation
Assessing `LLM-as-a-Judge` performance involves comparing its judgments with human evaluations using:
- **Human-labeled datasets**: Benchmarks like MTBench and LLMEval2 provide ground truth for comparison [^8], [^9].
- **Correlation metrics**: Metrics such as Spearman correlation and agreement rates quantify alignment with human
judgments.

### Takeaways
Even with all advantages of `LLM-as-a-Judge` solutions, there are several concerns when using models in the
evaluation process. After analyzing multiple solutions, some limitations and biases were noticed [^8], [^9]. Using ML
solutions typically raises ethical concerns. The black-box nature of models makes them a vulnerable part of the
evaluation pipeline, potentially affecting the fairness and reliability of AI-driven assessments.

It should be noted that even though LLMs, unlike humans, are trained to avoid perpetuating harmful stereotypes,
they are still biased. The model’s generation process can be affected by systematic errors or tendencies, leading
to incorrect judgments. These biases, though often subtle, must be addressed when using LLMs in an evaluative context.
When creating a synthetic evaluator, the following judgment biases are commonly encountered:
- **Position bias**: The model favors the first example during a comparison of two sentences.
- **Verbosity bias**: The model prefers longer sentences, even if they are objectively
of lower quality.
- **Self-enhancement bias**: The model favors sentences generated by itself or similar models, and those that
are stylistically or structurally similar.
- **Sentiment bias**: The model better rates sentences with positive sentiment as more attractive resulting in positive labels that are preferred over negative
ones.


These biases can undermine the goal of using machine learning models to create a fair, objective, and transparent
evaluation process. Addressing these challenges requires implementing solutions such as swapping evaluated data,
using different LLMs, and selecting neutral label names.

It is crucial to remember that LLMs are tools designed to support, not replace, human judgment. Given the
vulnerabilities mentioned above, these solutions should be avoided when evaluating domain knowledge in legal or
medical fields.

While the integration of LLMs in the judicial or evaluative process has significant potential, understanding how
LLMs work should form the foundation of creating applications that remain ethical, fair, and effective.

## High quality data as a key to success

Exceptional quality data is fundamental to the success of `LLM-as-a-Judge`, as it directly influences the
model’s accuracy, reliability, and fairness. Low-quality data, including mislabeled or inconsistent examples,
renders the model ineffective as a judge. A well-curated dataset enhances the model’s ability to make accurate
and consistent evaluations by providing diverse and representative samples. Additionally, high-quality data
supports reliable benchmarking, enabling the comparison of different models based on their evaluation performance.

High quality data is obtained in the annotation process which should be carefully curated to make it possible
for human annotators to deliver the best results. Various techniques enable us to get this output, while dealing
with biases.

Lastly, the dataset used during the development of a syntactical judge does not need to be large. In our research,
we used a representative sample of 1,000 examples. This allowed us to preserve the distribution of the original
dataset while reducing the cost of repeatedly querying the model.

### Choosing evaluation criteria
When selecting evaluation criteria, it is essential to ensure they are based on an objective perspective rather
than a subjective one. Objective criteria provide measurable and reproducible results, making evaluations more
reliable and reducing potential bias.

Some criteria can rely on personal opinions, intuition, or assumptions, and should be avoided, since they can vary between
individuals. Instead, it’s better to focus on quantifiable and well-defined metrics, such as accuracy, precision, recall,
efficiency, cost-effectiveness, or compliance with predefined standards.

Additionally, the chosen criteria should align with the goals and requirements of the evaluation. When comparing
different solutions, methodologies, or products, the criteria should facilitate a fair comparison by ensuring
consistency and clarity in assessment. Well-defined evaluation standards also enhance transparency, making it
easier to justify decisions and replicate results in future analyses.

### Annotation process
At Allegro we place a high value on annotation instructions, because we know that good instructions translate
into better quality annotations.
Our focus is not only on creating the guidelines, but also on seeing how they perform in real-world use.

The process usually involves a business team with a need for an annotated dataset, a Data Annotation Project
Manager (a representative from the *Data Acquisition & Annotation Services team*, also known as DAQAS), and a
team of internal annotators.
Once these individuals work together, the ready instruction is sent out to an external data services vendor
with a larger dataset, which allows for scaling the annotation process.

At the start of the annotation process we therefore focus on what the annotation is supposed to achieve,
and then how it should be carried out.
We consider the image of an annotator required for the task: will they need domain knowledge, will they need to
be a native Polish, Czech, Slovak, Hungarian speaker (e.g. for data related to text generation) or expert linguists
(e.g. for annotating translations).
It is then determined what data will be at the annotator’s disposal and whether each piece should be treated
with equal importance.
Next, labels are identified and a decision is made whether the task will be single or multi-choice.

We tweak the instructions over and over as we go. For example, if we see people interpreting a word in different ways, we change the instructions
to give clearer definitions and examples. This helps everyone annotate the data the same way, giving us better results.
These first annotations allow for finding and filling the gaps. If there are cases that appear relatively
often in the data, that were not thought of at the stage of designing the instruction, they will
need to be included in its main body. Conversely, if there are unexpected examples that are difficult to label, they are
likely to be included in the edge cases section or simply the FAQ.

All these steps aim at making the instruction so comprehensive and exhaustive that in the end there is
no need to ask any questions to the task owner.
The guidelines should allow the annotator to make all of their decisions based on their best judgment.

To facilitate and unify the process in the company, DAQAS have prepared a template of an annotation instruction
detailing the above-mentioned elements:
1. Business context of the task (where the Product Manager is asked to explain what problem the business
would like to solve and what importance it has)
2. Goal of annotation (detailing what the annotation will be used for, e.g. to train a model)
3. Outline of the task with the following details:
   - workflow (how the annotator will proceed to annotate the data)
   - classes (what labels the annotator will use to annotate the dataset)
   - examples of both correct and incorrect annotations to illustrate the task.

### A brief critique of usage Likert’s scale
The **[Likert scale](https://en.wikipedia.org/wiki/Likert_scale)** is an ordinal scale with characteristics such as:
- Offers a range of response options, such as “Strongly Agree” to “Strongly Disagree”.
- The responses reflect a ranking.
- The distances between scores are not defined, meaning the numerical values assigned to the responses do not
imply precise intervals.

<figure style="display:flex;justify-content:center">
    <img alt="likerts_scale" src="/assets/img/articles/2025-03-07-how-to-create-a-synthetic-annotator/likert_scale.svg"/>
</figure>

The Likert scale is widely used to measure attitudes and opinions by asking respondents to indicate their level
of agreement or disagreement with a statement.
While it is widely used, it has several limitations:
- **Central tendency bias**: Respondents may avoid extreme answers, leading to data clustering around the middle
and masking true sentiments.
- **Ambiguity**: Interpreting Likert scores can be subjective, especially when aggregating data or analyzing responses.
- **Overuse**: Likert scales are sometimes used when more precise or appropriate measurement methods are needed.

### Benefits of using binary labels
Binary labels can be more effective than Likert scales in some situations because they offer clear, unambiguous
choices, reducing the potential for misinterpretation. With only two options (e.g., “Yes” or “No”), responses are
simpler and more direct, making analysis straightforward. Additionally, binary labels eliminate issues like
central tendency bias, which can distort Likert scale results. In cases where a clear decision or opinion is
needed, binary labels provide a more definitive measure of agreement or disagreement, ensuring clearer conclusions.

<figure style="display:flex;justify-content:center">
    <img alt="Example of a binary label" src="/assets/img/articles/2025-03-07-how-to-create-a-synthetic-annotator/binary.svg"/>
</figure>

### Comparing results to ground truth labels
Evaluating model performance requires comparing predictions to ground truth labels, whether for binary or
multiclass data. [Standard metrics](https://medium.com/analytics-vidhya/evaluation-metrics-for-classification-models-e2f0d8009d69) such as precision, recall, and F1 score are commonly used to represent the
model’s abilities.

A confusion matrix shows how well a model performs by displaying the number of correct and incorrect predictions.
Analyzing it helps understand how well the model classifies examples and which classes were mislabeled.

Additionally, metrics like Person’s Correlation Coefficient assess the linear relationship between predictions
and true labels, while Cohen’s Kappa measures inter-rater agreement, accounting for chance. These metrics provide
a more nuanced view of model performance, ensuring more reliable evaluations.

## Process of creating an LLM judge
In this section, we introduce a step-by-step guide to creating a synthetic evaluator.

### Define your problem and create dataset
In section _“High quality data as a key to the success”_, the structure
of the dataset and evaluation criteria were comprehensively presented. Creating an annotated dataset is the
foundation of the project. Clear objectives and goals simplify understanding and are suitable in all professional
fields.

<figure style="display:flex;justify-content:center;">
    <img alt="Outline of the process of building an LLM judge" src="/assets/img/articles/2025-03-07-how-to-create-a-synthetic-annotator/process.svg"/>
</figure>

To start developing an LLM judge, there is a list of requirements to follow.
At the beginning of the whole process, focus on the purpose of the project.
1. Describe the goal of the project: What do you want to achieve by using a synthetic annotator?
2. Collect the dataset: Use your internal data sources or LLMs to create the dataset that will be used in this
project. What sentences do you need to evaluate? You could also generate data from other LLMs while using
information from your domain. For example: when you want to evaluate the quality of translations generated by
an internal Language Model you should collect pairs of translated and non-translated sentences.
3. Choose an LLM: Check limitations of model. Is it possible to create evaluations that you want to provide?
Could this model process sentences in the language that you have them in?

The next part of the project is to obtain labeled data. The annotation process consists of the following steps:
1. Create annotation instructions: The annotation instructions are key to correctly labeled examples. Annotators
should be able to recreate the process without needing to contact the authors. Define the evaluation criteria for
judging sentences, provide detailed descriptions, and include examples of both correctly and wrongly annotated data
for every criterion.
2. Label data: To achieve the best results, base the annotation process on annotators who are experts in the subject
of the project. For more information, read the [Annotation process](#annotation-process) section.

Lastly, focus on the evaluation part and postprocessing of data.
1. Decide what metrics to use when evaluating results obtained from an LLM: Choose suitable metrics. Refer to the
[Comparing results](#comparing-results-to-ground-truth-labels) to ground truth labels section for more information.
2. Analyze and post-process data: Lastly, review the created dataset. Describe the distribution of the labels,
as it will determine how to evaluate the model’s output. Handle missing values if needed. Check the evaluated
sentences for:
   - How long are they?
   - What diverse range of contexts do they cover?
   - Look at the word distribution.

It is a good moment to answer the basic question: Does this project need an LLM evaluator? The simplicity of
using the latest LLMs is often the reason they are chosen for the evaluation process. While their capabilities
are impressive, and they can handle various tasks well, in problems like sentiment analysis, much simpler ML or DL
models can achieve excellent results. These solutions significantly reduce costs, are easier to maintain in a
production environment, and are independent of external products, but they require professional knowledge to train,
test, and deploy.

### Choose an LLM
Deciding which LLM is suitable for your project is strongly based on the project’s principles and the data you want
to evaluate. SOTA models like GPT-4 lead in multipurpose cases, but their high usage costs and closed-source nature
often make them unsuitable for production settings.

On the other hand, open-source models are powerful but require self-development. The best characteristic of these
models is that their usage is free.

Do not forget about fine-tuned models. While there are many options available, finding one aligned with the specific
problem you want to evaluate is essential.

Lastly, consider fine-tuning an LLM. While it is a time-consuming task, adapting the model to your specific problem
will improve the entire pipeline. A fine-tuned LLM will provide fixed, structured outputs without requiring
extensive prompt engineering.

After choosing an LLM, develop an easy workflow to ensure convenient access to the model. There will be many
experiments, and having a streamlined solution for this improves the entire pipeline. Ensure the chosen model is
suitable for your data. If your data includes sentences in a language other than English, verify that the LLM can
correctly interpret them.

### Create an evaluation prompt
In every LLM-based solution prompts are typically the main aspect that the user can control to improve and obtain
better results. The goal when creating a prompt in `LLM-as-a-Judge` tasks is to accurately recreate the annotation
process done by humans. The prompt engineering process is time-consuming and iterative, but a well-tailored prompt
can significantly boost the model’s performance.

Here are a few tips to help you obtain high-quality output:

- **Use a correctly written prompt**: Avoid spelling mistakes and ensure the language is clear and informative.
- **Format and structure the text**: Use [section markers](https://platform.openai.com/docs/guides/prompt-engineering#tactic-use-delimiters-to-clearly-indicate-distinct-parts-of-the-input)
and describe every variable in the text.
- **Set context**: Describe the purpose of the model, for example, “You are an AI system instructed to replace human
annotators in the task of evaluating...”
- **Use a description of the dataset and business context**: Provide additional specifications to help the LLM
understand the domain of the data and the problem.
- **Provide additional data used in creating the dataset**: Do not forget to provide all extra context available to
human annotators.
- **Provide a description of every evaluation criterion**: List the evaluation criteria and label descriptions.
- **Directly ask for the score generation**: Clearly request the model to return a label.
- **Try few-shot prompting**: Adding a couple of examples usually boosts performance. Show correctly annotated
sentences with the obtained score for each label.
- **Use Chain-of-Thought and generate reasoning**: This technique encourages the model to create output using
dynamically generated context, providing explainability.
- **Tailor the prompt for each LLM**: Remember that LLMs may interpret prompt formatting differently.
- **Experiment with generating annotations for every criterion in one call**: This alternative approach can speed up
the process and reduce costs, but it may result in poor performance due to large context size.

### Create an evaluation pipeline
An evaluation pipeline, made simple by using a powerful tool like LLMs.

<figure style="display:flex;justify-content:center;" class="hide-on-mobile">
    <img alt="Structure of an evaluation pipeline" src="/assets/img/articles/2025-03-07-how-to-create-a-synthetic-annotator/pipeline.svg"/>
</figure>

The steps in this pipeline are:
1. Inserting prepared data into the prompt.
2. Using the prompt to generate a suitable response from the model.
3. Retrieving the LLM’s generation.
4. Post-processing the output to obtain the label and other generation components.
5. Getting evaluation metrics.

### Generate results
Use the evaluation pipeline to obtain results. Save the results along with a description of all experiment parameters, such as the LLM, model parameters,
and used prompt.

### Analyse results, make changes, and evaluate again
Lastly, compare the obtained results to human annotations. How compatible are they? Are the results acceptable
in your case?

Try modifying the prompt, model, generation techniques, and methods for label selection. Also, consider adding
reasoning steps and evaluate again. This is an iterative task, and even small changes can improve the solution.

Do not hesitate to acknowledge that your data or problem definition might not be suitable for this solution.
Seek alternatives or stick with the human annotation pipeline, but conduct a thorough case study to assess your
options.

## An LLM judge using Allegro’s domain data
The goal of the project was to assess whether it is possible to create a trustworthy LLM-based evaluator using data
from e-commerce platforms such as Allegro.

### Datasets
Throughout the entire process we utilized two datasets, each with different sizes and evaluation criteria.
One dataset contains summaries of product reviews, while the other includes generated topics of a given product
category. Despite these differences, both datasets share several similarities:
- The evaluated sentences are generated by an LLM in Polish language.
- Each text is scored based on multiple criteria.
- Each example has associated additional data that was used to generate the sentence. E.g. in case of Topic
Generation Dataset category and path from Allegro’s page are provided.
- The label distribution is highly imbalanced, with the majority of examples representing a positive score for each
criterion.
- Criteria are scored on a binary scale. The positive class has value 1 and negative 0.
- Ground truth labels are obtained from human annotators. Annotation instructions created by
Allegro’s DAQAS team are used during this process.
- During the experiments a representative sample of 1000 examples from each dataset was used, maintaining the data
distribution.

### Setup
As the LLM-based judge model, we selected GPT-4 (version 2024-08-06), as it was considered the gold standard at the
time we began the process. The model was deployed on Azure, and we used Allegro’s open-source Python library,
[allms](https://github.com/allegro/allms/tree/main), to create a simple pipeline.

During the iterative process of developing the judge, we utilized a prompt inspired by Prometheus [^4], [^5], which
requires the generation steps to be listed and includes a request to generate feedback.
This prompt has form presented below:

````python
prompt = """###Task Description:
{task_description}
* The output format should be a json with criterion as a key and feedback (0 or 1) as a value. Skip newlines in the json.
* Please do not generate any other opening, closing, and explanations.

###The sentence to evaluate:
{{sentence}}

###Examples of correctly annotated sentences:
{examples}

###Score Rubrics:
Score given sentence by a criterion: {criterion}.
Score 0: {score_0}
Score 1: {score_1}

###Feedback:
"""
````

Variables in the prompt:
- `task_description`: Context provided to the model, describing the task.
- `sentence`: The text being evaluated.
- `examples`: Part included during few-shot experiments, providing a list of correctly annotated sentences in the output format.
- `criterion`: The name of the currently analyzed criterion.
- `score_0` and `score_1`: Descriptions of the labels and how to obtain them.

We evaluated the results by focusing on the performance of the less-representative class, specifically assessing
precision, recall, and F1 score. In addition to these metrics, we also computed and maximized Cohen’s Kappa to
measure the agreement between the model’s predictions and the human annotations.

### Experiments
We conducted a series of experiments for each dataset, evaluating every ablation scenario. The variations we tested
include:
- **Few-shot prompting**: We examined zero-shot, one-shot, and five-shot prompting to assess the model’s performance
across different levels of training context.
- **Adding context about the dataset**: Providing additional context typically enhances the generation of high-quality
responses. We explored how well the model performs with no context, with context provided to human annotators
(which included a detailed description of the dataset and examples of the data used to generate sentences), and
with simplified context (shortened descriptions of the datasets).
- **Evaluating one or all criteria in a single prompt**: This ablation aimed to determine whether the model could
maintain consistent response quality when analyzing all evaluation criteria at once. By reducing the cost of
dataset context to a single inclusion, we compared the model’s performance to that of analyzing one criterion at a
time.
- **Swapping score labels during label generation**: We hypothesized that the model might favor labels with positive
sentiment (such as 1). We tested how the effect of swapping these labels may affect the model’s results.
- **Using neutral label names**: We aimed to demonstrate that utilizing neutral labels names contributes to more stable
results. We used names: *label_a*, *label_b*

For each dataset, we conducted 72 experiments in total, calculated as 3 (few-shot variations) × 3
(context variations) × 2 (criteria evaluation options) × 2 (label swapping options) × 2 (neutral score usage).

### Results
In our experiments we aggregated the results for each metric by computing the weighted average, with the weights
reflecting the data distribution for each criterion.

Introducing few-shot prompting contributed to the improvement and stabilization of the results. The best
performance was achieved using five-shot prompting, which provided the most consistent outcomes.

However, evaluating all criteria at once had a negative influence on the overall results. Additionally, the model
did not always return scores for all criteria, often providing results for only a subset of them.

We also found that adding external context to the prompt helped improve the results. This additional information
enriched the model’s input and led to better performance overall.

While swapping labels of scores improved certain metric values, it also resulted in a significant increase in the
false-negative rate. This suggests that while score manipulation can improve some aspects of performance, it may
come at the cost of increased error.

Lastly, when neutral label names were used, the model’s performance was either on par with or slightly worse than
the non-modified version of the experiment. Even when scores were swapped between labels, the results remained
largely unchanged, indicating minimal impact from this adjustment.

Overall, the results were modest. Both datasets produced Cohen’s Kappa Coefficients slightly above 0.2, reflecting fair agreement between the human annotators
and the language model. A value close to zero suggests that there is still significant room for improvement, and further fine-tuning of the model may
help enhance performance.

## Summary
The `LLM-as-a-Judge` approach shows considerable potential in a production setting. The automated nature of this solution
allows the creation of complex pipelines.

However, this solution is not without problems. It requires time to test and tailor solutions to the problem
and dataset. Yet still results obtained by humans may be superior in this field. It is important to carefully
approach this topic and try it only when needed and possible to use, not just because LLMs' use may be seen as
a cutting-edge solution.

While using LLMs for synthetic annotation is a promising direction, it still requires significant improvements
before it can fully replace human work in production environments. For now, at Allegro we still rely on human
annotations in our production projects. It is important to emphasize that this is not due to the evaluation
process using LLMs, but rather because the models still need refinement for optimal performance.

## Bibliography
[^1]: [*GPT-4 Technical Report*, OpenAI et al., 2024](https://arxiv.org/abs/2303.08774)
[^2]: [*Sparks of Artificial General Intelligence: Early experiments with GPT-4*, Bubeck et al., 2023](https://arxiv.org/abs/2303.12712)
[^3]: [*LLaMA: Open and Efficient Foundation Language Models* H. Touvron al., 2023](https://arxiv.org/abs/2302.13971)
[^4]: [*Prometheus: Inducing Fine-grained Evaluation Capability in Language Models* S. Kim al., 2022](https://arxiv.org/abs/2302.13971)
[^5]: [*Prometheus 2: An Open Source Language Model Specialized in Evaluating Other Language Models* S. Kim al., 2022](https://arxiv.org/abs/2310.08491)
[^6]: [*MacGyver: Are Large Language Models Creative Problem Solvers?* Y. Tian al., 2024](https://arxiv.org/abs/2311.09682)
[^7]: [*Reasoning with Language Model is Planning with World Model* S. Hao al., 2023](https://arxiv.org/abs/2305.14992)
[^8]: [*Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* L. Zheng al., 2023](https://arxiv.org/abs/2306.05685)
[^9]: [*LLMEval: A Preliminary Study on How to Evaluate Large Language Models* Y. Zhang al., 2023](https://arxiv.org/abs/2312.07398)
