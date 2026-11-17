---
title: "Probability and Statistics Foundations"
date: 2026-10-27
lang: en
permalink: /en/probability-statistics/
zh_link: /zh/probability-statistics/
series: machine-learning
series_order: 1
categories:
  - Machine Learning
tags:
  - Probability
  - Statistics
  - Machine Learning
  - Information Theory
classes: statistics-article
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Connect random variables and distributions to Bayes' rule, exponential families, and cross-entropy through a continuous explanation and five interactive figures."
---

{% include statistics-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

Why does a classifier output probabilities? Why do squared errors so often appear alongside Gaussian distributions? How do sigmoid, softmax, and cross-entropy fit together? These ideas share a common language: probability and statistics.

This article starts with random variables and distributions, then connects Bayesian inference, exponential families, and common learning objectives. Figures are interactive; references for the derivations and further reading appear at the end.

---

## 1. Start by identifying what is random

### 1.1 From a data-generating process to random variables

Consider an image and its class. Before receiving the image, neither its pixels nor its class are known. After observing it, the pixels are fixed, but the class may remain uncertain. We can represent the input by a random variable $X$, the class by $Y$, and their co-occurrence by a joint distribution $p(x,y)$.

Formally, a random variable is a function mapping outcomes of a random experiment to numbers. Uppercase $X$ denotes the variable; lowercase $x$ denotes a particular value. A random vector collects multiple components, such as an image's pixel vector $\mathbf X$.

This provides a starting point for learning: an unknown process produces data, and we observe only a finite sample. A probability model makes assumptions about that process; statistical inference uses observations to estimate its parameters. Those assumptions matter. Successive sensor readings need not be independent, and the distribution at deployment need not match the training distribution.

### 1.2 Discrete probabilities and continuous densities

When $X$ takes finitely or countably many values, such as class labels, a **probability mass function (PMF)** assigns a probability directly to each value:

$$
p_X(x)=P(X=x),\qquad p_X(x)\geq0,\qquad\sum_xp_X(x)=1.
$$

For a variable with a density, such as continuous measurement noise, $p_X(x)$ describes how probability is concentrated near $x$. Integrating over an interval produces a probability:

$$
P(a\leq X\leq b)=\int_a^bp_X(x)\,dx,
\qquad\int_{-\infty}^{\infty}p_X(x)\,dx=1.
$$

Such a variable has $P(X=x)=0$ at every individual point. **Density height is not point probability, and a density can exceed 1.** For example, $X\sim\mathcal U(0,0.2)$ has density 5 inside its interval, yet the total area is $5\times0.2=1$.

To express the probability of being below a threshold in a common form, introduce the **cumulative distribution function (CDF)**:

$$
F_X(t)=P(X\leq t).
$$

For discrete variables, accumulate the PMF; for variables with a density, integrate the density. Prediction intervals, quantiles, and threshold decisions often depend more directly on a CDF than on density at a single point.

## 2. Common distributions: understand the question before the formula

### 2.1 Single successes, success counts, and event counts

The simplest experiment has two outcomes. If $X\in\lbrace 0,1\rbrace$ and its success probability is $\theta$, then

$$
p(x\mid\theta)=\theta^x(1-\theta)^{1-x},
\qquad X\sim\operatorname{Bernoulli}(\theta).
$$

This compact expression combines $p(1)=\theta$ and $p(0)=1-\theta$. Its mean and variance are $\mathbb E[X]=\theta$ and $\operatorname{Var}(X)=\theta(1-\theta)$. A binary classifier can predict the parameter of precisely this distribution.

Now ask how many successes occur in $n$ independent repetitions. Let $M=X_1+\cdots+X_n$. With independent trials sharing the same success probability, $M$ has a **binomial distribution**:

$$
P(M=m)=\binom nm\theta^m(1-\theta)^{n-m},
\qquad m=0,\ldots,n.
$$

The product $\theta^m(1-\theta)^{n-m}$ gives the probability of one specific arrangement. The coefficient $\binom nm$ counts the arrangements yielding the same total. Consequently,

$$
\mathbb E[M]=n\theta,\qquad
\operatorname{Var}(M)=n\theta(1-\theta).
$$

Some counts have no natural total number of trials, such as requests arriving in a short time window. Take the binomial limit $n\to\infty$, $\theta\to0$, keeping $n\theta=\lambda$. This gives the **Poisson distribution**:

$$
P(M=m)=\frac{\lambda^me^{-\lambda}}{m!},
\quad m=0,1,\ldots,\qquad
\mathbb E[M]=\operatorname{Var}(M)=\lambda.
$$

Here $\lambda$ is the expected event count within the chosen interval. Under a constant-rate model with rate $r$, an interval of length $\Delta t$ has $\lambda=r\Delta t$. For example, if requests follow a Poisson process at 40 requests per second, the probability of at least one arrival in 0.01 seconds is $1-e^{-0.4}\approx0.3297$. Clustering or a changing arrival rate requires reconsidering that model.

{% include statistics-figure.html kind="discrete" %}

### 2.2 From binary to multiclass outcomes

For $K$ mutually exclusive outcomes, represent one observation by a **one-hot vector** $\mathbf x$: one component equals 1 and all others equal 0. Let $\boldsymbol\pi=(\pi_1,\ldots,\pi_K)^\top$, with $\pi_k\geq0$ and $\sum_k\pi_k=1$. The **categorical distribution**, also called multinoulli, is

$$
p(\mathbf x\mid\boldsymbol\pi)=\prod_{k=1}^{K}\pi_k^{x_k},
\qquad\mathbb E[\mathbf X]=\boldsymbol\pi.
$$

This generalizes a Bernoulli trial from two categories to many. Repeat the experiment independently $n$ times and collect the class counts $\mathbf M=(M_1,\ldots,M_K)$. Their **multinomial distribution** is

$$
P(\mathbf M=\mathbf m)
=\frac{n!}{\prod_{k=1}^{K}m_k!}\prod_{k=1}^{K}\pi_k^{m_k},
\qquad\sum_{k=1}^{K}m_k=n.
$$

Each count has mean $n\pi_k$ and variance $n\pi_k(1-\pi_k)$. Different class counts satisfy

$$
\operatorname{Cov}(M_j,M_k)=-n\pi_j\pi_k,\qquad j\ne k.
$$

The negative sign has a simple explanation: with a fixed total, allocating another observation to one category leaves fewer for the others. **Trials can be independent while the resulting class counts are dependent.**

### 2.3 Continuous variables and the Gaussian

The uniform distribution $\mathcal U(a,b)$ gives equal probabilities to equal-length subintervals, producing density $1/(b-a)$. When values concentrate around a center, a common alternative is a **Gaussian distribution**:

$$
p(x\mid\mu,\sigma^2)
=\frac1{\sqrt{2\pi}\,\sigma}
\exp\!\left[-\frac{(x-\mu)^2}{2\sigma^2}\right],\qquad\sigma>0.
$$

The mean $\mu$ determines location, the standard deviation $\sigma$ determines scale, and $\sigma^2$ is variance. The normalizing factor makes the curve shorter when it spreads out and taller when it narrows, preserving total area 1.

Writing $\Phi$ for the standard normal CDF gives

$$
P(a\leq X\leq b)
=\Phi\!\left(\frac{b-\mu}{\sigma}\right)
-\Phi\!\left(\frac{a-\mu}{\sigma}\right),\qquad a\leq b.
$$

{% include statistics-figure.html kind="gaussian" %}

### 2.4 Why do Gaussians appear so often?

One explanation comes from accumulating many small disturbances. Suppose $X_1,\ldots,X_n$ are **independent and identically distributed (i.i.d.)**, with mean $\mu$ and finite, positive variance $0<\sigma^2<\infty$. The classical **central limit theorem (CLT)** states

$$
Z_n=\frac{\sum_{i=1}^{n}X_i-n\mu}{\sigma\sqrt n}
\xrightarrow{\mathrm d}\mathcal N(0,1).
$$

It is the **centered and standardized sum** that converges in distribution. The raw sum has mean $n\mu$ and variance $n\sigma^2$, both growing with $n$. The sample average instead has variance $\sigma^2/n$. This distinction explains how a total error can spread out while an average becomes more concentrated.

The CLT does not justify fitting every dataset with a Gaussian. Strong dependence, infinite variance, or mixed populations can undermine that intuition. Finite-sample approximation quality also depends on the original distribution.

The next figure revisits sums of uniform variables with newly computed curves. For $X_i\sim\mathcal U(0,1)$, $\mu=1/2$ and $\sigma^2=1/12$, so $Z_n=(\sum_iX_i-n/2)/\sqrt{n/12}$. The [ProbabilityCourse CLT chapter](https://www.probabilitycourse.com/chapter7/7_1_2_central_limit_theorem.php) provides further discussion of normalization and assumptions.

{% include statistics-figure.html kind="clt" %}

### 2.5 Covariance determines multivariate Gaussian geometry

Data points usually have several components. Replace the scalar mean by $\boldsymbol\mu$ and variance by a covariance matrix $\Sigma$ to obtain a $D$-dimensional Gaussian density:

$$
p(\mathbf x)
=\frac1{(2\pi)^{D/2}|\Sigma|^{1/2}}
\exp\!\left[-\frac12(\mathbf x-\boldsymbol\mu)^\top
\Sigma^{-1}(\mathbf x-\boldsymbol\mu)\right].
$$

This formula assumes symmetric positive definite $\Sigma$. A singular covariance describes a degenerate Gaussian on a lower-dimensional subspace and cannot be substituted directly into this inverse-based density formula. Here $\det(\Sigma)$ is the determinant and $\Lambda=\Sigma^{-1}$ is the precision matrix.

The quadratic form

$$
d_M^2=(\mathbf x-\boldsymbol\mu)^\top\Sigma^{-1}
(\mathbf x-\boldsymbol\mu)
$$

is the squared Mahalanobis distance. If $\Sigma=U\operatorname{diag}(\lambda_1,\ldots,\lambda_D)U^\top$ and $z_i=\mathbf u_i^\top(\mathbf x-\boldsymbol\mu)$, then

$$
d_M^2=\sum_{i=1}^{D}\frac{z_i^2}{\lambda_i}.
$$

Distance is measured relative to the distribution's own axes and scales. The same Euclidean displacement is less unusual along a direction that naturally varies more. Equal-density contours are ellipses: eigenvectors set their directions, and axis lengths are proportional to $\sqrt{\lambda_i}$.

## 3. How should observations change a prediction?

### 3.1 Joint, marginal, and conditional views

A joint distribution $p(x,y)$ describes co-occurrence. To focus on $X$, collect all possibilities for $Y$:

$$
p(x)=\sum_yp(x,y)
\quad\text{or}\quad
p(x)=\int p(x,y)\,dy.
$$

This operation is **marginalization**. It removes an unwanted variable without assuming independence.

If $Y=y$ has been observed, restrict attention to that observation and renormalize:

$$
p(x\mid y)=\frac{p(x,y)}{p(y)},
\qquad p(x,y)=p(x\mid y)p(y).
$$

For discrete events, require $P(Y=y)>0$. For continuous variables with a joint density, the density ratio applies where $p_Y(y)>0$; it does not say that the event $Y=y$ has positive point probability.

Applying the product rule repeatedly gives the **probability chain rule**:

$$
p(x_1,\ldots,x_D)
=p(x_1)\prod_{j=2}^{D}p(x_j\mid x_1,\ldots,x_{j-1}).
$$

No independence assumption is needed. Independence is the additional property $p(x,y)=p(x)p(y)$. Conditional independence is different: $X\perp Y\mid Z$ permits factorization given $Z$, without guaranteeing marginal independence.

### 3.2 Bayes' rule reverses a data-generating description

Suppose it is easy to describe observations produced by a class, $p(x\mid y)$, while the desired prediction is the class after seeing $x$. Factor the joint in both directions:

$$
p(y\mid x)=\frac{p(x\mid y)p(y)}{p(x)},
\qquad p(x)=\sum_yp(x\mid y)p(y).
$$

Here $p(y)$ is the prior; $p(x\mid y)$ is the likelihood when $y$ is treated as the hypothesis being compared; $p(y\mid x)$ is the posterior. The denominator pools all classes' contributions and ensures that posterior probabilities sum to 1.

**Example.** Suppose 10% of emails are spam. A word occurs with probability 0.8 in spam and 0.2 in legitimate mail. After observing that word, the spam probability is

$$
\frac{0.8\times0.1}{0.8\times0.1+0.2\times0.9}
=\frac4{13}\approx0.3077.
$$

The word raises the spam probability, but 0.8 is not the answer. Both the low prior and the possibility of that word in legitimate mail must enter the calculation.

### 3.3 Why are Gaussian models convenient for inference?

Gaussians have a useful closure property: the marginals and conditionals of a joint Gaussian are Gaussian. Partition a random vector as

$$
\begin{bmatrix}\mathbf X_a\\\mathbf X_b\end{bmatrix}
\sim\mathcal N\!\left(
\begin{bmatrix}\boldsymbol\mu_a\\\boldsymbol\mu_b\end{bmatrix},
\begin{bmatrix}\Sigma_{aa}&\Sigma_{ab}\\\Sigma_{ba}&\Sigma_{bb}\end{bmatrix}
\right).
$$

The marginal is simply $\mathbf X_a\sim\mathcal N(\boldsymbol\mu_a,\Sigma_{aa})$. After observing $\mathbf X_b=\mathbf x_b$, the conditional parameters become

$$
\boldsymbol\mu_{a\mid b}
=\boldsymbol\mu_a+\Sigma_{ab}\Sigma_{bb}^{-1}
(\mathbf x_b-\boldsymbol\mu_b),
$$

$$
\Sigma_{a\mid b}
=\Sigma_{aa}-\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}.
$$

The mean shifts according to how far the observation is from its own mean. The covariance subtracts uncertainty explained by that observation. Both updates depend on the cross-covariance block $\Sigma_{ab}$.

For a zero-mean bivariate Gaussian with unit marginal variances and correlation $\rho$,

$$
\bigl(X\mid Y=y\bigr)\;\sim\;\mathcal N(\rho y,1-\rho^2),
\qquad |\rho|<1.
$$

The parenthesized expression means “$X$ given $Y=y$”: $y$ is the fixed observation, while $X$ remains random.

At $\rho=0$, observing $Y$ does not change the distribution of $X$. A larger $\lvert\rho\rvert$ means more informative observations and a smaller conditional variance. The implication from zero correlation to independence relies on **joint Gaussianity**.

{% include statistics-figure.html kind="conditional" %}

## 4. Summarizing a distribution with a few numbers

### 4.1 Expectation is a probability-weighted average

Given a distribution, we often want the average behavior of a function $f(X)$, such as prediction loss. Expectation weights each function value by its probability:

$$
\mathbb E[f(X)]=\sum_xf(x)p(x)
\quad\text{or}\quad
\mathbb E[f(X)]=\int f(x)p(x)\,dx.
$$

An expectation is not necessarily the most probable outcome. A fair die has expectation 3.5, which no roll produces. Conditional expectation uses the same construction with weights from $p(x\mid y)$.

Whenever the required expectations exist, linearity gives

$$
\mathbb E\!\left[\sum_i a_iX_i+b\right]
=\sum_i a_i\mathbb E[X_i]+b.
$$

**Independence is not required.** Independence does guarantee $\mathbb E[XY]=\mathbb E[X]\mathbb E[Y]$, but that equality alone does not imply independence. Nor can a general nonlinear function be moved outside expectation: usually $\mathbb E[f(X)]\ne f(\mathbb E[X])$.

### 4.2 Variance, covariance, and second moments

A mean locates the center but says little about dispersion. Average the squared deviation from the mean to obtain variance:

$$
\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]
=\mathbb E[X^2]-\mu^2,\qquad\mu=\mathbb E[X].
$$

