---
title: "Probability Density Estimation"
date: 2026-10-27
lang: en
permalink: /en/density-estimation/
zh_link: /zh/density-estimation/
series: machine-learning
series_order: 2
categories:
  - Machine Learning
tags:
  - Probability
  - Density Estimation
  - Bayesian Inference
  - Expectation Maximization
classes: statistics-article
toc: true
toc_label: Contents
toc_sticky: true
excerpt: "Connect maximum likelihood, Bayesian estimation, histograms, kernels, nearest neighbors, and Gaussian mixtures. Derive EM updates and their monotonicity, with interactive comparisons of smoothing and initialization."
---

{% include statistics-assets.html %}
<script type="module" src="{{ '/assets/js/density-estimation.mjs' | relative_url }}"></script>

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

Measurements of a batch of parts let us calculate an average length and a variance. To estimate the probability that a length falls within a certain range, or identify unusual lengths, we also need their distribution. **Probability density estimation** uses a finite sample to estimate the distribution that produced it.

The simplest approach assumes a Gaussian distribution and estimates its mean and variance. When one Gaussian cannot describe the data, histograms, kernel estimates, and nearest-neighbor estimates offer more flexible alternatives. Another approach combines several Gaussians. The following sections introduce these methods and derive their estimates.

---

## 1. From observations to distributions

### 1.1 What are we estimating?

Given independent and identically distributed (i.i.d.) observations $\mathcal D=(x_1,\ldots,x_n)$, density estimation constructs a function $\widehat p(x)$ approximating the unknown generating density $p_\star(x)$. It must satisfy the [basic requirements of a probability density]({{ '/en/probability-statistics/' | relative_url }}): nonnegative values and unit integral. Regional probabilities are then approximated by integration:

$$
P(X\in R)=\int_R p_\star(x)\,dx
\approx\int_R\widehat p(x)\,dx.
$$

Distinguish the notation first. Uppercase $X$ is a random variable before observation, $x_i$ is the recorded value of observation $i$, and $x$ in $\widehat p(x)$ is a query position that can move along the real line. The hat means estimated from data. Moving $x$ traces one estimated curve; collecting another sample can produce another curve.

**From probability back to density.** Over a short interval of width $\Delta$ where density varies little, probability is approximately density height times width. Density is therefore probability concentration per unit length, rather than point probability. Section 4 turns this area–height–width relation directly into an estimator.

Density estimation also supports other tasks. When training observations have known classes, estimate a density $p(x\mid C_j)$ within each class and combine it with class priors to classify a new observation. This is generative classification, using the same familiar Bayes' rule:

$$
P(C_j\mid x)
=\frac{p(x\mid C_j)P(C_j)}{\sum_\ell p(x\mid C_\ell)P(C_\ell)}.
$$

Here $p(x\mid C_j)$ asks what data a class produces, while $P(C_j\mid x)$ asks which class could have produced an observed value. The denominator sums over classes using total probability, making their posterior probabilities sum to 1. Section 4.6 uses this same identity for neighbor voting, and Section 5 uses it for mixture assignments.

Class frequencies can estimate priors when sampling proportions represent the target setting. Artificially changed sampling ratios require reconsidering the priors. For now, study the density of one collection of observations, written $p(x)$, without class labels.

### 1.2 Common approaches

**Parametric models** choose a distribution family, such as the Gaussian, then estimate a finite-dimensional parameter. **Nonparametric methods** allow representation capacity to grow with data or resolution, as in histograms and kernel estimates. Nonparametric does not mean that there are no bandwidths or other choices to make.

**Mixture models** combine simple distributions into richer shapes. With a fixed component count, a mixture is still parametric; allowing more components increases its capacity. These are different modeling assumptions, rather than a universal ranking of quality.

Keep two questions separate: **how to represent a density, and how to determine it from observations**. Choosing a Gaussian answers the first; maximum likelihood and Bayesian estimation answer the second. They are not mutually exclusive alternatives at the same level. We first fix the representation to one Gaussian and work through estimation.

## 2. Maximum likelihood estimation

### 2.1 Fix the data and vary the parameters

Let the model be $p(x\mid\theta)$, where $\theta$ collects the unknown parameters. For one Gaussian, $\theta=(\mu,\sigma^2)$. Identically distributed observations share parameters, while independence makes their joint density a product:

$$
L(\theta;\mathcal D)=\prod_{i=1}^{n}p(x_i\mid\theta).
$$

Once observations are fixed, this expression is a function of $\theta$, called the **likelihood**. It need not integrate to 1 over parameters and is not a posterior distribution. For continuous observations, it consists of density values, not the probability of observing those exact points.

Why compare that product? Represent each recorded observation by a small interval of width $\Delta$. The joint probability of these intervals is approximately

$$
\prod_{i=1}^{n}\bigl[p(x_i\mid\theta)\Delta\bigr]
=\Delta^n L(\theta;\mathcal D).
$$

This approximation applies when densities are continuous at the observations and intervals are sufficiently short. Comparing parameters at the same measurement resolution leaves the common factor unchanged. Maximum likelihood thus chooses parameters making neighborhoods of the observed sample most probable within the chosen model family.

The logarithm is strictly increasing, so maximizing likelihood is equivalent to maximizing **log-likelihood**:

$$
\widehat\theta_{\mathrm{ML}}
=\arg\max_\theta\ell(\theta),
\qquad\ell(\theta)=\sum_{i=1}^{n}\log p(x_i\mid\theta).
$$

Products become sums, simplifying derivatives and avoiding underflow from multiplying tiny values. This is **maximum likelihood estimation (MLE)**.

$\arg\max$ returns the maximizing parameter, rather than the maximum function value. Minimizing $-\ell(\theta)$ gives the same estimate; that objective is the negative log-likelihood. All logarithms here are natural logarithms.

### 2.2 Deriving Gaussian mean and variance estimates

Begin with the density of one observation and take its logarithm:

$$
p(x_i\mid\mu,v)=\frac1{\sqrt{2\pi v}}
\exp\!\left[-\frac{(x_i-\mu)^2}{2v}\right],
\qquad v=\sigma^2>0,
$$

$$
\log p(x_i\mid\mu,v)
=-\frac12\log(2\pi v)-\frac{(x_i-\mu)^2}{2v}.
$$

The logarithm brings down the squared term from the exponential; the normalizing factor produces the first term. Summing these terms over all observations gives

$$
\ell(\mu,v)
=-\frac n2\log(2\pi v)-\frac1{2v}\sum_{i=1}^{n}(x_i-\mu)^2.
$$

The first term does not involve the mean. With $v$ fixed, maximizing log-likelihood therefore minimizes total squared distance from $\mu$. Differentiate:

$$
\frac{\partial\ell}{\partial\mu}
=\frac1v\sum_{i=1}^{n}(x_i-\mu)=0
\quad\Longrightarrow\quad
\widehat\mu=\bar x=\frac1n\sum_{i=1}^{n}x_i.
$$

