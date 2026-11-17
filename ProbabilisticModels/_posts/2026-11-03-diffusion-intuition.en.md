---
title: "Diffusion Models I: From Corruption and Denoising to Generation"
date: 2026-11-03
lang: en
permalink: /en/diffusion-intuition/
zh_link: /zh/diffusion-intuition/
series: generative-models
series_order: 5
categories: [Generative Models]
tags: [Diffusion, MNIST, Point Clouds]
classes: [statistics-article, generative-article]
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Use MNIST and ShapeNet chairs to explain corruption, noise prediction, training, generation, conditioning, and latent diffusion in one complete account."
---

{% include generative-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

The basic idea of diffusion is:

> **Gradually turn real samples into noise, train a network to denoise, and generate by repeatedly applying that network to fresh noise.**

There are three activities: corruption, training, and generation. We specify the corruption rule, learn how to denoise, and repeatedly use that learned network to generate. First follow the complete procedure; then consider why it works.

We start with MNIST digits and transfer the same mechanism to ShapeNet chair point clouds. No prior study of VAEs or stochastic differential equations is required.

## 1. Intuition: use an easy corruption process to design a learning task

Imagine a clear handwritten 3.

Repeatedly adding random noise obscures the strokes until little remains except visual static. This is easy to program: sample random numbers and mix them into the image.

The opposite direction is difficult. Should a noisy image become a 3, an 8, or something else? The answer comes from regularities learned from training data.

Diffusion breaks the task into many noise levels:

- With little noise, learn to repair disturbed strokes.
- With more noise, learn to interpret the remaining structural clues.
- With almost pure noise, learn the broader possibilities of digit structure.

After training, combine these judgments into a process that takes noise to digits.

**The corruption rule is fixed; the network learns the information needed to generate in the opposite direction.**

## 2. Forward process: turn a digit into noise

Let $x_0$ be a clean image and $x_t$ its state at noise level $t$. Larger $t$ means stronger corruption.

{% include generative-figure.html kind="mnist" %}

Move the time slider to watch strokes disappear. The widget holds one noise draw fixed for comparison and illustrates the corruption formula; it does not run a denoising network.

A useful property is that **we can sample level $t$ directly, without performing $t$ separate corruption steps**:

$$
x_t=\sqrt{\bar\alpha_t}\,x_0+
\sqrt{1-\bar\alpha_t}\,\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
$$

The equation has two parts:

| Part | Meaning |
| --- | --- |
| $\sqrt{\bar\alpha_t}\,x_0$ | Retained clean-image signal |
| $\sqrt{1-\bar\alpha_t}\,\epsilon$ | Added Gaussian noise |

We arrange for $\bar\alpha_t$ to decrease with time. The image dominates initially and noise dominates at the end. At $\bar\alpha_t=0.01$, the signal coefficient is $0.1$ and the noise coefficient is approximately $0.995$.

For MNIST, both $x_0$ and $\epsilon$ are $28\times28$ arrays. Each pixel receives its own noise value. This attenuates signal and adds random variation, rather than simply blurring an image.

## 3. Reverse process: what does the network predict?

We want to move from $x_t$ to a slightly cleaner $x_{t-1}$. A common approach predicts the noise in the corruption equation:

$$
\hat\epsilon=\epsilon_\theta(x_t,t).
$$

The network receives a noisy image and its time. Its output has the same shape as the image and estimates noise at each pixel.

Time matters because a mildly corrupted digit and nearly pure static require different adjustments. It tells the network how much original signal remains trustworthy.

A sampler converts the prediction into an update to $x_{t-1}$. At the new state, predict again and take another step.

Denoising does not mean simply computing $x_t-\hat\epsilon$: the forward process also scales the signal, and update coefficients depend on time. The [mathematical article]({{ '/en/denoising-diffusion/' | relative_url }}) supplies the complete rule.

## 4. Training: the noise we added supplies the answer

No manual repair labels are needed. The program knows the noise it just sampled.

One update consists of:

1. Draw a real MNIST image $x_0$.
2. Sample a time $t$ and Gaussian noise $\epsilon$.
3. Construct $x_t$ with the forward equation.
4. Predict $\epsilon_\theta(x_t,t)$.
5. Compare the prediction with the known noise and update network parameters.

The common loss is mean squared error (MSE):

$$
L=\mathbb E_{x_0,t,\epsilon}
\left[\|\epsilon-\epsilon_\theta(x_t,t)\|^2\right].
$$

In words:

> **I corrupt a real digit; given the corrupted result and noise level, predict the noise used to construct it.**

Different times and noise draws turn one clean image into many training inputs. Each example needs only one sampled time, rather than an entire corruption chain. One network shares parameters across times.

## 5. Generation: start without an original image

After training:

1. Draw a standard Gaussian image $x_T$.
2. Predict noise from $x_T,T$ and update to $x_{T-1}$.
3. Predict again using the new state and time.
4. Continue toward the clean endpoint and return the image.

$$
x_T\sim\mathcal N(0,I)
\quad\longrightarrow\quad x_{T-1}
\quad\longrightarrow\quad\cdots
\quad\longrightarrow\quad x_0.
$$

There is no original image waiting to be recovered. The initial noise is new; the network uses learned digit regularities to organize strokes.

| | Training | Generation |
| --- | --- | --- |
| Start from | Real digits | Fresh Gaussian noise |
| Operation | Construct supervised denoising exercises | Repeatedly use the trained network |
| Know clean images and noise targets? | Yes | No |
| Network calls | One sampled time per example | Multiple calls along the sampling process |

Structure and detail often emerge progressively, but assigning only outlines to particular steps and only detail to others is not a strict rule.

## 6. Why can noise prediction teach generation?

This is the central conceptual question.

A network trained on MNIST sees coherent digit strokes; one trained on chairs sees seats, backs, and legs. **Inferring noise from corrupted observations requires learning which structures are consistent with the training data.**

Two surviving arcs in a noisy digit are ambiguous in isolation. Across the image, the network can use how a 3 connects or how an 8 forms two loops.

Strong corruption admits several explanations. The network generally cannot recover every random number exactly. Under MSE, the ideal estimate averages over the explanations compatible with the observation.

Why does that average not turn every generated digit into the same gray image? Because the estimate is used inside an evolving sampling process. Each update changes the input, and the next prediction changes with it. Many local updates produce a sample, rather than one regression directly from strong noise to a clean image.

More formally, noise prediction can be converted to the log-density gradient of the noisy distribution, called the score. It supplies data-dependent information for generation. The [continuous-time article]({{ '/en/score-based-models/' | relative_url }}) develops this connection after the basic procedure is understood.

## 7. Conditioning: request a digit 3

An unconditional model learns to generate MNIST-like images without knowing which digit is wanted. Introduce a condition $c$:

$$
\epsilon_\theta(x_t,t,c).
$$

For MNIST, $c$ can be class 3. For ShapeNet, it can be an object category or partial scan. For text-to-image generation, it can be features from a text encoder.

Training supplies a condition with each real example. Generation holds the desired condition fixed and changes the initial noise to obtain different matching samples. Text features commonly interact with image features through cross-attention.

Classifier-Free Guidance (CFG) randomly drops conditions during training, allowing conditional and unconditional predictions. Sampling strengthens the direction between them. Stronger guidance changes diversity and detail as well as condition adherence.

## 8. Latent diffusion: compress before generating

High-resolution images contain many pixels, making repeated network evaluation expensive. Latent diffusion first compresses an image with an autoencoder:

$$
x \xrightarrow{\ E\ } h
\quad\text{; corrupt, train, and generate in }h,\text{ then}\quad
h_{\mathrm{new}}\xrightarrow{\ D\ }x_{\mathrm{new}}.
$$

The diffusion model processes a compact representation $h$, and the decoder converts generated latents back into images. This reduces denoising computation, while introducing dependence on information preserved by the autoencoder.

MNIST is small enough for direct pixel-space practice. Latent diffusion adds a representation stage to the same learning procedure.

## 9. Transfer the mechanism to ShapeNet chairs

Sample 2048 surface points from each chair mesh. One example becomes $x_0\in\mathbb R^{2048\times3}$. Replace each pixel with each point's three coordinates; the corruption equation and noise MSE remain applicable.

{% include generative-figure.html kind="chair" %}

This procedural teaching chair illustrates coordinate corruption. Noise thickens the surface, obscures thin legs, and eventually overwhelms the seat and back. Actual ShapeNet training applies this process across many different chairs.

The network receives the noisy cloud and time, returning a noise array of the same shape. It needs whole-object context so points can jointly form a chair. Different training chairs supply variation in backs, legs, and armrests.

Generation starts from a new $2048\times3$ Gaussian array and produces a chair point cloud. Diffusion over shape latents can instead feed a decoder for a signed distance function (SDF), followed by mesh extraction. The [geometry article]({{ '/en/generative-geometry/' | relative_url }}) develops that pipeline.

## 10. Compare VAE, GAN, diffusion, and Flow Matching

Compare their mechanisms first:

| Method | Main idea | Common computational pattern |
| --- | --- | --- |
| VAE | Learn latent variables and a decoder | Decoding usually takes one forward pass; representation and objective affect results |
| GAN | Train a generator with discriminator feedback | Generation usually takes one forward pass; adversarial learning must address stability and coverage |
| Diffusion | Learn denoising at many noise levels | Direct regression objective; sampling usually makes multiple network calls |
| Flow Matching | Construct noise-to-data paths and regress velocity | Integrate a learned field; cost depends on paths and solvers |

This is a mechanism comparison, not a universal quality ranking. Sampling cost motivates methods such as [DDIM]({{ '/en/diffusion-sampling/' | relative_url }}). [Flow Matching]({{ '/en/flow-matching/' | relative_url }}) asks for movement velocity and connects to probability-flow descriptions of diffusion.

The core chain is:

> **Corruption creates controllable learning tasks, noise prediction learns data regularities, and repeated sampling updates turn fresh noise into new samples.**

Continue with the [compact mathematical derivation]({{ '/en/denoising-diffusion/' | relative_url }}) to align this procedure with forward distributions, reverse means, and sampling equations.

**References and provenance.** The narrative order draws on the reader-supplied [DeepSeek answer](https://chat.deepseek.com/share/ommd8ohmqvu2lxjvpo), with independently organized MNIST and ShapeNet explanations. Technical sources: [DDPM](https://arxiv.org/abs/2006.11239), [Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598), [Latent Diffusion Models](https://arxiv.org/abs/2112.10752), and [ShapeNet](https://arxiv.org/abs/1512.03012). MNIST uses binarized test inputs mapped to $[-1,1]$; the chair is procedural. Both figures only illustrate forward corruption. Papers and datasets retain their respective rights.
