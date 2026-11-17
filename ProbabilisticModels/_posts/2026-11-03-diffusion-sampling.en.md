---
title: "Diffusion Models III: DDPM and DDIM Share Training, Not Sampling Rules"
date: 2026-11-03
lang: en
permalink: /en/diffusion-sampling/
zh_link: /zh/diffusion-sampling/
series: generative-models
series_order: 7
categories: [Generative Models]
tags: [DDIM, Diffusion, Numerical Analysis]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Use one noise predictor to understand stochastic DDPM updates, deterministic DDIM updates, skipping steps, and the connection to reverse SDEs and probability-flow ODEs."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

The relationship between DDPM and DDIM starts with one idea:

> **Under the common noise-prediction objective, DDIM can reuse a network trained for DDPM. It primarily changes how predictions are used to move between noise levels during generation.**

Separate **what the network learns** from **what the sampler does with it**. We first examine discrete updates, then connect them to reverse SDEs and probability-flow ODEs.

## 1. Keep training fixed: predict noise at the current level

Following the [previous article]({{ '/en/denoising-diffusion/' | relative_url }}), draw a MNIST image or ShapeNet chair cloud, choose a time, and construct

$$
x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
$$

Train the network to predict noise from $x_t,t$:

$$
L=\mathbb E_{x_0,t,\epsilon}
\left[\|\epsilon-\epsilon_\theta(x_t,t)\|^2\right].
$$

An exercise uses one noise level. It does not require generation to take 1000 steps or inject fresh noise at every step.

After training, the network answers a noise-prediction question at different times. **Turning that answer into the next state is the sampler's responsibility.**

## 2. DDPM: predict a mean, then sample the next state

Classic DDPM starts from $x_T\sim\mathcal N(0,I)$ and generates $x_{T-1},\ldots,x_0$. First compute the reverse mean:

$$
\mu_\theta(x_t,t)=\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,
\epsilon_\theta(x_t,t)\right),
\qquad \alpha_t=1-\beta_t.
$$

Then draw the next state around that mean:

$$
x_{t-1}=\mu_\theta(x_t,t)+\sigma_t z_t,
\qquad z_t\sim\mathcal N(0,I).
$$

$\sigma_t$ is the square root of the selected reverse variance. One choice is
$\sigma_t^2=\tilde\beta_t=\beta_t(1-\bar\alpha_{t-1})/(1-\bar\alpha_t)$. The final step adds no random perturbation.

For MNIST, the network predicts pixel noise and the sampler produces a slightly cleaner image. For chairs, it predicts coordinate noise and produces the next point cloud.

**Randomness comes from both initial $x_T$ and intermediate $z_t$.** Fixing only the starting noise while changing intermediate draws can change the output. Fixing all draws permits reproducibility.

## 3. DDIM: estimate clean data, then recombine at the target time

DDIM uses the prediction differently. First estimate the clean sample:

$$
\hat x_0=
\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon_\theta(x_t,t)}
{\sqrt{\bar\alpha_t}}.
$$

Choose a cleaner time $s<t$ and recombine estimated signal and noise using the proportions at $s$:

$$
\boxed{
x_s=\sqrt{\bar\alpha_s}\,\hat x_0+
\sqrt{1-\bar\alpha_s}\,\epsilon_\theta(x_t,t).
}
$$

This is the common **deterministic DDIM update**:

| Term | Role |
| --- | --- |
| $\sqrt{\bar\alpha_s}\,\hat x_0$ | Supply the signal component at the target time |
| $\sqrt{1-\bar\alpha_s}\,\epsilon_\theta(x_t,t)$ | Retain the appropriate noise component |

A cleaner $s$ increases signal proportion and reduces noise proportion. At $x_s$, query the network again. Predictions are refreshed along the path, rather than computed once at the start and reused unchanged.

Set $\bar\alpha_0=1$. At $s=0$, the noise term vanishes and the result is $\hat x_0$.

**Why can the network be reused?** Training uses the corruption marginal $q(x_t\mid x_0)$ at each time without uniquely specifying how all times must be coupled. DDIM constructs another family preserving those marginals, allowing the common noise objective to be reused with corresponding generation updates.

## 4. Where does the speedup come from?

The update directly supports a selected $s<t$. For example, a model trained at 1000 noise levels can visit

$$
1000\longrightarrow980\longrightarrow960
\longrightarrow\cdots\longrightarrow20\longrightarrow0.
$$

