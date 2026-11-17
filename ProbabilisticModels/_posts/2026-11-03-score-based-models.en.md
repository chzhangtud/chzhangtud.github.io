---
title: "Continuous-Time Generation I: One Score, SDE or ODE Sampling"
date: 2026-11-03
lang: en
permalink: /en/score-based-models/
zh_link: /zh/score-based-models/
series: generative-models
series_order: 8
categories: [Generative Models]
tags: [Score Matching, SDE, ODE, Diffusion]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Separate forward corruption, training, and reverse generation, then see how one score network supports reverse SDEs and deterministic probability-flow ODEs."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

The [previous article]({{ '/en/diffusion-sampling/' | relative_url }}) used one noise network with different sampling rules. Here is the continuous-time logic:

> **Specify forward corruption, train a denoiser to learn a score or its noise parameterization, then use that network in either a stochastic reverse SDE or a deterministic probability-flow ODE.**

Confusion often comes from treating the corruption equation, learned quantity, and generation equation as one object. We examine them separately.

## 1. What is an SDE? Start with an ordinary differential equation

An Ordinary Differential Equation (ODE) specifies velocity:

$$
\frac{dx}{d\tau}=f(x,\tau).
$$

A small update is $x\leftarrow x+f(x,\tau)h$. When solutions are unique, a fixed starting point determines the whole path.

A Stochastic Differential Equation (SDE) adds random perturbations:

$$
dX_\tau=f(X_\tau,\tau)\,d\tau+g(\tau)\,dW_\tau.
$$

$f$ is drift, describing deterministic change. $g$ controls noise strength and $W$ is Brownian motion. A small simulation step is

$$
X_{\tau+h}\approx X_\tau+f(X_\tau,\tau)h+
g(\tau)\sqrt h\,z,
\qquad z\sim\mathcal N(0,I).
$$

**Even with the same starting state, different intermediate random draws can give different SDE paths.** Noise scales with $\sqrt h$; Brownian increments cannot be treated as the derivative of an ordinary differentiable function.

For MNIST the state is an image. For ShapeNet it can be the coordinate array of a complete chair. All components evolve together.

## 2. The forward SDE corrupts data without a score

Let $\tau$ increase from zero to $T$, meaning **data to noise**:

$$
dX_\tau=f(X_\tau,\tau)\,d\tau+g(\tau)\,dW_\tau,
\qquad \tau:0\longrightarrow T.
$$

A variance-preserving process corresponding to small DDPM steps uses

$$
f(x,\tau)=-\tfrac12\beta(\tau)x,
\qquad g(\tau)=\sqrt{\beta(\tau)}.
$$

The first term attenuates signal and the second injects noise. Digit strokes disappear; chair surfaces scatter.

**There really is no score in this equation.** We specified the corruption rule, so a network is unnecessary to tell the program how to damage data.

What information is missing when we try to go from noise back to data?

## 3. Reversal needs the information supplied by the score

Corruption mixes many possible digits or chairs together. Knowing the signal attenuation and noise strength does not determine how a current cloud should form a plausible shape.

Let $p_\tau(x)$ be the density of noisy data at time $\tau$. Define

$$
s_\tau(x)=\nabla_x\log p_\tau(x).
$$

The **score is the gradient of log density with respect to sample coordinates**. It describes a local direction of increasing density. This differentiates with respect to $x$, not network parameters.

For a scalar Gaussian,

$$
p(x)=\mathcal N(\mu,\sigma^2)
\quad\Longrightarrow\quad
s(x)=-\frac{x-\mu}{\sigma^2}.
$$

The direction is positive to the left of the mean and negative to the right. For a chair, each score row has three point-coordinate components, but depends on the whole shape rather than simply a fixed surface normal.

{% include generative-figure.html kind="score" %}

The two-peak example illustrates noise scale: small noise preserves two distinguishable structures; large noise merges them. Following a score uphill to a peak is still different from sampling a distribution with the right spread. Generation also requires drift, schedule, and time direction.

## 4. Training: convert noise prediction into a score

We lack an explicit density $p_\tau$, but have clean examples and can corrupt them:

$$
x_\tau=a_\tau x_0+b_\tau\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
$$

$b_\tau$ is the forward noise standard deviation. Discrete DDPM uses $b_t=\sqrt{1-\bar\alpha_t}$.

For fixed $x_0$, the conditional density is a known Gaussian:

$$
\nabla_{x_\tau}\log q(x_\tau\mid x_0)
=-\frac{x_\tau-a_\tau x_0}{b_\tau^2}
=-\frac{\epsilon}{b_\tau}.
$$

The known target $-\epsilon/b_\tau$ can supervise a score network. This is denoising score matching. Squared error averages over possible clean sources; ideally the result is $s_\tau(x)$.

Alternatively, reuse the preceding noise predictor:

$$
\boxed{
s_\theta(x,\tau)=-\frac{\epsilon_\theta(x,\tau)}{b_\tau}.
}
$$

**Noise and score prediction here express the same information.** The time-dependent factor changes loss weighting, so unweighted MSE objectives are not automatically identical. Switching between the two samplers below can nevertheless reuse one trained network.

<details class="generative-details" markdown="1">
<summary>Compact derivation: why conditional score regression learns the marginal score</summary>

