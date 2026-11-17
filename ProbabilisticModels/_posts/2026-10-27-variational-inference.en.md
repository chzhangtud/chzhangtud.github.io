---
title: "From Latent Variable Models to Variational Inference"
date: 2026-10-27
lang: en
permalink: /en/variational-inference/
zh_link: /zh/variational-inference/
series: generative-models
series_order: 1
categories: [Probabilistic Models]
tags: [Variational Inference, Graphical Models, ELBO]
classes: statistics-article
toc: true
toc_label: On this page
toc_sticky: true
excerpt: "Use one temperature measurement model to derive posterior inference, the ELBO, variational optimization, EM noise estimation, and mean-field approximation with unknown sensor bias."
---

{% include vae-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

A room thermometer reads 21 °C. Historical temperatures for rooms of this kind are centered around 20 °C, with a standard deviation of about 1 °C. The thermometer has been calibrated, but its readings still contain random noise with a standard deviation of 0.6 °C. We want to estimate the actual room temperature from this reading and retain the uncertainty in that estimate.

We will model this measurement and obtain the temperature posterior both through Bayes' rule and through variational optimization. We then use the same measurement model to estimate noise, and introduce an unknown sensor bias to derive a mean-field approximation. All numerical values are teaching assumptions, rather than measurements from an actual sensor.

The prerequisites are conditional probability, expectations, and KL divergence from [Probability and Statistics Foundations]({{ '/en/probability-statistics/' | relative_url }}). Section 4 derives the EM steps introduced in [Probability Density Estimation]({{ '/en/density-estimation/' | relative_url }}). All logarithms are natural.


<div class="pgm-reading-guide" markdown="1">

**Reading guide.** Read each purpose, main result, and takeaway first, then expand derivations or code as needed. Interactive figures remain in the main text so the argument can be followed without opening every calculation.

</div>

---

## 1. Temperature measurement model

<div class="pgm-section-intro" markdown="1">

**Purpose.** Separate the reading, actual temperature, and measurement noise, then use one reading to update the temperature estimate.

</div>



### 1.1 Prior and observation noise

<div class="pgm-section-intro" markdown="1">

**Purpose.** Set up the measurement model: actual temperature has a prior range, and the reading adds noise to that temperature.

</div>

Let $T$ denote the actual temperature and $R$ the thermometer reading. Express both relative to 20 °C, using 1 °C as the unit:

$$
Z=\frac{T-20\,{}^\circ\mathrm C}{1\,{}^\circ\mathrm C},
\qquad
X=\frac{R-20\,{}^\circ\mathrm C}{1\,{}^\circ\mathrm C}.
$$

A reading of 21 °C corresponds to $x=1$. The actual temperature is unobserved, so $Z$ is the model's **latent variable**; $X$ is observed.

Model historical temperatures with a standard Gaussian and assume measurement noise is independent of temperature:

$$
Z\sim\mathcal N(0,1),\qquad
\varepsilon\sim\mathcal N(0,\tau^2),\qquad
X=Z+\varepsilon.
$$

The noise standard deviation $\tau>0$ is initially 0.6. Given a true temperature difference $z$, readings fluctuate around it:

$$
p(z)=\mathcal N(z\mid0,1),\qquad
p_\theta(x\mid z)=\mathcal N(x\mid z,\tau^2),
\qquad \theta=\tau^2.
$$

The first term is the **prior density** before observing a reading. The second is the **conditional observation density** given the actual temperature. The model parameter $\theta$ is fixed initially and estimated in Section 4.

Multiplying gives the joint density:

$$
p_\theta(x,z)=p(z)p_\theta(x\mid z).
$$

The graph $Z\to X$ represents this factorization: assign probabilities to actual temperatures, then conditional probabilities to their readings. Its arrow specifies the generative model's factorization.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The prior describes temperature before measurement; the conditional observation density describes noisy readings at a given temperature. Their product is the joint used for inference.

</div>

### 1.2 Temperature posterior

<div class="pgm-section-intro" markdown="1">

**Purpose.** With the reading observed, reweight possible actual temperatures using both their prior plausibility and their ability to explain this reading.

</div>

The reading $x=1$ adds information about the temperature. For each candidate $z$, the joint density $p(z)p_\theta(1\mid z)$ accounts for both its historical plausibility and its compatibility with the observed reading.

Integrating these weights over temperatures gives the observation's marginal density:

$$
p_\theta(x)=\int p(z)p_\theta(x\mid z)\,dz.
$$

The integral accounts for all possible unknown temperatures $z$ and gives the reading's **marginal density**. Once the observed $x$ is fixed, this expression viewed as a function of the noise parameter $\theta$ is the **marginal likelihood**. For a 21 °C reading, it assigns a density to that reading under each noise setting after integrating over all possible actual temperatures.

Normalizing by this total weight gives the **true posterior**, the actual temperature distribution conditional on the reading:

$$
p_\theta(z\mid x)
=\frac{p(z)p_\theta(x\mid z)}{p_\theta(x)}.
$$

For a fixed $x$, the denominator is constant with respect to $z$ and makes the posterior integrate to one:

$$
\int p_\theta(z\mid x)\,dz
=\frac{\int p(z)p_\theta(x\mid z)\,dz}{p_\theta(x)}=1.
$$

Evaluating the joint at one candidate temperature requires multiplying two density values. Evaluating the observation's marginal likelihood requires integration over the temperature range. This one-dimensional Gaussian model has an analytic integral. With more complex sensor responses or high-dimensional latent variables, the joint may remain easy to evaluate while the marginal likelihood integral becomes difficult. This motivates approximating the true posterior below.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Integrating out temperature gives the reading marginal likelihood. Dividing the joint by it gives the temperature posterior. The integral can be difficult even when individual density evaluations are easy.

</div>

### 1.3 Analytic Gaussian posterior

<div class="pgm-section-intro" markdown="1">

**Purpose.** Solve the simple model exactly as a reference for variational optimization. Completing the square is optional; the posterior result and temperature interpretation remain visible.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: completing the posterior square</summary>

Both prior and observation distribution are Gaussian. Fix the reading $x$ and combine their exponents:

$$
\begin{aligned}
p_\theta(z\mid x)
&\propto p(z)p_\theta(x\mid z)\\
&\propto\exp\!\left[-\frac12\left(z^2+\frac{(x-z)^2}{\tau^2}\right)\right].
\end{aligned}
$$

The proportionality sign temporarily leaves factors independent of $z$ in the normalizer. Expand the quadratic and complete the square:

$$
\begin{aligned}
z^2+\frac{(x-z)^2}{\tau^2}
&=\frac{1+\tau^2}{\tau^2}z^2-\frac{2x}{\tau^2}z+\frac{x^2}{\tau^2}\\
&=\frac{1+\tau^2}{\tau^2}
\left(z-\frac{x}{1+\tau^2}\right)^2+\frac{x^2}{1+\tau^2}.
\end{aligned}
$$

The final term does not depend on $z$. Comparing the remaining exponent with $-(z-m)^2/(2v)$ gives

</details>

The resulting temperature posterior is:

$$
p_\theta(z\mid x)
=\mathcal N\!\left(z\mid\frac{x}{1+\tau^2},\frac{\tau^2}{1+\tau^2}\right).
$$

Meanwhile, $X$ is the sum of independent Gaussian variables. Adding their means and variances yields

$$
p_\theta(x)=\mathcal N(x\mid0,1+\tau^2).
$$

With $x=1$ and $\tau=0.6$, the posterior mean is about 0.7353, its variance is 0.2647, and its standard deviation is 0.5145. In temperature units, the posterior mean is approximately 20.7353 °C with a standard deviation of 0.5145 °C.

The estimate lies between the historical mean of 20 °C and the 21 °C reading. Lower observation noise gives the reading more influence. Greater noise preserves more of the prior information.

{% include vae-explainer.html kind="bayes" %}

Both $z$ and $x$ represent temperature differences relative to 20 °C. Display the prior density, conditional observation density, joint density, and true posterior in sequence. The conditional observation density curve holds the reading fixed and varies candidate temperature $z$; this weighting function need not integrate to one over $z$.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** A 21 °C reading gives a posterior mean near 20.7353 °C and SD near 0.5145 °C. The estimate combines the reading with historical information and retains uncertainty.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 1 summary.** We now have a temperature distribution conditional on the reading, including uncertainty. Next we recover it through optimization, preparing for models whose posterior is harder to calculate.

</div>

## 2. Variational inference and the ELBO

<div class="pgm-section-intro" markdown="1">

**Purpose.** Adjust a manageable temperature distribution toward the true posterior. This section builds the objective for choosing that distribution, before solving for its parameters.

</div>



### 2.1 Gaussian approximation

<div class="pgm-section-intro" markdown="1">

**Purpose.** Specify the adjustable answer: a Gaussian temperature estimate, with a mean for its center and a variance for uncertainty.

</div>

Keep the temperature model and obtain the posterior again through optimization. The analytic result provides a check.

For a given reading $x$, choose adjustable Gaussians to approximate the true posterior $p_\theta(z\mid x)$. Write the approximation as $q_\lambda(z\mid x)$ to retain its dependence on the current reading:

$$
q_\lambda(z\mid x)=\mathcal N(z\mid\mu,v),\qquad
v>0,\qquad \lambda=(\mu,\log v).
$$

The mean $\mu$ and variance $v$ control the candidate's center and width. Parameterizing with $\log v$ keeps the variance positive. These **variational parameters** $\lambda$ describe the temperature estimate for the current reading. The noise parameter $\theta$ belongs to the measurement model.

Measure the discrepancy from the true posterior using

$$
D_{\mathrm{KL}}\!\left(q_\lambda(z\mid x)\Vert p_\theta(z\mid x)\right)
=\mathbb E_{q_\lambda}\!\left[\log q_\lambda(Z\mid x)-\log p_\theta(Z\mid x)\right].
$$

KL divergence is nonnegative and vanishes when the candidate equals the posterior. **Variational inference (VI)** searches a chosen distribution family for an approximate posterior through optimization.

Direct evaluation of this KL still uses the true posterior, whose denominator is the observation's marginal likelihood $p_\theta(x)$. We next derive the ELBO to obtain an objective built from the joint density.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** VI searches a chosen distribution family. We adjust the approximate posterior for this reading while keeping the measurement noise fixed.

</div>

### 2.2 Evidence lower bound

<div class="pgm-section-intro" markdown="1">

**Purpose.** We need a score computed from the joint and approximate posterior. The ELBO supplies it; the lower-bound algebra is optional, while its target is stated below.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: Jensen inequality and the ELBO</summary>

Fix the reading $x$ and noise parameter $\theta$. Below, $q$ denotes the current approximate posterior, and $\mathbb E_q$ denotes expectation under that distribution conditional on the given $x$. The joint and the Gaussian approximation are positive everywhere, with finite relevant expectations. Multiply and divide by the same approximate posterior density inside the marginal likelihood integral from Section 1.2:

$$
\begin{aligned}
\log p_\theta(x)
&=\log\int p_\theta(x,z)\,dz\\
&=\log\int q(z\mid x)\frac{p_\theta(x,z)}{q(z\mid x)}\,dz\\
&=\log\mathbb E_q\!\left[\frac{p_\theta(x,Z)}{q(Z\mid x)}\right].
\end{aligned}
$$

The expectation $\mathbb E_q[f(Z)]$ denotes $\int q(z\mid x)f(z)\,dz$. This expression still integrates before taking the logarithm. Since the logarithm is concave, Jensen's inequality gives

$$
\begin{aligned}
\log p_\theta(x)
&\geq\mathbb E_q\!\left[\log\frac{p_\theta(x,Z)}{q(Z\mid x)}\right]\\
&=\mathbb E_q[\log p_\theta(x,Z)-\log q(Z\mid x)].
\end{aligned}
$$

Denote the right side by

</details>

The resulting objective is:

$$
\mathcal L(q,\theta;x)
=\mathbb E_q[\log p_\theta(x,Z)-\log q(Z\mid x)].
$$

This is the **evidence lower bound (ELBO)**, satisfying $\mathcal L(q,\theta;x)\leq\log p_\theta(x)$. Evidence is another name for the marginal likelihood $p_\theta(x)$; the ELBO bounds the **observation's log marginal likelihood**.

First integrate over the unknown temperature to obtain the Bayes denominator $p_\theta(x)$, then take its logarithm. The ELBO bounds that logarithm. Exponentiating the ELBO gives a lower bound on the denominator itself:

$$
\exp\!\left(\mathcal L(q,\theta;x)\right)
\leq p_\theta(x)=\int p_\theta(x,z)\,dz.
$$

The expression contains only the joint density, candidate distribution, and expectations under that candidate. All those expectations are analytic in this example. In a complex model we can instead choose an easily sampled $q$ and estimate its expectations.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The ELBO bounds log marginal likelihood from below. It avoids evaluating the true posterior or marginal likelihood, although its expectations still require calculation or estimation.

</div>

### 2.3 Posterior KL and the ELBO

<div class="pgm-section-intro" markdown="1">

**Purpose.** Connect the score to approximation quality and explain what an ELBO improvement means for the temperature estimate.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: expanding posterior KL</summary>

Substitute Bayes' rule into posterior KL and expand:

$$
\begin{aligned}
D_{\mathrm{KL}}\!\left(q(z\mid x)\Vert p_\theta(z\mid x)\right)
&=\int q(z\mid x)\log\frac{q(z\mid x)}{p_\theta(z\mid x)}\,dz\\
&=\int q(z\mid x)\left[\log q(z\mid x)-\log\frac{p_\theta(x,z)}{p_\theta(x)}\right]dz\\
&=\int q(z\mid x)[\log q(z\mid x)-\log p_\theta(x,z)]\,dz
+\int q(z\mid x)\log p_\theta(x)\,dz\\
&=-\mathcal L(q,\theta;x)+\log p_\theta(x).
\end{aligned}
$$

The first integral is the negative ELBO. In the second, $\log p_\theta(x)$ is constant with respect to $z$, so take it outside and use $\int q(z\mid x)\,dz=1$. Consequently,

</details>

Their relationship is:

$$
\boxed{\log p_\theta(x)=\mathcal L(q,\theta;x)
+D_{\mathrm{KL}}\!\left(q(z\mid x)\Vert p_\theta(z\mid x)\right).}
$$

For a fixed reading and measurement model, the left side is constant. Each ELBO increase reduces posterior KL by the same amount:

$$
\arg\max_\lambda\mathcal L(q_\lambda,\theta;x)
=\arg\min_\lambda D_{\mathrm{KL}}\!\left(q_\lambda(z\mid x)\Vert p_\theta(z\mid x)\right).
$$

Choosing the best approximate posterior does not require the constant's value. When marginal likelihood cannot be computed, the posterior KL value remains unknown, but the direction of improvement is determined by the ELBO.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** For fixed data and model, log marginal likelihood stays constant. Every ELBO increase reduces posterior KL by the same amount, making it a useful optimization objective.

</div>

### 2.4 ELBO decomposition

<div class="pgm-section-intro" markdown="1">

**Purpose.** Separate the ELBO into how well candidate temperatures explain the reading and how far their distribution departs from the prior.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: the two-term ELBO decomposition</summary>

Substitute the measurement factorization $p_\theta(x,z)=p(z)p_\theta(x\mid z)$:

$$
\begin{aligned}
\mathcal L(q,\theta;x)
&=\mathbb E_q[\log p_\theta(x\mid Z)+\log p(Z)-\log q(Z\mid x)]\\
&=\mathbb E_q[\log p_\theta(x\mid Z)]
-\mathbb E_q[\log q(Z\mid x)-\log p(Z)]\\
&=\mathbb E_q[\log p_\theta(x\mid Z)]
-D_{\mathrm{KL}}\!\left(q(z\mid x)\Vert p(z)\right).
\end{aligned}
$$

</details>

The two-term ELBO is:

$$
\mathcal L(q,\theta;x)=\mathbb E_q[\log p_\theta(x\mid Z)]-D_{\mathrm{KL}}(q(z\mid x)\Vert p(z)).
$$

The first term measures how well the candidate temperature distribution explains the 21 °C reading on average. The second measures departure from the historical temperature prior and has a minus sign. Together they form the same ELBO.

This **prior KL** has a different role from **posterior KL**. Posterior KL is the gap between the ELBO and log marginal likelihood; prior KL is one term inside the ELBO. The reading moves the posterior temperature mean from 20 °C toward 21 °C, so the optimal posterior generally departs from the prior. Posterior KL can vanish while prior KL remains positive.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Prior KL is part of the objective; posterior KL is the gap to log marginal likelihood. Matching the posterior does not require zero prior KL.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 2 summary.** The ELBO turns posterior approximation into optimization. For a fixed model, raising it reduces posterior KL. Next we calculate and optimize this objective.

</div>

## 3. Solving the Gaussian approximation

<div class="pgm-section-intro" markdown="1">

**Purpose.** Now optimize the Gaussian mean and variance: calculate the two objective terms, combine them, and solve for the optimum.

</div>



### 3.1 Expected conditional log likelihood

<div class="pgm-section-intro" markdown="1">

**Purpose.** Evaluate how well the approximate temperature distribution explains the reading on average, including both mean error and the spread of the estimate.

</div>

This section uses the conditional observation density $p_\theta(x\mid z)$ given an actual temperature difference $z$, and averages its logarithm under the approximate posterior. This expected conditional log likelihood differs from log marginal likelihood $\log p_\theta(x)$, which integrates out the unknown temperature. The conditional observation log density is

$$
\log p_\theta(x\mid z)
=-\frac12\log(2\pi\tau^2)-\frac{(x-z)^2}{2\tau^2}.
$$

<details class="pgm-derivation" markdown="1">
<summary>Derivation: expected squared error</summary>

Under $q(z\mid x)=\mathcal N(z\mid\mu,v)$, the mean is $\mathbb E_q Z=\mu$ and the variance is $\operatorname{Var}_q(Z\mid x)=v$. Decompose the error into mean error and random deviation:

$$
\begin{aligned}
\mathbb E_q[(x-Z)^2]
&=\mathbb E_q[((x-\mu)-(Z-\mu))^2]\\
&=(x-\mu)^2-2(x-\mu)\mathbb E_q[Z-\mu]
+\mathbb E_q[(Z-\mu)^2]\\
&=(x-\mu)^2+v.
\end{aligned}
$$

The middle term vanishes since $\mathbb E_q[Z-\mu]=0$, and the final term is the candidate variance. Thus

</details>

Expected conditional log likelihood is:

$$
\mathbb E_q[\log p_\theta(x\mid Z)]
=-\frac12\log(2\pi\tau^2)-\frac{(x-\mu)^2+v}{2\tau^2}.
$$

It depends both on the candidate mean's distance from the reading and on the candidate distribution's width.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Expected squared error is squared mean error plus candidate variance. The observation term therefore depends on both center and width.

</div>

### 3.2 Prior KL

<div class="pgm-section-intro" markdown="1">

**Purpose.** Calculate the departure of the approximate temperature distribution from the historical prior, giving the second ELBO term.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: Gaussian KL to the prior</summary>

Take expectations of the two Gaussian log densities:

$$
\begin{aligned}
\mathbb E_q[\log q(Z\mid x)]&=-\frac12\log(2\pi v)-\frac12,\\
\mathbb E_q[\log p(Z)]&=-\frac12\log(2\pi)-\frac12(\mu^2+v).
\end{aligned}
$$

The first line uses $\mathbb E_q[(Z-\mu)^2]/v=1$. The second uses $\mathbb E_q[Z^2]=\mu^2+v$. Subtracting gives

</details>

The result is:

$$
D_{\mathrm{KL}}\!\left(q(z\mid x)\Vert p(z)\right)
=\frac12(\mu^2+v-1-\log v).
$$

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Prior KL depends on both mean and variance. It is available analytically and is subtracted from expected conditional log likelihood.

</div>

### 3.3 Optimal mean and variance

<div class="pgm-section-intro" markdown="1">

**Purpose.** Combine the terms into a function of mean and variance and maximize it. Read the optimum directly or expand the derivative calculations.

</div>

Subtract prior KL from the expected conditional log likelihood to obtain the approximate temperature posterior objective:

$$
\begin{aligned}
\mathcal L(\mu,v;x)
&=-\frac12\log(2\pi\tau^2)\\
&\quad-\frac{(x-\mu)^2+v}{2\tau^2}
-\frac12(\mu^2+v-1-\log v).
\end{aligned}
$$

<details class="pgm-derivation" markdown="1">
<summary>Derivation: optimal mean and variance</summary>

The reading and noise scale are fixed; $\mu$ and $v$ are adjusted. Differentiate with respect to the mean and set the derivative to zero:

$$
\begin{aligned}
\frac{\partial\mathcal L}{\partial\mu}
&=\frac{x-\mu}{\tau^2}-\mu=0,\\
x-\mu&=\tau^2\mu,\\
\mu^\star&=\frac{x}{1+\tau^2}.
\end{aligned}
$$

Differentiate with respect to the variance:

$$
\begin{aligned}
\frac{\partial\mathcal L}{\partial v}
&=-\frac{1}{2\tau^2}-\frac12+\frac{1}{2v}=0,\\
\frac1v&=\frac1{\tau^2}+1,\\
v^\star&=\frac{\tau^2}{1+\tau^2}.
\end{aligned}
$$

The second derivatives are $-1/\tau^2-1$ and $-1/(2v^2)$, with zero mixed derivative, confirming a global maximum. This equals the Bayesian posterior in Section 1.3. The single-Gaussian candidate family contains the model's true posterior, so this variational optimization has no approximation error.

</details>

The optimal approximation has parameters:

$$
\mu^\star=\frac{x}{1+\tau^2},\qquad v^\star=\frac{\tau^2}{1+\tau^2}.
$$

{% include vae-explainer.html kind="elbo" %}

Fix $x=1$ and $\tau=0.6$. The initial candidate $q=\mathcal N(0,1)$ equals the temperature prior and has zero prior KL. Its ELBO is approximately $-3.1859$, log marginal likelihood is $-1.4403$, and posterior KL is $1.7456$.

Click “Match exact posterior.” The candidate mean becomes approximately 0.7353 and its standard deviation 0.5145. The ELBO reaches log marginal likelihood and posterior KL vanishes, while prior KL is about 0.5672. The figure controls standard deviation $\sigma=\sqrt v$.

For a nonlinear sensor response $X=f_\theta(Z)+\varepsilon$, the measurement model still defines a joint density, but the squared error contains $(x-f_\theta(z))^2$, and completing the square generally no longer yields the posterior. We can still construct the ELBO and optimize a candidate distribution. Its family may exclude the true posterior, and its expectations may require sampling estimates.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The optimum recovers the exact temperature posterior. More complex models can use the same objective but may need numerical optimization and may retain approximation error.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 3 summary.** The optimized parameters recover the exact posterior because it belongs to the family. Next we also learn the measurement noise parameter.

</div>

## 4. Estimating measurement noise

<div class="pgm-section-intro" markdown="1">

**Purpose.** Move from inferring temperature for one reading to learning the sensor noise from multiple independent measurements.

</div>



### 4.1 Marginal likelihood of multiple measurements

<div class="pgm-section-intro" markdown="1">

**Purpose.** Score all readings together: integrate out each unknown temperature and evaluate one shared noise parameter using their marginal likelihood.

</div>

We previously treated the noise standard deviation as known. Now keep the temperature prior for this type of room and estimate the noise variance $\theta=\tau^2$ from multiple measurements.

Take one reading in each of $N$ independent room states, giving $x_1,\ldots,x_N$. Each has its own true temperature difference $Z_i$ drawn from the same prior. Measurement noises are independent and share a parameter $\theta$:

$$
p_\theta(x_{1:N},z_{1:N})
=\prod_{i=1}^N p(z_i)p_\theta(x_i\mid z_i).
$$

Each reading $x_i$ is known while its actual temperature difference $z_i$ is unknown. Integrate out that unknown temperature to obtain the reading's marginal likelihood for the noise parameter $\theta$. Independence then gives the product for the full set of readings:

$$
\begin{aligned}
p_\theta(x_i)&=\int p(z_i)p_\theta(x_i\mid z_i)\,dz_i,\\
L_{\mathrm{marg}}(\theta;x_{1:N})&=\prod_{i=1}^N p_\theta(x_i).
\end{aligned}
$$

Hold the readings $x_{1:N}$ fixed and maximize this marginal likelihood to estimate noise. Its **log marginal likelihood** is

$$
\ell(\theta)=\log L_{\mathrm{marg}}(\theta;x_{1:N})
=\sum_{i=1}^N\log p_\theta(x_i).
$$

For each observed $x_i$, choose an **approximate posterior** $q_i(z_i\mid x_i)$ to approximate the **true posterior** $p_\theta(z_i\mid x_i)$. Each approximation is optimized separately and has ELBO $\mathcal L(q_i,\theta;x_i)$. Define their sum as

$$
\mathcal F(q,\theta)=\sum_{i=1}^N\mathcal L(q_i,\theta;x_i).
$$

Log marginal likelihood equals this ELBO sum plus the KL gaps between all approximate and true posteriors:

$$
\ell(\theta)=\mathcal F(q,\theta)
+\sum_{i=1}^N D_{\mathrm{KL}}\!\left(q_i(z_i\mid x_i)\Vert p_\theta(z_i\mid x_i)\right).
$$

Readings have different approximate posterior temperature means, while all measurements share the noise parameter. Inferring temperature adjusts each approximate posterior $q_i$ under the current model. Estimating noise adjusts the shared $\theta$ given those approximations.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Each observation has its own approximate posterior, while noise parameters are shared. Dataset ELBOs and posterior KL gaps both add over observations.

</div>

### 4.2 EM updates

<div class="pgm-section-intro" markdown="1">

**Purpose.** Alternate inference of actual temperatures under current noise and estimation of new noise from those distributions. Keep the update visible and expand its derivation or monotonicity proof when needed.

</div>

The true posterior is tractable in this example. In the E-step at iteration $t$, set $q_i^{(t)}$ equal to the true posterior under the current noise variance $\theta^{(t)}$:

$$
\begin{aligned}
q_i^{(t)}(z_i\mid x_i)&=p_{\theta^{(t)}}(z_i\mid x_i)\\
&=\mathcal N(z_i\mid m_i,v_i),\\
m_i&=\frac{x_i}{1+\theta^{(t)}},\qquad
v_i=\frac{\theta^{(t)}}{1+\theta^{(t)}}.
\end{aligned}
$$

<details class="pgm-derivation" markdown="1">
<summary>Derivation: the noise-variance M-step</summary>

This is the E-step. Hold these posteriors fixed and use them to estimate a new noise variance. The terms of the ELBO that involve the new $\theta$ are

$$
\mathcal F(q^{(t)},\theta)
=-\frac N2\log(2\pi\theta)
-\frac{1}{2\theta}\sum_{i=1}^N[(x_i-m_i)^2+v_i]+C.
$$

The constant $C$ collects prior and candidate-distribution terms independent of the new parameter. Differentiating,

$$
\begin{aligned}
\frac{\partial\mathcal F}{\partial\theta}
&=-\frac{N}{2\theta}
+\frac{1}{2\theta^2}\sum_{i=1}^N[(x_i-m_i)^2+v_i]=0,\\
\theta^{(t+1)}
&=\frac1N\sum_{i=1}^N[(x_i-m_i)^2+v_i].
\end{aligned}
$$

</details>

The noise variance update is:

$$
\theta^{(t+1)}=\frac1N\sum_{i=1}^N[(x_i-m_i)^2+v_i].
$$

The new noise variance is the posterior average squared error. The $v_i$ term accounts for uncertainty in the actual temperature. Using only $(x_i-m_i)^2$ would omit that uncertainty. This is the M-step.

<details class="pgm-derivation" markdown="1">
<summary>Proof: marginal likelihood monotonicity of exact EM</summary>

The exact E-step gives zero KL between approximate and true posteriors at the old parameters, making the ELBO sum equal to the observation log marginal likelihood there. Improving that bound in the M-step gives

$$
\begin{aligned}
\ell(\theta^{(t+1)})
&\geq\mathcal F(q^{(t)},\theta^{(t+1)})\\
&\geq\mathcal F(q^{(t)},\theta^{(t)})\\
&=\ell(\theta^{(t)}).
\end{aligned}
$$

The first line uses the lower bound at the new parameters. The second uses the M-step improvement, and the third the exact E-step equality. A restricted approximate posterior generally leaves a KL gap in the final line. Increasing the ELBO then does not generally guarantee monotonic improvement of observation log marginal likelihood. Alternating an approximate E-step with parameter learning is called variational EM.

</details>

An exact E-step and an improving M-step ensure nondecreasing log marginal likelihood; restricted posterior approximations generally do not.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Noise estimation includes remaining temperature uncertainty. Exact E-steps give nondecreasing log marginal likelihood here; restricted approximate posteriors generally remove that guarantee.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 4 summary.** EM alternates temperature inference and shared noise estimation. Exact posteriors support likelihood monotonicity; approximate posteriors require distinguishing bound improvement from likelihood improvement.

</div>

## 5. Unknown sensor bias and mean-field approximation

<div class="pgm-section-intro" markdown="1">

**Purpose.** Keep the same reading but allow uncertain calibration bias. Examine dependence between two latent variables and what an independent approximation misses.

</div>



### 5.1 Extended measurement model

<div class="pgm-section-intro" markdown="1">

**Purpose.** A high reading may reflect a warmer room or positive sensor bias. Infer both possible sources jointly.

</div>

Return to the single 21 °C reading. We previously assumed a calibrated thermometer. Now include uncertainty in its zero-point bias.

Let $B$ denote the bias, also in units of 1 °C, and give it an independent standard Gaussian prior. The measurement relation becomes

$$
Z\sim\mathcal N(0,1),\qquad B\sim\mathcal N(0,1),\qquad
X=Z+B+\varepsilon,
$$

where $\varepsilon\sim\mathcal N(0,\tau^2)$ and all three variables are independent before observation. Positive bias raises the reading. This section analyzes one measurement, jointly inferring true temperature difference $Z$ and sensor bias $B$ rather than treating the bias as known to be zero.

The observation distribution and joint density are

$$
p_\theta(x\mid z,b)=\mathcal N(x\mid z+b,\tau^2),\qquad
p_\theta(x,z,b)=p(z)p(b)p_\theta(x\mid z,b).
$$

The same high reading can be explained by a high actual temperature or a positive bias. Once the reading is fixed, an increase in either variable can be offset by a decrease in the other. Their posterior is therefore correlated despite their independent priors.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The model adds uncertain bias, while the reading constrains the sum of bias and temperature difference. Conditioning therefore couples the variables.

</div>

### 5.2 Bivariate posterior

<div class="pgm-section-intro" markdown="1">

**Purpose.** Calculate the exact joint posterior as a reference for mean-field. Matrix calculations are optional; the result and interpretation stay visible.

</div>

Combining the three Gaussian exponents gives

$$
\log p_\theta(z,b\mid x)
=-\frac12\left[z^2+b^2+\frac{(x-z-b)^2}{\tau^2}\right]+C.
$$

<details class="pgm-derivation" markdown="1">
<summary>Derivation: the joint temperature–bias posterior</summary>

Here $C$ is independent of $z,b$. Expand the square:

$$
\begin{aligned}
z^2+b^2+\frac{(x-z-b)^2}{\tau^2}
&=\left(1+\frac1{\tau^2}\right)(z^2+b^2)
+\frac{2zb}{\tau^2}\\
&\quad-\frac{2x(z+b)}{\tau^2}+\frac{x^2}{\tau^2}.
\end{aligned}
$$

The term $x^2/\tau^2$ is constant. Put the square and cross-term coefficients in a matrix and the linear coefficients in a vector:

$$
\begin{aligned}
y&=\begin{pmatrix}z\\b\end{pmatrix},\qquad
\Lambda=\begin{pmatrix}1+1/\tau^2&1/\tau^2\\1/\tau^2&1+1/\tau^2\end{pmatrix},\\
h&=\frac{x}{\tau^2}\begin{pmatrix}1\\1\end{pmatrix},\qquad
\log p_\theta(y\mid x)=-\frac12y^\top\Lambda y+h^\top y+C.
\end{aligned}
$$

The matrix $\Lambda$ is the posterior precision, the inverse covariance. Set $m=\Lambda^{-1}h$ and complete the quadratic:

$$
-\frac12y^\top\Lambda y+h^\top y
=-\frac12(y-m)^\top\Lambda(y-m)+\frac12m^\top\Lambda m.
$$

The final term is independent of $y$. For the two-by-two matrix inverse, first calculate the determinant:

$$
\det\Lambda
=\left(1+\frac1{\tau^2}\right)^2-\frac1{\tau^4}
=1+\frac2{\tau^2}.
$$

Swap the diagonal entries, negate the off-diagonal entries, and divide by the determinant to obtain the covariance. Multiplying it by $h$ gives the mean:

</details>

The exact joint posterior covariance and mean are:

$$
\Sigma=\Lambda^{-1}
=\frac1{2+\tau^2}\begin{pmatrix}1+\tau^2&-1\\-1&1+\tau^2\end{pmatrix},\qquad
m=\frac{x}{2+\tau^2}\begin{pmatrix}1\\1\end{pmatrix}.
$$

Thus $p_\theta(z,b\mid x)=\mathcal N(y\mid m,\Sigma)$. Each marginal variance is $(1+\tau^2)/(2+\tau^2)$, covariance is $-1/(2+\tau^2)$, and correlation is $-1/(1+\tau^2)$.

With $x=1$ and $\tau=0.6$, both posterior means are approximately 0.4237, each marginal variance is 0.5763, and correlation is $-0.7353$. Some of the high reading can now be attributed to bias. The estimated temperature moves back to about 20.4237 °C, with more uncertainty than when bias was known to be zero.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Bias explains part of the reading, moving the temperature estimate toward the prior mean with greater uncertainty. Negative correlation records the tradeoff between explanations.

</div>

### 5.3 Factorized approximation

<div class="pgm-section-intro" markdown="1">

**Purpose.** Choose a simpler answer: separate Gaussians for temperature and bias, without correlation in the approximation.

</div>

Approximate this joint posterior by a product of univariate Gaussians:

$$
q(z,b\mid x)=q_z(z\mid x)q_b(b\mid x),\qquad
q_z=\mathcal N(\mu_z,v_z),\qquad q_b=\mathcal N(\mu_b,v_b).
$$

This is a **mean-field** approximation. It requires temperature and bias to be independent inside the approximation, excluding the negative correlation just derived. The measurement model remains the same; the approximate posterior family is restricted.

Maximize the ELBO within this family by holding $q_b$ fixed while updating $q_z$, then updating $q_b$ using the new $q_z$. Each step optimizes one complete factor.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Mean-field restricts the approximate posterior, not the measurement model. It simplifies computation while excluding correlated answers.

</div>

### 5.4 Coordinate updates

<div class="pgm-section-intro" markdown="1">

**Purpose.** Alternate two estimates: subtract current bias to infer temperature, then use current temperature to infer bias. The update and fixed point are visible without the derivation.

</div>

<details class="pgm-derivation" markdown="1">
<summary>Derivation: mean-field coordinate updates</summary>

Fix $q_b$ first. The ELBO terms involving $q_z$ can be written as

$$
\mathcal L(q_z)
=\int q_z(z\mid x)A(z)\,dz-\int q_z(z\mid x)\log q_z(z\mid x)\,dz+C,
\qquad
A(z)=\mathbb E_{q_b}[\log p_\theta(x,z,B)].
$$

The expectation averages over bias $B$ while retaining $z$ as a variable. Define $r(z)=\exp(A(z))/K$, with $K=\int\exp(A(u))\,du$. The expression becomes

$$
\mathcal L(q_z)=-D_{\mathrm{KL}}(q_z\Vert r)+\log K+C.
$$

Neither $K$ nor $C$ depends on the candidate $q_z$, so the optimal update is $q_z=r$. In this model, $r$ is Gaussian and belongs to our factor family.

To calculate it, substitute the joint into $A(z)$. Write $\mathbb E_{q_b}B=\mu_b$ and $\operatorname{Var}_{q_b}(B)=v_b$:

$$
\mathbb E_{q_b}[(x-z-B)^2]=(x-z-\mu_b)^2+v_b.
$$

Both $v_b$ and $\mathbb E_{q_b}[B^2]$ are independent of $z$ and enter the constant. Keep the terms depending on $z$ and expand:

$$
\begin{aligned}
A(z)&=-\frac12z^2-\frac{(x-z-\mu_b)^2}{2\tau^2}+C\\
&=-\frac12\left(1+\frac1{\tau^2}\right)z^2
+\frac{x-\mu_b}{\tau^2}z+C.
\end{aligned}
$$

Comparing with the univariate Gaussian quadratic identifies the updated mean and variance:

$$
q_z^{\mathrm{new}}(z\mid x)
=\mathcal N\!\left(z\mid\frac{x-\mu_b}{1+\tau^2},\frac{\tau^2}{1+\tau^2}\right).
$$

The temperature estimate uses the reading after subtracting the current mean bias. Exchanging the variables gives the bias update:

</details>

The alternating factor updates are:

$$
\mu_z^{\mathrm{new}}=\frac{x-\mu_b}{1+\tau^2},\qquad
\mu_b^{\mathrm{new}}=\frac{x-\mu_z^{\mathrm{new}}}{1+\tau^2},\qquad
v_z=v_b=\frac{\tau^2}{1+\tau^2}.
$$

Alternate the mean updates. At convergence, $\mu_z=(x-\mu_b)/(1+\tau^2)$ and $\mu_b=(x-\mu_z)/(1+\tau^2)$ both hold. Subtraction gives $\tau^2(\mu_z-\mu_b)=0$, so the means agree. Substituting back yields

$$
\mu_z^\star=\mu_b^\star=\frac{x}{2+\tau^2},\qquad
v_z^\star=v_b^\star=\frac{\tau^2}{1+\tau^2}.
$$

Direct differentiation of the Gaussian candidate ELBO gives the same result. The mean objective is a strictly concave quadratic and each variance objective is strictly concave, so these coordinate updates converge to the unique optimum within this family.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** The updates find the optimum within the independent Gaussian family. That optimum need not equal the true posterior; next compare their uncertainty.

</div>

### 5.5 Approximation error and KL direction

<div class="pgm-section-intro" markdown="1">

**Purpose.** Compare the optimized approximation with the exact answer, separating incomplete optimization from limitations of the distribution family.

</div>

The optimal mean-field approximation retains the true posterior mean but changes its variance. At $\tau=0.6$, the true temperature marginal variance is approximately 0.5763, while the approximation's is only 0.2647. Even complete optimization cannot recover temperature–bias correlation inside this factorized family.

{% include vae-explainer.html kind="sensor" %}

Blue ellipses show exact joint-posterior density contours; orange dashed contours show the independent Gaussian approximation. Switch to “Temperature marginal” to compare widths at the same mean. Changing observation noise changes both posterior correlation and approximation error.

We optimize $D_{\mathrm{KL}}(q\Vert p_\theta(\cdot\mid x))$, whose expectation is under the candidate $q$. Giving an independent approximation the same marginal widths as the posterior spreads more probability into low-posterior-density regions outside the tilted ellipse. This KL direction chooses narrower marginals.

The reverse KL matches true marginal variances within independent Gaussians. It still loses correlation and differs from the optimum of the current ELBO.

<details class="pgm-derivation" markdown="1">
<summary>Calculation: optimal variance under reverse KL</summary>

In the opposite direction, $D_{\mathrm{KL}}(p_\theta(\cdot\mid x)\Vert q)$, the expectation is under the true posterior. For a candidate factor variance $v$, the relevant objective is $\tfrac12(\log v+s/v)$, with $s$ the true marginal variance. Differentiation gives $(v-s)/(2v^2)=0$ and therefore $v=s$. The figure's “Match true marginals” option shows this width. It still loses correlation and is no longer the optimum of our original ELBO.

</details>

Variance error also depends on direction. Under the true posterior, $Z+B$ has variance approximately 0.3051. The optimal independent approximation gives approximately 0.5294. It underestimates the individual marginal variances while overestimating variance of their sum. The reading constrains the sum of temperature and bias; discarding negative correlation loses part of that constraint.

From a calibrated thermometer to one with uncertain bias, variational inference optimizes a candidate posterior under a fixed measurement model. The model determines the target, the candidate family determines which approximations are possible, and the ELBO supplies the optimization objective. [Neural Networks as Probability Models]({{ '/en/neural-probability-models/' | relative_url }}) develops more flexible observation relations. Sampling, reparameterization, and amortized inference then address computing and sharing this optimization.

<div class="pgm-section-summary" markdown="1">

**Takeaway.** Means can match while correlation is lost. Individual variances are too small but variance of the sum is too large, so uncertainty cannot be assessed from one number alone.

</div>

<div class="pgm-section-wrapup" markdown="1">

**Section 5 summary.** Temperature and bias compensate for each other, producing negative posterior correlation. Mean-field cannot represent it and changes uncertainty even at its optimum.

</div>

## 6. Notation

| Symbol | Meaning |
| --- | --- |
| $T$ / $R$ | Actual room temperature / thermometer reading |
| $Z$ / $X$ | Actual / observed temperature difference relative to 20 °C, in units of 1 °C |
| $B$ | Unknown sensor bias introduced in Section 5, also in units of 1 °C |
| $\tau$ / $\theta$ | Observation-noise standard deviation / variance, $\theta=\tau^2$ |
| $p_\theta(x\mid z)$ | Conditional observation density given the actual temperature |
| $p_\theta(x)$ | Reading density after integrating out temperature; as a function of parameters for fixed data, marginal likelihood (also called model evidence) |
| $p_\theta(z\mid x)$ | True temperature posterior given the reading |
| $L_{\mathrm{marg}}$ / $\ell$ | Dataset marginal likelihood / log marginal likelihood |
| $\mathcal F(q,\theta)$ | Sum of the per-reading ELBOs |
| $q_\lambda$ / $\lambda$ | Candidate posterior approximation / variational parameters |
| $\mu$ / $v$ / $\sigma$ | Candidate mean / variance / standard deviation, $v=\sigma^2$ |
| $q_zq_b$ | Mean-field approximation making temperature and bias independent |
| $m$ / $\Sigma$ / $\Lambda$ | Bivariate posterior mean / covariance / precision, $\Lambda=\Sigma^{-1}$ |
| ELBO / VI / EM | Evidence lower bound / variational inference / expectation–maximization |

## 7. References

1. **Christopher M. Bishop, 2006.** [*Pattern Recognition and Machine Learning*](https://link.springer.com/book/9780387310732), §10.1, printed pp. 462–469. Variational decomposition, mean-field updates, and the correlated-Gaussian example.
2. **David M. Blei, Alp Kucukelbir, and Jon D. McAuliffe, 2017.** [*Variational Inference: A Review for Statisticians*](https://arxiv.org/abs/1601.00670). The optimization perspective and approximation families.
3. **Radford M. Neal and Geoffrey E. Hinton, 1998.** [*A View of the EM Algorithm that Justifies Incremental, Sparse, and Other Variants*](https://www.cs.toronto.edu/~hinton/absps/emk.pdf). EM as optimization over distributions and parameters.

**Sources and corrections.** This article reorganizes and derives the ideas from the course's EM material and the references above. The interactive teaching example is independently implemented; textbook illustrations are not reproduced. Rights to the original materials remain with their authors or publishers. Corrections to formulas, terminology, and interpretation are welcome.