The sample average is precisely the point minimizing total squared error. The second derivative is $-n/v<0$, confirming a maximum for fixed variance.

Substitute this mean and differentiate with respect to $v$. The derivatives of $\log(2\pi v)$ and $-1/(2v)$ are $1/v$ and $1/(2v^2)$, respectively, so

$$
\frac{\partial\ell}{\partial v}
=-\frac n{2v}+\frac1{2v^2}\sum_i(x_i-\bar x)^2=0,
$$

Multiplying by $2v^2$ gives $-nv+\sum_i(x_i-\bar x)^2=0$, hence

$$
\widehat v_{\mathrm{ML}}=\frac1n\sum_{i=1}^{n}(x_i-\bar x)^2.
$$

If the observations are not all identical, total squared error is positive. The variance derivative is positive below this solution and negative above it, confirming a maximum. The mean centers the curve, while variance balances covering the sample against spreading density too thinly.

For observations $0,1,1,2$, the mean is 1 and total squared error is 2, giving ML variance $2/4=0.5$. The fitted distribution is therefore $\mathcal N(1,0.5)$.

The denominator is $n$, whereas the unbiased sample variance from introductory statistics uses $n-1$. To see the difference, start from the identity

$$
\sum_i(X_i-\bar X)^2
=\sum_i(X_i-\mu)^2-n(\bar X-\mu)^2.
$$

Let the population mean be $\mu$ and variance $v=\sigma^2$, with independent observations. Taking an expectation here means averaging the quantity over repeated samples of size $n$. The observations $X_i$ and their mean $\bar X$ vary between samples, while population parameters $\mu$ and $v$ stay fixed.

**Expectation of the first term.** The definition of variance gives, for every observation,

$$
\mathbb E[(X_i-\mu)^2]
=\mathbb E[(X_i-\mathbb E[X_i])^2]
=\operatorname{Var}(X_i)=v.
$$

Expectations add term by term. There are $n$ terms, each with expectation $v$, so

$$
\mathbb E\!\left[\sum_{i=1}^{n}(X_i-\mu)^2\right]
=\sum_{i=1}^{n}\mathbb E[(X_i-\mu)^2]
=nv.
$$

**Expectation of the second term.** First express the deviation of the sample mean as

$$
\bar X-\mu=\frac1n\sum_{i=1}^{n}(X_i-\mu).
$$

Squaring produces coefficient $1/n^2$. Expanding the square of the sum gives both individual squares and cross products:

$$
(\bar X-\mu)^2
=\frac1{n^2}\left[
\sum_i(X_i-\mu)^2
+2\sum_{i<j}(X_i-\mu)(X_j-\mu)
\right].
$$

The sum of individual squares has expectation $nv$, as calculated above. For cross products, independence lets us factor the expectation. Each deviation has mean $\mathbb E[X_i-\mu]=0$, so every cross term has zero expectation:

$$
\begin{aligned}
\mathbb E[(X_i-\mu)(X_j-\mu)]
&=\mathbb E[X_i-\mu]\,\mathbb E[X_j-\mu]\\
&=0,\qquad i\ne j.
\end{aligned}
$$

Consequently,

$$
\mathbb E[(\bar X-\mu)^2]
=\frac1{n^2}(nv+0)=\frac vn.
$$

The second term in the original identity has another factor of $n$, giving

$$
\mathbb E[n(\bar X-\mu)^2]
=n\frac vn=v.
$$

Substituting both expectations into the identity yields

$$
\mathbb E\!\left[\sum_i(X_i-\bar X)^2\right]
=nv-v=(n-1)v.
$$

Dividing this sum by $n-1$ therefore gives an estimator whose expectation equals population variance $v$: the unbiased sample variance. Dividing by $n$ gives expectation $(n-1)v/n$, which is too small. Gaussian maximum likelihood nevertheless uses $n$ because its objective is to maximize the observed likelihood, rather than to make the variance estimate unbiased.

For vectors, the corresponding estimates are $\widehat{\boldsymbol\mu}=n^{-1}\sum_i\mathbf x_i$ and

$$
\widehat\Sigma_{\mathrm{ML}}
=\frac1n\sum_{i=1}^{n}(\mathbf x_i-\widehat{\boldsymbol\mu})
(\mathbf x_i-\widehat{\boldsymbol\mu})^\top.
$$

Entry $(a,b)$ averages the products of centered values for coordinates $a$ and $b$. Diagonal entries are the individual ML variances.

### 2.3 An optimum need not exist with insufficient data

Why require observations not all to coincide? With one observation, setting $\mu$ at the observed point makes squared error zero. Density reduces to $1/\sqrt{2\pi v}$, which grows without bound as $v\to0$. No finite MLE with strictly positive variance exists. The same happens with several identical observations. In higher dimensions, empirical covariance can be singular when centered observations have insufficient rank.

Solving derivative equations must therefore be followed by checking boundaries, feasibility, and existence of an optimum. A prior on the **mean** alone does not automatically prevent an unknown **variance** from collapsing. Remedies include variance constraints, covariance regularization, or priors controlling the relevant parameters.

## 3. Bayesian estimation

### 3.1 From a best parameter to a posterior

MLE returns a best parameter, but four observations and four thousand observations should not give the same confidence in an identical estimated mean. Bayesian inference asks a further question: **after observing the sample, how much weight should each possible parameter receive?**

We now describe unknown parameters with distributions as well. Write a prior $p(\theta)$ and apply Bayes' rule with parameters taking the place of classes:

$$
p(\theta\mid\mathcal D)
=\frac{p(\mathcal D\mid\theta)p(\theta)}{p(\mathcal D)},
\qquad p(\mathcal D)=\int p(\mathcal D\mid\theta)p(\theta)\,d\theta.
$$

The prior describes parameter beliefs before observations; likelihood describes compatibility with the data; the posterior combines them. Taking the posterior mode gives a **maximum a posteriori (MAP)** estimate. MAP remains a point estimate and does not replace the full posterior.

The same $p(\mathcal D\mid\theta)$ previously viewed as a function of parameters is now multiplied by their prior. The denominator integrates this product over all parameters. It is constant with respect to the parameter being compared and ensures that the posterior integrates to 1. It can be omitted when finding a MAP estimate and restored when normalizing the full posterior.

### 3.2 A conjugate Gaussian example with known observation variance

To keep one unknown at a time, assume known observation variance $\sigma^2$ and estimate only the mean. Let $\bigl(X_i\mid\mu\bigr)\;\sim\;\mathcal N(\mu,\sigma^2)$ with prior $\mu\sim\mathcal N(\mu_0,\tau_0^2)$. The variances concern different objects: $\sigma^2$ describes observations around the true mean; $\tau_0^2$ describes uncertainty about the mean's location.