Differentiate $p_\tau(x)=\int q_\tau(x\mid x_0)p_{\mathrm{data}}(x_0)\,dx_0$ and divide by $p_\tau(x)$:

$$
\nabla_x\log p_\tau(x)
=\mathbb E[\nabla_x\log q_\tau(x\mid X_0)\mid X_\tau=x]
=-\frac{\mathbb E[\epsilon\mid X_\tau=x]}{b_\tau}.
$$

Squared-error regression learns this conditional mean. We can therefore train a log-density gradient without first estimating the density value at every position.

</details>

## 5. First generation choice: put the score into a reverse SDE

Under suitable smoothness conditions, time reversal gives

$$
dX_\tau=
\left[f(X_\tau,\tau)-g(\tau)^2s_\tau(X_\tau)\right]d\tau
+g(\tau)\,d\bar W_\tau,
\qquad \tau:T\longrightarrow0.
$$

Replace the unknown true score by $s_\theta$ and numerically simulate from the noise endpoint.

This answers why the earlier SDE lacked a score:

- The **forward SDE** follows specified corruption rules and needs no score.
- The **reverse SDE** uses learned distribution information and contains a score.

Generation runs with decreasing $\tau$, so $d\tau<0$. With positive step size $h$, the deterministic reverse increment uses $-h$, while random standard deviation scales with $\sqrt h$. The sign inside the brackets alone does not determine the movement direction.

## 6. Second choice: use the same score in a probability-flow ODE

The corresponding probability-flow ODE is

$$
\boxed{
\frac{dx}{d\tau}
=f(x,\tau)-\tfrac12g(\tau)^2s_\tau(x).
}
$$

Integrate from $\tau=T$ toward zero to generate. Substituting $s_\theta$ requires **no separately trained denoiser for the ODE**.

| | Reverse SDE | Probability-flow ODE |
| --- | --- | --- |
| Drift / velocity | $f-g^2s_\theta$ | $f-\tfrac12g^2s_\theta$ |
| Intermediate random term | $g\,d\bar W_\tau$ | None |
| Given a starting point | Still depends on random increments | Deterministic when the solution is unique |
| Network | The same $s_\theta$ | The same $s_\theta$ |

The change does more than delete randomness: **the score coefficient also changes from one to one-half**. That compensates for the effect of random diffusion on density evolution.

<details class="generative-details" markdown="1">
<summary>Compact derivation: where does one-half come from?</summary>

For $g$ depending only on time, the forward density satisfies the Fokker–Planck equation:

$$
\partial_\tau p=-\nabla\cdot(fp)+\tfrac12g^2\Delta p.
$$

Using $\nabla p=p\,s$, rewrite it as

$$
\partial_\tau p=-\nabla\cdot[(f-\tfrac12g^2s)p].
$$

This is the continuity equation for velocity $f-\tfrac12g^2s$. Deterministic motion can therefore produce the same marginal density evolution.

</details>

## 7. How can different paths have the same distribution?

Imagine generating ten thousand chairs and pausing at one time:

- Each SDE sample follows a randomly perturbed path.
- Each ODE sample follows a deterministic velocity field.

The theoretical equality concerns the **distribution of all samples at that time**, not identical coordinates for sample 17 in both processes. Think of matching group distributions despite different individual journeys.

This requires true scores, compatible initialization, and exact integration, among other conditions. Network approximation and finite steps produce practical differences. Determinism also preserves diversity from different initial noise draws.

## 8. Does only the decoder learn the score?

More precisely, the **whole denoising network** learns the score or its noise parameterization. In a U-Net, encoder and decoder both participate in prediction. They do not separately represent forward corruption and reverse generation.

Latent diffusion has another decoder: the autoencoder decoder that turns generated latents into images or geometry. Its role differs from the repeatedly evaluated denoising network.

| Stage | Operation | Needs a trained score? |
| --- | --- | --- |
| Forward corruption | Apply specified $f,g$ | No |
| Network training | Learn noise or score from supervised corruption exercises | Produces it |
| Reverse SDE generation | Correct drift and retain random perturbations | Uses it |
| Probability-flow ODE generation | Construct deterministic velocity | Uses the same network |

> **Training learns the information needed for denoising; generation chooses how to use it. The forward process is specified, while reverse SDE and probability-flow ODE samplers share a network but have different dynamics.**

MNIST uses batched images; ShapeNet can use batched $N\times3$ clouds. A representation change affects network architecture without changing these responsibilities.

[Continuous flows]({{ '/en/normalizing-flows/' | relative_url }}) next describes how velocity transports density. [Flow Matching]({{ '/en/flow-matching/' | relative_url }}) trains with directly constructed velocity supervision and can use other paths, so it need not always start by learning a score.

**References and provenance.** Question order follows the reader-supplied [DeepSeek conversation](https://chat.deepseek.com/share/qkai6x2oonl72m9rv2). Technical basis: [Score-Based Generative Modeling through SDEs, §§3–4 and appendix D](https://arxiv.org/abs/2011.13456); noise parameterization: [DDPM](https://arxiv.org/abs/2006.11239). The displayed equations assume a time-dependent scalar $g$ without spatial dependence. Zero-noise endpoints can require limits or a small residual noise level. The widget uses analytic distributions, not a trained generator.
