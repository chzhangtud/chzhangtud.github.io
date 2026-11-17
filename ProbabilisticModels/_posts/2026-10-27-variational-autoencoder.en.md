---
title: "VAE: From a Latent Probability Model to Generation"
date: 2026-10-27
lang: en
permalink: /en/variational-autoencoder/
zh_link: /zh/variational-autoencoder/
series: generative-models
series_order: 4
categories: [Probabilistic Models]
tags: [VAE, Generative Models, Variational Inference]
classes: statistics-article
toc: true
toc_label: On this page
toc_sticky: true
excerpt: "Start with generating new handwritten digits, discover why latent variables and an encoder are needed, derive the training objective, and explore trained toy and MNIST models."
---

{% include vae-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

Suppose we have a collection of handwritten digits and want to train a program that draws a new digit each time it runs. The drawings should vary in shape and handwriting while retaining the structure that makes them recognizable as digits.

Independently drawing a random value for each of 784 pixels usually produces noise. We need to learn relationships between pixels: which positions form a stroke and which should remain blank. A **variational autoencoder (VAE)** approaches this by drawing a small collection of random numbers, then transforming them into structured observations with a learned model.

That generation procedure is easy to program. The difficulty is learning the transformation when we have training images but none of the random numbers that produced them. The encoder, variational bound, and reparameterization each address part of this problem. We will introduce them as those needs arise, then inspect the trained models on this page.

## 1. Turning random numbers into structured observations

<div class="pgm-section-intro" markdown="1">

**First define generation.** To repeatedly produce new observations, we need a source of easily sampled randomness and a transformation from those random values to the observation space.

</div>

Start with something simpler than an image: a curved cloud of points in a plane. Each point has two coordinates, but the cloud roughly follows a curve. A single number $z$ can specify a position along that curve, and a function $m_\theta(z)$ can map it to a point in the plane. The parameters $\theta$ belong to a neural network that we will learn.

Because training data do not include $z$, it is called a **latent variable**. We give it a simple distribution from which we can sample, such as

$$
Z\sim p(z)=\mathcal N(0,1).
$$

This is the **prior**: it specifies how to draw a latent value before observing a particular data point. A standard Gaussian is convenient to sample and evaluate; the learned transformation handles the curve's complexity.

A real point cloud has some thickness. Measurement noise or other variation can move points away from the curve. We model that with Gaussian noise of fixed standard deviation $\tau$:

$$
X=m_\theta(Z)+\tau\eta,\qquad\eta\sim\mathcal N(0,I_2).
$$

For illustration, take $m(z)=(z,(z^2-1)/2)^\top$. A draw $z=0$ gives center $(0,-0.5)$; $z=1$ gives center $(1,0)$. Adding noise places an observation nearby. During learning, we observe the points and try to learn this transformation.

{% include vae-concept.html kind="mapping" %}

The conditional distribution corresponding to this process is

$$
p_\theta(x\mid z)=\mathcal N(x\mid m_\theta(z),\tau^2I_2).
$$

The network supplies the distribution's mean and is called a **decoder**. For images it can instead supply pixel probabilities, as we will see in Section 6. Drawing $z$ and then $x$ defines the joint distribution

$$
p_\theta(x,z)=p(z)p_\theta(x\mid z).
$$

The prior determines which latent positions are visited; the conditional distribution determines what each position can produce; their product describes the joint density.

<div class="pgm-section-summary" markdown="1">

**The model so far.** Draw a Gaussian latent value, decode its center, and add observation noise to obtain a new point. Learning should adjust the decoder so the resulting point cloud matches the data.

</div>

## 2. Learning when only observations are available

<div class="pgm-section-intro" markdown="1">

**Now we face the learning problem.** If every observed point came with its latent value, we could train the decoder to map that value to the observation. The data contain only observed positions, so we must consider all latent values that might have produced each one.

</div>

A natural learning criterion is to make observed examples likely under the model. Different latent values can contribute to the density of a given $x$, so we integrate their contributions:

$$
p_\theta(x)=\int p(z)p_\theta(x\mid z)\,dz.
$$

This is **marginalization**. Each contribution combines how frequently the prior visits a latent position and how well that position explains $x$. Maximum likelihood aims to increase the average $\log p_\theta(x)$ over the training set.

With a nonlinear neural decoder, the integral usually has no convenient analytic solution. Dense grids become expensive in higher latent dimensions. Sampling from the prior can estimate the density, but many samples may decode far from a particular $x$ and contribute almost nothing.

We would therefore like to infer which latent values could explain this observation. The exact answer is the posterior

$$
p_\theta(z\mid x)=\frac{p(z)p_\theta(x\mid z)}{p_\theta(x)}.
$$

Its denominator is the same difficult integral. We introduce another network to predict a tractable approximation $q_\phi(z\mid x)$. This is the **encoder**, with parameters $\phi$.

A common choice is a diagonal Gaussian whose mean and log variance come from the encoder:

$$
q_\phi(z\mid x)=\mathcal N\!\left(z\mid\mu_\phi(x),
\operatorname{diag}(\exp r_\phi(x))\right).
$$

The variance is $\exp r_\phi(x)$ and the standard deviation is $\exp(r_\phi(x)/2)$, both elementwise. Predicting log variance lets the network output arbitrary real values while keeping variances positive.

For example, an encoder might assign a point the one-dimensional distribution $\mathcal N(0.8,0.2^2)$. It proposes latent values near $0.8$, with uncertainty described by the standard deviation. A diagonal Gaussian is a tractable approximation; more complicated posteriors may not fit it well.

{% include vae-concept.html kind="inference" %}

The decoder describes possible observations starting from $z$. The encoder starts from $x$ and suggests possible latent values. We still need a shared learning objective for both networks.

<div class="pgm-section-summary" markdown="1">

**Why the encoder appeared.** Observations have unknown latent explanations, and their exact posterior is difficult to compute. An encoder learns an approximate posterior that focuses computation on useful latent regions.

</div>

## 3. ELBO: a tractable objective for learning

<div class="pgm-section-intro" markdown="1">

**A useful proposal still needs a learning criterion.** The encoder can suggest where to look for explanations, but its predictions must also be learned. We need an objective that rewards useful explanations and improves the decoder at the same time.

</div>

Variational inference provides a computable lower bound, the **evidence lower bound (ELBO)**:

$$
\begin{aligned}
\mathcal L(\theta,\phi;x)
&=\underbrace{\mathbb E_{q_\phi(z\mid x)}[\log p_\theta(x\mid Z)]}_{\text{explain the input using inferred latent values}}\\
&\quad-\underbrace{D_{\mathrm{KL}}(q_\phi(z\mid x)\Vert p(z))}_{\text{departure of the approximate posterior from the prior}}.
\end{aligned}
$$

For the first term, encode $x$, draw a proposed latent value, and decode it. If the decoder assigns high density to the original $x$, this term is large. Because the computation returns to its input, it is called the **reconstruction term**.

The second term uses **KL divergence** to compare the input's approximate posterior with the chosen prior. Training draws latent values through the encoder, whereas generation draws them from the prior. Their joint treatment in the probability objective helps coordinate these two ways of using the decoder. The tradeoff follows from the lower-bound derivation.

To see where the expression comes from, hold $x$ fixed and write $q(z)=q_\phi(z\mid x)$. Multiply and divide by $q$ inside the integral, then use concavity of the logarithm:

$$
\begin{aligned}
\log p_\theta(x)
&=\log\mathbb E_q\!\left[\frac{p(Z)p_\theta(x\mid Z)}{q(Z)}\right]\\
&\geq\mathbb E_q[\log p_\theta(x\mid Z)]
-\mathbb E_q\!\left[\log\frac{q(Z)}{p(Z)}\right]
=\mathcal L.
\end{aligned}
$$

The last expectation is KL divergence. Evaluating the bound requires only the prior, decoder, and approximate posterior, avoiding direct evaluation of the marginal likelihood.

For minimization, negate the bound:

$$
\boxed{J(x)=-\mathcal L
=\mathbb E_{q_\phi(z\mid x)}[-\log p_\theta(x\mid Z)]
+D_{\mathrm{KL}}(q_\phi(z\mid x)\Vert p(z)).}
$$

This is the familiar reconstruction loss plus KL. A large reconstruction loss means decoded latent samples explain the input poorly. A large prior KL means the encoding distribution departs substantially from the prior. Their sum is the negative-ELBO objective used here.

<details class="pgm-derivation" markdown="1">
<summary>Further detail: the gap between the bound and log likelihood</summary>

Substituting Bayes' rule into the KL definition gives

$$
\log p_\theta(x)-\mathcal L
=D_{\mathrm{KL}}(q_\phi(z\mid x)\Vert p_\theta(z\mid x)).
$$

Here the comparison is to the **true posterior**. For fixed decoder parameters, log likelihood does not depend on the encoder, so increasing ELBO decreases this approximation gap. Joint training also changes the generative model itself.

This posterior KL and the prior KL inside the loss compare different distributions. The former is generally difficult to compute; the latter is tractable here. A logged prior KL therefore does not directly measure posterior approximation accuracy.

</details>

<div class="pgm-section-summary" markdown="1">

**We now have a learning criterion.** Reconstruct the input from encoder-proposed latent values, evaluate reconstruction cost, and add prior KL. Minimizing the sum learns both networks without directly computing marginal likelihood.

</div>

## 4. Turning the objective into a parameter update

<div class="pgm-section-intro" markdown="1">

**The objective must become a computation.** We need to evaluate KL, estimate the reconstruction expectation, and propagate gradients through sampling back to the encoder. Solving these three tasks gives a complete training update.

</div>

**Evaluate KL.** A standard Gaussian prior and diagonal Gaussian approximate posterior give the analytic expression

$$
D_{\mathrm{KL}}(q\Vert p)=\frac12\sum_{j=1}^d[\mu_j^2+\exp r_j-1-r_j].
$$

The latent dimension is $d$. At $\mu=0,r=0$, KL is zero because both distributions have mean zero and unit variance. In one dimension, $\mu=1,r=0$ gives KL $1/2$. Changing the variance while keeping the mean fixed also changes KL: it constrains both location and width.

<details class="pgm-derivation" markdown="1">
<summary>Derivation: the Gaussian KL formula</summary>

For one-dimensional $q=\mathcal N(\mu,\sigma^2)$ and $p=\mathcal N(0,1)$,

$$
\log\frac{q(z)}{p(z)}=-\log\sigma-\frac{(z-\mu)^2}{2\sigma^2}+\frac{z^2}{2}.
$$

Taking expectations under $q$, with $\mathbb E_q[(Z-\mu)^2]=\sigma^2$ and $\mathbb E_q[Z^2]=\mu^2+\sigma^2$, gives

$$
D_{\mathrm{KL}}(q\Vert p)=\frac12(\mu^2+\sigma^2-1-\log\sigma^2).
$$

Set $r=\log\sigma^2$ and sum over independent coordinates.

</details>

**Estimate reconstruction by sampling.** For each input, draw latent values from the encoded Gaussian and average their reconstruction losses. To make the sample's dependence on encoder outputs differentiable, write

$$
\epsilon\sim\mathcal N(0,I_d),\qquad
z=\mu_\phi(x)+\exp(r_\phi(x)/2)\odot\epsilon.
$$

This is **reparameterization**, with elementwise multiplication $\odot$. Randomness comes from a fixed noise distribution, and the encoder's mean and scale enter through differentiable operations. In one dimension, $\partial z/\partial\mu=1$ and $\partial z/\partial r=\tfrac12e^{r/2}\epsilon$. Reconstruction gradients can now travel through $z$ into encoder parameters.

For $\mu=0.8$, $\sigma=0.2$, and a noise draw $\epsilon=-0.5$, the sample is $z=0.7$. Decode that value and evaluate how well the resulting observation distribution explains the original input.

**Evaluate the reconstruction cost.** For our fixed-variance Gaussian observation model,

$$
-\log p_\theta(x\mid z)=\frac{\lVert x-m_\theta(z)\rVert^2}{2\tau^2}
+D\log\tau+\frac D2\log(2\pi).
$$

Here $D$ is the observation dimension, equal to 2 for the point cloud. Squared distance penalizes a decoded center far from the input. Smaller observation noise $\tau$ makes the same distance more costly. The final terms normalize the Gaussian density; fixed $\tau$ makes them irrelevant to parameter gradients, but they matter when reporting the negative ELBO.

With $L$ independent latent samples per observation,

$$
\widehat J(x)=\frac1L\sum_{\ell=1}^L[-\log p_\theta(x\mid z^{(\ell)})]
+\frac12\sum_{j=1}^d[\mu_j^2+\exp r_j-1-r_j].
$$

The experiments train with $L=1$ and average over a mini-batch. Individual estimates fluctuate, while successive updates see fresh noise. Encoding, sampling, decoding, evaluating both loss terms, and backpropagating complete one VAE update.

<details class="pgm-derivation" markdown="1">
<summary>Code: match the steps to PyTorch</summary>

This excerpt comes from the [complete toy script]({{ '/assets/examples/vae_toy.py' | relative_url }}). The batch shape is `[M, 2]`, with one latent dimension.

```python
mu, logvar = model.encode(batch)
std = (0.5 * logvar).exp()
z = mu + std * torch.randn_like(mu)
mean = model.decoder(z)

nll = ((batch - mean).square() / (2 * tau**2)
       + math.log(tau) + 0.5 * math.log(2 * math.pi)).sum(-1)
kl = 0.5 * (mu.square() + logvar.exp() - 1 - logvar).sum(-1)
loss = (nll + kl).mean()

optimizer.zero_grad()
loss.backward()
optimizer.step()
```

Each `.sum(-1)` sums either observed or latent coordinates; `.mean()` averages observations. Additionally dividing only reconstruction by the number of pixels would change the relative weighting of the two terms.

The computation retains dependencies from `mean` through `z` to `mu` and `logvar`. Detaching `z` would cut that reconstruction-gradient path back to the encoder.

</details>

<div class="pgm-section-summary" markdown="1">

**One update is now complete.** Evaluate Gaussian KL directly, estimate reconstruction by sampling, and use reparameterization to retain differentiable dependence on encoder parameters. Backpropagating the sum updates both networks.

</div>

## 5. Inspecting the learned two-dimensional model

<div class="pgm-section-intro" markdown="1">

**Use a visible example to inspect learning.** Plotting both observations and decoder outputs lets us compare finding a latent explanation for an existing point with generating a new point from a random latent value.

</div>

The dataset is the noisy parabola introduced in Section 1:

$$
U\sim\mathcal N(0,1),\qquad
X=\begin{pmatrix}U\\(U^2-1)/2\end{pmatrix}+0.18\eta,
\qquad\eta\sim\mathcal N(0,I_2).
$$

Training receives only $X$, without $U$ labels. The VAE learns its own latent coordinates and decoder. Its coordinate direction may reverse the generating $U$ while still representing the same observation distribution.

{% include vae-figure.html kind="vae" %}

Start with the decoder mean curve and move $z$. The green point shows $m_\theta(z)$, revealing where each latent-axis position maps in the observation plane. Gray points draw latent values from the prior, decode them, and add observation noise. The curve describes centers; the cloud includes random variation around them.

Next choose a held-out observation and compare the red input with the orange reconstruction:

$$
x\xrightarrow{\text{encoder}}\mu_\phi(x)
\xrightarrow{\text{decoder}}m_\theta(\mu_\phi(x)).
$$

This display uses the posterior mean as a representative latent position, so the same input gives the same orange point. The Latent distribution view shows the encoder's full approximate posterior. Reconstruction inspects how the model explains an existing observation; prior generation inspects what it produces by itself.

Resampling changes the gray points' random draws. The learned weights and decoder curve remain fixed. The browser loads an offline-trained model; reproduction details follow.

<details class="pgm-derivation" markdown="1">
<summary>Reproduce the toy experiment: architecture, settings, and metrics</summary>

The encoder is $2\to16\to16\to2$, outputting a scalar mean and log variance. The decoder is $1\to16\to16\to2$. Hidden activations are $\tanh$ and the observation standard deviation is fixed at $\tau=0.18$.

Training uses 512 observations, batches of 128, Adam learning rate 0.003, and 2500 updates with one latent draw per observation. Log variance is clamped to $[-8,5]$. Training seed is 13; training and held-out data seeds are 21 and 22. Evaluation uses 256 independent held-out observations with 32 fixed noise draws each.

With PyTorch installed, run from the repository root:

```text
python assets/examples/vae_toy.py
```

The script creates data and exports the [browser model]({{ '/assets/data/vae-toy-model.json' | relative_url }}), including weights, configuration, metrics, runtime version, and reference forward values. Exact results can vary slightly with the runtime.

The exported model's held-out mean negative-ELBO estimate decreased from 22.4332 to 1.4667 nats per observation. Final reconstruction negative log density is approximately −0.4836, and prior KL approximately 1.9503. Natural logarithms give units of nats.

A narrow continuous density can exceed 1 near its center, so its negative logarithm can be negative. Probabilities still come from integrating density over regions and remain between 0 and 1.

Decoding a representative mean, $m_\theta(\mu_\phi(x))$, generally differs from averaging a nonlinear decoder over the whole approximate posterior, $\mathbb E_q[m_\theta(Z)]$. The plot clips observations outside its visible window, while latent Gaussian draws themselves are untruncated.

</details>

<div class="pgm-section-summary" markdown="1">

**The plot exposes two tasks.** Reconstruction starts from an observed point and inspects its explanation. Generation starts from the prior and inspects the learned observation distribution. They share a decoder while obtaining latent values differently.

</div>

## 6. Moving from points to handwritten digits

<div class="pgm-section-intro" markdown="1">

**Return to drawing digits.** The point experiment already supplies the complete learning method. For images, replace coordinates with pixels and choose an observation distribution for them. Encoding, sampling, and variational learning retain their roles.

</div>

Each MNIST image has $28\times28=784$ pixels. This teaching model binarizes original 0–255 values: values above 127 become 1; all others become 0. Each resulting pixel can be modeled by a Bernoulli distribution.

Given a two-dimensional latent value, the decoder produces 784 logits $a_{\theta,j}(z)$. Sigmoid converts them into probabilities of a pixel being 1:

$$
\pi_{\theta,j}(z)=\operatorname{sigmoid}(a_{\theta,j}(z)).
$$

A probability of 0.9 means a sampled pixel is 1 with 90% probability. Sample every location to generate a binary image. Pixels are modeled as independent **given the same latent value**; shared strokes and structure arise because that latent value jointly controls all pixel probabilities.

The observation model and reconstruction cost are

$$
p_\theta(x\mid z)=\prod_{j=1}^{784}
\pi_{\theta,j}(z)^{x_j}(1-\pi_{\theta,j}(z))^{1-x_j},
$$

$$
-\log p_\theta(x\mid z)=-\sum_{j=1}^{784}
\left[x_j\log\pi_{\theta,j}(z)+(1-x_j)\log(1-\pi_{\theta,j}(z))\right].
$$

This is binary cross-entropy. For a target pixel of 1, predicted probability 0.9 incurs cost $-\log0.9\approx0.105$; probability 0.1 incurs about 2.303. It scores the decoder's explanation of the input. The prior, approximate posterior, Gaussian KL, and reparameterization retain their earlier forms.

**Reconstruction: what information survives the latent representation?**

{% include vae-mnist.html kind="reconstruction" %}

Choose a test image and follow input, encoding distribution, latent sample, and decoded image. The encoder maps 784 pixels to a two-dimensional mean and log variance. Displayed values $\mu$, $\log\sigma^2$, $\epsilon$, and $z$ correspond to the sampling formula in Section 4.

Mean reconstruction decodes $\mu_\phi(x)$ directly. Sampled reconstruction first draws a latent value from the approximate posterior. Resampling leaves the former fixed and may change the latter. Both images display Bernoulli probabilities as grayscale values, making the decoder output easier to inspect.

Missing strokes or blurry reconstruction reveal limitations of this learned representation: all information passes through two latent dimensions and a small network.

**Generation: what does the model draw without an input image?**

{% include vae-mnist.html kind="generation" %}

The uniform coordinate grid acts as a map of the decoder. Move $z_1,z_2$ to inspect neighboring latent positions. It displays both central and distant positions for comparison.

Actual generation draws from a standard Gaussian, which visits central regions more often than distant ones. Switch to Standard Gaussian prior draws to decode random positions. Then choose Bernoulli samples to draw binary pixels from their probabilities, completing latent draw, pixel probabilities, and image draw.

This model receives no digit labels. The generated digit depends on the sampled latent value and the decoder's learned mapping.

**Interpolation: how does the decoder transition between two encodings?**

{% include vae-mnist.html kind="interpolation" %}

Encode images A and B and move between their posterior means:

$$
z_\alpha=(1-\alpha)\mu_\phi(x_A)+\alpha\mu_\phi(x_B),\qquad0\leq\alpha\leq1.
$$

Decode each intermediate position with the same network. The endpoints are the two mean reconstructions; intermediate positions reveal outputs along the latent path. Depending on the learned representation, transitions may be smooth or pass through blurry and ambiguous shapes. This lets us inspect how the model organizes relationships between images.

<details class="pgm-derivation" markdown="1">
<summary>Reproduce MNIST: data splits, architecture, and training code</summary>

Use [torchvision MNIST](https://docs.pytorch.org/vision/stable/generated/torchvision.datasets.MNIST.html). Split the official 60000 training images with seed 33 into 55000 training and 5000 validation examples. Evaluate the official 10000 test images after training. Labels do not enter the encoder or loss.

The encoder is $784\to128\to64\to4$, splitting its output into two-dimensional means and log variances. The decoder is $2\to64\to128\to784$. Hidden layers use $\tanh$ and the output supplies logits. A two-dimensional latent space supports direct visualization while limiting representation capacity.

Use batches of 256, one latent sample per image, Adam learning rate 0.001, seed 31, and a predetermined 16 epochs. KL weight is 1 and log variance is clamped to $[-8,5]$.

```python
mu, logvar = model.encode(x)
z = mu + (0.5 * logvar).exp() * torch.randn_like(mu)
logits = model.decoder(z)

nll = F.binary_cross_entropy_with_logits(
    logits, x, reduction="none").sum(-1)
kl = 0.5 * (mu.square() + logvar.exp() - 1 - logvar).sum(-1)
loss = (nll + kl).mean()

optimizer.zero_grad()
loss.backward()
optimizer.step()
```

`binary_cross_entropy_with_logits` evaluates sigmoid and Bernoulli negative log likelihood together in a numerically stable way. Summing pixels before averaging observations gives units of nats per image.

The [complete script]({{ '/assets/examples/vae_mnist.py' | relative_url }}) handles downloading, training, evaluation, and export. With torch and torchvision installed, run:

```text
python assets/examples/vae_mnist.py --epochs 16
```

Use `--data-dir` for a dataset cache location and `--output` for the export path. The page loads the [exported model weights]({{ '/assets/data/vae-mnist-model.json' | relative_url }}) and includes the first 40 test images for browsing. Final metrics use all 10000 test images. Browser interactions perform forward computation.

</details>

<div class="pgm-section-summary" markdown="1">

**The image model uses the same method.** Pixel probabilities replace coordinate means, so reconstruction becomes binary cross-entropy. Reconstruction tests retained information, prior sampling inspects independent generation, and interpolation explores latent organization.

</div>

## 7. Assessing what the VAE learned

<div class="pgm-section-intro" markdown="1">

**A few convincing drawings leave questions unanswered.** We also want to know whether unseen inputs are handled well, plausible outputs occur frequently, and latent values genuinely influence generation. These questions require independent data, objective values, and model behavior.

</div>

Each epoch estimates validation negative ELBO using one fixed noise draw per image. After the predetermined 16 epochs, evaluate the test set. The exported model reports:

| Dataset and metric | Nats per image |
| --- | --- |
| Initial validation negative-ELBO estimate | 544.6864 |
| Epoch-16 validation negative-ELBO estimate | 145.9615 |
| Test reconstruction negative-log-likelihood estimate | 141.1539 |
| Test prior KL | 5.7046 |
| Test negative-ELBO estimate | 146.8585 |

The validation reduction indicates improvement on this objective for unseen images. Test components add up: $141.1539+5.7046=146.8585$. Comparisons should keep preprocessing and evaluation methods consistent; these results belong to this binarization, two-dimensional latent space, and small network.

Connect the numbers to the displays. Clear reconstructions indicate useful input information survives inference and decoding. Repeated plausible prior draws indicate useful behavior at positions visited during independent generation. Inspecting both helps locate problems along the learning and generation process.

One failure mode is **posterior collapse**: many inputs receive approximate posteriors close to the prior, while the decoder barely responds to latent values. Little input information then travels through the latent channel. A small prior KL together with nearly identical encodings and weak decoder response to changing latent values suggests this problem. KL alone is insufficient evidence.

The name variational autoencoder now has a concrete meaning. The reconstruction path encodes and decodes, with a latent distribution learned through a variational bound. The encoder assists learning; afterward, the prior and decoder can generate new observations on their own.

<div class="pgm-section-summary" markdown="1">

**The problem we have solved.** We wanted to generate complex data from simple randomness while observing only training examples. The encoder proposes latent explanations, ELBO provides a tractable objective, and reparameterization carries gradients through sampled values. After training, drawing from the prior and then the decoder gives the generation procedure.

</div>

The following [diffusion article]({{ '/en/diffusion-intuition/' | relative_url }}) studies another route to generation: learning to transform noise into structured data through gradual denoising.

## 8. Notation and references

| Symbol | Meaning |
| --- | --- |
| $x,z$ | Observation, latent variable |
| $\theta,\phi$ | Decoder and encoder parameters |
| $p(z),p_\theta(x\mid z)$ | Prior and conditional observation distribution |
| $q_\phi(z\mid x)$ | Encoder's approximate posterior |
| $\mu_\phi,r_\phi$ | Approximate-posterior mean and log variance |
| $m_\theta,\tau$ | Gaussian observation mean and fixed standard deviation |
| $d,D,L$ | Latent dimension, observation dimension, latent draws per input |
| $\mathcal L,J$ | ELBO and negative-ELBO loss |

1. **Diederik P. Kingma and Max Welling.** [*Auto-Encoding Variational Bayes*](https://arxiv.org/html/1312.6114v11), Sections 2–3 and Appendices B–C. The main reference for the bound, reparameterization, and Gaussian and Bernoulli models.
2. **Diederik P. Kingma and Max Welling, 2019.** [*An Introduction to Variational Autoencoders*](https://arxiv.org/abs/1906.02691). A systematic treatment of generative modeling, variational learning, and inference.
3. **Chris Cremer, Xuechen Li, and David Duvenaud, 2018.** [*Inference Suboptimality in Variational Autoencoders*](https://proceedings.mlr.press/v80/cremer18a.html). Further analysis of approximate inference errors.
4. **Torchvision documentation.** [MNIST dataset interface](https://docs.pytorch.org/vision/stable/generated/torchvision.datasets.MNIST.html).

**Sources and corrections.** This article independently organizes and derives the material using these references. Synthetic examples, training scripts, and interactive figures were implemented for this article. MNIST images come from the cited dataset, with rights retained by their providers. Rights in the original papers and textbooks remain with their authors or publishers. Corrections are welcome.
