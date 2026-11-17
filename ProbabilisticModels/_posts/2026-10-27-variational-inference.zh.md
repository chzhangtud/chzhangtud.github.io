---
title: "从隐变量模型到变分推断"
date: 2026-10-27
lang: zh
permalink: /zh/variational-inference/
en_link: /en/variational-inference/
series: generative-models
series_order: 1
categories: [Probabilistic Models]
tags: [Variational Inference, Graphical Models, ELBO]
classes: statistics-article
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "以温度测量为例，推导后验分布、ELBO 与变分优化，再用噪声估计和未知零点偏差说明 EM、平均场近似及其误差。"
---

{% include vae-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

房间里的温度计显示 21 ℃。根据历史记录，这类房间的温度通常在 20 ℃ 附近，标准差约为 1 ℃；温度计已经校准，但读数仍带有标准差为 0.6 ℃ 的随机噪声。我们希望根据这次读数，估计房间的真实温度，同时保留估计的不确定性。

下面把这个测量过程写成概率模型，分别用贝叶斯公式和变分优化求出温度的后验分布。随后，仍使用这个测量模型估计噪声，并在传感器存在未知零点偏差时推导平均场近似。所有数值都是教学设定，不是实际传感器的测量数据。

本文用到[概率统计基础]({{ '/zh/probability-statistics/' | relative_url }})中的条件概率、期望和 KL 散度。[概率密度估计]({{ '/zh/density-estimation/' | relative_url }})介绍过的 EM 会在第 4 节重新推导。所有对数均为自然对数。


<div class="pgm-reading-guide" markdown="1">

**阅读方式。** 可以先读每节的思路、主要结果和小结，再按需展开推导或代码。交互图保留在正文中，跳过计算细节也能继续阅读。

</div>

---

## 1. 温度测量模型

<div class="pgm-section-intro" markdown="1">

**思路。** 先把温度计读数、真实温度和测量噪声分开，写出它们之间的关系，再根据一次读数更新温度估计。

</div>



### 1.1 先验与观测噪声

<div class="pgm-section-intro" markdown="1">

**思路。** 这一小节只建立测量模型：真实温度先有一个可能范围，读数是在真实温度上再叠加噪声得到的。

</div>

设房间的真实温度为 $T$，温度计读数为 $R$。以 20 ℃ 为基准、1 ℃ 为单位，记真实温差为 $Z$，读数温差为 $X$：

$$
Z=\frac{T-20\,{}^\circ\mathrm C}{1\,{}^\circ\mathrm C},
\qquad
X=\frac{R-20\,{}^\circ\mathrm C}{1\,{}^\circ\mathrm C}.
$$

这样，21 ℃ 的读数对应 $x=1$。真实温度没有被直接观测，所以 $Z$ 是这个模型中的**隐变量**；$X$ 是观测变量。

把历史温度分布建模为标准高斯，并假设测量噪声独立于真实温度：

$$
Z\sim\mathcal N(0,1),\qquad
\varepsilon\sim\mathcal N(0,\tau^2),\qquad
X=Z+\varepsilon.
$$

其中 $\tau>0$ 是噪声标准差，初始设定为 0.6。给定一个真实温差 $z$，读数就在它附近波动，因此

$$
p(z)=\mathcal N(z\mid0,1),\qquad
p_\theta(x\mid z)=\mathcal N(x\mid z,\tau^2),
\qquad \theta=\tau^2.
$$

第一项是看读数以前的**先验密度**，第二项是给定真实温度时读数的**条件观测密度**。$\theta$ 是生成模型的参数；前面先把它固定，第 4 节再估计它。

两项相乘得到联合密度：

$$
p_\theta(x,z)=p(z)p_\theta(x\mid z).
$$

有向图 $Z\to X$ 表示这个分解：模型先给真实温度分配概率，再给相应读数分配条件概率。图中的箭头描述生成模型的分解方式。

<div class="pgm-section-summary" markdown="1">

**小结。** 先验描述测量前的温度范围，条件观测密度描述温度给定后读数如何波动。二者相乘得到联合密度，后续推断都从这个模型出发。

</div>

### 1.2 温度的后验分布

<div class="pgm-section-intro" markdown="1">

**思路。** 现在读数已经知道，目标是重新给各种真实温度分配权重：既参考历史温度，也检查它能否解释这次读数。

</div>

读数 $x=1$ 给温度估计增加了信息。对每个候选温差 $z$，联合密度 $p(z)p_\theta(1\mid z)$ 同时考虑它在历史上是否常见，以及它产生当前读数的可能性。

将这些权重对所有温差积分，得到观测的边缘密度：

$$
p_\theta(x)=\int p(z)p_\theta(x\mid z)\,dz.
$$

这个积分把未知真实温度 $z$ 的所有可能取值都考虑进来，得到读数 $x$ 的**边缘密度**。对于已经看到的读数，将 $x$ 固定、把 $p_\theta(x)$ 看作噪声参数 $\theta$ 的函数，就称为观测的**边缘似然**（marginal likelihood）。例如读数为 21 ℃ 时，它表示不同噪声设定在综合所有可能真实温度后，对这次读数给出的密度。

用这个总权重归一化，得到已知读数后的真实温度分布，即**真实后验**：

$$
p_\theta(z\mid x)
=\frac{p(z)p_\theta(x\mid z)}{p_\theta(x)}.
$$

分母对给定的 $x$ 是一个常数，它使后验对 $z$ 的积分等于 1：

$$
\int p_\theta(z\mid x)\,dz
=\frac{\int p(z)p_\theta(x\mid z)\,dz}{p_\theta(x)}=1.
$$

计算一个候选温度处的联合密度，只涉及两个密度值相乘；计算观测的边缘似然则需要对整个温度范围积分。在本篇的一维高斯模型中，这个积分有解析解。对于更复杂的传感器响应或高维隐变量，联合密度仍可能容易计算，边缘似然所需的积分却可能难以处理。这是后面用变分方法近似真实后验的出发点。

<div class="pgm-section-summary" markdown="1">

**小结。** 把未知温度积分掉得到读数的边缘似然；用它归一化联合密度，得到真实温度的后验。困难可能出在这个积分，而不在单个温度处的密度计算。

</div>

### 1.3 高斯后验的解析解

<div class="pgm-section-intro" markdown="1">

**思路。** 先解出这个简单模型的准确答案，作为后面检查变分优化的标准。配方细节可以展开查看，后验结果与温度解释保留在正文。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：高斯后验的配方</summary>

在当前模型中，先验和观测分布都是高斯。固定读数 $x$，把两项的指数合并：

$$
\begin{aligned}
p_\theta(z\mid x)
&\propto p(z)p_\theta(x\mid z)\\
&\propto\exp\!\left[-\frac12\left(z^2+\frac{(x-z)^2}{\tau^2}\right)\right].
\end{aligned}
$$

这里的 $\propto$ 暂时将与 $z$ 无关的系数留在归一化常数里。对指数中的二次项展开并配方：

$$
\begin{aligned}
z^2+\frac{(x-z)^2}{\tau^2}
&=\frac{1+\tau^2}{\tau^2}z^2-\frac{2x}{\tau^2}z+\frac{x^2}{\tau^2}\\
&=\frac{1+\tau^2}{\tau^2}
\left(z-\frac{x}{1+\tau^2}\right)^2+\frac{x^2}{1+\tau^2}.
\end{aligned}
$$

最后一项与 $z$ 无关。将剩余部分与高斯密度的指数 $-(z-m)^2/(2v)$ 对照，得到

</details>

所得温度后验为：

$$
p_\theta(z\mid x)
=\mathcal N\!\left(z\mid\frac{x}{1+\tau^2},\frac{\tau^2}{1+\tau^2}\right).
$$

同时，$X$ 是两个独立高斯变量之和，均值相加、方差相加，所以

$$
p_\theta(x)=\mathcal N(x\mid0,1+\tau^2).
$$

代入 $x=1$、$\tau=0.6$，后验均值约为 0.7353，方差约为 0.2647，标准差约为 0.5145。换回温度单位，真实温度的后验均值约为 20.7353 ℃，标准差约为 0.5145 ℃。

估计结果在历史均值 20 ℃ 与读数 21 ℃ 之间。观测噪声越小，读数对后验的影响越大；噪声较大时，后验会保留更多先验信息。

{% include vae-explainer.html kind="bayes" %}

图中的 $z$ 和 $x$ 都是相对 20 ℃ 的温差。依次显示先验密度、条件观测密度、联合密度与真实后验，可以看到上述计算的各项。条件观测密度曲线将读数 $x$ 固定，横轴取 $z$；它是候选温度的权重函数，并不要求对 $z$ 积分为 1。

<div class="pgm-section-summary" markdown="1">

**小结。** 21 ℃ 的读数给出约 20.7353 ℃ 的后验均值，标准差约为 0.5145 ℃。读数与历史信息共同影响估计，结果还保留了温度的不确定性。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 1 节小结。** 现在得到的是给定读数后真实温度的分布，既有估计值，也有不确定性。下面用优化再求一次这个分布，为更难计算的模型准备方法。

</div>

## 2. 变分推断与 ELBO

<div class="pgm-section-intro" markdown="1">

**思路。** 接下来调整一个容易处理的温度分布，让它接近真实后验。这里建立评价候选分布的目标，暂时不计算最优参数。

</div>



### 2.1 高斯近似

<div class="pgm-section-intro" markdown="1">

**思路。** 先规定能调整的答案长什么样：用一个高斯分布表示温度估计，均值控制中心，方差控制不确定性。

</div>

保留温度测量模型，再用优化求一次后验。已有的解析解可以用来检验结果。

对给定读数 $x$，选择一族可调的高斯分布，近似真实后验 $p_\theta(z\mid x)$。记作 $q_\lambda(z\mid x)$，保留它对当前读数的依赖：

$$
q_\lambda(z\mid x)=\mathcal N(z\mid\mu,v),\qquad
v>0,\qquad \lambda=(\mu,\log v).
$$

$\mu$ 和 $v$ 分别控制候选分布的中心与宽度。用 $\log v$ 参数化，可以保证方差 $v$ 为正。这组**变分参数** $\lambda$ 属于当前读数的温度估计；噪声参数 $\theta$ 则属于测量模型。

衡量候选分布与真实后验之间的差异，可以使用

$$
D_{\mathrm{KL}}\!\left(q_\lambda(z\mid x)\Vert p_\theta(z\mid x)\right)
=\mathbb E_{q_\lambda}\!\left[\log q_\lambda(Z\mid x)-\log p_\theta(Z\mid x)\right].
$$

KL 散度非负，候选分布与后验一致时为零。**变分推断**（variational inference，VI）就是在选定的分布族内，通过优化寻找近似后验。

直接计算这个 KL 仍然要用真实后验，而真实后验的分母是观测的边缘似然 $p_\theta(x)$。为得到可以从联合密度构造的目标，下面推导 ELBO。

<div class="pgm-section-summary" markdown="1">

**小结。** 变分推断在选定的分布族中找答案。这里调整的是当前读数的近似后验参数，测量模型的噪声参数保持不变。

</div>

### 2.2 证据下界

<div class="pgm-section-intro" markdown="1">

**思路。** 需要一个能用联合密度和近似后验计算的评分。下面给出 ELBO；构造下界的代数放在折叠区，先读它界住什么即可。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：Jensen 不等式与 ELBO</summary>

固定读数 $x$ 和噪声参数 $\theta$。以下用 $q$ 表示当前的近似后验，$\mathbb E_q$ 表示在这个给定 $x$ 的分布下取期望。当前模型的联合密度与高斯近似都处处为正，相关期望有限。在第 1.2 节计算边缘似然的积分中，乘除同一个近似后验密度，有

$$
\begin{aligned}
\log p_\theta(x)
&=\log\int p_\theta(x,z)\,dz\\
&=\log\int q(z\mid x)\frac{p_\theta(x,z)}{q(z\mid x)}\,dz\\
&=\log\mathbb E_q\!\left[\frac{p_\theta(x,Z)}{q(Z\mid x)}\right].
\end{aligned}
$$

期望 $\mathbb E_q[f(Z)]$ 表示积分 $\int q(z\mid x)f(z)\,dz$。上式仍然先积分、再取对数。由于对数函数是凹函数，Jensen 不等式给出

$$
\begin{aligned}
\log p_\theta(x)
&\geq\mathbb E_q\!\left[\log\frac{p_\theta(x,Z)}{q(Z\mid x)}\right]\\
&=\mathbb E_q[\log p_\theta(x,Z)-\log q(Z\mid x)].
\end{aligned}
$$

将右边记为

</details>

得到的目标函数为：

$$
\mathcal L(q,\theta;x)
=\mathbb E_q[\log p_\theta(x,Z)-\log q(Z\mid x)].
$$

它称为**证据下界**（evidence lower bound，ELBO），满足 $\mathcal L(q,\theta;x)\leq\log p_\theta(x)$。“证据”是边缘似然 $p_\theta(x)$ 的另一个名称，ELBO 实际给出的是**观测的边缘对数似然的下界**。

这里先对未知温度积分，得到贝叶斯公式的分母 $p_\theta(x)$，然后再取对数。ELBO 界住的是这个对数；将 ELBO 指数化，才得到分母本身的下界：

$$
\exp\!\left(\mathcal L(q,\theta;x)\right)
\leq p_\theta(x)=\int p_\theta(x,z)\,dz.
$$

ELBO 的表达式中只保留了联合密度、候选分布以及候选分布下的期望。本例中的这些期望都能解析计算；复杂模型中也可以选择容易采样的 $q$，再估计期望。

<div class="pgm-section-summary" markdown="1">

**小结。** ELBO 是边缘对数似然的下界。它本身不需要先算出真实后验或边缘似然，但其中的期望仍需解析计算或采样估计。

</div>

### 2.3 后验 KL 与 ELBO

<div class="pgm-section-intro" markdown="1">

**思路。** 这一节把评分与近似质量联系起来，说明提高 ELBO 对温度估计意味着什么。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：后验 KL 的展开</summary>

将贝叶斯公式代入后验 KL，逐项展开：

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

第一项是负的 ELBO。第二项中的 $\log p_\theta(x)$ 与积分变量 $z$ 无关，可以提出积分号，再用 $\int q(z\mid x)\,dz=1$。因此

</details>

二者的关系为：

$$
\boxed{\log p_\theta(x)=\mathcal L(q,\theta;x)
+D_{\mathrm{KL}}\!\left(q(z\mid x)\Vert p_\theta(z\mid x)\right).}
$$

固定温度读数和测量模型后，左边是常数。ELBO 每提高多少，后验 KL 就减少多少，所以

$$
\arg\max_\lambda\mathcal L(q_\lambda,\theta;x)
=\arg\min_\lambda D_{\mathrm{KL}}\!\left(q_\lambda(z\mid x)\Vert p_\theta(z\mid x)\right).
$$

选择最优近似后验不需要知道这个常数的数值。对于无法计算边缘似然的模型，后验 KL 的具体数值仍然未知，但 ELBO 的改进方向已经确定。

<div class="pgm-section-summary" markdown="1">

**小结。** 模型和读数固定后，边缘对数似然不动。ELBO 增加多少，近似后验到真实后验的 KL 就减少多少，因此可以用 ELBO 指导优化。

</div>

### 2.4 ELBO 的分解

<div class="pgm-section-intro" markdown="1">

**思路。** 把 ELBO 拆成两项，分别观察候选温度能否解释读数，以及它相对历史温度范围偏离了多少。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：ELBO 的两项分解</summary>

把测量模型的分解 $p_\theta(x,z)=p(z)p_\theta(x\mid z)$ 代入：

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

ELBO 可以写成两项：

$$
\mathcal L(q,\theta;x)=\mathbb E_q[\log p_\theta(x\mid Z)]-D_{\mathrm{KL}}(q(z\mid x)\Vert p(z)).
$$

第一项检查候选温度分布平均能多好地解释 21 ℃ 的读数。第二项衡量候选分布偏离历史温度先验的程度，并带着负号。它们共同构成同一个 ELBO。

这里的**先验 KL** 与上一节的**后验 KL** 有不同的作用。后验 KL 是 ELBO 与边缘对数似然的差距；先验 KL 是 ELBO 中的一项。当前读数使温度后验的均值从 20 ℃ 移向 21 ℃，因此最优后验通常会偏离先验。后验 KL 降至零时，先验 KL 仍然可以为正。

<div class="pgm-section-summary" markdown="1">

**小结。** 先验 KL 是训练目标中的一项；后验 KL 是下界与边缘对数似然之间的差距。两者不能互换，后验匹配准确也不要求先验 KL 为零。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 2 节小结。** ELBO 把近似后验的选择写成了优化问题。模型固定时，提高 ELBO 就会缩小到真实后验的 KL 差距；下一节计算这个目标并求最优参数。

</div>

## 3. 高斯近似的求解

<div class="pgm-section-intro" markdown="1">

**思路。** 有了评分函数，现在实际调整高斯近似的均值和方差。先计算两项，再把它们合起来求最优值。

</div>



### 3.1 期望条件对数似然

<div class="pgm-section-intro" markdown="1">

**思路。** 检查近似温度分布对这次读数的平均解释能力。计算时既要考虑均值的误差，也要考虑温度估计自身的分散程度。

</div>

本节使用给定真实温差 $z$ 时的条件观测密度 $p_\theta(x\mid z)$，对它的对数在近似后验下取期望。这个期望条件对数似然，与对未知温差积分得到的边缘对数似然 $\log p_\theta(x)$ 是不同的量。条件观测密度的对数为

$$
\log p_\theta(x\mid z)
=-\frac12\log(2\pi\tau^2)-\frac{(x-z)^2}{2\tau^2}.
$$

<details class="pgm-derivation" markdown="1">
<summary>推导：平方误差的期望</summary>

在候选分布 $q(z\mid x)=\mathcal N(z\mid\mu,v)$ 下，$\mathbb E_q Z=\mu$、$\operatorname{Var}_q(Z\mid x)=v$。把误差分成均值误差与随机偏离，得到

$$
\begin{aligned}
\mathbb E_q[(x-Z)^2]
&=\mathbb E_q[((x-\mu)-(Z-\mu))^2]\\
&=(x-\mu)^2-2(x-\mu)\mathbb E_q[Z-\mu]
+\mathbb E_q[(Z-\mu)^2]\\
&=(x-\mu)^2+v.
\end{aligned}
$$

中间项因 $\mathbb E_q[Z-\mu]=0$ 而消失，最后一项就是候选方差。因此

</details>

期望条件对数似然为：

$$
\mathbb E_q[\log p_\theta(x\mid Z)]
=-\frac12\log(2\pi\tau^2)-\frac{(x-\mu)^2+v}{2\tau^2}.
$$

它既取决于候选均值离读数有多远，也取决于候选分布自身有多宽。

<div class="pgm-section-summary" markdown="1">

**小结。** 平均平方误差等于均值误差的平方再加上候选方差。因此重建这一项会同时受到估计中心和宽度的影响。

</div>

### 3.2 先验 KL

<div class="pgm-section-intro" markdown="1">

**思路。** 计算近似温度分布偏离历史先验的程度，得到 ELBO 的第二项。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：高斯近似与先验的 KL</summary>

由两个高斯密度的对数，分别取期望：

$$
\begin{aligned}
\mathbb E_q[\log q(Z\mid x)]&=-\frac12\log(2\pi v)-\frac12,\\
\mathbb E_q[\log p(Z)]&=-\frac12\log(2\pi)-\frac12(\mu^2+v).
\end{aligned}
$$

第一行用了 $\mathbb E_q[(Z-\mu)^2]/v=1$；第二行用了 $\mathbb E_q[Z^2]=\mu^2+v$。两行相减就是

</details>

计算结果为：

$$
D_{\mathrm{KL}}\!\left(q(z\mid x)\Vert p(z)\right)
=\frac12(\mu^2+v-1-\log v).
$$

<div class="pgm-section-summary" markdown="1">

**小结。** 先验 KL 同时取决于均值和方差。它可以直接计算，随后从期望条件对数似然中减去。

</div>

### 3.3 最优均值与方差

<div class="pgm-section-intro" markdown="1">

**思路。** 将两项合成一个关于均值、方差的函数，然后寻找评分最高的位置。先看最优值，需要核对求导时再展开。

</div>

将期望条件对数似然减去先验 KL，得到近似温度后验的优化目标：

$$
\begin{aligned}
\mathcal L(\mu,v;x)
&=-\frac12\log(2\pi\tau^2)\\
&\quad-\frac{(x-\mu)^2+v}{2\tau^2}
-\frac12(\mu^2+v-1-\log v).
\end{aligned}
$$

<details class="pgm-derivation" markdown="1">
<summary>推导：均值和方差的最优条件</summary>

$x$ 与 $\tau$ 固定，待调整的是 $\mu,v$。对均值求导并令导数为零：

$$
\begin{aligned}
\frac{\partial\mathcal L}{\partial\mu}
&=\frac{x-\mu}{\tau^2}-\mu=0,\\
x-\mu&=\tau^2\mu,\\
\mu^\star&=\frac{x}{1+\tau^2}.
\end{aligned}
$$

对方差求导：

$$
\begin{aligned}
\frac{\partial\mathcal L}{\partial v}
&=-\frac{1}{2\tau^2}-\frac12+\frac{1}{2v}=0,\\
\frac1v&=\frac1{\tau^2}+1,\\
v^\star&=\frac{\tau^2}{1+\tau^2}.
\end{aligned}
$$

二阶导数分别为 $-1/\tau^2-1$ 和 $-1/(2v^2)$，交叉导数为零，因此这是全局最大值。它与第 1.3 节的贝叶斯后验完全一致。单高斯候选族包含了这个模型的真实后验，所以本次变分优化没有近似误差。

</details>

最优近似的参数为：

$$
\mu^\star=\frac{x}{1+\tau^2},\qquad v^\star=\frac{\tau^2}{1+\tau^2}.
$$

{% include vae-explainer.html kind="elbo" %}

固定 $x=1$、$\tau=0.6$。初始候选 $q=\mathcal N(0,1)$ 等于温度先验，先验 KL 为零；ELBO 约为 $-3.1859$，边缘对数似然约为 $-1.4403$，后验 KL 约为 $1.7456$。

点击“设为真实后验”后，候选均值变为约 0.7353，标准差变为约 0.5145。ELBO 上升到边缘对数似然，后验 KL 变为零，而先验 KL 约为 0.5672。图里控制的是标准差 $\sigma=\sqrt v$。

对于非线性响应 $X=f_\theta(Z)+\varepsilon$，测量模型仍给出了联合密度，但平方误差中会出现 $(x-f_\theta(z))^2$，后验一般不再能用上述配方求出。此时仍可以建立 ELBO，优化候选分布；候选族未必包含真实后验，所需期望也可能要用采样估计。

<div class="pgm-section-summary" markdown="1">

**小结。** 最优近似给出了先前的准确温度后验。实际复杂模型仍可沿用这个目标，但可能需要数值优化，而且近似族未必能表示真实后验。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 3 节小结。** 优化得到的均值与方差和准确后验一致，说明这个例子能在高斯族中精确求解。接下来才允许测量模型的噪声参数也发生变化。

</div>

## 4. 测量噪声的估计

<div class="pgm-section-intro" markdown="1">

**思路。** 前面只推断一次读数背后的温度。现在有多次独立测量，要利用它们一起估计温度计的噪声大小。

</div>



### 4.1 多次测量的边缘似然

<div class="pgm-section-intro" markdown="1">

**思路。** 把各次测量合在一起评分：每次都先积分掉未知真实温度，再用所有读数的边缘似然评价同一个噪声参数。

</div>

前面假定温度计的噪声标准差已知。现在保持同一类房间的温度先验不变，用多次测量估计噪声方差 $\theta=\tau^2$。

设在独立的房间状态中各测量一次，得到读数温差 $x_1,\ldots,x_N$。每次都有自己的真实温差 $Z_i$，它们服从同一先验，测量噪声相互独立，共用一个参数 $\theta$：

$$
p_\theta(x_{1:N},z_{1:N})
=\prod_{i=1}^N p(z_i)p_\theta(x_i\mid z_i).
$$

每次读数 $x_i$ 已知、真实温差 $z_i$ 未知。先对未知温差积分，得到单次读数对噪声参数 $\theta$ 的边缘似然；再利用独立性相乘，得到整组读数的边缘似然：

$$
\begin{aligned}
p_\theta(x_i)&=\int p(z_i)p_\theta(x_i\mid z_i)\,dz_i,\\
L_{\mathrm{marg}}(\theta;x_{1:N})&=\prod_{i=1}^N p_\theta(x_i).
\end{aligned}
$$

固定读数 $x_{1:N}$，估计噪声参数时最大化的是这个边缘似然。对应的**边缘对数似然**为

$$
\ell(\theta)=\log L_{\mathrm{marg}}(\theta;x_{1:N})
=\sum_{i=1}^N\log p_\theta(x_i).
$$

对每个已知读数 $x_i$，选择**近似后验** $q_i(z_i\mid x_i)$，近似**真实后验** $p_\theta(z_i\mid x_i)$。每个观测的近似后验单独优化，其 ELBO 为 $\mathcal L(q_i,\theta;x_i)$。将这些 ELBO 相加，定义

$$
\mathcal F(q,\theta)=\sum_{i=1}^N\mathcal L(q_i,\theta;x_i).
$$

边缘对数似然等于这个 ELBO 之和，再加上所有近似后验与真实后验之间的 KL 差距：

$$
\ell(\theta)=\mathcal F(q,\theta)
+\sum_{i=1}^N D_{\mathrm{KL}}\!\left(q_i(z_i\mid x_i)\Vert p_\theta(z_i\mid x_i)\right).
$$

每个读数对应不同的近似后验均值，噪声参数却由所有测量共享。推断温度是在当前模型下调整各自的近似后验 $q_i$；估计噪声是在这些近似后验给定后调整共享参数 $\theta$。

<div class="pgm-section-summary" markdown="1">

**小结。** 每个观测有自己的近似后验，噪声参数由数据共享。整组数据的 ELBO 是各观测 ELBO 的和，近似误差也按观测累加。

</div>

### 4.2 EM 更新

<div class="pgm-section-intro" markdown="1">

**思路。** 交替做两件事：用当前噪声估计真实温度，再用这些温度分布估计新的噪声。更新结果保留在正文，求导与单调性证明可以按需展开。

</div>

本例能精确计算真实后验。在第 $t$ 轮的 E 步，令近似分布 $q_i^{(t)}$ 等于当前噪声方差 $\theta^{(t)}$ 下的真实后验：

$$
\begin{aligned}
q_i^{(t)}(z_i\mid x_i)&=p_{\theta^{(t)}}(z_i\mid x_i)\\
&=\mathcal N(z_i\mid m_i,v_i),\\
m_i&=\frac{x_i}{1+\theta^{(t)}},\qquad
v_i=\frac{\theta^{(t)}}{1+\theta^{(t)}}.
\end{aligned}
$$

<details class="pgm-derivation" markdown="1">
<summary>推导：噪声方差的 M 步</summary>

这是 E 步。接着固定这些后验，用它们估计新的噪声方差。ELBO 中与新参数 $\theta$ 有关的部分为

$$
\mathcal F(q^{(t)},\theta)
=-\frac N2\log(2\pi\theta)
-\frac{1}{2\theta}\sum_{i=1}^N[(x_i-m_i)^2+v_i]+C.
$$

常数 $C$ 吸收先验和候选分布中不随新 $\theta$ 变化的项。对 $\theta$ 求导：

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

噪声方差的更新为：

$$
\theta^{(t+1)}=\frac1N\sum_{i=1}^N[(x_i-m_i)^2+v_i].
$$

新的噪声方差是后验平均平方误差。这里保留了 $v_i$，因为真实温度还有不确定性；只使用 $(x_i-m_i)^2$ 会漏掉这一部分。这是 M 步。

<details class="pgm-derivation" markdown="1">
<summary>证明：准确 EM 的边缘似然单调性</summary>

准确 E 步使旧参数处近似后验与真实后验之间的 KL 为零，因此 ELBO 之和与观测的边缘对数似然相等。M 步提高这个下界，就有

$$
\begin{aligned}
\ell(\theta^{(t+1)})
&\geq\mathcal F(q^{(t)},\theta^{(t+1)})\\
&\geq\mathcal F(q^{(t)},\theta^{(t)})\\
&=\ell(\theta^{(t)}).
\end{aligned}
$$

第一行使用新参数处的下界，第二行使用 M 步的改进，第三行使用准确 E 步的等式。如果改用受限的近似后验，最后的等式通常会留下 KL 差距；提高 ELBO 一般就不能保证观测的边缘对数似然同步单调提高。这种近似 E 步与参数学习的交替称为变分 EM。

</details>

准确 E 步与改进下界的 M 步保证边缘对数似然不下降；受限近似后验通常不能提供同样保证。

<div class="pgm-section-summary" markdown="1">

**小结。** 估计噪声时必须包含真实温度仍有的不确定性。这个例子的准确 E 步能保证边缘对数似然不降；换成受限近似后验后，这个保证通常不再成立。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 4 节小结。** EM 交替估计各次测量的温度分布和所有测量共享的噪声。准确后验使它具有边缘似然单调性；使用近似后验时要区分下界改进与似然改进。

</div>

## 5. 未知零点偏差与平均场近似

<div class="pgm-section-intro" markdown="1">

**思路。** 继续使用同一次温度读数，但不再假设温度计已完全校准。加入未知零点偏差，观察两个隐变量之间的依赖，以及独立近似会遗漏什么。

</div>



### 5.1 扩展测量模型

<div class="pgm-section-intro" markdown="1">

**思路。** 读数偏高可能来自房间较热，也可能来自温度计的正偏差。现在同时估计这两种来源。

</div>

回到房间里那一次 21 ℃ 的读数。前面假设温度计已经校准，现在将未知的零点偏差也纳入模型。

用 $B$ 表示以 1 ℃ 为单位的零点偏差，给它一个独立的标准高斯先验。测量关系变成

$$
Z\sim\mathcal N(0,1),\qquad B\sim\mathcal N(0,1),\qquad
X=Z+B+\varepsilon,
$$

其中 $\varepsilon\sim\mathcal N(0,\tau^2)$，三个变量先验独立。正偏差会使读数偏高。这一节只分析一次测量，共同推断真实温差 $Z$ 和传感器偏差 $B$，不再把 $B$ 当作已知的零。

观测分布与联合密度为

$$
p_\theta(x\mid z,b)=\mathcal N(x\mid z+b,\tau^2),\qquad
p_\theta(x,z,b)=p(z)p(b)p_\theta(x\mid z,b).
$$

同一个偏高读数，可以由较高的真实温度或正的零点偏差解释。在读数固定后，提高其中一个变量，就可以由降低另一个变量补偿。因此，先验中独立的两个变量在后验中会相关。

<div class="pgm-section-summary" markdown="1">

**小结。** 模型增加了一个未知偏差，但读数仍只提供它与真实温差之和的信息。因此观察后两个变量不再独立。

</div>

### 5.2 二维后验

<div class="pgm-section-intro" markdown="1">

**思路。** 先算出温度与偏差的准确联合后验，作为检验平均场近似的标准。矩阵配方放在折叠区，结果和温度含义直接保留。

</div>

将三个高斯因子的指数合并，得到

$$
\log p_\theta(z,b\mid x)
=-\frac12\left[z^2+b^2+\frac{(x-z-b)^2}{\tau^2}\right]+C.
$$

<details class="pgm-derivation" markdown="1">
<summary>推导：温度与偏差的二维高斯后验</summary>

$C$ 与 $z,b$ 无关。展开平方：

$$
\begin{aligned}
z^2+b^2+\frac{(x-z-b)^2}{\tau^2}
&=\left(1+\frac1{\tau^2}\right)(z^2+b^2)
+\frac{2zb}{\tau^2}\\
&\quad-\frac{2x(z+b)}{\tau^2}+\frac{x^2}{\tau^2}.
\end{aligned}
$$

其中 $x^2/\tau^2$ 是常数。将两个平方项与交叉项的系数放进矩阵，将线性项的系数放进向量：

$$
\begin{aligned}
y&=\begin{pmatrix}z\\b\end{pmatrix},\qquad
\Lambda=\begin{pmatrix}1+1/\tau^2&1/\tau^2\\1/\tau^2&1+1/\tau^2\end{pmatrix},\\
h&=\frac{x}{\tau^2}\begin{pmatrix}1\\1\end{pmatrix},\qquad
\log p_\theta(y\mid x)=-\frac12y^\top\Lambda y+h^\top y+C.
\end{aligned}
$$

这里的 $\Lambda$ 是后验的精度矩阵，即协方差矩阵的逆。取 $m=\Lambda^{-1}h$，对二次型配方：

$$
-\frac12y^\top\Lambda y+h^\top y
=-\frac12(y-m)^\top\Lambda(y-m)+\frac12m^\top\Lambda m.
$$

最后一项与 $y$ 无关。由二阶矩阵的求逆公式，先计算行列式：

$$
\det\Lambda
=\left(1+\frac1{\tau^2}\right)^2-\frac1{\tau^4}
=1+\frac2{\tau^2}.
$$

交换两个对角元素，将非对角元素变号，再除以行列式，得到协方差矩阵。将它乘以 $h$，得到均值：

</details>

真实联合后验的协方差与均值为：

$$
\Sigma=\Lambda^{-1}
=\frac1{2+\tau^2}\begin{pmatrix}1+\tau^2&-1\\-1&1+\tau^2\end{pmatrix},\qquad
m=\frac{x}{2+\tau^2}\begin{pmatrix}1\\1\end{pmatrix}.
$$

所以 $p_\theta(z,b\mid x)=\mathcal N(y\mid m,\Sigma)$。两个边际方差均为 $(1+\tau^2)/(2+\tau^2)$，协方差为 $-1/(2+\tau^2)$，相关系数为 $-1/(1+\tau^2)$。

仍取 $x=1$、$\tau=0.6$。两个后验均值都约为 0.4237，每个边际方差约为 0.5763，相关系数约为 $-0.7353$。现在一部分偏高读数可以归于零点偏差，温度估计回到约 20.4237 ℃，而且温度不确定性比已知偏差为零时更大。

<div class="pgm-section-summary" markdown="1">

**小结。** 读数的一部分可以由偏差解释，温度估计更靠近历史均值且不确定性更大。准确后验中的负相关记录了两种解释之间的补偿关系。

</div>

### 5.3 因子化近似

<div class="pgm-section-intro" markdown="1">

**思路。** 选择一个更简单的答案形式：分别用两个高斯表示温度和偏差，不在近似里保留它们的相关性。

</div>

对这个联合后验，选择两个一维高斯的乘积作为近似：

$$
q(z,b\mid x)=q_z(z\mid x)q_b(b\mid x),\qquad
q_z=\mathcal N(\mu_z,v_z),\qquad q_b=\mathcal N(\mu_b,v_b).
$$

这是**平均场**（mean-field）近似。它要求近似分布中的温度与偏差独立，因此无法表示刚才得到的负相关。真实测量模型保持不变，受到限制的是近似后验的分布族。

下面在这个族中最大化 ELBO。更新 $q_z$ 时固定 $q_b$，再用新的 $q_z$ 更新 $q_b$，每一步都优化一个完整的因子。

<div class="pgm-section-summary" markdown="1">

**小结。** 平均场限制的是近似后验，而不是真实模型。这个限制使计算更简单，也预先排除了能表示负相关的答案。

</div>

### 5.4 坐标更新

<div class="pgm-section-intro" markdown="1">

**思路。** 轮流更新真实温度与零点偏差的估计：先按当前偏差修正读数来估计真实温度，再按当前温度估计偏差。先看更新规则与收敛结果即可使用它。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：平均场因子的坐标更新</summary>

先固定 $q_b$。ELBO 中与 $q_z$ 有关的部分可以写为

$$
\mathcal L(q_z)
=\int q_z(z\mid x)A(z)\,dz-\int q_z(z\mid x)\log q_z(z\mid x)\,dz+C,
\qquad
A(z)=\mathbb E_{q_b}[\log p_\theta(x,z,B)].
$$

这个期望只对偏差 $B$ 取平均，$z$ 仍然保留为变量。令 $r(z)=\exp(A(z))/K$，其中 $K=\int\exp(A(u))\,du$，上式就等于

$$
\mathcal L(q_z)=-D_{\mathrm{KL}}(q_z\Vert r)+\log K+C.
$$

$K$ 与 $C$ 都不随待选的 $q_z$ 改变，所以最优更新是 $q_z=r$。本例中 $r$ 恰好也是高斯，属于我们选的因子族。

为了求出它，将联合密度代入 $A(z)$。记 $\mathbb E_{q_b}B=\mu_b$、$\operatorname{Var}_{q_b}(B)=v_b$，有

$$
\mathbb E_{q_b}[(x-z-B)^2]=(x-z-\mu_b)^2+v_b.
$$

其中 $v_b$ 和 $\mathbb E_{q_b}[B^2]$ 都与 $z$ 无关，归入常数。保留依赖 $z$ 的项，再展开平方：

$$
\begin{aligned}
A(z)&=-\frac12z^2-\frac{(x-z-\mu_b)^2}{2\tau^2}+C\\
&=-\frac12\left(1+\frac1{\tau^2}\right)z^2
+\frac{x-\mu_b}{\tau^2}z+C.
\end{aligned}
$$

与一维高斯的二次项对照，就得到更新后的均值与方差：

$$
q_z^{\mathrm{new}}(z\mid x)
=\mathcal N\!\left(z\mid\frac{x-\mu_b}{1+\tau^2},\frac{\tau^2}{1+\tau^2}\right).
$$

温度估计使用扣除当前平均偏差后的读数。交换两个变量，可以得到偏差因子的更新：

</details>

两个因子的交替更新规则为：

$$
\mu_z^{\mathrm{new}}=\frac{x-\mu_b}{1+\tau^2},\qquad
\mu_b^{\mathrm{new}}=\frac{x-\mu_z^{\mathrm{new}}}{1+\tau^2},\qquad
v_z=v_b=\frac{\tau^2}{1+\tau^2}.
$$

两个均值交替更新。在收敛处，它们同时满足 $\mu_z=(x-\mu_b)/(1+\tau^2)$ 和 $\mu_b=(x-\mu_z)/(1+\tau^2)$。两式相减得到 $\tau^2(\mu_z-\mu_b)=0$，所以均值相等；再代回任意一式：

$$
\mu_z^\star=\mu_b^\star=\frac{x}{2+\tau^2},\qquad
v_z^\star=v_b^\star=\frac{\tau^2}{1+\tau^2}.
$$

这与直接对高斯候选的 ELBO 求导相同。均值优化是一个严格凹的二次问题，各方差的目标也严格凹，因此这里的坐标更新收敛到这个族内的唯一最优解。

<div class="pgm-section-summary" markdown="1">

**小结。** 交替更新能得到这个独立高斯族中的最优均值和方差。但族内最优不等于真实后验，下一小节比较它们的不确定性。

</div>

### 5.5 近似误差与 KL 方向

<div class="pgm-section-intro" markdown="1">

**思路。** 比较最优近似与准确答案，分清优化没有完成造成的误差，以及分布形式本身不够灵活造成的误差。

</div>

最优平均场近似保留了真实后验的均值，但改变了方差。$\tau=0.6$ 时，真实温度边际方差约为 0.5763，近似边际方差却只有 0.2647。即便把优化做完，因子化分布也无法恢复温度与偏差之间的相关性。

{% include vae-explainer.html kind="sensor" %}

蓝色椭圆是真实联合后验的等密度线，橙色虚线是独立高斯近似。切到“温度边际”，可以比较相同均值下的两种宽度。改变噪声标准差，会同时改变真实后验的相关性和近似误差。

我们优化的是 $D_{\mathrm{KL}}(q\Vert p_\theta(\cdot\mid x))$，期望按候选分布 $q$ 取。若独立近似把两个边际都铺得与真实后验一样宽，就会在椭圆外的低后验密度区域放入更多概率。这个方向的 KL 优化会选择更窄的边际。

用反方向的 KL 优化独立高斯时，会匹配真实的边际方差；这仍然不能恢复相关性，也不是当前 ELBO 的最优近似。

<details class="pgm-derivation" markdown="1">
<summary>计算细节：反方向 KL 的最优方差</summary>

若换成 $D_{\mathrm{KL}}(p_\theta(\cdot\mid x)\Vert q)$，期望就按真实后验取。对一个候选因子的方差 $v$，与它有关的目标为 $\tfrac12(\log v+s/v)$，其中 $s$ 是真实边际方差。求导得到 $(v-s)/(2v^2)=0$，最优值变成 $v=s$。图中“匹配真实边际”的选项展示的就是这一宽度；它仍没有恢复相关性，也不再是我们原先 ELBO 对应的最优近似。

</details>

方差误差还与观察方向有关。真实后验中，$Z+B$ 的方差约为 0.3051，而最优独立近似给出约 0.5294。两个单独变量的方差被低估了，它们的和的方差反而被高估。读数约束的是温度与偏差的和，丢掉两者的负相关，就会丢掉这部分约束。

从已校准的温度计到存在未知偏差的温度计，变分推断始终在固定测量模型后优化近似后验。模型决定应当推断的分布，候选族决定能够表示哪些近似，ELBO 则提供优化这些近似的目标。后续的[神经网络概率模型]({{ '/zh/neural-probability-models/' | relative_url }})会将观测关系写得更灵活；采样、重参数化与摊销推断负责计算和共享这种优化。

<div class="pgm-section-summary" markdown="1">

**小结。** 这里均值可以匹配，温度与偏差的相关性却丢失了。近似的各自方差偏小、和的方差反而偏大，说明判断不确定性不能只看一个数字。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 5 节小结。** 温度与零点偏差可以互相补偿，所以真实后验存在负相关。平均场近似无法表示它，即使充分优化，也会改变不确定性的估计。

</div>

## 6. 符号说明

| 符号 | 含义 |
| --- | --- |
| $T$ / $R$ | 房间真实温度 / 温度计读数 |
| $Z$ / $X$ | 以 20 ℃ 为基准、1 ℃ 为单位的真实温差 / 读数温差 |
| $B$ | 第 5 节引入的未知零点偏差，单位同为 1 ℃ |
| $\tau$ / $\theta$ | 观测噪声标准差 / 方差，$\theta=\tau^2$ |
| $p_\theta(x\mid z)$ | 给定真实温度时读数的条件观测密度 |
| $p_\theta(x)$ | 对未知真实温度积分后的读数边缘密度；固定读数后，作为参数的函数称边缘似然（也称模型证据） |
| $p_\theta(z\mid x)$ | 给定读数后的真实温度后验 |
| $L_{\mathrm{marg}}$ / $\ell$ | 整组读数的边缘似然 / 边缘对数似然 |
| $\mathcal F(q,\theta)$ | 每个读数对应的 ELBO 之和 |
| $q_\lambda$ / $\lambda$ | 候选近似后验 / 变分参数 |
| $\mu$ / $v$ / $\sigma$ | 候选均值 / 方差 / 标准差，$v=\sigma^2$ |
| $q_zq_b$ | 将温度与偏差视为独立的平均场近似 |
| $m$ / $\Sigma$ / $\Lambda$ | 二维后验均值 / 协方差 / 精度矩阵，$\Lambda=\Sigma^{-1}$ |
| ELBO / VI / EM | 证据下界 / 变分推断 / 期望最大化算法 |

## 7. 参考文献

1. **Christopher M. Bishop，2006。** [*Pattern Recognition and Machine Learning*](https://link.springer.com/book/9780387310732)，§10.1，印刷页 462–469。变分分解、平均场更新与相关高斯的例子。
2. **David M. Blei、Alp Kucukelbir、Jon D. McAuliffe，2017。** [*Variational Inference: A Review for Statisticians*](https://arxiv.org/abs/1601.00670)。从优化视角讨论 VI 与近似族。
3. **Radford M. Neal、Geoffrey E. Hinton，1998。** [*A View of the EM Algorithm that Justifies Incremental, Sparse, and Other Variants*](https://www.cs.toronto.edu/~hinton/absps/emk.pdf)。EM 的分布优化视角。

**来源与勘误。**本文结合课程中的 EM 内容与以上文献，以个人理解重新组织和推导；交互图为独立制作的教学例子，未复制教材插图。原材料及其图文的权利归相应作者或出版方所有。如有公式、术语或理解上的疏漏，欢迎指出。
