---
title: "Geometry Generation: ShapeNet Chairs as Point Clouds or Fields"
date: 2026-11-03
lang: en
permalink: /en/generative-geometry/
zh_link: /zh/generative-geometry/
series: generative-models
series_order: 11
categories: [Generative Models]
tags: [Point Clouds, ShapeNet, SDF, Flow Matching]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Apply DDPM and Flow Matching to complete chairs, then extend the pipeline to latent SDF generation and conditional completion."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

Apply [DDPM]({{ '/en/denoising-diffusion/' | relative_url }}) and [Flow Matching]({{ '/en/flow-matching/' | relative_url }}) to one concrete 3D task: **train on many ShapeNet chairs, generate a new chair from random numbers, and obtain a viewable surface.**

Start with point clouds, then extend to geometric fields. The main distinction is how one complete sample is represented.

## 1. One example is one chair

Sample $N=2048$ points by triangle area from each chair mesh. Apply consistent orientation, centering, and scaling to obtain $y\in\mathbb R^{N\times3}$. A batch is `[B,N,3]`.

Learning shape variation requires different chairs: different backs, legs, and armrests. Repeatedly sampling one chair gives multiple observations of the same surface, without supplying diversity between shapes. Split training and test data by object identity before sampling surfaces.

The real Stanford Bunny below illustrates coordinate corruption using the same point-cloud representation:

{% include generative-figure.html kind="bunny" %}

Increasing noise thickens the surface into a cloud and obscures thin ears. Diffusion training learns to organize such coordinates across many shapes and noise levels.

## 2. Train noise prediction or velocity prediction

The same clean chairs $y$ support either objective:

| | DDPM | Linear Flow Matching |
| --- | --- | --- |
| Draw | Noise $z$, corruption time $\tau$ | Noise $z$, generation time $t$ |
| Input | $x_\tau=a_\tau y+b_\tau z$ | $x_t=(1-t)z+ty$ |
| Output | $\epsilon_\theta(x_\tau,\tau)$ | $v_\theta(x_t,t)$ |
| Target | $z$ | $y-z$ |
| Generate | Reverse denoising updates | Integrate from $t=0$ to 1 |

Both outputs have shape $N\times3$. The network processes the whole chair: deciding how one point moves requires context from the seat, back, and remaining points.

Row order has no geometric meaning, so a point-cloud field should generally be permutation equivariant. Reordering input points should reorder output vectors consistently, preserving the correspondence needed for per-point updates.

## 3. Turn a Gaussian cloud into a new shape

For FM, draw $x(0)\sim\mathcal N(0,I_{3N})$ and repeatedly update

$$
x(t+h)=x(t)+h\,v_\theta(x(t),t).
$$

At $t=1$, the coordinates form a generated point cloud. DDPM instead runs backward from high corruption, using noise predictions to compute reverse means and random perturbations.

The network has no target chair during generation. It arranges coordinates using learned shape regularities. Different starting noise can give another chair; specifying a category or partial observation requires conditioning.

**A point cloud has no triangle connectivity.** To obtain a mesh, apply surface reconstruction. For a continuous representation from which a surface can be extracted, consider a geometric field.

## 4. Generate SDFs through shape latents

A Signed Distance Function (SDF) maps a query position $r\in\mathbb R^3$ to signed distance. With negative values inside, the surface is its zero level set:

$$
f(r)<0\ \text{inside},\qquad
f(r)=0\ \text{on the surface},\qquad
f(r)>0\ \text{outside}.
$$

The generated object is **the field of an entire shape**, not one distance query. A useful teaching pipeline is:

1. Train a shape autoencoder to encode each chair as a latent $h=E(y)$.
2. Train its decoder $D(h,r)$ to predict that chair's SDF at query position $r$.
3. Freeze the autoencoder and train diffusion or FM on latents from many chairs.
4. Generate $h_{\mathrm{new}}$, query $D(h_{\mathrm{new}},r)$, and extract the zero level set.

For FM, use $h_t=(1-t)z+t h$ with target $h-z$. **Motion happens in shape latent space; the decoder supplies the surface.** This is the same division of labor used when moving image diffusion from pixels to a latent representation.

Decoder error, query resolution, and surface extraction affect the final mesh. Non-watertight input meshes also need an explicit policy for inside/outside signs. This is an implementable teaching pipeline, not a claim that a trained ShapeNet SDF model is included here.

## 5. Condition generation on what you want

Unconditional generation only asks for a plausible chair. To complete a partial scan $c$, condition the network:

$$
\epsilon_\theta(x_\tau,\tau,c)
\quad\text{or}\quad
v_\theta(x_t,t,c).
$$

During training, a full chair supplies the target and a simulated visible surface supplies the condition. At generation, holding $c$ fixed while changing initial noise can represent different plausible hidden backs.

Categories, text, or images can also be encoded as conditions. A class embedding is a direct option when only category control is needed. The condition specifies the request while the noise or velocity objective trains generation.

## 6. Check geometry and diversity

Rotate the camera to inspect the seat, legs, hidden surfaces, and outliers. Examine many samples to see whether backs and leg types vary. For SDFs, inspect extracted meshes for holes, self-intersections, and lost thin parts.

A common point-cloud measure is squared Chamfer distance:

$$
\operatorname{CD}(A,B)=
\frac1{|A|}\sum_{a\in A}\min_{b\in B}\|a-b\|^2+
\frac1{|B|}\sum_{b\in B}\min_{a\in A}\|b-a\|^2.
$$

Nearest-point distances expose positional errors, but do not inspect triangle connectivity and can miss density differences caused by duplicates. A distance for one sample also cannot establish diversity of a generated distribution.

<details class="generative-details" markdown="1">
<summary>Geometry detail: why can interpolation between valid endpoints look strange?</summary>

Array interpolation pairs row $i$ at the start with row $i$ at the end. Shuffling that correspondence can send intermediate points through the interior. This matters for shape deformation and interpolation. Noise-to-shape CFM can use random pairing without semantic correspondence across chairs.

</details>

{% include generative-figure.html kind="correspondence" %}

The full pipeline is now visible: **represent whole shapes as point clouds or latents, learn their distribution with diffusion or FM, then convert samples into viewable geometry.** Full 3D scenes additionally need object layout, relationships, and scale.

**References and provenance.** Data context: [ShapeNet](https://arxiv.org/abs/1512.03012) and the [Stanford 3D Scanning Repository](https://graphics.stanford.edu/data/3Dscanrep/). Method background: [point-cloud diffusion](https://arxiv.org/abs/2103.01458), [Flow Matching](https://arxiv.org/abs/2210.02747), and [DeepSDF](https://arxiv.org/abs/1901.05103). The latent pipeline is a teaching construction, not a reproduction of a specific architecture from these papers.

**Data and usage.** The Bunny figure samples 1024 points by triangle area from the real Stanford University Computer Graphics Laboratory mesh and applies uniform scaling. See the [preparation script]({{ '/assets/examples/prepare_generative_examples.py' | relative_url }}) for provenance. Usage is governed by the [source repository terms](https://graphics.stanford.edu/data/3Dscanrep/). Other datasets and papers retain their respective rights. No completed ShapeNet training experiment is reported.