For example, if $X$ is equally likely to be $-1$ or $1$, then $\mathbb E[X]=0$ while $\mathbb E[X^2]=1$. This also demonstrates why nonlinear transformations and expectations cannot generally be interchanged.

Covariance describes how two variables vary together:

$$
\operatorname{Cov}(X,Y)
=\mathbb E[(X-\mathbb E[X])(Y-\mathbb E[Y])]
=\mathbb E[XY]-\mathbb E[X]\mathbb E[Y].
$$

It follows that

$$
\operatorname{Var}(X+Y)
=\operatorname{Var}(X)+\operatorname{Var}(Y)
+2\operatorname{Cov}(X,Y).
$$

Independent variables have zero covariance, so their variances add. Zero covariance, however, only excludes this linear form of co-variation. If $X\sim\mathcal U(-1,1)$ and $Y=X^2$, then $\operatorname{Cov}(X,Y)=0$ even though $Y$ is completely determined by $X$.

Collecting the pairwise covariances of a vector gives

$$
\Sigma=\mathbb E[(\mathbf X-\boldsymbol\mu)
(\mathbf X-\boldsymbol\mu)^\top],
\qquad\mathbb E[\mathbf X\mathbf X^\top]
=\Sigma+\boldsymbol\mu\boldsymbol\mu^\top.
$$

