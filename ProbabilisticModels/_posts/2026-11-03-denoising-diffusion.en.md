---
title: "Diffusion Models II: A Compact Derivation from Corruption to Sampling"
date: 2026-11-03
lang: en
permalink: /en/denoising-diffusion/
zh_link: /zh/denoising-diffusion/
series: generative-models
series_order: 6
categories: [Generative Models]
tags: [DDPM, ELBO, MNIST]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Follow the complete DDPM mathematical chain: forward corruption, closed-form sampling, tractable posteriors, noise prediction, MSE, and generation."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

The [previous article]({{ '/en/diffusion-intuition/' | relative_url }}) explained the procedure: corrupt data, learn to predict noise, and generate with repeated reverse updates. Here we connect its equations:

> **Why define a forward process? Why can noise parameterize the reverse mean? How does noise MSE lead to the sampling rule?**

We retain that chain without a full ELBO expansion. A clean sample $x_0$ can be a $1\times28\times28$ MNIST image or a $2048\times3$ ShapeNet chair cloud. Operations apply elementwise; $I$ is identity covariance over all components.

## 1. Forward corruption: specify a simple random process

Each step attenuates the existing signal and adds independent Gaussian noise:

$$
q(x_t\mid x_{t-1})
=\mathcal N\!\left(\sqrt{\alpha_t}\,x_{t-1},\,\beta_t I\right),
\qquad \alpha_t=1-\beta_t,\quad 0<\beta_t<1.
$$

Equivalently, the executable form is

$$
x_t=\sqrt{\alpha_t}\,x_{t-1}+\sqrt{\beta_t}\,z_t,
\qquad z_t\sim\mathcal N(0,I).
$$

$\sqrt{\alpha_t}$ scales the signal; $\sqrt{\beta_t}$ is the new noise standard deviation. Draw independent $z_t$ at each step. We specify the sequence $\beta_1,\ldots,\beta_T$, called the noise schedule.

For MNIST this changes pixel values; for chairs it changes point coordinates. Nothing is learned in this operation.

## 2. Closed form: sample any noise level directly

Training should draw a level $t$ without repeatedly simulating all earlier steps. Gaussian corruption makes that possible.

Define

$$
\bar\alpha_t=\prod_{s=1}^t\alpha_s,\qquad \bar\alpha_0=1.
$$

Combining the steps gives

$$
q(x_t\mid x_0)
=\mathcal N\!\left(\sqrt{\bar\alpha_t}\,x_0,\,
(1-\bar\alpha_t)I\right).
$$

One standard Gaussian draw therefore suffices:

$$
\boxed{
x_t=\sqrt{\bar\alpha_t}\,x_0+
\sqrt{1-\bar\alpha_t}\,\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
}
$$

Why the variance $1-\bar\alpha_t$? After two steps it is
$\alpha_2\beta_1+\beta_2=\alpha_2(1-\alpha_1)+(1-\alpha_2)=1-\alpha_1\alpha_2$. Recursing gives the result.

Here $\epsilon$ summarizes the accumulated noise rather than a single increment $z_t$. This is the noise the network will predict.

**The closed form constructs training inputs.** Choose a schedule with sufficiently small $\bar\alpha_T$ to make the terminal distribution close to standard Gaussian.

## 3. Reverse denoising: first consider a tractable version

Generation must move from $x_t$ to $x_{t-1}$. The true reverse distribution $q(x_{t-1}\mid x_t)$ depends on the unknown data distribution, so we cannot simply write it down.

Training has extra information: the clean sample $x_0$. Conditioning on it makes the previous-step distribution tractable:

$$
q(x_{t-1}\mid x_t,x_0)
=\mathcal N\!\left(\tilde\mu_t(x_t,x_0),\,\tilde\beta_t I\right),
\qquad t\geq2.
$$

Bayes' rule gives

$$
q(x_{t-1}\mid x_t,x_0)
\propto q(x_t\mid x_{t-1})\,q(x_{t-1}\mid x_0).
$$

Both right-hand factors are Gaussian functions of $x_{t-1}$. Multiply and complete the square:

$$
\tilde\mu_t=
\frac{\sqrt{\bar\alpha_{t-1}}\beta_t}{1-\bar\alpha_t}\,x_0+
\frac{\sqrt{\alpha_t}(1-\bar\alpha_{t-1})}{1-\bar\alpha_t}\,x_t,
$$

$$
\tilde\beta_t=
\frac{1-\bar\alpha_{t-1}}{1-\bar\alpha_t}\,\beta_t.
$$

The coefficients need not be memorized. The important point is: **knowing the clean answer makes the reverse step calculable; generation lacks that answer and needs a network.**

Approximate the true reverse process with a learned Gaussian transition:

$$
p_\theta(x_{t-1}\mid x_t)
=\mathcal N\!\left(\mu_\theta(x_t,t),\,\sigma_t^2 I\right).
$$

Fix the variance and learn the mean. Our sampling example uses the common choice $\sigma_t^2=\tilde\beta_t$ for $t\geq2$.

## 4. The substitution: replace unknown data with unknown noise