The posterior is proportional to Gaussian likelihood times Gaussian prior. Taking logarithms makes these contributions add. Omitting terms independent of $\mu$ that normalization can absorb,

$$
\log p(\mu\mid\mathcal D)
=\text{const}-\frac1{2\sigma^2}\sum_i(x_i-\mu)^2
-\frac{(\mu-\mu_0)^2}{2\tau_0^2}.
$$

Here is the actual square completion. Expand $\sum_i(x_i-\mu)^2=\sum_i x_i^2-2n\bar x\mu+n\mu^2$ and the prior square. Collect coefficients of $\mu^2$ and $\mu$:

$$
\log p(\mu\mid\mathcal D)
=C-\frac12\bigl(A\mu^2-2B\mu\bigr),
$$

$$
A=\frac n{\sigma^2}+\frac1{\tau_0^2},
\qquad B=\frac{n\bar x}{\sigma^2}+\frac{\mu_0}{\tau_0^2}.
$$

$C$ is independent of $\mu$. Using $A\mu^2-2B\mu=A(\mu-B/A)^2-B^2/A$ absorbs the final constant and gives

$$
p(\mu\mid\mathcal D)\propto
\exp\!\left[-\frac A2\left(\mu-\frac BA\right)^2\right].
$$

Compare this with the Gaussian exponent $-(\mu-\mu_n)^2/(2\tau_n^2)$. Its center is $\mu_n=B/A$ and its variance is $\tau_n^2=1/A$. Thus the posterior is $\mathcal N(\mu_n,\tau_n^2)$ with

$$
\frac1{\tau_n^2}=\frac1{\tau_0^2}+\frac n{\sigma^2},
\qquad\mu_n=\tau_n^2\left(\frac{\mu_0}{\tau_0^2}
+\frac{n\bar x}{\sigma^2}\right).
$$

Equivalently, the posterior mean is a weighted average:

$$
\mu_n
=\frac{n\tau_0^2}{n\tau_0^2+\sigma^2}\bar x
+\frac{\sigma^2}{n\tau_0^2+\sigma^2}\mu_0.
$$

Why does the data receive coefficient $n/\sigma^2$? The sample mean has variance $\sigma^2/n$, whose reciprocal is exactly this coefficient. **Precision** means inverse variance: more certain information gets larger precision. The posterior center is therefore a precision-weighted average, and posterior precision adds the two precisions. A concentrated prior receives more weight; more observations let the data dominate.

**Continue the numerical example.** Keep observations $0,1,1,2$, but now assume known observation variance $\sigma^2=1$ and prior $\mathcal N(0,1)$ for the mean. The data mean is 1 with precision 4, while the prior mean is 0 with precision 1. Hence $\mu_n=(4\times1+1\times0)/5=0.8$ and $\tau_n^2=1/5=0.2$. The latter describes uncertainty about the **mean parameter**, not observation variance.

The prior and posterior are both Gaussian, with updated parameters. Such a prior is **conjugate** to the likelihood, allowing the posterior to be calculated analytically and represented by the same type of parameters.

### 3.3 Predicting a new observation requires another average

Assuming a new observation is conditionally independent of training data given parameters,

$$
p(x_\star\mid\mathcal D)
=\int p(x_\star\mid\theta)p(\theta\mid\mathcal D)\,d\theta.
$$

Why integrate? For each possible mean, there is a conditional Gaussian density for the next observation. Because the mean is uncertain, average these densities using posterior weights. This is the **posterior predictive distribution**. Integration removes the unknown parameter and leaves the future observation $x_\star$ as the argument.

In the Gaussian example, write $X_\star=\mu+\varepsilon$, with $\varepsilon\sim\mathcal N(0,\sigma^2)$ independent of the mean and previous observations. Given the data, uncertainty about the mean follows $\mathcal N(\mu_n,\tau_n^2)$. Independent Gaussians add to another Gaussian, adding their means and variances:

$$
X_\star\mid\mathcal D
\sim\mathcal N(\mu_n,\sigma^2+\tau_n^2).
$$

**The law of total variance.** Overall variation can arise both within groups and between group means. For example, mixing parts made by two machines can produce a wide range of lengths even if each machine is individually consistent, provided their average lengths differ.

Let $Y$ specify the group and $X$ be the quantity of interest. If $X$ has a finite second moment,

$$
\operatorname{Var}(X)
=\mathbb E_Y[\operatorname{Var}(X\mid Y)]
+\operatorname{Var}_Y(\mathbb E[X\mid Y]).
$$

The first term fixes $Y$, calculates variance within each group, then averages these variances using group probabilities. It measures **within-group variation**. The second calculates each group's mean and measures variation among these means: **between-group variation**. Simply averaging group variances would omit variation caused by different group means.

For example, suppose two equally likely groups both have variance 1, with means 0 and 2. Average within-group variance is 1. The overall mean is 1, so variance of group means is $[(0-1)^2+(2-1)^2]/2=1$. Overall variance is therefore $1+1=2$.

$Y$ can also be continuous: integration over its distribution replaces a weighted sum over groups. The identity requires neither independence of $X$ and $Y$ nor Gaussian distributions.

**Derivation.** Write $m(Y)=\mathbb E[X\mid Y]$ and $m=\mathbb E[X]$. Split the deviation from the overall mean into two parts:

$$
X-m=\bigl(X-m(Y)\bigr)+\bigl(m(Y)-m\bigr).
$$

The first is deviation from the group mean; the second is the group mean's deviation from the overall mean. Squaring and taking expectations gives

$$
\begin{aligned}
\operatorname{Var}(X)
&=\mathbb E[(X-m(Y))^2]
+\mathbb E[(m(Y)-m)^2]\\
&\quad+2\mathbb E[(X-m(Y))(m(Y)-m)].
\end{aligned}
$$

An expectation can be calculated by first conditioning on $Y$, then averaging over groups. This is the law of total expectation, $\mathbb E[\mathbb E[Z\mid Y]]=\mathbb E[Z]$: averaging group means using group probabilities gives the same result as directly averaging over the population.

For the cross term, fixing $Y$ makes $m(Y)-m$ constant, while deviations within the group have mean zero:

$$
\begin{aligned}
\mathbb E[(X-m(Y))(m(Y)-m)\mid Y]
&=(m(Y)-m)\,\mathbb E[X-m(Y)\mid Y]\\
&=0.
\end{aligned}
$$

Averaging over $Y$ leaves this cross term zero. The remaining first term is the average conditional variance. The second is variance of the group means because $\mathbb E[m(Y)]=m$:

$$
\begin{aligned}
\mathbb E[(X-m(Y))^2]
&=\mathbb E_Y[\operatorname{Var}(X\mid Y)],\\
\mathbb E[(m(Y)-m)^2]
&=\operatorname{Var}_Y(\mathbb E[X\mid Y]).
\end{aligned}
$$