This clarifies the covariance in the multivariate Gaussian: diagonal entries are component variances, while off-diagonal entries describe co-variation.

### 4.3 From theoretical expectation to sample estimates

The true distribution is usually unknown, and its integrals may lack analytic solutions. Given independent samples $x_1,\ldots,x_n$ from $p$, estimate an expectation by

$$
\widehat{\mathbb E[f(X)]}=\frac1n\sum_{i=1}^{n}f(x_i).
$$

If $\mathbb E[\lvert f(X)\rvert]<\infty$, the law of large numbers ensures convergence to the expectation. With finite variance, the estimator has variance $\operatorname{Var}(f(X))/n$, so its standard error decreases as $1/\sqrt n$. Halving that error typically requires about four times as many samples.

For the mean and variance, i.i.d. observations give

$$
\bar x=\frac1n\sum_{i=1}^{n}x_i,
\qquad s^2=\frac1{n-1}\sum_{i=1}^{n}(x_i-\bar x)^2,\quad n>1.
$$

The denominator $n-1$ corrects the bias introduced by estimating the mean from the same data. The Gaussian maximum-likelihood variance estimate, which uses $n$, addresses a different estimation criterion.

### 4.4 What do higher moments describe?

Raw moments are $m_r=\mathbb E[X^r]$; central moments are $c_r=\mathbb E[(X-\mu)^r]$. The second central moment is variance. To compare shapes independently of scale, standardize:

$$
\text{skewness}=\frac{c_3}{\sigma^3},
\qquad\text{kurtosis}=\frac{c_4}{\sigma^4}.
$$

Skewness describes asymmetry. Kurtosis concerns tails and extreme values; interpreting it simply as peak sharpness is misleading. A Gaussian has kurtosis 3, so **excess kurtosis** is often reported as $c_4/\sigma^4-3$. These quantities require their corresponding moments to exist.

## 5. A shared form for apparently different distributions

### 5.1 Exponential families separate parameters from data

Set aside the names “natural parameter” and “sufficient statistic” for a moment. **An exponential family can be understood through a common construction: score each outcome, exponentiate to obtain positive weights, then normalize.** The score is a linear combination of fixed data features, with coefficients determined by the parameters.

Start with a Bernoulli variable, whose outcomes are 0 and 1. Choose a real parameter $\eta$ and score outcome $x$ by $\eta x$:

- Outcome 0 has score 0 and exponentiated weight $e^0=1$.
- Outcome 1 has score $\eta$ and exponentiated weight $e^\eta$.

The weights do not yet sum to 1. Divide each by their total to obtain probabilities:

$$
P(X=0)=\frac1{1+e^\eta},
\qquad P(X=1)=\frac{e^\eta}{1+e^\eta}.
$$