Solve the closed-form equation for clean data:

$$
x_0=
\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon}
{\sqrt{\bar\alpha_t}}.
$$

Substitute into $\tilde\mu_t$ and collect coefficients:

$$
\tilde\mu_t=
\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,\epsilon\right).
$$

The mean now depends on noise instead of clean data. A network predicting $\epsilon_\theta(x_t,t)$ defines

$$
\boxed{
\mu_\theta(x_t,t)=
\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,
\epsilon_\theta(x_t,t)\right).
}
$$

**Noise prediction supports generation because this equation converts it into the mean required by a reverse update.**

The network still sees only $x_t,t$, without access to the original sample. Other targets, including clean-data prediction, are possible; noise prediction is the parameterization used here.

## 5. Training: supervise with the noise we sampled

Draw $x_0$ from the dataset, select $t$, and sample $\epsilon$. The closed form supplies the input, and $\epsilon$ supplies the target:

$$
L_{\mathrm{simple}}
=\mathbb E_{x_0,t,\epsilon}
\left[
\left\|\epsilon-
\epsilon_\theta\!\left(
\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t
\right)\right\|^2
\right].
$$

Operationally: draw data, select time, corrupt, predict, and compare squared error.

How does this relate to likelihood? DDPM's evidence lower bound (ELBO) asks learned reverse transitions to approach the tractable posteriors from section 3. With fixed variance, Gaussian KL divergence becomes mean MSE. Substituting section 4 gives **time-weighted noise MSE**. The common $L_{\mathrm{simple}}$ further removes these time weights.

This provides a derivation, but does not make the simplified loss the unmodified negative log likelihood. We keep that connection without expanding the full bound.

The training core broadcasts over images or point clouds:

```python
index = torch.randint(T, (clean.shape[0],), device=clean.device)
a = alpha_bar[index].view((-1,) + (1,) * (clean.ndim - 1))
epsilon = torch.randn_like(clean)
noisy = a.sqrt() * clean + (1 - a).sqrt() * epsilon
prediction = model(noisy, (index.float() + 1) / T)
loss = (prediction - epsilon).square().mean()
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

Array entry <code>alpha_bar[0]</code> represents $\bar\alpha_1$, so normalized network time is <code>(index + 1) / T</code>. Use an image network for MNIST or a network aggregating whole-shape context for ShapeNet.

Under strong corruption, the original noise is generally ambiguous. The MSE optimum is $\mathbb E[\epsilon\mid x_t,t]$, rather than recovery of every random seed.

## 6. Sampling: insert predictions into reverse updates

After training, start from fresh noise:

$$
x_T\sim\mathcal N(0,I).
$$

For $t=T,T-1,\ldots,1$, predict $\epsilon_\theta(x_t,t)$ and update

$$
\boxed{
x_{t-1}=
\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,
\epsilon_\theta(x_t,t)\right)
+\sqrt{\tilde\beta_t}\,z.
}
$$

For $t>1$, draw $z\sim\mathcal N(0,I)$. The final step adds no noise and returns the mean. Extending the variance formula with $\bar\alpha_0=1$ gives $\tilde\beta_1=0$.

The update:

- Removes part of the predicted noise.
- Compensates for forward signal attenuation.
- Adds a random perturbation at intermediate steps using the selected variance.

The final $x_0$ is a new digit or chair cloud. Sampling uses the current state, time, network, and randomness, without an original clean sample.

## 7. Connect the complete mathematical chain

| Stage | Uses | Produces |
| --- | --- | --- |
| Define corruption | Schedule $\beta_t$ | Controlled forward steps |
| Combine steps | $x_0,t,\epsilon$ | Directly sampled $x_t$ |
| Compute training posterior | $x_t,x_0$ | Tractable reverse mean |
| Rewrite mean | Express $x_0$ using noise | Noise parameterization of $\mu_\theta$ |
| Train | Real examples and sampled noise | $\epsilon_\theta(x_t,t)$ |
| Generate | Fresh noise and trained network | New $x_0$ |

The connection is:

> **The closed form corrupts data, MSE teaches noise prediction, and the reverse-mean equation turns predictions into generation steps.**

The complete DDPM procedure is now defined. Run the [MNIST teaching script]({{ '/assets/examples/generative_mnist.py' | relative_url }}) with <code>--model ddpm --epochs 10</code>. Continue to [DDIM sampling]({{ '/en/diffusion-sampling/' | relative_url }}) for fewer steps, or [Flow Matching]({{ '/en/flow-matching/' | relative_url }}) to learn movement velocity instead.

**References and provenance.** The derivation order draws on the reader-supplied [DeepSeek answer](https://chat.deepseek.com/share/ommd8ohmqvu2lxjvpo). Equations follow [DDPM, §§2–3 and appendix](https://arxiv.org/abs/2006.11239). Shape-generation background: [Diffusion Probabilistic Models for 3D Point Cloud Generation](https://arxiv.org/abs/2103.01458). This explains generic training mechanisms rather than reproducing that paper's network. The MNIST script is educational; no ShapeNet training result is reported.