Adding the two terms gives the law of total variance.

**Application to posterior prediction.** Here the data $\mathcal D$ are already given, and the additional conditioning variable is the unknown mean $\mu$. Fixing $\mu$ gives conditional mean $\mu$ and conditional variance $\sigma^2$ for a new observation:

$$
\mathbb E[X_\star\mid\mu,\mathcal D]=\mu,
\qquad\operatorname{Var}(X_\star\mid\mu,\mathcal D)=\sigma^2.
$$

The first contribution is the posterior average of constant $\sigma^2$, hence still $\sigma^2$. The second is posterior variance of $\mu$, namely $\tau_n^2$. Explicitly,

$$
\begin{aligned}
\operatorname{Var}(X_\star\mid\mathcal D)
&=\mathbb E_{\mu\mid\mathcal D}\!\left[\operatorname{Var}(X_\star\mid\mu,\mathcal D)\right]\\
&\quad+\operatorname{Var}_{\mu\mid\mathcal D}\!\left[\mathbb E(X_\star\mid\mu,\mathcal D)\right]\\
&=\sigma^2+\tau_n^2.
\end{aligned}
$$

The first term is observation noise remaining even if the mean were known; the second is uncertainty about that mean. The numerical example predicts $\mathcal N(0.8,1.2)$: posterior variance of the mean is 0.2, but predictive variance of a new observation is 1.2. Plugging in the posterior mean omits the second contribution. That approximation improves when the posterior concentrates.

{% include density-figure.html kind="posterior" %}

## 4. Nonparametric density estimation

The previous approaches differ in estimation but both restrict density to a chosen family. If data have two clear peaks, accurately estimating a single Gaussian's mean and variance still cannot produce two peaks. Relax the shape assumption by returning to Section 1: estimate the probability of a small region, then divide by its size to obtain density.

### 4.1 A local counting formula

Take a small region $R$ containing a query $x$, with volume $V$: interval length in one dimension, area in two. The integration variable $u$ moves inside the region while $x$ stays fixed. If density varies little, approximate $p(u)$ by the constant $p(x)$:

$$
P(X\in R)=\int_Rp(u)\,du\approx p(x)V.
$$

If $k$ of $n$ observations fall inside, the law of large numbers motivates estimating regional probability by frequency $k/n$. Substitute it on the left and divide by $V$:

$$
\widehat p(x)\approx\frac{k}{nV}.
$$

For example, if 10 out of 100 observations occupy an interval of length 0.5, estimated probability is 0.1 and estimated density height is $0.1/0.5=0.2$. Converting frequency into density requires division by interval length.

The region must be small enough for a constant-density approximation yet contain enough observations for stable counting. Fixing its size and counting observations leads to histograms and windows; fixing the count and adapting its size leads to nearest neighbors. The following methods arrange $k$ and $V$ in this same expression.

### 4.2 Histograms: divide counts by bin width

Partition the real line into bins of width $h$. If bin $b$ contains $n_b$ observations, set

$$
\widehat p(x)=\frac{n_b}{nh},\qquad x\text{ lies in bin }b.
$$

Each bin has area $n_b/n$, so all areas sum to 1. Counts or frequencies without division by bin width are not density heights.

Narrow bins reveal detail but respond strongly to sample fluctuations; wide bins obscure structure. Alignment of bin boundaries matters too. With $B$ bins along each of $d$ dimensions, a grid contains $B^d$ bins, a direct illustration of the curse of dimensionality.

### 4.3 Kernel density estimation

Before introducing kernels, start with counting. Histogram bins stay fixed on the line; crossing a boundary changes the count abruptly. Instead, center a moving window of length $h$ at each query $x$. The indicator $\mathbf1$ equals 1 when its condition holds and 0 otherwise, so

$$
k(x)=\sum_{i=1}^{n}\mathbf1\!\left(\lvert x-x_i\rvert\leq\frac h2\right),
\qquad \widehat p_h(x)=\frac{k(x)}{nh}.
$$

This remains count divided by sample size and window length. Divide the condition by $h>0$ and define $K_{\mathrm{box}}(u)=\mathbf1(\lvert u\rvert\leq1/2)$ to write

$$
\widehat p_h(x)=\frac1{nh}\sum_{i=1}^{n}
K\!\left(\frac{x-x_i}{h}\right),\qquad h>0.
$$

With a box kernel this is exactly the moving-window count. Contributions still jump when observations enter or leave the window. Replacing $K$ by a smooth function gives nearby observations more weight than distant ones and smooths the resulting curve. This produces **kernel density estimation (KDE)**: $K$ determines how contributions vary with distance, and $h$ controls their range.

Read the same sum another way: keep each $x_i$ fixed and move $x$. Each term draws a small density around one observation. Require $K(u)\geq0$ and $\int K(u)\,du=1$. Bandwidth $h$ controls width and $1/h$ compensates height for stretching. With $u=(x-x_i)/h$ we have $dx=h\,du$, hence

$$
\int\frac1hK\!\left(\frac{x-x_i}{h}\right)dx
=\int K(u)\,du=1.
$$

Each scaled kernel has unit area. Multiplication by $1/n$ assigns each observation probability mass $1/n$, so the total area is 1. This explains the averaging factor, bandwidth factor, sum, and local shape separately. Scaling all coordinates in $d$ dimensions gives volume factor $h^d$ and vector argument $(\mathbf x-\mathbf x_i)/h$.

Common one-dimensional kernels include

$$
K_{\mathrm G}(u)=\frac1{\sqrt{2\pi}}e^{-u^2/2},
$$

$$
K_{\mathrm{box}}(u)=\mathbf1\!\left(\lvert u\rvert\leq\frac12\right),
$$

$$
K_{\mathrm E}(u)=\frac34(1-u^2)\mathbf1(\lvert u\rvert\leq1).
$$

The last is the Epanechnikov kernel, with factor $1-u^2$. Gaussian kernels are nonzero everywhere, while box and Epanechnikov kernels vanish outside finite intervals, called finite support. Smoothness and computational cost both matter.

In particular, $h^{-1}K_{\mathrm G}((x-x_i)/h)$ is a Gaussian density with mean $x_i$ and variance $h^2$. Gaussian KDE therefore puts one Gaussian at each observation and averages them equally. This observation leads naturally to Gaussian mixtures in Section 5.

### 4.4 Choosing bandwidth

A small bandwidth leaves sharp local peaks around observations and makes an estimate sensitive to the particular sample. A large bandwidth reduces fluctuations but can merge genuinely separate modes. This is the **bias–variance tradeoff**.

First identify whose variance is involved. Fix query $x$ and repeatedly draw new training samples. Each sample produces a value $\widehat p_h(x)$. **Variation across these estimates** is estimation variance, distinct from the variance of observations $X$. The difference between their average and the true height $p(x)$ is bias.