For example, $\eta=\log3$ gives weights 1 and 3, hence probabilities $1/4$ and $3/4$. The second expression is sigmoid. Normalization has turned an unrestricted real parameter into a valid binary probability.

Generalize this construction and include fixed base weights $h(x)$:

$$
p(x\mid\boldsymbol\eta)
=\frac{h(x)\exp[\boldsymbol\eta^\top T(x)]}{Z(\boldsymbol\eta)}.
$$

Each part has a concrete role:

- **$T(x)$ extracts fixed features of the observation.** Examples are $x$ or the vector $(x,x^2)^\top$. These features do not change with the parameters being estimated.
- **$\boldsymbol\eta$ weights those features.** The dot product $\boldsymbol\eta^\top T(x)$ produces the score; these coefficients are the natural parameters.
- **$h(x)$ supplies fixed base weights.** It equals 1 in the Bernoulli example.
- **$Z(\boldsymbol\eta)$ totals all unnormalized weights.** Use a sum for discrete variables and an integral for continuous ones, ensuring a normalized distribution.

The usual exponential-family expression moves this denominator into the exponent. Define

$$
A(\boldsymbol\eta)=\log Z(\boldsymbol\eta),
$$

to obtain

$$
p(x\mid\boldsymbol\eta)
=h(x)\exp\!\left[\boldsymbol\eta^\top T(x)-A(\boldsymbol\eta)\right].
$$

