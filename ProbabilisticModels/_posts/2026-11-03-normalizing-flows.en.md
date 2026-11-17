---
title: "Continuous-Time Generation II: Invertible Maps and Normalizing Flows"
date: 2026-11-03
lang: en
permalink: /en/normalizing-flows/
zh_link: /zh/normalizing-flows/
series: generative-models
series_order: 9
categories: [Generative Models]
tags: [Normalizing Flow, CNF, Geometry]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Use geometric coordinate warps to understand mass conservation, Jacobian determinants, continuous density changes, and the motivation for flow matching."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

The [previous article]({{ '/en/score-based-models/' | relative_url }}) described a deterministic ODE transporting noise into data. We now approach the same idea through coordinate transformations familiar from graphics: when a map stretches space, how must its probability density change?

## 1. A map preserves probability mass

Let $Z$ have known density and set $X=F(Z)$ with an invertible map. Under $X=2Z$, a short interval doubles in length but retains its probability mass, so density halves. In multiple dimensions,

$$
p_X(F(z))=\frac{p_Z(z)}{|\det J_F(z)|},
$$

$$
\log p_X(x)=\log p_Z(F^{-1}(x))-
\log|\det J_F(F^{-1}(x))|.
$$

The absolute Jacobian determinant measures local volume change, not distance traveled by a point.

{% include generative-figure.html kind="jacobian" %}

The uniform source makes equal source cells carry equal mass. Expanded target cells have lower average density. Shearing or bending alone need not change area; the determinant identifies the actual local area multiplier.

The widget uses $x=z_1$ and $y=e^{az_1}z_2+0.4\sin(2z_1)$, whose determinant is $e^{az_1}>0$. We recover $z_1$ from $x$, then recover $z_2$ from $y$. The deformation is a specific invertible map, not an arbitrary illustration.

## 2. How do normalizing flows define a model?

A normalizing flow composes invertible transformations:

$$
z_K=F_K\circ\cdots\circ F_1(z_0),
\qquad
\log p_K(z_K)=\log p_0(z_0)-\sum_{k=1}^{K}\log|\det J_{F_k}(z_{k-1})|.
$$

Tractable inverses and determinants enable density evaluation and maximum-likelihood training. Generation samples a simple source and applies the forward map.

An arbitrary neural network is usually neither invertible nor equipped with a cheap determinant. Real NVP uses structured coupling layers in which some coordinates control shifts and scales of others, producing a tractable Jacobian structure.

MNIST can be treated as a 784-dimensional array, but its pixels are discrete. A continuous density is not the probability mass of a discrete image. Reporting discrete likelihoods requires an explicit treatment such as dequantization.

## 3. How does a continuous flow resemble a velocity field?

An ODE can define the transformation instead:

$$
\frac{dx_t}{dt}=v_\theta(x_t,t),\qquad x_0=z.
$$

When the field is sufficiently regular and solutions exist uniquely, initial positions determine trajectories and reverse integration recovers starting points. Invertibility comes from the ODE flow rather than special invertible network layers at every step.

Think of samples as tracer particles. Their density obeys the continuity equation

$$
\partial_t p_t+\nabla\cdot(p_t v_\theta)=0.
$$

This expresses probability-mass conservation. Graphics simulations may move smoke or mesh vertices with velocity fields; generative models transport random variables. Their time coordinate need not be physical time, and their field need not obey a material law.

## 4. Why does divergence control density?

Along a trajectory,

$$
\frac{d}{dt}\log p_t(x_t)=-\nabla\cdot v_\theta(x_t,t).
$$

Positive divergence expands a local particle cloud and lowers density. Negative divergence compresses it. For $v(x)=ax$ in $d$ dimensions, $x_t=e^{at}x_0$ and divergence is $da$, so density scales as $e^{-dat}$, matching the finite-map volume formula.

A continuous normalizing flow (CNF) can integrate coordinates and log density together to evaluate likelihoods. Practical computations still depend on ODE tolerances, divergence calculations, and any high-dimensional trace estimation. A theoretical density formula does not eliminate numerical error.

## 5. What does invertibility imply for geometry?

A smooth nonsingular invertible flow in $\mathbb R^3$ cannot compress a full-dimensional Gaussian exactly onto a zero-thickness mesh surface in finite time. It can approximate a thin surface neighborhood, but exact lower-dimensional support requires additional care. This connects to the zero-noise endpoint issue in score models.

A complete-shape flow may instead act in $\mathbb R^{3N}$. That learns variation across point clouds, which differs from moving one point over a fixed surface.

Another approach learns a flow in latent space and uses a decoder for point clouds, vertex arrays, or implicit fields. The decoder need not preserve dimension or invertibility. Consequently, restrictions on latent flow topology do not directly establish restrictions on the final surface topology; representation and decoding also matter.

## 6. Why introduce flow matching next?

Likelihood training of a CNF generally involves solving the ODE and computing or estimating divergence. Can we instead choose a noise-to-data probability path and directly teach the network its required velocity?

That is the motivation for [flow matching]({{ '/en/flow-matching/' | relative_url }}). The continuous flow defines a model class; flow matching supplies a way to train it. Keeping model form and objective separate makes its relationship to diffusion easier to understand.

**Notation.** $J_F$ is the Jacobian, $\det J_F$ is signed local volume scaling, and $\nabla\cdot v$ is divergence. CNF means continuous normalizing flow.

**References and sources.** See [Variational Inference with Normalizing Flows](https://arxiv.org/abs/1505.05770), [Real NVP](https://arxiv.org/abs/1605.08803), [Neural Ordinary Differential Equations, §4](https://arxiv.org/abs/1806.07366), and [Flow Matching, §2–3](https://arxiv.org/html/2210.02747v2). The warp and graphics are independent implementations. Original papers remain subject to their authors' rights. Corrections are welcome.
