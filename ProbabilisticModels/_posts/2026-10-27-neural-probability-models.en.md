---
title: "Neural Networks as Probability Models"
date: 2026-10-27
lang: en
permalink: /en/neural-probability-models/
zh_link: /zh/neural-probability-models/
series: generative-models
series_order: 2
categories: [Probabilistic Models]
tags: [Neural Networks, Probability, Backpropagation]
classes: statistics-article
toc: true
toc_label: On this page
toc_sticky: true
excerpt: "The network tools needed for a VAE: forward computation, backpropagation, gradient updates, and outputs that parameterize Gaussian or Bernoulli distributions."
---

{% include vae-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

[The previous article]({{ '/en/variational-inference/' | relative_url }}) turned latent inference into optimization over approximate distributions. We now need a learnable function that maps an input to distribution parameters. A neural network provides that function.

We only need feedforward networks, the chain rule, and minibatch updates. The central question is how a deterministic network participates in a stochastic model.


<div class="pgm-reading-guide" markdown="1">

**Reading guide.** Read each purpose, main result, and takeaway first, then expand derivations or code as needed. Interactive figures remain in the main text so the argument can be followed without opening every calculation.

</div>

---

## 1. Neural network forward computation

<div class="pgm-section-intro" markdown="1">

**Purpose.** Start with the network as a function mapping inputs to outputs. Using fixed, existing parameters for a forward computation is commonly called **model inference**; learning parameters from data and a loss is called **training**.

</div>



### 1.1 Layers and nonlinearity

<div class="pgm-section-intro" markdown="1">

**Purpose.** View a layer as a weighted combination followed by a nonlinear transformation; a multilayer network repeats this process.

</div>

For an input vector $u$, a layer applies an affine transformation followed by an elementwise activation:

$$
a=Wu+b,\qquad h=\tanh(a).
$$

The rows of $W$ specify output coordinates and its columns input coordinates. A multilayer network composes such functions:

$$
h=\tanh(W_1u+b_1),\qquad o=W_2h+b_2.
$$

Nonlinearity matters: a composition of affine transformations without nonlinear activations is still affine. We use $\tanh$ for a compact example, not because VAEs require it.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Forward computation determines how inputs affect outputs. Nonlinearity enriches the function, without introducing sampling by itself.

</div>

### 1.2 Inputs, parameters, and training

<div class="pgm-section-intro" markdown="1">

**Purpose.** Distinguish supplied inputs, learned weights, and latent samples drawn later from a distribution.

</div>

Weights and biases are optimized parameters. Inputs are supplied data, and the loss evaluates the current prediction. A forward pass alone does not learn anything; training also differentiates the loss and changes parameters.

Model inference uses existing parameters to compute outputs. Training also includes a forward pass, followed by gradient computation and parameter updates. Here, model inference means evaluating the network; posterior inference means obtaining the conditional distribution of latent variables. In a VAE, one encoder forward pass can supply approximate-posterior parameters.

A VAE has generative-network parameters $\theta$ and inference-network parameters $\phi$. Both are distinct from the per-observation random latent variables $z_i$.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Training updates weights and biases. Encoder parameters, decoder parameters, and per-observation latent samples have different roles.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 1 summary.** A network supplies an adjustable function; training changes it. Next its outputs will specify distribution parameters.

</div>

## 2. Network outputs and probability distributions

<div class="pgm-section-intro" markdown="1">

**Purpose.** Use the network to specify a distribution through means, variances, or binary probabilities; draw random outcomes afterward.

</div>



### 2.1 Gaussian outputs: mean and log variance

<div class="pgm-section-intro" markdown="1">

**Purpose.** For continuous outcomes, predict both a typical location and uncertainty using a Gaussian mean and variance.

</div>

Let a network output two vectors:

$$
(\mu_\theta(u),r_\theta(u))=f_\theta(u),\qquad r_j=\log\sigma_j^2.
$$

These define a diagonal Gaussian conditional distribution:

$$
p_\theta(y\mid u)=\mathcal N\!\left(y\mid\mu_\theta(u),
\operatorname{diag}(\exp r_\theta(u))\right).
$$

The network remains deterministic. Randomness enters when we subsequently sample from the distribution. Log-variance outputs guarantee positive variances while allowing unconstrained real network outputs. Remember that

$$
\sigma^2=\exp r,\qquad\sigma=\exp(r/2).
$$

Using $\exp r$ as the sampling standard deviation would contradict the declared variance.

{% include vae-figure.html kind="network" %}

<details class="pgm-derivation" markdown="1">
<summary>Example parameters: the fixed interactive network</summary>

The fixed network in the figure uses

$$
\begin{aligned}
\mu(x)&=0.8\tanh(1.2x+0.4)-0.5\tanh(-0.7x)+b,\\
r(x)&=-1+0.5\tanh x.
\end{aligned}
$$

</details>

Moving the input changes the distribution's position and width; changing $b$ only shifts the mean. The figure performs no training, and its chosen weights are not a fit to a real dataset.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Fixed inputs and weights give a fixed distribution, while samples can vary. Sampling uses SD, whereas the network here outputs log variance.

</div>

### 2.2 Bernoulli outputs

<div class="pgm-section-intro" markdown="1">

**Purpose.** Binary outcomes need a valid probability. Transform the real network output into a probability for the two outcomes.

</div>

For a binary outcome, a real output $a_\theta(u)$ can define

$$
\pi_\theta(u)=\operatorname{sigmoid}(a_\theta(u)),\qquad
p_\theta(y\mid u)=\pi_\theta(u)^y(1-\pi_\theta(u))^{1-y}.
$$

A network output, a distribution parameter, and a sampled outcome are different objects. Bernoulli outcomes must be 0 or 1. A continuous measurement lying in $[0,1]$ is not automatically Bernoulli. Our minimal VAE experiment uses continuous Gaussian observations.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** A real output, its transformed probability, and a sampled zero or one are distinct. The observation model must match the data type.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 2 summary.** The network sets parameters; the probability model specifies outcomes and sampling. Next derive a training loss from that model.

</div>

## 3. Observation models and training losses

<div class="pgm-section-intro" markdown="1">

**Purpose.** Reward network outputs that assign high density to observed data. Negative log likelihood converts that requirement into a minimized loss.

</div>

The Gaussian negative log-likelihood for one observation is

$$
\ell(y,u;\theta)=\frac12\sum_{j=1}^D
\left[(y_j-\mu_j)^2\exp(-r_j)+r_j+\log(2\pi)\right].
$$

<details class="pgm-derivation" markdown="1">
<summary>Calculation: mean and log-variance gradients</summary>

Both $\mu_j$ and $r_j$ depend on the input through the network. Their derivatives are

$$
\frac{\partial\ell}{\partial\mu_j}=(\mu_j-y_j)\exp(-r_j),
\qquad
\frac{\partial\ell}{\partial r_j}
=\frac12\left[1-(y_j-\mu_j)^2\exp(-r_j)\right].
$$

</details>

Increasing variance downweights the squared residual, but the $r_j$ term penalizes excessive variance. With a learned variance, the squared residual alone is not the Gaussian negative log-likelihood.

If the observation SD is fixed at $\tau$ in every coordinate,

$$
\ell=\frac{\|y-\mu_\theta(u)\|^2}{2\tau^2}
+D\log\tau+\frac D2\log(2\pi).
$$

The last two terms are constant for network gradients when $\tau$ is fixed, but they change reported values. The later implementation retains them and reports nats per observation.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Fixed Gaussian variance gives weighted squared error. Learned variance requires its additional terms, preventing variance inflation from freely downweighting errors.

</div>

## 4. Backpropagation and parameter updates

<div class="pgm-section-intro" markdown="1">

**Purpose.** Given a loss, determine how each weight affects it. Backpropagation computes those derivatives and the optimizer applies an update.

</div>



### 4.1 Chain rule and gradient propagation

<div class="pgm-section-intro" markdown="1">

**Purpose.** Start at the output error and follow dependencies backward. Matrix derivatives are optional; the interactive figure shows the same process.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Calculation: backpropagation through two layers</summary>

For $o=W_2h+b_2$, $h=\tanh(a)$, and $a=W_1u+b_1$, suppose we already know $\delta_o=\partial\ell/\partial o$. Then

$$
\begin{aligned}
\nabla_{W_2}\ell&=\delta_o h^\top,&\nabla_{b_2}\ell&=\delta_o,\\
\delta_a&=(W_2^\top\delta_o)\odot(1-h\odot h),\\
\nabla_{W_1}\ell&=\delta_a u^\top,&\nabla_{b_1}\ell&=\delta_a.
\end{aligned}
$$

The symbol $\odot$ denotes elementwise multiplication. **Backpropagation** applies these local derivatives in reverse dependency order. These expressions use one observation and column vectors; batch implementations sum or average observation gradients.

</details>

Automatic differentiation records computational dependencies and applies derivative rules. It cannot decide whether our loss matches the probability model we intended.

{% include vae-explainer.html kind="backprop" %}

Follow the computational chain through multiplication, activation, and residual. The dashed segment previews an update; the button actually changes the weight. Take several steps with fixed data, then increase the learning rate and check whether a longer step necessarily helps.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The chain rule combines local effects into gradients for all weights. Automatic differentiation executes this calculation but requires correct dependencies.

</div>

### 4.2 Minibatch gradient updates

<div class="pgm-section-intro" markdown="1">

**Purpose.** Adjust weights using the gradient and repeat with another batch. The learning rate sets the step size.

</div>

Temporarily collect all parameters into $w$. For a batch $B$,

$$
J_B(w)=\frac1{|B|}\sum_{i\in B}\ell_i(w),\qquad
w\leftarrow w-\eta\nabla_wJ_B(w).
$$

The learning rate is $\eta$. Minibatch stochastic gradient descent uses part of the dataset to estimate an update direction. It saves computation but does not guarantee a decrease in the whole-dataset loss at each step. Adam adaptively scales gradient updates; it cannot repair an incorrect model or a mistaken reduction over dimensions.

An implementation clears old gradients, computes the current loss, backpropagates, and then updates parameters. Otherwise gradients may accumulate across steps.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Minibatches save work but individual losses can fluctuate. Clear gradients, differentiate, and update in order to avoid unintended accumulation.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 4 summary.** Backpropagation computes gradients; the optimizer changes weights. Neither automatically validates the model or loss.

</div>

## 5. Encoder and decoder

<div class="pgm-section-intro" markdown="1">

**Purpose.** Return these tools to the latent model: one network infers a latent distribution from observations, and another specifies observations from latent values.

</div>

A deterministic autoencoder compresses an input through a bottleneck and reconstructs it:

$$
z=e_\phi(x),\qquad\widehat x=d_\theta(z).
$$

This illustrates the computational directions of encoding and decoding. Reconstruction alone specifies neither a prior from which to sample $z$ nor a guarantee that samples from an arbitrary prior will decode sensibly.

For the VAE, we will instead specify

$$
q_\phi(z\mid x)=\mathcal N\!\left(z\mid\mu_\phi(x),
\operatorname{diag}(\exp r_\phi(x))\right),
$$

$$
p_\theta(x\mid z)=\mathcal N\!\left(x\mid m_\theta(z),\tau^2I\right).
$$

The encoder outputs approximate-posterior parameters; the decoder outputs observation-distribution parameters. The generative graph still points $Z\to X$. The inference distribution $q_\phi(z\mid x)$ is separately constructed; it is not an extra reverse edge casually added to the same generative graph.

The remaining question is how to differentiate through the sampled $z$ between the two networks. Continue with [Sampling, Reparameterization, and Amortized Inference]({{ '/en/trainable-variational-inference/' | relative_url }}).

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The encoder supplies approximate-posterior parameters and the decoder observation parameters. Differentiating through sampling between them is the next problem.

</div>

## 6. Check your understanding and notation

- With fixed inputs and weights, how can a deterministic network define a random model?
- If the network outputs $r=\log\sigma^2$, which expression gives the sampling SD?
- Why must a learned Gaussian variance retain more than a squared-error term?
- How do a latent sample, encoder parameters, and decoder parameters differ?

| Symbol | Meaning |
| --- | --- |
| $W,b$ / $h$ | Weights and biases / hidden activations |
| $r$ | Log variance, not log standard deviation |
| $\theta$ / $\phi$ | Generative / inference-network parameters |
| MLP / SGD | Multilayer perceptron / stochastic gradient descent |

## 7. References

1. **Christopher M. Bishop, 2006.** [*Pattern Recognition and Machine Learning*](https://link.springer.com/book/9780387310732), §§5.1–5.3 and §12.4.2. Probabilistic outputs, backpropagation, and autoassociative bottlenecks.
2. **David E. Rumelhart, Geoffrey E. Hinton, and Ronald J. Williams, 1986.** [*Learning representations by back-propagating errors*](https://doi.org/10.1038/323533a0). The original representation-learning research.
3. **Diederik P. Kingma and Max Welling.** [*Auto-Encoding Variational Bayes*, Appendix C](https://arxiv.org/html/1312.6114v11). MLP parameterizations of probabilistic encoders and decoders.

**Sources and corrections.** This article reorganizes the course's neural-network material and the references around the tools required for a VAE. Formulas follow the conventions stated here; the interactive figure is independently implemented. Rights to the original materials remain with their authors or publishers. Corrections to formulas, terminology, and interpretation are welcome.