Thus **$A(\boldsymbol\eta)$ can first be understood as the normalization term**. Its formal name is the log-partition function. In the continuous case,

$$
A(\boldsymbol\eta)=\log\int h(x)
\exp[\boldsymbol\eta^\top T(x)]\,dx.
$$

Replace the integral by a sum in the discrete case. Allowed parameters must make this quantity finite. The structure does not, by itself, imply unimodality.

Now return to the formal name of $T(x)$: the **sufficient statistic**. Sufficiency means that, within the model, the statistic retains the information in the data relevant to the parameter. For independent observations, log-likelihoods involve $\sum_iT(x_i)$ rather than necessarily requiring every detail of every observation. This helps explain the recurring role of counts, averages, and sums of squares in estimation.

A Gaussian fits the same template: take $h(x)=1$ and $T(x)=(x,x^2)^\top$, giving score $\eta_1x+\eta_2x^2$. A negative quadratic coefficient produces a Gaussian shape after exponentiation and normalization; Section 5.4 works this out. The value of the exponential-family framework is that Bernoulli, Gaussian, Poisson, and other distributions separate data features from parameters in this shared structure, allowing common methods for differentiation, expectations, and estimation.

### 5.2 Bernoulli probabilities lead naturally to sigmoid

For $0<\theta<1$, rearrange the log Bernoulli PMF:

$$
\begin{aligned}
\log p(x\mid\theta)
&=x\log\theta+(1-x)\log(1-\theta)\\
&=x\log\frac{\theta}{1-\theta}+\log(1-\theta).
\end{aligned}
$$

Define $\eta=\log[\theta/(1-\theta)]$. Then $T(x)=x$, $h(x)=1$, and $A(\eta)=\log(1+e^\eta)$. This also explains the previous section's score: $\theta/(1-\theta)$ is the odds of occurrence, and $\eta$ is its logarithm. Solving for the probability gives

$$
\theta=\frac{e^\eta}{1+e^\eta}
=\frac1{1+e^{-\eta}}=\operatorname{sigmoid}(\eta).
$$

The natural parameter ranges over all real numbers, while the probability lies in $(0,1)$. Sigmoid connects these spaces. Logistic regression models $\eta$ as a linear function of features and transforms it into a conditional success probability.

### 5.3 Categorical probabilities lead to softmax

For multiple classes, assign a real score $\eta_k$ to each class and normalize jointly:

$$
\pi_k=\frac{e^{\eta_k}}{\sum_{j=1}^{K}e^{\eta_j}},
\qquad A(\boldsymbol\eta)=\log\sum_{j=1}^{K}e^{\eta_j}.
$$

This is softmax. Adding the same constant to every score leaves probabilities unchanged. Thus the $K$ scores contain one redundant degree of freedom; an equivalent parameterization fixes one reference-class score at zero.

