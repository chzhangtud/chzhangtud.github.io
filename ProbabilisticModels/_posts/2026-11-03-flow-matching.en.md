---
title: "Flow Matching: Learning Motion from Noise to a Chair"
date: 2026-11-03
lang: en
permalink: /en/flow-matching/
zh_link: /zh/flow-matching/
series: generative-models
series_order: 10
categories: [Generative Models]
tags: [Flow Matching, ODE, MNIST, ShapeNet]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Start with straight interpolation and velocity supervision, then use a common Gaussian path to connect Flow Matching precisely to diffusion."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

[DDPM]({{ '/en/denoising-diffusion/' | relative_url }}) asks: “What noise was mixed into this chair?” Ask instead: **“In which direction should these coordinates move next?”** This leads to Flow Matching (FM).

Start with a clean chair, random noise, and a straight line between them. That is enough to construct a practical training target.

## 1. Draw a line from noise to a chair

Let $y$ be a clean chair and $z\sim\mathcal N(0,I)$ be noise, both shaped $2048\times3$. Use increasing **generation time** $t\in[0,1]$:

$$
x_t=(1-t)z+t y.
$$

At $t=0$, the state is noise; at $t=1$, the chair. At $t=0.3$, it is $0.7z+0.3y$.

The time convention has changed: larger DDPM times mean more noise, while larger times here mean closer to data. We use $y,z$ consistently for the data and noise endpoints.

{% include generative-figure.html kind="chair-flow" %}

The figure holds a procedural chair and one noise draw fixed to illustrate training interpolation. The endpoint is given in advance; **this is not a generated chair**. Actual generation only has fresh noise and a learned velocity field.

## 2. Read the velocity target from the path

Differentiate the straight line:

$$
u=\frac{dx_t}{dt}=y-z.
$$

Training draws $y,z,t$, constructs $x_t$, and asks the network to predict $y-z$:

$$
L_{\mathrm{CFM}}
=\mathbb E_{y,z,t}
\left[\|v_\theta((1-t)z+ty,t)-(y-z)\|^2\right].
$$

This is Conditional Flow Matching (CFM): the supervised velocity belongs to a path conditioned on known endpoints.

| Step | DDPM noise prediction | Linear CFM here |
| --- | --- | --- |
| Construct input | $a_t y+b_t z$ from a diffusion schedule | $(1-t)z+ty$ |
| Predict | Noise $z$ | Velocity $y-z$ |
| Loss | Squared noise error | Squared velocity error |
| Generate | DDPM, DDIM, or probability-flow solver | Integrate $dx/dt=v_\theta(x,t)$ |

For MNIST, $y-z$ is an image of pixel change rates. For point clouds, it is a set of coordinate velocities. The tensor shape stays the same; its interpretation changes.

## 3. Where does generation velocity come from?

After training, draw $x(0)\sim\mathcal N(0,I)$ and query the network repeatedly. Euler gives

$$
x(t+h)=x(t)+h\,v_\theta(x(t),t).
$$

Integrate from zero to one to obtain a new chair. The training core applies equally to MNIST and point clouds:

```python
# clean: images [B,1,28,28] or point clouds [B,N,3]
t = torch.rand(clean.shape[0], device=clean.device)
weight = t.view((-1,) + (1,) * (clean.ndim - 1))
z = torch.randn_like(clean)
middle = (1 - weight) * z + weight * clean
loss = (model(middle, t) - (clean - z)).square().mean()
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

The [MNIST teaching script]({{ '/assets/examples/generative_mnist.py' | relative_url }}) implements this with `--model fm --epochs 10` and uses Heun sampling, with two velocity evaluations per step.

Different chair–noise pairs can pass through similar intermediate states while requesting different velocities. The network only sees $x,t$. Squared error resolves this by learning

$$
v^\star(x,t)=\mathbb E[y-z\mid x_t=x,t].
$$

This is the **average velocity over possible endpoint pairs at the current state**. Generation continually reevaluates that field rather than following one stored training line.

<details class="generative-details" markdown="1">
<summary>Derivation: why does conditional regression learn the marginal velocity?</summary>

Let $U=y-z$. Conditional-mean regression gives

$$
\mathbb E\|v_\theta-U\|^2
=\mathbb E\|v_\theta-v^\star\|^2+
\mathbb E\|U-v^\star\|^2.
$$

The final term is independent of model parameters, so both objectives have the same parameter gradient. Averaging the conditional probability conservation equations gives the corresponding marginal equation. Under suitable regularity, the marginal velocity transports the overall distribution.

</details>

## 4. How does this connect to diffusion?

Write both approaches using a Gaussian path:

$$
x_t=a(t)y+b(t)z.
$$

Diffusion selects a particular signal/noise schedule. Linear CFM uses $a(t)=t,b(t)=1-t$. For any differentiable schedule, the conditional velocity is

$$
u_t=\dot a(t)y+\dot b(t)z.
$$

We can therefore **keep a diffusion probability path and train its velocity using Flow Matching**, or change the path to linear interpolation.

An existing noise predictor can also be converted. Estimate $\hat z=\epsilon_\theta(x,t)$ and $\hat y=(x-b\hat z)/a$, then substitute into velocity:

$$
v_\theta(x,t)
=\frac{\dot a(t)}{a(t)}x+
\left(\dot b(t)-\frac{\dot a(t)b(t)}{a(t)}\right)
\epsilon_\theta(x,t).
$$

This connects noise and velocity prediction for the **same path**, at interior times where $a(t)\neq0$. Renaming an arbitrary pretrained DDPM output does not turn it into a linear-flow velocity.

<details class="generative-details" markdown="1">
<summary>Further connection: scores, probability flow, and loss weights</summary>

A Gaussian noise path satisfies $s_t(x)=-\mathbb E[z\mid x_t=x]/b(t)$. Substituting gives

$$
v_t(x)=\frac{\dot a}{a}x+
\left(\frac{\dot a}{a}b^2-\dot b\,b\right)s_t(x).
$$

For schedules induced by a corresponding linear Gaussian diffusion SDE, this agrees with its probability-flow ODE velocity, with the time direction converted consistently. The connection concerns one-time distributions, not identical individual trajectories.

Prediction targets also change loss weights. If $c(t)=\dot b-\dot a b/a$, the compatible parameterization makes velocity error equal $c(t)$ times noise error. Velocity MSE is thus noise MSE weighted by $c(t)^2$, rather than the same unweighted objective. Endpoint divisions require limits or special handling.

</details>

## 5. Do straight training paths mean one-step generation?

No. Each conditional training line has constant velocity, but the learned average changes with position and time. Sampling paths can curve:

{% include generative-figure.html kind="matching" %}

Gray dashed lines are conditional training paths. Blue curves integrate an analytic marginal velocity. They do not have a one-to-one correspondence.

Easier-to-integrate paths may reduce network calls, but the learned field, solver, and training also matter. Independent straight-line pairing does not automatically solve global optimal transport between noise and data.

## 6. What changes for ShapeNet?

Use an entire chair's $N\times3$ coordinates as $y$, draw noise of the same shape, and retain the target $y-z$. The main change is the network: it must use global chair structure so points move coherently.

Pairing row $i$ of noise with row $i$ of a target defines a training path. It does not require semantic point correspondence across different chairs. Inputs and supervised outputs must nevertheless be reordered together. A point-cloud field should generally be permutation equivariant.

For geometric fields, encode chairs into shape latents, learn velocities there, and decode a signed distance function (SDF). The [geometry article]({{ '/en/generative-geometry/' | relative_url }}) develops that pipeline.

**Relationship to remember.** Diffusion and FM can share Gaussian probability paths and convert between score, noise, and velocity descriptions. FM can also choose other paths. Diffusion already supports deterministic probability-flow sampling; FM changes how paths and velocity supervision are constructed.

**References and provenance.** Conditional objectives, marginal velocities, and Gaussian paths follow [Flow Matching for Generative Modeling, §§3–4](https://arxiv.org/abs/2210.02747). Probability flow follows [Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456). The chair is procedural and the mixture figure is analytic; neither is a trained result. Code and exposition are independently written, with no ShapeNet experiment reported.
