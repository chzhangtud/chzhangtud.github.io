---
title: "Neural Networks: From Representation Learning to Backpropagation"
date: 2026-11-03
lang: en
permalink: /en/neural-networks/
zh_link: /zh/neural-networks/
series: machine-learning
series_order: 110
categories:
  - Machine Learning
tags:
  - Neural Networks
  - Backpropagation
  - Optimization
classes: statistics-article
toc: true
toc_label: On this page
toc_sticky: true
excerpt: "Understand neural networks through XOR and a worked training step: representations, activations, losses, backpropagation, optimization, regularization, CNNs, and RNNs."
---

{% include statistics-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

Counting dark pixels rarely suffices to recognize a handwritten digit: different digits may contain the same amount of ink. We need representations that distinguish strokes, shapes, and their combinations. Neural networks learn these representations together with the prediction rule.

This standalone article reorganizes Jan Peters's *Statistical Machine Learning, Lecture 11: Neural Networks* (TU Darmstadt, Summer Semester 2019), adding explanations and worked examples. Basic matrix multiplication and single-variable derivatives are enough to begin. Read the hints, examples, and takeaways first; expand derivations when you want to check the details.

## 1. Representation learning

> **Hint:** Start with what the model sees, rather than how many layers it has.

A conventional approach chooses features $\phi(x)$, then learns a prediction such as $\widehat y=w^\top\phi(x)+b$. A neural network also learns parameters inside the representation:

$$
h=\phi(x;\theta),\qquad \widehat y=g(h;\omega).
$$

Training adjusts both $\theta$ and $\omega$. In an image model, earlier layers may respond to local edges and later layers combine those responses. What actually emerges depends on the data, architecture, and task. The artificial neuron is a convenient mathematical unit, rather than a precise simulation of a biological neuron.

**Takeaway:** The network learns both how to represent inputs and how to use that representation.

## 2. A neuron and a layer

> **Hint:** Weights control the contributions of inputs; a bias shifts the total.

For a column vector $x\in\mathbb R^d$, a neuron computes

$$
z=w^\top x+b,\qquad h=f(z).
$$

$z$ is the preactivation and $f$ is the activation function. With $w=(2,-1)^\top$, $x=(1,3)^\top$, and $b=1$, we have $z=0$. A sigmoid activation then returns $1/2$.

Stacking $m$ neurons gives

$$
z=Wx+b,\quad h=f(z),\quad W\in\mathbb R^{m\times d},\quad b,h\in\mathbb R^m.
$$

Usually the activation acts elementwise. Each row of $W$ belongs to one neuron; there are $md+m$ parameters. Biases can be absorbed into an augmented input: $\widetilde x=(x^\top,1)^\top$, $\widetilde W=[W\ b]$, and $z=\widetilde W\widetilde x$.

A hard-threshold perceptron outputs $$\mathbf1\{w^\top x+b>0\}$$; a sigmoid unit produces a smooth probability. These are different models, but thresholding the latter at $0.5$ gives the same type of hyperplane boundary, $w^\top x+b=0$. We focus on networks that admit gradient-based training.

**Takeaway:** A layer combines matrix multiplication, a bias, and an activation. Write down shapes first.

## 3. Why nonlinear hidden layers matter: XOR

> **Hint:** Depth alone does not create nonlinearity.

A multilayer perceptron (MLP) with one hidden layer computes

$$
h=f(W^{(1)}x+b^{(1)}),\qquad
\widehat y=g(W^{(2)}h+b^{(2)}).
$$

Without an intermediate nonlinearity, two affine layers collapse:

$$
W^{(2)}(W^{(1)}x+b^{(1)})+b^{(2)}
=(W^{(2)}W^{(1)})x+W^{(2)}b^{(1)}+b^{(2)}.
$$

For exclusive OR (XOR), unequal binary inputs have target 1; equal inputs have target 0. Let $s=x_1+x_2$ and construct

$$
h_1=\operatorname{ReLU}(s),\quad h_2=\operatorname{ReLU}(s-1),\quad
\widehat y=h_1-2h_2.
$$

| Input | $s$ | $h_1$ | $h_2$ | $\widehat y$ |
| --- | --- | --- | --- | --- |
| $(0,0)$ | 0 | 0 | 0 | 0 |
| $(1,0)$ | 1 | 1 | 0 | 1 |
| $(0,1)$ | 1 | 1 | 0 | 1 |
| $(1,1)$ | 2 | 2 | 1 | 0 |

The linear output matches the four targets; it is not a probability for arbitrary inputs. This is a representation example with chosen parameters, rather than a trained solution.

<details markdown="1">
<summary>Derivation: why a single affine boundary cannot separate XOR</summary>

The positive points require $w_1+b>0$ and $w_2+b>0$, hence $w_1+w_2+2b>0$. The negative points require $b\leq0$ and $w_1+w_2+b\leq0$, hence $w_1+w_2+2b\leq0$. This is a contradiction.

</details>

**Takeaway:** A nonlinear hidden layer changes the representation, allowing a simple output layer to solve a harder problem.

## 4. Activations and their gradients

> **Hint:** Inspect the derivative as well as the function value.

$$
\begin{aligned}
\sigma(z)&=\frac1{1+e^{-z}},& \sigma'(z)&=\sigma(z)(1-\sigma(z)),\\
\tanh'(z)&=1-\tanh^2(z),\\
\operatorname{ReLU}(z)&=\max(0,z),&
\operatorname{ReLU}'(z)&=\begin{cases}1,&z>0,\\0,&z<0.\end{cases}
\end{aligned}
$$

Sigmoid maps to $(0,1)$ and is useful for binary probabilities. Its derivative is at most $1/4$ and becomes very small in saturated regions. Tanh is centered at zero but also saturates. ReLU has derivative 1 on the positive side, yet a neuron that remains negative on every training input may receive zero gradients indefinitely. At zero, implementations commonly choose derivative 0.

**Takeaway:** Nonlinearity provides expressive power; its derivative also controls how learning signals propagate.

## 5. Outputs and losses

> **Hint:** Decide what an answer means before deciding how to penalize it.

Write the target as $t$, prediction as $\widehat y$, and single-example loss as $\ell$.

**Regression:** a linear output $\widehat y=z$ often uses

$$
\ell=\frac12\lVert\widehat y-t\rVert_2^2.
$$

This corresponds to a Gaussian observation model with fixed variance, up to additive constants and positive scaling.

**Binary classification:** $p=\sigma(z)=P(t=1\mid x)$ and $$t\in\{0,1\}$$ give

$$
\ell=-t\log p-(1-t)\log(1-p),\qquad
\frac{\partial\ell}{\partial z}=p-t.
$$

For target 1, increasing $p$ from $0.5$ to $0.9$ reduces the loss from approximately $0.693$ to $0.105$.

**Mutually exclusive classes:** softmax and cross-entropy use

$$
p_k=\frac{e^{z_k}}{\sum_j e^{z_j}},\qquad
\ell=-\sum_k t_k\log p_k,\qquad
\frac{\partial\ell}{\partial z_k}=p_k-t_k.
$$

Here $t$ is one-hot. Softmax couples classes through its denominator. For labels that can coexist, such as cat and dog in one image, separate sigmoid outputs are a different and often appropriate model.

<details markdown="1">
<summary>Derivation: why the output gradient is prediction minus target</summary>

For binary cross-entropy,

$$
\frac{\partial\ell}{\partial z}
=\left(-\frac{t}{p}+\frac{1-t}{1-p}\right)p(1-p)=p-t.
$$

For softmax, use $\sum_k t_k=1$ to write

$$
\ell=-\sum_k t_kz_k+\log\sum_j e^{z_j}.
$$

Differentiation gives $p_k-t_k$. The activation derivative is already included; do not multiply by it again.

</details>

Subtract $\max_j z_j$ from all logits before exponentiating to avoid overflow without changing probabilities. Compute the loss using a stable log-sum-exp expression.

**Takeaway:** Choose the output interpretation and loss together.

## 6. A complete forward pass

> **Hint:** A forward pass computes the result using current parameters; it does not update them.

For $L$ parameterized layers, excluding the input layer,

$$
h^{(0)}=x,\quad z^{(l)}=W^{(l)}h^{(l-1)}+b^{(l)},\quad
h^{(l)}=f^{(l)}(z^{(l)}),\quad \widehat y=h^{(L)}.
$$

Consider $h=\sigma(w_1x+b_1)$ and $\widehat y=w_2h+b_2$. Set $x=t=1$, $w_1=b_1=b_2=0$, and $w_2=1$. Then $z_1=0$, $h=0.5$, $\widehat y=0.5$, and $\ell=\tfrac12(\widehat y-t)^2=0.125$. Save intermediate values for the backward pass.

**Takeaway:** Forward propagation computes predictions, loss, and the intermediate values needed for differentiation.

## 7. Backpropagation

> **Hint:** Ask how a small change in each intermediate value would affect the final loss.

Define $\delta^{(l)}=\nabla_{z^{(l)}}\ell$. This is a sensitivity to preactivations, rather than a layer's prediction error. In the worked example, $r=\widehat y-t=-0.5$ gives

$$
\begin{aligned}
\frac{\partial\ell}{\partial w_2}&=rh=-0.25,&
\frac{\partial\ell}{\partial b_2}&=r=-0.5,\\
\frac{\partial\ell}{\partial w_1}&=rw_2h(1-h)x=-0.125,&
\frac{\partial\ell}{\partial b_1}&=rw_2h(1-h)=-0.125.
\end{aligned}
$$

A change in $w_1$ affects the hidden preactivation, hidden output, prediction, and loss in sequence. The chain rule multiplies these local effects.

For a general network, the output loss and activation determine $\delta^{(L)}$: it is $\widehat y-t$ for linear outputs with squared loss, and the appropriate $p-t$ for the cross-entropy combinations above. Hidden layers obey

$$
\boxed{\delta^{(l)}=((W^{(l+1)})^\top\delta^{(l+1)})
\odot(f^{(l)})'(z^{(l)})},
$$

$$
\boxed{\nabla_{W^{(l)}}\ell=\delta^{(l)}(h^{(l-1)})^\top,
\qquad\nabla_{b^{(l)}}\ell=\delta^{(l)}}.
$$

The symbol $\odot$ denotes elementwise multiplication. For $m$ current units and $d$ previous units, the weight gradient has shape $(m\times1)(1\times d)=m\times d$.

<details markdown="1">
<summary>Derivation: multiply along a path, sum over branches</summary>

Since $z_i^{(l)}=\sum_j W_{ij}^{(l)}h_j^{(l-1)}+b_i^{(l)}$,

$$
\frac{\partial\ell}{\partial W_{ij}^{(l)}}=\delta_i^{(l)}h_j^{(l-1)},
\qquad
\frac{\partial\ell}{\partial h_j^{(l)}}=\sum_i W_{ij}^{(l+1)}\delta_i^{(l+1)}.
$$

Multiplying the second expression by the local activation derivative gives $\delta_j^{(l)}$.

</details>

After computing all gradients, gradient descent updates $\theta\leftarrow\theta-\eta\nabla\ell$. At $\eta=0.1$, our example becomes $w_1=b_1=0.0125$, $w_2=1.025$, $b_2=0.05$. A new forward pass gives $\widehat y\approx0.5689$ and $\ell\approx0.0929$, down from $0.125$. Do not update one layer early and use its new weights to compute another layer's gradient at the old parameter point.

**Takeaway:** Backpropagation computes gradients; the optimizer uses those gradients to update parameters.

## 8. Vanishing gradients, residual paths, and checking derivatives

> **Hint:** Repeated multiplication can rapidly shrink or amplify a signal.

Ten sigmoid derivatives alone have product at most $(1/4)^{10}\approx9.54\times10^{-7}$. This illustrates activation-induced shrinking; the complete gradient also depends on weights and directions. Repeated matrix amplification can instead cause exploding gradients.

A residual block uses $h_{\mathrm{out}}=h+F(h)$, so its Jacobian is

$$
\frac{\partial h_{\mathrm{out}}}{\partial h}=I+J_F(h).
$$

The identity path offers a more direct gradient route, without guaranteeing perfect propagation.

For debugging a small deterministic network, compare analytic gradients with central differences:

$$
\frac{\partial\ell}{\partial\theta_j}\approx
\frac{\ell(\theta+\varepsilon e_j)-\ell(\theta-\varepsilon e_j)}{2\varepsilon}.
$$

$e_j$ is a coordinate unit vector. Checking $P$ parameters costs about $2P$ forward evaluations, whereas backpropagation typically costs a constant multiple of a forward pass for all gradients. Avoid ReLU kinks and disable dropout during the check.

**Takeaway:** Residual paths help optimization; numerical derivatives help verify an implementation.

## 9. Full, stochastic, and mini-batch gradients

> **Hint:** These methods mainly differ in how many examples contribute to each update.

$$
J(\theta)=\frac1N\sum_n\ell_n(\theta),\qquad
g=\frac1B\sum_{n\in\mathcal B}\nabla\ell_n,\qquad
\theta\leftarrow\theta-\eta g.
$$

Full gradient descent uses all $N$ examples; single-example stochastic gradient descent (SGD) uses one; mini-batch training uses $B$. Uniformly sampled batch averages are unbiased estimates of the full gradient. Mini-batches balance noise and computational efficiency, and the term SGD often includes this version.

An epoch is one pass over the training set. With $N=1000$ and $B=100$, an epoch typically contains 10 updates. Shuffling avoids long runs of class-ordered batches; sequence tasks must retain any ordering required by their formulation.

**Takeaway:** Understand the sampling process, batch size, and update count rather than assuming each update needs the whole dataset.

## 10. Optimizers

> **Hint:** Backpropagation supplies gradients; an optimizer decides how to move.

A tiny learning rate is slow; an excessive one may oscillate or diverge. Momentum smooths recent gradients:

$$
m_t=\beta m_{t-1}+(1-\beta)g_t,\qquad
\theta_t=\theta_{t-1}-\eta_t m_t.
$$

Consistent directions accumulate, while alternating contributions partly cancel. Conventions omitting $1-\beta$ require a corresponding change in learning-rate scale.

Adam tracks first and second moments. With $m_0=v_0=0$ and $t\geq1$,

$$
\begin{aligned}
m_t&=\beta_1m_{t-1}+(1-\beta_1)g_t,\\
v_t&=\beta_2v_{t-1}+(1-\beta_2)(g_t\odot g_t),\\
\widehat m_t&=m_t/(1-\beta_1^t),\qquad
\widehat v_t=v_t/(1-\beta_2^t),\\
\theta_t&=\theta_{t-1}-\eta_t\widehat m_t/(\sqrt{\widehat v_t}+\epsilon).
\end{aligned}
$$

The last operations are elementwise. Bias corrections compensate for zero initialization. Common starting values are $\beta_1=0.9$, $\beta_2=0.999$, and $\epsilon=10^{-8}$; the learning rate still needs attention, and loss need not decrease on every step. See the [original algorithm](https://arxiv.org/abs/1412.6980).

The lecture also discusses adaptive scaling and curvature-based methods for small networks. Explicit curvature matrices are expensive for large models. For small least-squares problems, Levenberg–Marquardt solves

$$
(J_f^\top J_f+\lambda I)\Delta\theta=J_f^\top(t-f(\theta)),
\qquad\theta\leftarrow\theta+\Delta\theta,
$$

where $J_f$ is the output Jacobian and $\lambda>0$ is damping. Solve the system rather than explicitly forming an inverse.

**Takeaway:** Momentum smooths directions, Adam adjusts coordinate scales, and second-order methods exploit curvature.

## 11. Initialization

> **Hint:** Break symmetry while keeping signal magnitudes manageable.

Identically initialized hidden units generally receive identical outputs and updates. Random weights allow them to learn distinct features; biases can often start at zero. With $n_{\mathrm{in}}$ inputs, the variance of a weighted sum roughly scales with $n_{\mathrm{in}}\operatorname{Var}(W_{ij})$ under simplifying assumptions.

Xavier/Glorot uniform initialization uses

$$
W_{ij}\sim\mathcal U\left[-\sqrt{\frac6{n_{\mathrm{in}}+n_{\mathrm{out}}}},
\sqrt{\frac6{n_{\mathrm{in}}+n_{\mathrm{out}}}}\right],
$$

with variance $2/(n_{\mathrm{in}}+n_{\mathrm{out}})$. As an addition to the lecture, He initialization accounts for ReLU truncation and commonly uses variance $2/n_{\mathrm{in}}$. These scales rely on approximations rather than universal guarantees.

**Takeaway:** Give units distinct starting points without making forward values or backward gradients excessively large or small.

## 12. Overfitting and training behavior

> **Hint:** Fitting observed examples and predicting unseen examples are different goals.

Use separate training, validation, and test sets. Validation supports tuning and early stopping; reserve the test set for final assessment. Parameter count affects capacity but does not determine generalization by itself.

**L2 regularization** adds

$$
J_{\mathrm{reg}}=J+\frac\lambda2\lVert\theta\rVert_2^2,
\qquad\theta\leftarrow(1-\eta\lambda)\theta-\eta\nabla J.
$$

Under ordinary gradient descent this yields weight decay, usually applied mainly to weights. Adding L2 to Adam's gradient is not equivalent to directly decaying parameters.

**Early stopping** tracks validation performance, allows a patience interval, and restores the best validation checkpoint. Do not repeatedly tune on the test set. **Augmentation** must preserve labels: shifting an image may be reasonable, whereas rotating 6 into 9 may change the answer.

**Inverted dropout** with keep probability $q$ uses

$$
\widetilde h=(r\odot h)/q,\quad r_j\sim\operatorname{Bernoulli}(q),\quad
\mathbb E[\widetilde h\mid h]=h.
$$

At inference disable masking and use $h$. Here $q$ is the probability of keeping a unit.

**Batch normalization (BN)** uses a feature's batch mean and variance:

$$
\widehat a=\frac{a-\mu_{\mathcal B}}{\sqrt{v_{\mathcal B}+\epsilon}},\qquad
y=\gamma\widehat a+\beta.
$$

$\gamma,\beta$ are learned. Inference usually uses accumulated training statistics. BN changes scale and optimization behavior and may regularize; it is not an equivalent replacement for dropout.

**Takeaway:** Monitor validation performance, choose interventions for the actual problem, and set training and inference behavior correctly.

## 13. Expressiveness is not learnability

> **Hint:** Separate existence of good parameters, finding them, and generalizing from them.

A common universal approximation statement says that, for a continuous target $f_\star$ on compact $K$, suitable activations and a sufficiently wide single hidden layer allow parameters satisfying, for any $\varepsilon>0$,

$$
\sup_{x\in K}|f_\theta(x)-f_\star(x)|<\varepsilon.
$$

This does not guarantee a practical width, successful optimization, or sufficient information in a small training set. Depth can represent certain compositional functions more compactly, but every task does not necessarily benefit from greater depth.

ReLU networks form piecewise affine regions. Under particular conditions, depth can greatly increase their representable number; [Montúfar et al.](https://arxiv.org/abs/1402.1869) study this expressiveness. More regions do not directly imply lower test error.

**Takeaway:** Approximation, optimization, and generalization ask different questions.

## 14. CNNs and RNNs

> **Hint:** Ask which parts of the data should share the same computation.

A convolutional neural network (CNN) exploits local spatial relationships and shares filters across positions. A single-channel illustration is

$$
z_{i,j}=\sum_{u,v}K_{u,v}x_{i+u,j+v}+b.
$$

This common implementation is technically cross-correlation. Multiple input channels add another sum. A $3\times3$ filter bank mapping 3 channels to 16 needs $3\times3\times3\times16+16=448$ parameters, independently of image width and height. Max pooling takes a local maximum to reduce spatial resolution. Translation equivariance means that translating an input translates its feature map under suitable boundary assumptions; it does not guarantee full classifier invariance.

A recurrent neural network (RNN) maintains state through time:

$$
h_t=\tanh(W_hh_{t-1}+W_xx_t+b),\qquad
\widehat y_t=g(W_yh_t+c).
$$

Unroll the computation and apply backpropagation through time (BPTT), adding contributions from every use of shared parameters. Repeated Jacobian products can vanish or explode. Long short-term memory (LSTM) networks introduce gates; their memory update includes

$$
c_t=f_t\odot c_{t-1}+i_t\odot\widetilde c_t.
$$

$f_t$ is the forget gate, $i_t$ the input gate, and $\widetilde c_t$ a candidate memory. Additive updates help preserve information without guaranteeing unlimited memory.

The lecture's vision and end-to-end driving examples illustrate learning directly from inputs to task outputs. Focus on structural assumptions, training objectives, and evaluation on unseen data.

**Takeaway:** CNNs share detectors over space; RNNs share state-update rules over time.

## 15. The complete training loop

> **Hint:** Be able to explain one update before memorizing architecture names.

Sample a mini-batch, compute predictions and loss, backpropagate gradients, and update parameters. Periodically evaluate on validation data with dropout disabled and BN in inference mode.

Try answering:

1. Why do extra affine layers fail to solve XOR?
2. Why does sigmoid with cross-entropy produce $p-t$?
3. Why is a layer's weight gradient an outer product?
4. Why stop while training loss is still falling?

<details markdown="1">
<summary>Answers</summary>

1. Affine compositions collapse into one affine map.
2. The loss derivative and sigmoid derivative simplify to $p-t$.
3. Each weight's contribution is $\delta_i h_j$.
4. Continuing may fit noise while validation performance deteriorates.

</details>

**Takeaway:** The model defines a function, the loss defines a goal, backpropagation computes gradients, the optimizer updates parameters, and validation checks generalization.

## 16. Notation and sources

| Symbol | Meaning |
| --- | --- |
| $x,t,\widehat y$ | Input, target, prediction |
| $W,b,\theta$ | Weights, biases, all trainable parameters |
| $z,h,\delta$ | Preactivations, activations, loss gradient with respect to preactivations |
| $\ell,J,N,B$ | Per-example loss, average objective, dataset size, batch size |
| $\eta,\lambda,\odot$ | Learning rate, regularization strength, elementwise multiplication |

**Primary source.** Jan Peters, TU Darmstadt, *Statistical Machine Learning, Lecture 11: Neural Networks*, Summer Semester 2019, user-provided `lecture_11_Neural_Networks.pdf`. The file contains 125 PDF pages including incremental slide builds, with slide numbering through 109. This article reorganizes the concepts rather than translating page by page.

**Corrections and additions.** Slide 45 reverses the derivative sign for squared loss; this article consistently uses $\widehat y-t$. Slide 82 contains inconsistent signs and coefficients in weight decay; here it is derived from $\lambda\lVert\theta\rVert^2/2$. Adam uses the original paper's standard bias corrections. The lecture's “Adadelta” slide shows a simplified gradient-square scaling rule, which is not presented here as the complete Adadelta algorithm. The ReLU XOR construction, numerical update, and He initialization are additions.

**Further reading.** [Deep Learning, Chapter 6](https://www.deeplearningbook.org/contents/mlp.html); [Adam](https://arxiv.org/abs/1412.6980); [Glorot and Bengio on initialization](https://proceedings.mlr.press/v9/glorot10a.html); [He et al. on ReLU initialization](https://arxiv.org/abs/1502.01852).

**Source, copyright, and use.** This article is for personal learning and knowledge organization. Rights to the lecture and embedded third-party material remain with the respective authors or rights holders; no unrestricted reuse is presumed. The original PDF and lecture illustrations are not reproduced here. Explanations, added examples, and reorganized derivations do not represent the author or university's position. Corrections are welcome.