Implementations commonly subtract the maximum score before exponentiation to avoid overflow. That stabilization uses exactly this translation invariance.

### 5.4 Gaussians are exponential-family members too

Expand the square in the univariate Gaussian:

$$
\log p(x)=\frac\mu{\sigma^2}x-\frac1{2\sigma^2}x^2
-\frac{\mu^2}{2\sigma^2}-\frac12\log(2\pi\sigma^2).
$$

Take $T(x)=(x,x^2)^\top$ and natural parameters $(\mu/\sigma^2,-1/(2\sigma^2))^\top$. The second parameter must be negative for normalization. With $h(x)=1$, the remaining terms give

$$
A(\boldsymbol\eta)=-\frac{\eta_1^2}{4\eta_2}
+\frac12\log\!\left(-\frac\pi{\eta_2}\right),\qquad\eta_2<0.
$$

Under regularity conditions permitting differentiation under the integral, the first and second derivatives of $A$ recover the expectation and covariance of the sufficient statistic:

$$
\nabla A(\boldsymbol\eta)=\mathbb E[T(X)],
\qquad\nabla^2 A(\boldsymbol\eta)=\operatorname{Cov}(T(X)).
$$

This links distribution parameters to moments in a common framework. See [Will Fithian's exponential-family notes](https://www.stat.berkeley.edu/~wfithian/courses/stat210a/exponential-families.html) for a systematic derivation.

## 6. From uncertainty to learning objectives

### 6.1 Information and entropy

An almost-certain event carries little new information; a rare event is more surprising. Requiring independent events to contribute additive information motivates

$$
I(x)=-\log p(x).
$$

Averaging this information under the distribution gives discrete **entropy**:

$$
H(p)=-\sum_xp(x)\log p(x),\qquad0\log0:=0.
$$

Here $\log$ denotes the natural logarithm, so information is measured in nats. Base-2 logarithms give bits. Among distributions on a fixed set of $K$ outcomes, the uniform distribution has maximum entropy $\log K$. Bernoulli entropy peaks at $p=1/2$, with value $\log2$, and approaches zero as $p$ approaches either endpoint.

For a continuous density, differential entropy is $h(p)=-\int p(x)\log p(x)\,dx$. It depends on coordinate units and can be negative, so the discrete coding-length interpretation cannot be transferred directly.

### 6.2 Cross-entropy and KL divergence

Suppose observations actually follow $p$, but predictions use $q$. The expected negative log prediction is **cross-entropy**:

$$
H(p,q)=-\sum_xp(x)\log q(x).
$$

The extra cost relative to the true entropy is the **Kullback–Leibler (KL) divergence**:

$$
\begin{aligned}
D_{\mathrm{KL}}(p\Vert q)
&=\sum_xp(x)\log\frac{p(x)}{q(x)}\\
&=H(p,q)-H(p)\geq0.
\end{aligned}
$$

If $p(x)>0$ where $q(x)=0$, the divergence is infinite. It vanishes when the distributions agree, almost everywhere for continuous distributions. In general it is asymmetric and does not satisfy all requirements of a distance metric.

The decomposition separates intrinsic uncertainty, $H(p)$, from additional model mismatch, $D_{\mathrm{KL}}(p\Vert q)$. The following binary example makes that separation visible.

{% include statistics-figure.html kind="entropy" %}

### 6.3 Why do cross-entropy and squared error become training losses?

True expectations are difficult to compute, but observations are available. Under i.i.d. sampling, maximum likelihood chooses parameters making the observed dataset most probable:

$$
\widehat{\boldsymbol\theta}
=\arg\max_{\boldsymbol\theta}\prod_{i=1}^{n}q_{\boldsymbol\theta}(x_i)
=\arg\min_{\boldsymbol\theta}
\left[-\frac1n\sum_{i=1}^{n}\log q_{\boldsymbol\theta}(x_i)\right].
$$

The final expression is the average **negative log-likelihood (NLL)**. It estimates cross-entropy under the true distribution and equals cross-entropy under the empirical distribution. When the data distribution is fixed, minimizing cross-entropy also minimizes the corresponding KL divergence.

For supervised learning, use $q_{\boldsymbol\theta}(y_i\mid x_i)$. With Bernoulli labels and predicted probability $q_i$, one observation contributes

$$
\ell_i=-y_i\log q_i-(1-y_i)\log(1-q_i),
$$

the binary cross-entropy loss. For one-hot categorical labels, the loss is $-\sum_k y_{ik}\log q_{ik}$, the multiclass cross-entropy.

For regression, suppose

$$
\bigl(Y\mid X=x\bigr)\;\sim\;\mathcal N(f_{\boldsymbol\theta}(x),\sigma^2),
$$

with a shared variance $\sigma^2$ fixed and known. The individual NLL is

$$
\ell_i=\frac{(y_i-f_{\boldsymbol\theta}(x_i))^2}{2\sigma^2}
+\frac12\log(2\pi\sigma^2).
$$

The second term is constant when optimizing $\boldsymbol\theta$, so maximum likelihood reduces to minimizing squared error. If the model also predicts variance, terms including $\log\sigma_i^2$ must remain; keeping only a freely weighted squared error is insufficient.

Sigmoid or softmax with cross-entropy, and Gaussian noise with squared error, therefore follow one common recipe: specify a conditional distribution for the output and maximize the likelihood of observations.

## 7. Check your understanding

1. Does a Gaussian density of 1.5 violate the upper bound of 1 on probability?
2. Why does a binomial PMF include a combinatorial factor while one Bernoulli trial does not?
3. Does linearity of expectation require independence? When do variances add directly?
4. In a standard correlated bivariate Gaussian, what are the conditional mean and variance of $X$ after observing $Y=1$?
5. Why does a large cross-entropy not by itself tell us how predictable the true distribution is?
6. Where does the fixed-variance assumption enter the derivation of squared error from Gaussian NLL?

**Answer guide.** Integrate density to obtain probability; combinatorial factors collect distinct trial arrangements; expectation is linear without independence, while direct variance addition requires zero covariance; the conditional parameters are $\rho$ and $1-\rho^2$; cross-entropy contains both intrinsic entropy and model mismatch; fixed variance makes the scale and log-normalization terms constant with respect to the predicted mean.

## 8. Notation and abbreviations

| Symbol | Meaning |
| --- | --- |
| $X,x$; $\mathbf X,\mathbf x$ | Random variable and value; random vector and value |
| PMF / PDF / CDF | Probability mass / density / cumulative distribution function |
| $\theta$; $\boldsymbol\theta$ | Bernoulli success probability; general model parameters, depending on context |
| $\boldsymbol\pi,\mu,\sigma^2,\Sigma$ | Class probabilities, mean, variance, covariance matrix |
| $\rho,\lambda$ | Correlation, Poisson expected event count; $\lambda_i$ denotes an eigenvalue in a spectral decomposition |
| $\boldsymbol\eta,T,A$ | Natural parameter, sufficient statistic, log-partition function |
| i.i.d. / CLT / NLL | Independent and identically distributed / central limit theorem / negative log-likelihood |
| $H(p),H(p,q),D_{\mathrm{KL}}(p\Vert q)$ | Entropy, cross-entropy, KL divergence |

## 9. References

1. **Ian Goodfellow, Yoshua Bengio, Aaron Courville.** [*Deep Learning*, Chapter 3: Probability and Information Theory](https://www.deeplearningbook.org/contents/prob.html). Further reading on conditional probability and information measures.
2. **Will Fithian.** [*Exponential Families*, UC Berkeley Stat 210A](https://www.stat.berkeley.edu/~wfithian/courses/stat210a/exponential-families.html). Further reading on natural parameters, sufficient statistics, and the log-partition function.
3. **Hossein Pishro-Nik.** [*Introduction to Probability, Statistics, and Random Processes*, §7.1.2 Central Limit Theorem](https://www.probabilitycourse.com/chapter7/7_1_2_central_limit_theorem.php). The standardized CLT and its assumptions.

**Corrections.** Corrections to formulas, terminology, or interpretations are welcome.