Write $m_h(x)=\mathbb E[\widehat p_h(x)]$. Split the error into $(\widehat p_h(x)-m_h(x))+(m_h(x)-p(x))$, square, and take expectations. The cross term vanishes because the first summand has mean zero:

$$
\underbrace{\mathbb E[(\widehat p_h(x)-p(x))^2]}_{\text{mean squared error}}
=\underbrace{\operatorname{Var}[\widehat p_h(x)]}_{\text{sampling variation}}
+\underbrace{(m_h(x)-p(x))^2}_{\text{squared bias}}.
$$

Bandwidth must account for both terms. The following calculation explains their dependence on $h^4$ and $1/(nh)$ using expectations, variance of independent averages, and Taylor expansion.

**First find the average estimate.** To analyze sampling error, replace the recorded $x_i$ by random observations $X_i$. Identical distributions make the expectation of the average equal to the expectation of one term:

$$
m_h(x)=\int\frac1h K\!\left(\frac{x-u}{h}\right)p(u)\,du
=\int K(t)p(x-ht)\,dt.
$$

The second equality substitutes $t=(x-u)/h$; reversing integration limits cancels the minus sign. Thus the average estimate smooths the true density around $x$. In one dimension, away from boundaries, for a sufficiently smooth density and symmetric kernel satisfying suitable moment conditions, expand locally:

$$
p(x-ht)\approx p(x)-ht\,p'(x)+\frac{h^2t^2}{2}p''(x).
$$

Multiply each term by $K(t)$ and integrate. The first remains $p(x)$ because kernel area is 1. The second vanishes because symmetry gives $\int tK(t)\,dt=0$. The third retains the kernel's second moment. Subtracting the true density gives

$$
\operatorname{Bias}[\widehat p_h(x)]
\approx\frac{h^2}{2}\mu_2(K)p''(x),
\qquad\mu_2(K)=\int u^2K(u)\,du,
$$

Bias usually scales as $h^2$, so **squared bias** scales as $h^4$. Averaging a curved density over a neighborhood smooths its curvature, producing this bias.

**Next find variation between training samples.** Let $Y_i=h^{-1}K((x-X_i)/h)$. The estimate is the average of these $Y_i$. With query $x$ and bandwidth $h$ fixed, the same function transforms each $X_i$, so $Y_1,\ldots,Y_n$ remain independent and identically distributed. Calculate variance step by step:

$$
\begin{aligned}
\operatorname{Var}[\widehat p_h(x)]
&=\operatorname{Var}\!\left(\frac1n\sum_{i=1}^{n}Y_i\right)\\
&=\frac1{n^2}\sum_{i=1}^{n}\operatorname{Var}(Y_i)\\
&=\frac1{n^2}\,n\operatorname{Var}(Y_1)\\
&=\frac1n\operatorname{Var}(Y_1).
\end{aligned}
$$

The second step uses independence: cross covariances vanish, allowing variances to add, while the factor $1/n$ is squared. The third uses identical distributions: every term has the same variance, so their sum is $n\operatorname{Var}(Y_1)$. Here $Y_1$ represents any one term, rather than restricting attention to the first observation. Any fixed index $i$ would give the same result.

Finally, variance equals the second moment minus the squared mean:

$$
\operatorname{Var}[\widehat p_h(x)]
=\frac1n\left(\mathbb E[Y_1^2]-\bigl(\mathbb E[Y_1]\bigr)^2\right).
$$

The same substitution applied to the squared kernel gives

$$
\mathbb E[Y_1^2]=\frac1h\int K(t)^2p(x-ht)\,dt
\approx\frac{p(x)}h\int K(t)^2\,dt.
$$

For small $h$ at points with $p(x)>0$, this $1/h$ contribution dominates while $\mathbb E[Y_1]^2$ stays bounded. The leading variance term is therefore

$$
\operatorname{Var}[\widehat p_h(x)]
\approx\frac{p(x)R(K)}{nh},
\qquad R(K)=\int K(u)^2\,du.
$$

This matches the intuition: with sample size fixed, a very narrow neighborhood receives meaningful contributions from fewer observations and becomes less stable.

**Only now choose bandwidth.** Collect factors independent of $h$ and $n$ into positive constants $C_1,C_2$. Leading local mean squared error takes the form

$$
\operatorname{MSE}(h)\approx C_1h^4+\frac{C_2}{nh}.
$$

Differentiating with respect to $h$ and setting the result to zero gives $4C_1h^3-C_2/(nh^2)=0$, hence

$$
h^5=\frac{C_2}{4C_1n},\qquad h\propto n^{-1/5}.
$$