This requires 50 updates and one network call per update, versus 1000 calls in the classic adjacent-time DDPM chain. **Reducing expensive denoiser evaluations is the main source of speedup.** Avoiding random-number generation itself is not the key.

Skipping means using both endpoint times in the correct coefficients, so the process reaches the clean endpoint. It does not mean stopping an adjacent-step formula early. DDPM can also support compatible stochastic updates on a coarser grid; DDIM supplies a direct, widely used skipping construction.

With fewer steps, each prediction spans a larger change and quality can decrease. Fifty steps here illustrates call counts, not a claim of equal quality for every model.

## 5. Does deterministic sampling eliminate diversity?

No. Deterministic DDIM means:

> **The same starting noise, network, and sampling settings determine the subsequent updates.**

Initial $x_T$ remains random. A different draw can produce another digit or chair.

The generalized update also permits intermediate randomness:

$$
x_s=\sqrt{\bar\alpha_s}\,\hat x_0+
\sqrt{1-\bar\alpha_s-\sigma_{t\to s}^2}\,
\epsilon_\theta(x_t,t)+\sigma_{t\to s}z,
\qquad z\sim\mathcal N(0,I),
$$

$$
\sigma_{t\to s}=\eta
\sqrt{\frac{1-\bar\alpha_s}{1-\bar\alpha_t}}\,
\sqrt{1-\frac{\bar\alpha_t}{\bar\alpha_s}},
\qquad 0\leq\eta\leq1.
$$

At $\eta=0$, this reduces to section 3. At $\eta>0$, fresh noise is introduced. Adjacent times, $\eta=1$, and compatible posterior-variance settings recover the corresponding DDPM update.

DDIM therefore is not a synonym for every possible setting having no random term. Specify the configuration when comparing results.

## 6. Compare the two clearly

| Question | Classic DDPM sampling | Common deterministic DDIM |
| --- | --- | --- |
| Reuse one noise network? | Yes | Yes |
| Update mechanism | Compute reverse mean, then sample | Estimate clean data and recombine for target time |
| Fresh intermediate noise? | Usually, except the final step | None, with $\eta=0$ |
| Randomness source | Initial and intermediate noise | Initial noise |
| Fewer calls | Compatible coarse-grid stochastic updates, among other methods | Select a shorter time subsequence |
| Retraining when switching? | Not required with compatible paths and parameterization | Usually reuse the trained model |

For MNIST, fix initial noise and inspect connected strokes and digit coverage. For ShapeNet, hold point count, normalization, and camera fixed, then check legs, backs, and outliers.

Shared initial noise controls an input variable; it does not guarantee identical DDPM and DDIM outputs, because the update processes differ.

## 7. How does this connect to SDEs and probability-flow ODEs?

Continuous time further separates **shared learned information** from **chosen generation dynamics**:

- DDPM connects to reverse diffusion SDEs, whose paths include random perturbations.
- Deterministic DDIM connects to probability-flow ODE sampling under an appropriate continuous limit and change of variables.
- A common noise network can be converted into a score supplying information for either continuous sampler.

A finite-step DDIM sampler is not an exact probability-flow ODE solution. Step size and numerical updates still affect results.

The [next article]({{ '/en/score-based-models/' | relative_url }}) explains SDEs, why the forward SDE contains no score, and how one trained network supports both reverse SDEs and probability-flow ODEs.

**Extra intuition: why step size matters.** This analytic rotation example fixes the true velocity field to isolate numerical error. Euler follows the current direction; Heun also evaluates the predicted endpoint. It is not a DDPM/DDIM quality comparison.

{% include generative-figure.html kind="sampler" %}

More steps bring both paths closer to the circular arc. Compare number of function evaluations (NFE): here Heun evaluates twice per step and Euler once. In generative sampling, network evaluations are the expensive operations.

**Main connection.** Training learns noise prediction at the current state; sampling decides how to use it. Classic DDPM updates are stochastic and common DDIM updates are deterministic. Both generate from random initial states.

**References and provenance.** Question order draws on the reader-supplied [DeepSeek conversation](https://chat.deepseek.com/share/qkai6x2oonl72m9rv2). Shared training and generalized updates follow [Denoising Diffusion Implicit Models, §§3–4 and appendices B–C](https://arxiv.org/abs/2010.02502); continuous-time connections follow [Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456). The rotation widget is independently implemented and analytic; no MNIST or ShapeNet sampling-quality experiment is reported.
