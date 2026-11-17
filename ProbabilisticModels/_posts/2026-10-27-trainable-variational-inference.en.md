---
title: "Trainable Variational Inference: Sampling, Reparameterization, and Amortization"
date: 2026-10-27
lang: en
permalink: /en/trainable-variational-inference/
zh_link: /zh/trainable-variational-inference/
series: generative-models
series_order: 3
categories: [Probabilistic Models]
tags: [Variational Inference, Reparameterization, Amortized Inference]
classes: statistics-article
toc: true
toc_label: On this page
toc_sticky: true
excerpt: "Use Monte Carlo estimates, reparameterized gradients, and a shared encoder to address three distinct obstacles between an ELBO and a trainable model."
---

{% include vae-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

We now have an [ELBO]({{ '/en/variational-inference/' | relative_url }}) and [neural distribution parameters]({{ '/en/neural-probability-models/' | relative_url }}). Efficient training still needs three things: expectation estimates, gradients, and inference that can be reused across observations.

Reparameterization addresses sampling gradients. Amortization addresses sharing across inputs. These are different problems, and we will handle them separately.


<div class="pgm-reading-guide" markdown="1">

**Reading guide.** Read each purpose, main result, and takeaway first, then expand derivations or code as needed. Interactive figures remain in the main text so the argument can be followed without opening every calculation.

</div>

---

## 1. Monte Carlo expectation estimates

<div class="pgm-section-intro" markdown="1">

**Purpose.** An ELBO expectation may be hard to integrate. Draw latent samples, evaluate the objective, and average their values.

</div>

Suppose we need

$$
J(\lambda)=\mathbb E_{q_\lambda(Z)}[f(Z)]
=\int q_\lambda(z)f(z)\,dz.
$$

With independent samples $z^{(1)},\ldots,z^{(L)}\sim q_\lambda$, use the **Monte Carlo (MC)** estimate

$$
\widehat J_L=\frac1L\sum_{\ell=1}^L f(z^{(\ell)}).
$$

<details class="pgm-derivation" markdown="1">
<summary>Calculation: estimator variance and sample count</summary>

It is unbiased when the expectation exists. For independent, identically distributed samples with finite variance,

$$
\operatorname{Var}(\widehat J_L)=\frac{\operatorname{Var}(f(Z))}{L}.
$$

The standard error therefore scales as $L^{-1/2}$. This describes repeated-sampling variability; doubling a particular sample set need not monotonically reduce its error.

</details>

More samples reduce typical repeated-estimation variability, without guaranteeing improvement on every individual draw.

No MCMC machinery is needed for our diagonal Gaussians: standard-normal samples can be transformed directly.

We will derive a sampled mean-gradient for $J=\mathbb E[(Z-1)^2]$ below. First inspect its repeated-sampling variability, then return to the derivation:

{% include vae-explainer.html kind="gradient" %}

Hold $\mu$ and $\sigma$ fixed and increase $L$. Gradient noise shows estimates concentrating near the analytic gradient; Samples and error shows the $L^{-1/2}$ standard-deviation scaling. This is the distribution of a gradient estimator, not the latent variable's own distribution.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Monte Carlo estimates expectations with sampling noise. We still need gradients when the sampling distribution depends on parameters.

</div>

## 2. Sampling distributions and parameter gradients

<div class="pgm-section-intro" markdown="1">

**Purpose.** Changing a mean or variance changes the samples, so an already drawn sample cannot simply be treated as an unrelated constant for differentiation.

</div>

When $q_\lambda$ depends on parameters, differentiating a sample average must account for changes in the sampling distribution.

For example, let $Z\sim\mathcal N(\mu,1)$ and $f(z)=z$. Then $J(\mu)=\mu$ and its derivative is 1. Treating an already drawn $z$ as a constant unrelated to $\mu$ would give an automatic derivative of zero.

This does not mean that gradients of sampling expectations do not exist. Different estimators are possible. For continuous Gaussians, **reparameterization** explicitly restores the dependency path.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Gradients must include how parameters affect samples. Reparameterization expresses this dependency through differentiable computation.

</div>

## 3. Reparameterized gradients

<div class="pgm-section-intro" markdown="1">

**Purpose.** Separate sampling into parameter-independent noise and a parameter-controlled transformation, then differentiate through that transformation.

</div>



### 3.1 Gaussian reparameterization

<div class="pgm-section-intro" markdown="1">

**Purpose.** Draw standard-normal noise and scale and shift it by the current parameters. Hold that noise fixed while computing the current gradient.

</div>

Write $r=\log\sigma^2$ and sample as

$$
\epsilon\sim\mathcal N(0,1),\qquad z=\mu+\exp(r/2)\epsilon.
$$

<details class="pgm-derivation" markdown="1">
<summary>Derivation: Gaussian pathwise gradients</summary>

Then

$$
\mathbb E_{q_{\mu,r}(Z)}[f(Z)]
=\mathbb E_{p(\epsilon)}\left[f\!\left(\mu+\exp(r/2)\epsilon\right)\right].
$$

The noise distribution no longer depends on the optimized parameters. The transformation from parameters to $z$, then to the loss, is differentiable. When differentiation and integration may be interchanged, and $f$ has no explicit parameter dependence,

$$
\frac{\partial J}{\partial\mu}=\mathbb E[f'(Z)],\qquad
\frac{\partial J}{\partial r}
=\mathbb E\left[f'(Z)\frac12\exp(r/2)\epsilon\right].
$$

This is a **pathwise derivative**: with the same noise, observe how the transformed sample moves as a parameter changes.

</details>

We can therefore hold the current noise fixed and differentiate along the parameter-to-sample-to-loss path.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Differentiate the transformation from parameters to samples, not the noise generator. Under the stated conditions, pathwise derivatives estimate gradients of expectations.

</div>

### 3.2 Checking sampled gradients

<div class="pgm-section-intro" markdown="1">

**Purpose.** Check sampled gradients on an objective with exact derivatives, separating implementation mistakes from sampling variation.

</div>

For $f(z)=(z-1)^2$,

$$
J=(\mu-1)^2+\exp r,\qquad
\partial_\mu J=2(\mu-1),\qquad\partial_r J=\exp r.
$$

<details class="pgm-derivation" markdown="1">
<summary>Calculation: sampled gradients of this objective</summary>

The sample-based gradients are

$$
\widehat{\partial_\mu J}=\frac1L\sum_\ell2(z^{(\ell)}-1),\qquad
\widehat{\partial_r J}=\frac1L\sum_\ell(z^{(\ell)}-1)\sigma\epsilon^{(\ell)}.
$$

</details>

{% include vae-figure.html kind="reparam" %}

Moving the mean or SD reuses the same noise draws, exposing the parameter-to-sample transformation. Resampling reveals the variation in estimated gradients at fixed parameters. A fixed seed makes the example reproducible, and the displayed gradients are computed from the plotted samples.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Fixed noise exposes parameter effects on samples; resampling exposes estimator variation. One sampled gradient need not equal the exact gradient.

</div>

### 3.3 Direct parameter dependence of the objective

<div class="pgm-section-intro" markdown="1">

**Purpose.** Some objectives depend on parameters both through samples and directly. Track both paths when differentiating.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: explicit and sample-path dependencies</summary>

If the integrand is $f_\phi(z)$, the complete chain rule is

$$
\nabla_\phi f_\phi(g_\phi(\epsilon))
=\left.\partial_\phi f_\phi(z)\right|_{z=g_\phi(\epsilon)}
+\left.\nabla_zf_\phi(z)\right|_{z=g_\phi(\epsilon)}\nabla_\phi g_\phi(\epsilon).
$$

Do not discard the first term. In the VAE reconstruction expectation, holding decoder parameters fixed makes $\log p_\theta(x\mid z)$ depend on encoder parameters only through $z$. If a sampled objective also contains $\log q_\phi(z\mid x)$, its explicit dependence must be handled too. The next article instead uses an analytic KL.

</details>

If the objective uses encoder parameters directly, include both that derivative and the derivative through the sample.

Reparameterization does not make arbitrary samplers differentiable. This construction is for continuous Gaussians under the appropriate differentiability and integrability conditions.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Following only the sample path can omit terms. VAEs often compute prior KL analytically and reparameterize the reconstruction expectation.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 3 summary.** Gaussian reparameterization preserves the sampling distribution and exposes a gradient path. Any direct parameter dependence of the objective must also be retained.

</div>

## 4. Encoders and amortized inference

<div class="pgm-section-intro" markdown="1">

**Purpose.** Separate posterior optimization for every observation is expensive. Train a shared function that directly outputs posterior parameters.

</div>



### 4.1 Shared posterior-parameter mapping

<div class="pgm-section-intro" markdown="1">

**Purpose.** Use an encoder to predict latent means and variances from each input instead of optimizing those parameters from scratch.

</div>

Previously, inference could separately optimize

$$
\lambda_i^\star=\arg\max_{\lambda_i}\mathcal L(q_{\lambda_i},\theta;x_i).
$$

A new observation would require another optimization. Instead, a shared network outputs

$$
(\mu_\phi(x_i),r_\phi(x_i))=e_\phi(x_i),
\qquad
q_\phi(z_i\mid x_i)=\mathcal N\!\left(z_i\mid\mu_\phi(x_i),
\operatorname{diag}(\exp r_\phi(x_i))\right).
$$

All observations share $\phi$, but their means and variances can differ. This is **amortized inference**: spread inference work across training one shared function.

It neither ignores the input nor fits a single identical Gaussian to every observation.

{% include vae-figure.html kind="amortized" %}

The demonstration has an analytically known posterior. Adjust $k$ to about $1/1.36$ and move $x$: one shared function then gives the correct means for different observations. The figure uses manual parameter adjustment, not a hidden training process.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Observations share a function and its weights, not one identical posterior. Different inputs can yield different means and variances.

</div>

### 4.2 Approximation and amortization gaps

<div class="pgm-section-intro" markdown="1">

**Purpose.** Separate limitations of the candidate family from the encoder failure to select its best parameters for each input.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: approximation and amortization gaps</summary>

Fix the generative model and assume encoder outputs lie in the same variational family. If $\lambda^\star(x)$ is a globally optimal per-observation solution,

$$
\log p_\theta(x)-\mathcal L(\phi;x)
=\underbrace{\log p_\theta(x)-\mathcal L(\lambda^\star(x);x)}_{\text{family approximation gap}}
+\underbrace{\mathcal L(\lambda^\star(x);x)-\mathcal L(\phi;x)}_{\text{additional amortization gap}}.
$$

The family may fail to represent the true posterior, and the shared encoder may fail to select the best member for each input. Actual optimization may not reach those ideal optima, so measured gaps can also depend on optimization quality.

</details>

The gap includes the family limitation and the additional failure of the shared encoder to choose its best member. Actual results also depend on optimization quality.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** A more capable encoder can address only part of the error. It cannot remove approximation error caused by the distribution family itself.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 4 summary.** Amortization reduces inference work for new observations, but the shared network may not choose the best approximation for every input. Speed and accuracy need separate evaluation.

</div>

## 5. Minibatch ELBO training

<div class="pgm-section-intro" markdown="1">

**Purpose.** Estimate training objectives from a batch of observations and latent samples within each observation. Keep these counts and their scaling distinct.

</div>

The total dataset objective is $\sum_{i=1}^N\mathcal L_i$. A batch $B$ of $M$ uniformly sampled observations yields the unbiased total-objective estimate

$$
\frac NM\sum_{i\in B}\widehat{\mathcal L}_i.
$$

For the **mean per-observation objective**, use $\frac1M\sum_{i\in B}\widehat{\mathcal L}_i$. The objectives differ by a fixed dataset-size factor, but reported values and learning-rate conventions should be consistent.

Batch size $M$ and latent sample count $L$ are separate dimensions. One latent sample per observation can still provide stochastic gradients across observations and training steps. Estimator quality and training behavior must be checked.

**A bound and its estimate are different.** The expectation defining the ELBO does not exceed $\log p_\theta(x)$. A finite Monte Carlo estimate can exceed it. Stochastic updates also lack exact EM's stepwise likelihood-monotonicity guarantee.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Minibatches and latent samples introduce separate randomness. The ELBO bounds log marginal likelihood, but an individual sampled estimate need not remain below it.

</div>

## 6. Training methods summary

<div class="pgm-section-intro" markdown="1">

**Purpose.** Place the three tools in one training workflow and identify the computation each provides.

</div>

| Tool | Problem addressed |
| --- | --- |
| Monte Carlo estimation | Estimate an expectation using samples |
| Reparameterization | Differentiate sampling expectations when applicable |
| Amortized inference | Share a function that produces posterior parameters for different observations |

The generative model is still $p(z)p_\theta(x\mid z)$. Combining it with an encoder and these training tools leads to the [VAE]({{ '/en/variational-autoencoder/' | relative_url }}).

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Sample averages estimate expectations, reparameterization supplies sampling gradients, and an encoder shares inference. The next article combines them with a generative model into a VAE.

</div>

## 7. Check your understanding and notation

- Which dependency is lost when a Gaussian sample is treated as independent of its mean?
- Why does resampling change estimated gradients but not analytic ones?
- Does amortization share latent values or the function producing distribution parameters?
- Why can a sampled ELBO estimate exceed the true log evidence?

$M$ is the observation batch size, $L$ the sample count per observation, and $\epsilon$ parameter-independent base noise. MC means Monte Carlo; SGVB means stochastic gradient variational Bayes.

## 8. References

1. **Christopher M. Bishop, 2006.** [*Pattern Recognition and Machine Learning*](https://link.springer.com/book/9780387310732), Chapter 11 introduction, printed pp. 523–525. Sample-average expectation estimates and variance.
2. **Diederik P. Kingma and Max Welling.** [*Auto-Encoding Variational Bayes*, §§2.2–2.4](https://arxiv.org/html/1312.6114v11). Reparameterization, SGVB, and shared inference networks.
3. **Chris Cremer, Xuechen Li, and David Duvenaud, 2018.** [*Inference Suboptimality in Variational Autoencoders*](https://proceedings.mlr.press/v80/cremer18a.html). Approximation and amortization gaps.

**Sources and corrections.** The derivations are reorganized from these references. Interactive examples implement the explicitly stated functions and models; paper figures are not reproduced. Rights to the original materials remain with their authors or publishers. Corrections to formulas, terminology, and interpretation are welcome.