This gives the familiar $n^{-1/5}$ bandwidth scale under the stated smoothness assumptions and nonzero leading coefficients. Points with zero local curvature need further analysis. The result describes how bandwidth should typically change with sample size, rather than specifying the best bandwidth for arbitrary data. See [Chapter 6 of Wasserman's *All of Nonparametric Statistics*](https://link.springer.com/book/10.1007/0-387-30623-4) and the CMU notes in the references for derivations.

Use held-out data or cross-validation to compare bandwidths through predictive log density. Maximizing training density with each observation's own kernel contribution included tends to favor $h\to0$ for Gaussian KDE. Bounded data also require checking boundary bias. The [scikit-learn density estimation guide](https://scikit-learn.org/stable/modules/density.html) discusses implementation choices.

{% include density-figure.html kind="smoothing" %}

### 4.5 k nearest neighbors: adapting window size to location

Return to $k/(nV)$. A box-window estimate fixes length $h$ and lets the count vary as the query moves. In sparse regions, a small fixed window might contain very few observations.

**k-nearest neighbors (kNN)** reverses the choice: fix $k$ and expand a window around the query until reaching the kth neighbor. If this distance is $r_k(x)$, a symmetric one-dimensional window has length $V(x)=2r_k(x)$. Substituting this into the same local counting formula defines

$$
\widehat p_{\mathrm{kNN}}(x)=\frac{k}{2n r_k(x)}.
$$

A small window in a dense region yields a high local density; sparse regions require larger windows. In multiple dimensions, replace $2r_k(x)$ by the neighborhood volume under the chosen distance. Small $k$ fluctuates strongly; large $k$ loses local detail.

For 100 observations and 10 neighbors, a kth-neighbor distance of 0.25 gives height $10/(100\times0.5)=0.2$. At a sparse query where that distance is 1, height falls to $10/(100\times2)=0.05$. The count is unchanged; the region needed to find those observations has grown.

The naive formula is a local estimate and need not integrate to 1 over the entire space. Far from a finite one-dimensional sample, $r_k(x)$ grows approximately as $\lvert x\rvert$, creating a nonintegrable $1/\lvert x\rvert$ tail. It should not be treated directly as a normalized generative model.

{% include density-figure.html kind="neighbors" %}

### 4.6 Why does neighbor classification become voting?

Use one neighborhood shared by all classes. Of its $k$ neighbors, let $k_j$ belong to class $C_j$; the full training set contains $n_j$ observations of that class. With common volume $V$,

$$
\widehat p(x)\approx\frac{k}{nV},\quad
\widehat p(x\mid C_j)\approx\frac{k_j}{n_jV},\quad
\widehat P(C_j)=\frac{n_j}{n}.
$$

Substituting into Bayes' rule cancels sample sizes and volume:

$$
\widehat P(C_j\mid x)\approx
\frac{k_j}{n_jV}\frac{n_j}{n}\frac{nV}{k}
=\frac{k_j}{k}.
$$

Why does conditional density divide by $n_j$? Its frequency is calculated within class $j$: $k_j$ of that class's $n_j$ observations occupy the region. Dividing that frequency by volume gives class-conditional density. Multiplying by prior $n_j/n$ converts it to a joint frequency density in the whole sample. Dividing by the overall density finally gives the proportion belonging to the class within the neighborhood.

If 7 of 10 neighbors belong to class one and 3 to class two, the estimated posteriors are 0.7 and 0.3. Majority voting selects class one. The cancellation requires a shared neighborhood; class-specific radii do not permit the same shortcut.

## 5. Gaussian mixtures and EM

### 5.1 Gaussian mixture models

One Gaussian may be too simple, while Gaussian KDE retains a curve at every observation. Could we instead retain a smaller number of Gaussians and learn their locations, widths, and proportions? This motivates a Gaussian mixture.

Describe its sampling process explicitly: first choose component $j$ with probability $\pi_j$, then draw an observation from that component's Gaussian. A variable $Z$ records the selected component:

$$
P(Z=j)=\pi_j,\qquad
p(x\mid Z=j)=\mathcal N(x\mid\mu_j,v_j),
$$

Only $x$ is recorded; the selected $Z$ is missing. A variable present in the model but absent from observations is a **latent variable**. Summing over possible component labels using total probability gives the observation density:

$$
p(x\mid\theta)=\sum_{j=1}^{M}\pi_j\mathcal N(x\mid\mu_j,v_j),
\quad\pi_j\geq0,\quad\sum_j\pi_j=1.
$$

This is a **Gaussian mixture model (GMM)**. Normalized components and weights summing to 1 guarantee a normalized mixture. Components need not correspond to semantic classes, and permuting their labels leaves the density unchanged.

$\theta$ collects all unknown $\pi_j,\mu_j,v_j$. The component probability $\pi_j$ differs from the constant $\pi$ in Gaussian normalization. Gaussian KDE is a special case of this sum: $M=n$, fixed weights $1/n$, means $x_i$, and common variance $h^2$. A GMM usually uses fewer components and learns their parameters, so fitting it is different from merely renaming KDE.

The challenge is the log-likelihood:

$$
\ell(\theta)=\sum_{i=1}^{n}
\log\!\left[\sum_{j=1}^{M}\pi_j\mathcal N(x_i\mid\mu_j,v_j)\right].
$$

The difficulty is that $\log(a+b)$ cannot become $\log a+\log b$, so each observation couples multiple components. Gradient methods remain possible. Here we imagine known assignments and ask whether the Gaussian MLE formulas would then apply.

If observation $i$'s component were known, write $s_{ij}=\mathbf1(Z_i=j)$: 1 for its actual component and 0 otherwise. Given those assignments, complete-data log-likelihood is

$$
\ell_{\mathrm c}(\theta)
=\sum_{i=1}^{n}\sum_{j=1}^{M}s_{ij}
\left[\log\pi_j+\log\mathcal N(x_i\mid\mu_j,v_j)\right].
$$

For each observation this selects its assigned component's term. The difficult sum inside the logarithm disappears, leaving Gaussian log-likelihoods within components. Known assignments would let us apply Section 2's mean and variance estimates separately. EM preserves this tractable structure by taking conditional expectations over unknown assignments.

### 5.2 EM: soft assignments followed by re-estimation

**E step: with parameters available, how should observations be assigned?** Start from valid initial parameters and denote parameters at iteration $t$ by $\theta^{(t)}$. The superscript is an iteration index, not a power. Apply Section 1's Bayes rule with components taking the place of classes. The resulting posterior assignment probabilities are **responsibilities**:

$$
\gamma_{ij}^{(t)}
=P(Z_i=j\mid x_i,\theta^{(t)})
=\frac{\pi_j^{(t)}\mathcal N(x_i\mid\mu_j^{(t)},v_j^{(t)})}
{\sum_\ell\pi_\ell^{(t)}\mathcal N(x_i\mid\mu_\ell^{(t)},v_\ell^{(t)})}.
$$

The numerator is selection probability times component density at the observation. The denominator sums these contributions to normalize them. For two equally weighted components with densities 0.6 and 0.2 at an observation, contributions are 0.3 and 0.1, giving responsibilities 0.75 and 0.25. Component density is not an assignment probability; normalization turns these contributions into probabilities.

Responsibilities sum to 1 for each observation. Why is this an expectation step? A binary indicator's expectation is its probability of being 1, so

$$
\mathbb E[s_{ij}\mid\mathcal D,\theta^{(t)}]=\gamma_{ij}^{(t)}.
$$

In this independent-sample model, conditioning on parameters means observation $i$'s posterior assignment only needs $x_i$. Taking conditional expectations of the complete-data log-likelihood therefore replaces unknown indicators by responsibilities. The next step optimizes

$$
Q(\theta\mid\theta^{(t)})
=\sum_{i,j}\gamma_{ij}^{(t)}
\left[\log\pi_j+\log\mathcal N(x_i\mid\mu_j,v_j)\right].
$$

Index $i$ always identifies an observation, and $j$ a component; the double sum adds every observation's contribution to every component. The conditioning argument $\theta^{(t)}$ indicates that weights come from old parameters. The first argument $\theta$ contains new parameters to optimize. Letting weights change with new parameters would no longer be this M step.

**M step: with assignment weights fixed, how should parameters be estimated?** Let effective counts be $N_j=\sum_i\gamma_{ij}^{(t)}$. An observation may contribute 0.75 of a count, so these need not be integers, but $\sum_jN_j=n$. Expanding the Gaussian logarithm in $Q$ and collecting parameter-independent constants gives

$$
Q=\sum_jN_j\log\pi_j
-\frac12\sum_jN_j\log v_j
-\frac12\sum_j\frac1{v_j}\sum_i\gamma_{ij}^{(t)}(x_i-\mu_j)^2
+\text{const}.
$$

Differentiate as before. For $\mu_j$, each observation simply has an extra fixed weight:

$$
\frac{\partial Q}{\partial\mu_j}
=\frac1{v_j}\sum_i\gamma_{ij}^{(t)}(x_i-\mu_j)=0
\quad\Longrightarrow\quad
\mu_j^{(t+1)}=\frac{\sum_i\gamma_{ij}^{(t)}x_i}{N_j}.
$$

For $v_j$, replace Section 2's sample size by $N_j$ and squared error by weighted squared error:

$$
\frac{\partial Q}{\partial v_j}
=-\frac{N_j}{2v_j}
+\frac{\sum_i\gamma_{ij}^{(t)}(x_i-\mu_j)^2}{2v_j^2}=0.
$$

Substituting the newly estimated mean yields

$$
v_j^{(t+1)}=\frac1{N_j}\sum_i\gamma_{ij}^{(t)}
(x_i-\mu_j^{(t+1)})^2.
$$

Finally estimate proportions by maximizing $\sum_jN_j\log\pi_j$ subject to $\sum_j\pi_j=1$. Introduce a Lagrange multiplier $\lambda$, giving $\sum_jN_j\log\pi_j+\lambda(1-\sum_j\pi_j)$. Differentiation gives $N_j/\pi_j-\lambda=0$, hence $\pi_j=N_j/\lambda$. Summing over components gives $\lambda=\sum_jN_j=n$, so

$$
\pi_j^{(t+1)}=\frac{N_j}{n}.
$$

Thus the M step estimates each group's mean, variance, and proportion using probability weights instead of assigning each observation entirely to one group. The mean and variance formulas require $N_j>0$; empty components require reinitialization or another remedy.

**Work through soft weights.** In a separate example, take observations $0,2$ with responsibilities 0.75 and 0.25 for component one. Its effective count is $N_1=0.75+0.25=1$, new mean is $(0.75\times0+0.25\times2)/1=0.5$, new variance is $[0.75(0-0.5)^2+0.25(2-0.5)^2]/1=0.75$, and new weight is $1/2$. The second observation is not discarded; it simply has less influence. This distinguishes soft assignment from immediate hard grouping.

The E step asks which current curve could have produced each observation. The M step asks where the curves should be centered, how wide they should be, and what proportions they should have under those assignments. Recalculate responsibilities with new parameters and repeat: this is **expectation-maximization (EM)**. For vector observations, weighted outer products replace weighted squared errors to update covariance matrices.

The figure displays weighted components, total density, and observed-data log-likelihood at each iteration. Run a single step, or pause the animation to compare iterations.

{% include density-figure.html kind="em" %}

### 5.3 Why does an iteration not decrease observed likelihood?

One connection remains: why does maximizing $Q$ improve the observed-data log-likelihood $\ell$ we actually care about? They are different functions. We can establish their relationship one observation at a time, without introducing a joint distribution over all latent assignments.

Write the exact assignment posterior under the parameters being considered as

$$
r_{ij}(\theta)=\frac{p(x_i,Z_i=j\mid\theta)}{p(x_i\mid\theta)}.
$$

For that observation choose any nonnegative weights $q_{ij}$ summing to $\sum_jq_{ij}=1$. These are an auxiliary assignment distribution for comparison, not extra model parameters. First assume positive component weights, variances, and $q_{ij}$; zero contributions can be treated by continuous limits.

Bayes' rule gives $\log p(x_i,Z_i=j\mid\theta)=\log p(x_i\mid\theta)+\log r_{ij}(\theta)$. Substitute this into the weighted sum:

$$
\begin{aligned}
\sum_jq_{ij}\log\frac{p(x_i,Z_i=j\mid\theta)}{q_{ij}}
&=\log p(x_i\mid\theta)
+\sum_jq_{ij}\log\frac{r_{ij}(\theta)}{q_{ij}}\\
&=\log p(x_i\mid\theta)
-D_{\mathrm{KL}}(q_i\Vert r_i(\theta)).
\end{aligned}
$$

Here $q_i$ denotes the entire vector of component probabilities for observation $i$, as does $r_i(\theta)$. In the first line, $\log p(x_i\mid\theta)$ is independent of $j$ and remains unchanged by a weighted average. The second line uses the definition $D_{\mathrm{KL}}(q_i\Vert r_i)=\sum_jq_{ij}\log(q_{ij}/r_{ij})$.

Sum over observations and define

$$
\mathcal F(q,\theta)
=\sum_{i,j}q_{ij}\log\frac{p(x_i,Z_i=j\mid\theta)}{q_{ij}},
$$

obtaining the decomposition

$$
\ell(\theta)
=\mathcal F(q,\theta)
+\sum_iD_{\mathrm{KL}}(q_i\Vert r_i(\theta)).
$$

Nonnegative KL means $\mathcal F$ cannot exceed $\ell$: it is a **lower bound**. To recall why KL is nonnegative, use $\log u\leq u-1$ with $u=r_{ij}/q_{ij}$ and average using $q_{ij}$. This yields $\sum_jq_{ij}\log(r_{ij}/q_{ij})\leq\sum_j(r_{ij}-q_{ij})=0$. Reversing the sign proves the claim.

The E step chooses the exact posterior at the old parameters: $q_{ij}^{(t)}=r_{ij}(\theta^{(t)})=\gamma_{ij}^{(t)}$. The two distributions match, making every KL term zero, so the bound equals observed log-likelihood at the old parameters.

Hold these weights fixed and expand $\mathcal F$:

$$
\mathcal F(q^{(t)},\theta)
=\underbrace{\sum_{i,j}\gamma_{ij}^{(t)}
\log p(x_i,Z_i=j\mid\theta)}_{Q(\theta\mid\theta^{(t)})}
-\underbrace{\sum_{i,j}\gamma_{ij}^{(t)}\log\gamma_{ij}^{(t)}}_{\text{independent of new parameters}}.
$$

The first term is precisely the preceding section's $Q$; the subtracted weighted log sum does not involve new parameters. Increasing $Q$ therefore raises the bound that already touches the objective at the old parameters:

$$
\ell(\theta^{(t+1)})
\geq\mathcal F(q^{(t)},\theta^{(t+1)})
\geq\mathcal F(q^{(t)},\theta^{(t)})
=\ell(\theta^{(t)}).
$$

Read from right to left: old likelihood equals the bound at old parameters; the M step does not lower that bound; true likelihood at new parameters cannot be below the new bound. Thus new likelihood cannot be below old likelihood. The E step fits the bound to the current objective, the M step raises it, and the next iteration fits it again.

Thus likelihood does not decrease when the E step is exact and the M step improves $Q$ under consistent objectives and constraints. Strict improvement is not required. See [Dempster, Laird, and Rubin](https://doi.org/10.1111/j.2517-6161.1977.tb01600.x) for the original algorithm and monotonicity analysis, and [Neal and Hinton](https://www.cs.toronto.edu/~hinton/absps/emk.pdf) for the bound-based perspective.

### 5.4 What remains to check when likelihood improves?

**Initialization.** EM does not guarantee a global optimum. Different initial parameters can reach different stationary points. Identical components receive identical responsibilities and updates, so the algorithm cannot spontaneously break their symmetry. Try multiple initializations and inspect stability.

**Singular solutions.** A component collapsing onto one observation with variance tending to zero can make GMM training likelihood unbounded. The figure explicitly constrains $v_j\geq0.04$. Its one-dimensional M step takes the larger of the weighted variance and 0.04, the optimum under that constraint. This differs from unconstrained EM, and the numerical floor is not universally appropriate.

**Component count.** Better training fit does not guarantee better predictions. For $q$ free parameters and sample size $n$, standard information criteria are

$$
\operatorname{AIC}=2q-2\ell(\widehat\theta),
\qquad\operatorname{BIC}=q\log n-2\ell(\widehat\theta),
$$

both minimized. They balance fit against a complexity penalty: higher log-likelihood lowers $-2\ell$, while more parameters increase the penalty. The standalone $q$ here counts parameters, unlike the auxiliary weights $q_{ij}$ above. A univariate GMM has $M$ means, $M$ variances, and $M-1$ independent weights, giving $q=3M-1$. One weight is determined by their sum being 1.

Mixtures can violate regularity conditions behind these criteria, so a preferred score is not proof of the true component count. Combine it with held-out log-likelihood, degeneracy checks, and domain knowledge.

EM extends beyond Gaussian mixtures to many latent-variable and missing-data models, provided the posterior and M step can be handled. [Bilmes' EM tutorial](https://people.ece.uw.edu/bilmes/p/pgs/b2hd-bilmes1997-em.html) derives mixture updates in detail; the [scikit-learn mixture guide](https://scikit-learn.org/stable/modules/mixture.html) discusses practical covariance constraints and model selection.

## 6. Choosing a method

| Method | Main assumptions or choices | Common pitfalls |
| --- | --- | --- |
| Single-Gaussian MLE | Unimodal ellipsoidal shape, mean and covariance | Insufficient data, shape mismatch, singular covariance |
| Bayesian parameter estimation | Likelihood, prior, posterior computation | Inappropriate priors, omitted parameter uncertainty |
| Histogram | Bin widths and alignment | Discontinuity, boundary sensitivity, high-dimensional grids |
| KDE | Kernel, bandwidth, distance, feature scales | Bandwidth choice, boundary bias, query and storage costs |
| Local kNN estimate | Neighbor count, distance, neighborhood volume | Feature scales, sparse high dimensions, no general global normalization |
| GMM with EM | Component count, covariance structure, initialization | Singular solutions, local stationary points, symmetric initialization |

Start with the purpose: comparing distribution shapes, generating samples, detecting anomalies, or classifying? Establish a simple baseline, check feature scales and sampling, and compare complexity using observations excluded from fitting. Sharp peaks at training observations are not sufficient evidence of a good density model.

## 7. Check your understanding

1. Why need a likelihood not integrate to 1 over its parameters?
2. Why does Gaussian ML variance use $n$ rather than $n-1$?
3. If posterior and predictive means agree, must their variances agree too?
4. What do $1/h$ and $1/h^d$ do for KDE normalization?
5. Why does the kth-neighbor radius change with the query? Why is naive kNN not automatically a normalized generative density?
6. Why does the E step use responsibilities instead of requiring hard classification?
7. Why inspect initialization, variance collapse, and held-out performance even when likelihood improves?

**Answer guide.** Likelihood fixes observations and varies parameters; likelihood maximization and unbiasedness are different criteria; predictive uncertainty includes observation noise; bandwidth factors compensate for scaling; neighbors fix a count and can have nonintegrable far tails; responsibilities retain assignment uncertainty; monotonicity concerns the chosen objective and does not guarantee a global optimum, finite maximum, or generalization.

## 8. Notation and abbreviations

| Symbol | Meaning |
| --- | --- |
| $\mathcal D,n,d$ | Observations, sample size, dimension |
| $L,\ell,\widehat\theta_{\mathrm{ML}}$ | Likelihood, log-likelihood, maximum-likelihood estimate |
| $\sigma^2,\tau_0^2,\tau_n^2$ | Observation variance, prior and posterior variance of the mean |
| $K,h,k,r_k(x)$ | Kernel, bandwidth, neighbor count, kth-neighbor distance |
| $M,\pi_j,\gamma_{ij},N_j$ | Component count, weight, responsibility, effective count |
| $s_{ij},Q,\mathcal F$ | Assignment indicator, expected complete-data log-likelihood, lower bound on observed log-likelihood |
| $r_{ij}(\theta),q_{ij}$ | Model assignment posterior, auxiliary assignment weights used in the proof |
| MLE / MAP / KDE / kNN | Maximum likelihood / maximum a posteriori / kernel density estimation / k nearest neighbors |
| GMM / EM | Gaussian mixture model / expectation-maximization |
| AIC / BIC | Akaike information criterion / Bayesian information criterion |

## 9. References

1. **A. P. Dempster, N. M. Laird, D. B. Rubin (1977).** [*Maximum Likelihood from Incomplete Data via the EM Algorithm*](https://doi.org/10.1111/j.2517-6161.1977.tb01600.x). The original EM paper, including likelihood monotonicity and convergence analysis.
2. **Jeff A. Bilmes.** [*A Gentle Tutorial of the EM Algorithm and Its Application to Parameter Estimation for Gaussian Mixture and Hidden Markov Models*, TR-97-021](https://people.ece.uw.edu/bilmes/p/pgs/b2hd-bilmes1997-em.html). Detailed mixture and hidden Markov model parameter updates.
3. **Radford M. Neal, Geoffrey E. Hinton (1998).** [*A View of the EM Algorithm that Justifies Incremental, Sparse, and Other Variants*](https://www.cs.toronto.edu/~hinton/absps/emk.pdf). An alternating-optimization view over distributions and parameters.
4. **scikit-learn documentation.** [*Density Estimation*](https://scikit-learn.org/stable/modules/density.html) and [*Gaussian Mixture Models*](https://scikit-learn.org/stable/modules/mixture.html). Practical references on kernels, bandwidths, mixtures, and model selection.
5. **Larry Wasserman (2006).** [*All of Nonparametric Statistics*, Chapter 6: Density Estimation](https://link.springer.com/book/10.1007/0-387-30623-4). Error analysis, bandwidth rates, and proofs for histograms and kernel density estimates.
6. **Pradeep Ravikumar, CMU 10-716.** [*Nonparametric Density Estimation*](https://www.cs.cmu.edu/~pradeepr/716/files_sp24/lect_notes/densityestimation.pdf). Freely readable notes adapted from Wasserman, including KDE bias, variance, and bandwidth derivations.

**Corrections.** Corrections to formulas, terminology, or interpretations are welcome.
