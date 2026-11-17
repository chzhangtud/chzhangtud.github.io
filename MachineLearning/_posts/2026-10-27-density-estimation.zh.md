---
title: "概率密度估计"
date: 2026-10-27
lang: zh
permalink: /zh/density-estimation/
en_link: /en/density-estimation/
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
toc_label: 本文目录
toc_sticky: true
excerpt: "从样本出发估计概率密度：串联最大似然、贝叶斯估计、直方图、核密度、近邻方法与高斯混合模型，推导 EM 的更新和单调性，并用交互图比较平滑尺度与初始化。"
---

{% include statistics-assets.html %}
<script type="module" src="{{ '/assets/js/density-estimation.mjs' | relative_url }}"></script>

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

记录一批零件的长度后，我们可以算出平均值和方差。但如果想知道长度落在某个范围内的概率，或者哪些长度很少出现，还需要了解这些数据的分布。**概率密度估计**研究的就是：怎样根据有限的样本，估计它们来自什么样的分布。

最简单的做法是先假设数据服从正态分布，再估计均值和方差。如果一条正态曲线无法描述数据，也可以从直方图出发，逐步得到核密度估计和近邻估计；还可以把几个正态分布混合起来，描述更复杂的形状。下面分别介绍这些方法，并推导它们的估计公式。

---

## 1. 从观测到分布

### 1.1 我们究竟要估计什么？

设已有 $n$ 个独立同分布的样本，记为 $\mathcal D=(x_1,\ldots,x_n)$。它们的真实密度 $p_\star(x)$ 未知，我们要根据样本得到一个估计 $\widehat p(x)$。估计结果仍然应当满足[概率密度的基本要求]({{ '/zh/probability-statistics/' | relative_url }})：处处非负，整条曲线下的面积为 1。对于一个区间或区域 $R$，便可以用它计算近似概率：

$$
P(X\in R)=\int_R p_\star(x)\,dx
\approx\int_R\widehat p(x)\,dx.
$$

这里 $x_i$ 是第 $i$ 个样本的具体数值，$x$ 则是密度函数的自变量。比如估计零件长度的分布时，把不同长度代入 $\widehat p(x)$，就能知道样本主要集中在哪些长度附近。符号上的帽子表示这个函数是从样本估计出来的。

密度的高度本身不是概率。若一个区间很短，其中的密度变化不大，区间概率就近似等于“密度高度 × 区间宽度”。因此，同样有 10% 的样本落入某个区间，区间越窄，说明这些样本越集中，估计的密度也应越高。

密度估计还可以用于分类。例如，分别估计两台机器所产零件的长度分布，再结合各台机器的产量比例，就能根据一个零件的长度判断它更可能来自哪台机器。一般地，设类别为 $C_j$，贝叶斯公式给出

$$
P(C_j\mid x)
=\frac{p(x\mid C_j)P(C_j)}{\sum_\ell p(x\mid C_\ell)P(C_\ell)}.
$$

$p(x\mid C_j)$ 是第 $j$ 类数据的密度，$P(C_j)$ 是这类数据所占的比例。两者相乘，再除以所有类别的总贡献，就得到观察到 $x$ 后它属于第 $j$ 类的概率。

如果训练样本中的类别比例能够代表实际情况，可以直接用样本频率估计 $P(C_j)$。若采样时人为改变了类别比例，就需要另外确定这个先验。下面先讨论不带类别标签的密度估计。

### 1.2 几种常用方法

一种做法是先指定分布的形式。例如假设数据服从正态分布，那么整条密度曲线就由均值和方差决定。只要估计出这两个参数，密度也就确定了。这类方法称为**参数方法**。

另一种做法是不预先限定整条曲线的形状，而是根据样本在不同位置的分布情况来构造密度，例如直方图和核密度估计。这些方法通常称为**非参数方法**。它们仍然有箱宽、带宽等需要选择的量，“非参数”并不等于没有参数。

还可以用几个简单分布的加权和描述整体分布，这称为**混合模型**。它比单个正态分布更灵活，但只要分量数固定，待估计的参数个数也是固定的，所以仍属于参数模型。

## 2. 最大似然估计

### 2.1 先把数据固定，再把参数当作变量

先假设样本来自某个分布 $p(x\mid\theta)$，其中 $\theta$ 表示未知参数。对于正态分布，$\theta=(\mu,\sigma^2)$。由于样本相互独立，它们的联合密度等于各自密度的乘积：

$$
L(\theta;\mathcal D)=\prod_{i=1}^{n}p(x_i\mid\theta).
$$

现在样本已经给定，未知的是参数。把上式看成 $\theta$ 的函数，就称为**似然函数**。对每一组候选参数，都可以算出一个似然值；最大似然估计选择其中使似然最大的那一组。

连续变量恰好取某个数值的概率为零，为什么仍然可以用密度值比较参数？可以把每个记录值理解为一个很短的测量区间，宽度记为 $\Delta$。当密度连续、区间足够短时，所有观测分别落入这些区间的概率近似为

$$
\prod_{i=1}^{n}\bigl[p(x_i\mid\theta)\Delta\bigr]
=\Delta^n L(\theta;\mathcal D).
$$

比较不同参数时，区间宽度相同，$\Delta^n$ 也相同。因此，最大化密度的乘积，就相当于最大化这些测量区间的联合概率。需要注意，似然是比较参数的函数，并不是参数的概率分布，不要求对 $\theta$ 积分为 1。

实际计算时通常先取对数。对数函数严格递增，不会改变最大值所在的位置，却能把乘积变成求和。于是**最大似然估计**（maximum likelihood estimation，MLE）可以写成

$$
\widehat\theta_{\mathrm{ML}}
=\arg\max_\theta\ell(\theta),
\qquad \ell(\theta)=\sum_{i=1}^{n}\log p(x_i\mid\theta).
$$

$\ell(\theta)$ 称为对数似然，$\arg\max$ 表示取使它最大的参数。求和更容易求导，也能避免许多很小的密度值相乘时出现数值下溢。

如果把目标改写成最小化 $-\ell(\theta)$，得到的参数不变。$-\ell(\theta)$ 就是负对数似然。下文的对数均为自然对数。

### 2.2 高斯均值和方差怎样推出来？

假设样本服从一维正态分布。为了方便对方差求导，记 $v=\sigma^2$。单个样本的密度和对数密度分别为

$$
p(x_i\mid\mu,v)=\frac1{\sqrt{2\pi v}}
\exp\!\left[-\frac{(x_i-\mu)^2}{2v}\right],
\qquad v=\sigma^2>0,
$$

$$
\log p(x_i\mid\mu,v)
=-\frac12\log(2\pi v)-\frac{(x_i-\mu)^2}{2v}.
$$

把所有样本的对数密度相加，第一项重复了 $n$ 次，第二项则累加各个样本的平方误差，得到

$$
\ell(\mu,v)
=-\frac n2\log(2\pi v)-\frac1{2v}\sum_{i=1}^{n}(x_i-\mu)^2.
$$

先固定方差 $v$，考察均值 $\mu$。第一项不含 $\mu$，所以对数似然要尽可能大，平方误差之和就要尽可能小。对数似然对 $\mu$ 求导，并令导数为零：

$$
\frac{\partial\ell}{\partial\mu}
=\frac1v\sum_{i=1}^{n}(x_i-\mu)=0
\quad\Longrightarrow\quad
\widehat\mu=\bar x=\frac1n\sum_{i=1}^{n}x_i.
$$

因此，最合适的均值就是样本平均数。由于二阶导数 $-n/v<0$，这个解确实使固定方差下的对数似然达到最大。

接着把 $\mu=\bar x$ 代回对数似然，对方差 $v$ 求导：

$$
\frac{\partial\ell}{\partial v}
=-\frac n{2v}+\frac1{2v^2}\sum_i(x_i-\bar x)^2=0,
$$

两边乘以 $2v^2$，便有 $nv=\sum_i(x_i-\bar x)^2$，所以

$$
\widehat v_{\mathrm{ML}}=\frac1n\sum_{i=1}^{n}(x_i-\bar x)^2.
$$

只要样本不全相同，平方误差之和就大于零。此时导数在这个解的左侧为正、右侧为负，所以这个解也是最大点。至此，均值和方差都已确定。

例如，样本为 $0,1,1,2$ 时，平均数是 1，平方误差之和是 2。因此，估计的均值为 1，方差为 $2/4=0.5$，得到的密度是 $\mathcal N(1,0.5)$。

这里的方差分母是 $n$，而常用的无偏样本方差分母是 $n-1$。两者的区别可以从下面这个恒等式看出来：

$$
\sum_i(X_i-\bar X)^2
=\sum_i(X_i-\mu)^2-n(\bar X-\mu)^2.
$$

设总体均值为 $\mu$、方差为 $v=\sigma^2$，各个样本相互独立。这里取期望，是考虑反复从这个总体抽取 $n$ 个样本时，平方和的平均值是多少。每次抽样的 $X_i$ 和 $\bar X$ 都可能改变，而总体参数 $\mu$ 和 $v$ 保持不变。

**第一项的期望。**按照方差的定义，每个样本都满足

$$
\mathbb E[(X_i-\mu)^2]
=\mathbb E[(X_i-\mathbb E[X_i])^2]
=\operatorname{Var}(X_i)=v.
$$

期望可以逐项相加。一共有 $n$ 项，每项的期望都是 $v$，所以

$$
\mathbb E\!\left[\sum_{i=1}^{n}(X_i-\mu)^2\right]
=\sum_{i=1}^{n}\mathbb E[(X_i-\mu)^2]
=nv.
$$

**第二项的期望。**先把样本均值与总体均值的差写成

$$
\bar X-\mu=\frac1n\sum_{i=1}^{n}(X_i-\mu).
$$

平方后，前面的系数变成 $1/n^2$。展开求和项的平方，既有各项自身的平方，也有不同项之间的乘积：

$$
(\bar X-\mu)^2
=\frac1{n^2}\left[
\sum_i(X_i-\mu)^2
+2\sum_{i<j}(X_i-\mu)(X_j-\mu)
\right].
$$

第一部分刚才已经算过，期望是 $nv$。对于第二部分，样本 $X_i$ 与 $X_j$ 相互独立，因此乘积的期望等于期望的乘积。而每个偏差的期望都是 $\mathbb E[X_i-\mu]=0$，所以所有交叉项的期望都为零：

$$
\begin{aligned}
\mathbb E[(X_i-\mu)(X_j-\mu)]
&=\mathbb E[X_i-\mu]\,\mathbb E[X_j-\mu]\\
&=0,\qquad i\ne j.
\end{aligned}
$$

于是

$$
\mathbb E[(\bar X-\mu)^2]
=\frac1{n^2}(nv+0)=\frac vn.
$$

恒等式的第二项外面还乘着 $n$，因此它的期望为

$$
\mathbb E[n(\bar X-\mu)^2]
=n\frac vn=v.
$$

将这两个结果代回恒等式，得到

$$
\mathbb E\!\left[\sum_i(X_i-\bar X)^2\right]
=nv-v=(n-1)v.
$$

所以，这个平方和除以 $n-1$ 后，期望恰好等于总体方差 $v$，这就是无偏样本方差。若除以 $n$，期望则是 $(n-1)v/n$，会偏小。高斯最大似然估计仍然采用分母 $n$，因为它的目标是使当前样本的似然最大，而不是使方差估计无偏。

如果每个样本包含多个坐标，均值换成均值向量，方差换成协方差矩阵。相应的估计为 $\widehat{\boldsymbol\mu}=n^{-1}\sum_i\mathbf x_i$ 和

$$
\widehat\Sigma_{\mathrm{ML}}
=\frac1n\sum_{i=1}^{n}(\mathbf x_i-\widehat{\boldsymbol\mu})
(\mathbf x_i-\widehat{\boldsymbol\mu})^\top.
$$

具体来说，矩阵的第 $(a,b)$ 个元素，是第 $a$、第 $b$ 个坐标分别减去均值后，相乘再取平均。对角线元素就是各个坐标的方差估计。

### 2.3 数据太少时，极大值可能不存在

如果只有一个样本，把均值设为该样本值，平方误差就为零。这时样本处的密度只剩 $1/\sqrt{2\pi v}$，方差越小，密度越大；当 $v\to0$ 时，密度趋于无穷。因此不存在一个方差为正、又能使似然达到最大的解。所有样本完全相同时也会出现同样的问题。

所以，求出导数为零的位置后，还需要检查解是否存在、是否满足参数约束。高维数据中也有类似问题：样本不足时，估计出的协方差矩阵可能不可逆。常见处理是给方差设置下限、对协方差矩阵作正则化，或为这些参数设置合适的先验。仅给均值加先验，并不能阻止方差趋近于零。

## 3. 贝叶斯估计

### 3.1 从一个最佳参数到参数的后验

最大似然给出一组参数，但没有直接告诉我们这组参数有多可靠。四个样本和四千个样本都可能得到均值 1，显然后者通常更值得信赖。贝叶斯估计用一个分布描述未知参数，从而保留这种不确定性。

设 $p(\theta)$ 是观测数据之前对参数的先验分布。看到数据后，根据贝叶斯公式得到参数的后验分布：

$$
p(\theta\mid\mathcal D)
=\frac{p(\mathcal D\mid\theta)p(\theta)}{p(\mathcal D)},
\qquad
p(\mathcal D)=\int p(\mathcal D\mid\theta)p(\theta)\,d\theta.
$$

分子是似然与先验的乘积。分母把这个乘积对所有可能参数积分，使后验密度的积分等于 1。它与待比较的 $\theta$ 无关，所以推导时常先写成“后验正比于似然乘先验”，最后再确定归一化常数。

后验分布较宽，表示参数还有较大的不确定性；后验分布集中在一小段范围内，表示参数估计较为确定。如果只取后验密度最高的位置，就得到**最大后验估计**（maximum a posteriori，MAP）。它与 MLE 一样，最终给出的仍然是一个点估计。

### 3.2 已知观测方差时的共轭高斯例子

以正态分布为例，假设观测方差 $\sigma^2$ 已知，只估计均值 $\mu$。设样本满足 $\bigl(X_i\mid\mu\bigr)\sim\mathcal N(\mu,\sigma^2)$，再为均值指定高斯先验 $\mu\sim\mathcal N(\mu_0,\tau_0^2)$。这两个方差有不同含义：$\sigma^2$ 表示观测值本身的分散程度，$\tau_0^2$ 表示我们对均值位置有多大把握。

似然和先验都含有一个指数函数，相乘时指数相加。取对数并把与 $\mu$ 无关的项记入常数，得到

$$
\log p(\mu\mid\mathcal D)
=\text{const}-\frac1{2\sigma^2}\sum_i(x_i-\mu)^2
-\frac{(\mu-\mu_0)^2}{2\tau_0^2}.
$$

为了认出后验是什么分布，先展开这两个平方。似然中的平方和为 $\sum_i(x_i-\mu)^2=\sum_i x_i^2-2n\bar x\mu+n\mu^2$。再展开先验中的平方，把含 $\mu^2$ 和 $\mu$ 的项合并：

$$
\log p(\mu\mid\mathcal D)
=C-\frac12\bigl(A\mu^2-2B\mu\bigr),
$$

$$
A=\frac n{\sigma^2}+\frac1{\tau_0^2},
\qquad B=\frac{n\bar x}{\sigma^2}+\frac{\mu_0}{\tau_0^2}.
$$

$C$ 不含 $\mu$。接着用 $A\mu^2-2B\mu=A(\mu-B/A)^2-B^2/A$ 配方，其中 $B^2/A$ 也可以并入常数。因此

$$
p(\mu\mid\mathcal D)\propto
\exp\!\left[-\frac A2\left(\mu-\frac BA\right)^2\right].
$$

这个指数已经具有高斯分布的形式：中心是 $B/A$，方差是 $1/A$。所以后验为 $\mathcal N(\mu_n,\tau_n^2)$，其中

$$
\frac1{\tau_n^2}=\frac1{\tau_0^2}+\frac n{\sigma^2},
\qquad
\mu_n=\tau_n^2\left(\frac{\mu_0}{\tau_0^2}
+\frac{n\bar x}{\sigma^2}\right).
$$

将 $\tau_n^2$ 代入均值表达式，可以更清楚地看出先验和数据各起多大作用：

$$
\mu_n
=\frac{n\tau_0^2}{n\tau_0^2+\sigma^2}\bar x
+\frac{\sigma^2}{n\tau_0^2+\sigma^2}\mu_0.
$$

后验均值是样本均值 $\bar x$ 和先验均值 $\mu_0$ 的加权平均。样本越多，$\bar x$ 的权重越大；先验方差越小，说明先验越确定，$\mu_0$ 的权重就越大。

如果把方差的倒数称为**精度**，公式还可以理解为按精度加权。样本均值的方差是 $\sigma^2/n$，所以精度为 $n/\sigma^2$；先验精度为 $1/\tau_0^2$。两者相加，就是后验精度。

仍取样本 $0,1,1,2$。这次假设观测方差已知为 $\sigma^2=1$，均值先验为 $\mathcal N(0,1)$。数据均值是 1，精度为 4；先验均值是 0，精度为 1。因此，后验均值为 $(4\times1+1\times0)/5=0.8$，后验方差为 $1/5=0.2$。样本把均值估计从先验的 0 拉向了 1，同时缩小了均值的不确定范围。

先验和后验都是高斯分布，这种先验与似然的搭配称为**共轭**。它的好处是后验可以直接算出来，更新后仍用同一组类型的参数表示。

### 3.3 预测一个新观测，还要再平均一次

估计均值后，还可以预测下一个观测。给定参数 $\theta$，新观测与已有样本相互独立；但参数尚未确定，需要考虑它在后验分布中的各种可能取值。因此，新观测的预测密度为

$$
p(x_\star\mid\mathcal D)
=\int p(x_\star\mid\theta)p(\theta\mid\mathcal D)\,d\theta.
$$

这个积分就是按参数的后验概率，对不同参数下的预测密度作加权平均，结果称为**后验预测分布**。它同时考虑了观测自身的随机性和参数估计的不确定性。

在高斯例子中，可以写成 $X_\star=\mu+\varepsilon$：均值 $\mu$ 的后验为 $\mathcal N(\mu_n,\tau_n^2)$，独立的观测噪声 $\varepsilon$ 服从 $\mathcal N(0,\sigma^2)$。独立高斯变量相加仍服从高斯分布，均值和方差分别相加，所以

$$
X_\star\mid\mathcal D
\sim\mathcal N(\mu_n,\sigma^2+\tau_n^2).
$$

**全方差公式。**总体的波动可以来自两个方面：同一组内部的数值有差异，不同组的平均值也有差异。例如，把两台机器生产的零件混在一起，即使每台机器的生产误差都很小，只要它们的平均长度不同，混合后的长度仍可能比较分散。

用 $Y$ 表示分组依据，$X$ 表示要研究的数值。只要 $X$ 的二阶矩有限，就有

$$
\operatorname{Var}(X)
=\mathbb E_Y[\operatorname{Var}(X\mid Y)]
+\operatorname{Var}_Y(\mathbb E[X\mid Y]).
$$

第一项先固定 $Y$，计算每组内部的方差，再按各组的概率取平均，表示**组内波动**。第二项先求每组的均值，再计算这些均值之间的方差，表示**组间波动**。因此，只把各组的方差平均起来，会漏掉各组均值不同造成的那部分波动。

例如，两组各占一半，组内方差都是 1，组均值分别为 0 和 2。组内方差的平均值是 1；总体均值是 1，所以组均值的方差为 $[(0-1)^2+(2-1)^2]/2=1$。总体方差因而是 $1+1=2$。

$Y$ 也可以是连续变量。这时，把“按各组概率求和”换成“对 $Y$ 的分布积分”即可。这个公式不要求 $X$ 和 $Y$ 独立，也不要求它们服从高斯分布。

**公式的推导。**记 $m(Y)=\mathbb E[X\mid Y]$、$m=\mathbb E[X]$。将一个数值到总体均值的偏差拆成两部分：

$$
X-m=\bigl(X-m(Y)\bigr)+\bigl(m(Y)-m\bigr).
$$

第一部分是数值到所在组均值的偏差，第二部分是该组均值到总体均值的偏差。平方后取期望，得到

$$
\begin{aligned}
\operatorname{Var}(X)
&=\mathbb E[(X-m(Y))^2]
+\mathbb E[(m(Y)-m)^2]\\
&\quad+2\mathbb E[(X-m(Y))(m(Y)-m)].
\end{aligned}
$$

这里可以先固定 $Y$，在组内取期望，再对所有组取平均。这是全期望公式 $\mathbb E[\mathbb E[Z\mid Y]]=\mathbb E[Z]$：先算各组的平均值，再按各组比例平均，结果等于直接算总体平均值。

对于交叉项，固定 $Y$ 后，$m(Y)-m$ 是常数，而组内偏差的平均值为零：

$$
\begin{aligned}
\mathbb E[(X-m(Y))(m(Y)-m)\mid Y]
&=(m(Y)-m)\,\mathbb E[X-m(Y)\mid Y]\\
&=0.
\end{aligned}
$$

再对 $Y$ 取平均，交叉项仍为零。剩下的第一项，在组内取期望时就是条件方差；第二项则是组均值的方差，因为 $\mathbb E[m(Y)]=m$。于是

$$
\begin{aligned}
\mathbb E[(X-m(Y))^2]
&=\mathbb E_Y[\operatorname{Var}(X\mid Y)],\\
\mathbb E[(m(Y)-m)^2]
&=\operatorname{Var}_Y(\mathbb E[X\mid Y]).
\end{aligned}
$$

两项相加就得到全方差公式。

**应用到后验预测。**在本节中，数据 $\mathcal D$ 已经给定，用来进一步划分条件的是未知均值 $\mu$。固定 $\mu$ 后，新观测的条件均值为 $\mu$，条件方差为 $\sigma^2$：

$$
\mathbb E[X_\star\mid\mu,\mathcal D]=\mu,
\qquad\operatorname{Var}(X_\star\mid\mu,\mathcal D)=\sigma^2.
$$

因此，全方差公式中的第一项是常数 $\sigma^2$ 的后验平均，结果仍是 $\sigma^2$；第二项是 $\mu$ 的后验方差，即 $\tau_n^2$。具体写成

$$
\begin{aligned}
\operatorname{Var}(X_\star\mid\mathcal D)
&=\mathbb E_{\mu\mid\mathcal D}\!\left[\operatorname{Var}(X_\star\mid\mu,\mathcal D)\right]\\
&\quad+\operatorname{Var}_{\mu\mid\mathcal D}\!\left[\mathbb E(X_\star\mid\mu,\mathcal D)\right]\\
&=\sigma^2+\tau_n^2.
\end{aligned}
$$

第一项是观测噪声的方差，第二项是均值的后验方差。上例中，均值的后验为 $\mathcal N(0.8,0.2)$，新观测的预测分布则为 $\mathcal N(0.8,1.2)$。它们的均值相同，方差却不同：即使均值估计已经很准确，新观测仍然会受到观测噪声的影响。

{% include density-figure.html kind="posterior" %}

## 4. 非参数密度估计

无论采用最大似然还是贝叶斯方法，只要假设数据服从一个正态分布，估计出的密度就只能有一个峰。如果样本明显分成两团，继续调整均值和方差也无法描述这种形状。此时可以不先假设整条曲线的形式，而是直接根据各个位置附近的样本数量估计密度。

### 4.1 一个局部计数公式

在位置 $x$ 附近取一个小区域 $R$，大小记为 $V$。在一维中，$V$ 就是区间长度；在二维中，则是面积。如果区域足够小，里面的密度近似不变，就有

$$
P(X\in R)=\int_Rp(u)\,du\approx p(x)V.
$$

假设 $n$ 个样本中有 $k$ 个落在这个区域内，就可以用频率 $k/n$ 估计区域概率。再除以 $V$，得到局部密度的估计：

$$
\widehat p(x)\approx\frac{k}{nV}.
$$

例如，100 个样本中有 10 个落在长度为 0.5 的区间内，区域概率估计为 0.1，密度估计就是 $0.1/0.5=0.2$。这里除以区间长度，是因为密度表示单位长度内的概率，而频率只反映整个区间的概率。

区域不能选得太大，否则“密度近似不变”就不成立；也不能太小，否则里面的样本太少，估计容易受偶然性影响。接下来的直方图、核密度和近邻方法，都需要处理这个区域大小的选择问题。

### 4.2 直方图：高度需要除以箱宽

直方图先把数轴划分成若干个宽度为 $h$ 的区间，通常称为箱。设第 $b$ 个箱中有 $n_b$ 个样本，把箱内的密度设为常数：

$$
\widehat p(x)=\frac{n_b}{nh},\qquad x\text{ 位于第 }b\text{ 个箱}.
$$

这样，箱的高度乘以宽度，正好是样本频率 $n_b/n$；所有箱的面积相加为 1。因此，密度直方图的高度要除以箱宽，不能直接用频数或频率。

箱宽较小时，直方图可以显示细节，但换一批样本，形状也可能明显改变；箱宽过大时，一些原本不同的峰又会被合在一起。箱的起始位置也会影响结果。推广到 $d$ 维后，如果每个坐标都分成 $B$ 个区间，就有 $B^d$ 个格子，很快会出现大量空格。这是高维密度估计困难的一个原因。

### 4.3 核密度估计

直方图的箱边界是固定的。即使两个位置十分接近，只要恰好位于箱边界两侧，密度估计也可能相差很大。可以改用一个随 $x$ 移动的窗口：每次都统计 $x$ 左右各 $h/2$ 范围内有多少样本。用指示函数 $\mathbf1$ 表示是否落入窗口，条件成立时取 1，否则取 0：

$$
k(x)=\sum_{i=1}^{n}\mathbf1\!\left(\lvert x-x_i\rvert\leq\frac h2\right),
\qquad \widehat p_h(x)=\frac{k(x)}{nh}.
$$

窗口长度为 $h$，所以密度仍是计数除以 $nh$。定义矩形核 $K_{\mathrm{box}}(u)=\mathbf1(\lvert u\rvert\leq1/2)$ 后，可以把这个估计统一写成

$$
\widehat p_h(x)=\frac1{nh}\sum_{i=1}^{n}
K\!\left(\frac{x-x_i}{h}\right),\qquad h>0.
$$

取矩形核时，样本对窗口的贡献只有 0 和 1，进出窗口时仍会发生跳变。如果改用平滑函数，让离 $x$ 越近的样本贡献越大、越远的样本贡献越小，估计曲线也会随之平滑。这就得到**核密度估计**（kernel density estimation，KDE）。函数 $K$ 决定每个样本的贡献怎样随距离变化，$h$ 则决定影响范围有多宽。

也可以把 KDE 理解成：以每个样本 $x_i$ 为中心放一条小密度曲线，再把它们平均。核函数需要满足 $K(u)\geq0$、$\int K(u)\,du=1$。把核的宽度乘以 $h$，就需要把高度除以 $h$，才能保持面积不变。令 $u=(x-x_i)/h$，则 $dx=h\,du$，可以验证

$$
\int\frac1hK\!\left(\frac{x-x_i}{h}\right)dx
=\int K(u)\,du=1.
$$

因此，每一项的面积都是 1，乘以 $1/n$ 后各占 $1/n$ 的概率，最后相加仍为 1。在 $d$ 维中，每个坐标都缩放 $h$ 倍，体积就缩放 $h^d$ 倍，所以归一化因子相应变为 $1/h^d$。

常见的一维核包括：

$$
K_{\mathrm G}(u)=\frac1{\sqrt{2\pi}}e^{-u^2/2},
$$

$$
K_{\mathrm{box}}(u)=\mathbf1\!\left(\lvert u\rvert\leq\frac12\right),
$$

$$
K_{\mathrm E}(u)=\frac34(1-u^2)\mathbf1(\lvert u\rvert\leq1).
$$

这三个分别是高斯核、矩形核和 Epanechnikov 核。高斯核在任意距离处都非零，后两个核则只在一定范围内非零。它们都满足面积为 1，但平滑程度和计算成本不同。

使用高斯核时，每一项 $h^{-1}K_{\mathrm G}((x-x_i)/h)$ 就是一条均值为 $x_i$、方差为 $h^2$ 的高斯密度。因此，高斯 KDE 实际上是 $n$ 个高斯分布的等权混合。后面的高斯混合模型也采用加权求和，不过不再要求每个样本对应一个分量，而是学习少数几个分量的参数。

### 4.4 如何选择带宽？

带宽直接决定平滑程度。$h$ 很小时，每个样本附近都有一个窄峰，估计曲线容易出现许多偶然的起伏；$h$ 很大时，曲线比较平稳，却可能把本来分开的两个峰合并。要解释怎样选择带宽，需要区分估计的偏差和方差。

固定一个位置 $x$，想象反复抽取同样多的样本，并且每次都用相同带宽估计密度。得到的 $\widehat p_h(x)$ 会随样本改变，这些估计值的波动称为估计方差。估计值的平均数与真实密度 $p(x)$ 的差，则称为偏差。这里的方差针对估计量，而不是原始数据 $X$。

记这些估计值的平均数为 $m_h(x)=\mathbb E[\widehat p_h(x)]$。把误差拆成“估计值与其平均数的差”以及“平均数与真实值的差”，平方后取期望。第一部分的均值为零，所以交叉项消失，得到

$$
\underbrace{\mathbb E[(\widehat p_h(x)-p(x))^2]}_{\text{均方误差}}
=\underbrace{\operatorname{Var}[\widehat p_h(x)]}_{\text{抽样波动}}
+\underbrace{(m_h(x)-p(x))^2}_{\text{偏差的平方}}.
$$

这个分解说明，减小抽样波动和减小系统性的偏差都能改善估计，但带宽对它们的影响恰好相反。下面分别计算这两项怎样依赖于 $h$。

**偏差。**这里要对各种可能的样本取平均，所以把已观测到的 $x_i$ 换回随机变量 $X_i$。由于样本同分布，KDE 平均值的期望等于其中任意一项的期望：

$$
m_h(x)=\int\frac1h K\!\left(\frac{x-u}{h}\right)p(u)\,du
=\int K(t)p(x-ht)\,dt.
$$

第二个等号使用变量代换 $t=(x-u)/h$。它表明，KDE 的期望相当于把真实密度在 $x$ 附近作加权平均。假设密度足够光滑、$x$ 远离分布边界，核函数对称且具有所需的有限矩，就可以在 $x$ 处作 Taylor 展开：

$$
p(x-ht)\approx p(x)-ht\,p'(x)+\frac{h^2t^2}{2}p''(x).
$$

代入积分后，第一项为 $p(x)\int K(t)\,dt=p(x)$；第二项含有 $\int tK(t)\,dt$，由于核函数对称而等于零。剩下的主要误差来自第三项，因此

$$
\operatorname{Bias}[\widehat p_h(x)]
\approx\frac{h^2}{2}\mu_2(K)p''(x),
\qquad\mu_2(K)=\int u^2K(u)\,du,
$$

在这些条件下，偏差的主要部分与 $h^2$ 成正比，偏差的平方就与 $h^4$ 成正比。带宽越大，邻域平均对密度局部形状的改变通常也越明显。

**方差。**记 $Y_i=h^{-1}K((x-X_i)/h)$，KDE 就是这些 $Y_i$ 的平均。固定位置 $x$ 和带宽 $h$ 后，每个 $X_i$ 都经过同一个函数变换，因此 $Y_1,\ldots,Y_n$ 也独立同分布。方差的计算可以逐步写成

$$
\begin{aligned}
\operatorname{Var}[\widehat p_h(x)]
&=\operatorname{Var}\!\left(\frac1n\sum_{i=1}^{n}Y_i\right)\\
&=\frac1{n^2}\sum_{i=1}^{n}\operatorname{Var}(Y_i)\\
&=\frac1{n^2}\,n\operatorname{Var}(Y_1)\\
&=\frac1n\operatorname{Var}(Y_1).
\end{aligned}
$$

第二步用到独立性：各项之间的协方差为零，求和的方差可以直接相加，系数 $1/n$ 则要平方。第三步用到同分布：每一项的方差都相同，所以 $n$ 项相加等于 $n\operatorname{Var}(Y_1)$。这里的 $Y_1$ 只是任取一项作为代表，并不是只考虑第一个样本；换成任意固定下标的 $Y_i$ 也成立。

再利用方差等于二阶矩减去均值的平方，得到

$$
\operatorname{Var}[\widehat p_h(x)]
=\frac1n\left(\mathbb E[Y_1^2]-\bigl(\mathbb E[Y_1]\bigr)^2\right).
$$

其中的二阶矩仍可用变量代换计算：

$$
\mathbb E[Y_1^2]=\frac1h\int K(t)^2p(x-ht)\,dt
\approx\frac{p(x)}h\int K(t)^2\,dt.
$$

当 $p(x)>0$、$h$ 趋于零时，二阶矩中的 $1/h$ 项起主要作用，而 $\mathbb E[Y_1]^2$ 保持有界。因此

$$
\operatorname{Var}[\widehat p_h(x)]
\approx\frac{p(x)R(K)}{nh},
\qquad R(K)=\int K(u)^2\,du.
$$

所以，样本数不变时，减小带宽会增大估计方差。原因是窗口变窄后，附近能提供信息的样本更少，估计也更容易受个别样本影响。

**带宽的尺度。**把与 $h$、$n$ 无关的系数分别记为正常数 $C_1,C_2$，均方误差的主要部分可以写成

$$
\operatorname{MSE}(h)\approx C_1h^4+\frac{C_2}{nh}.
$$

对 $h$ 求导并设为零，有 $4C_1h^3-C_2/(nh^2)=0$，即

$$
h^5=\frac{C_2}{4C_1n},\qquad h\propto n^{-1/5}.
$$

这就是常见的 $n^{-1/5}$ 带宽尺度的来源。它依赖前面的光滑性假设，以及两个主要系数均非零的条件；例如 $p^{\prime\prime}(x)=0$ 的位置，就需要进一步分析。这个结论说明带宽大致应当怎样随样本数变化，并不能直接给出任意数据的最佳带宽。详细推导见 [Wasserman 的《All of Nonparametric Statistics》第六章](https://link.springer.com/book/10.1007/0-387-30623-4)和文末的 CMU 讲义。

实际选择带宽时，可以把一部分样本留作验证，比较不同带宽对这些样本给出的对数密度，也可以采用交叉验证。不要只比较训练数据上的密度：高斯 KDE 在每个训练样本上都有一个以它自身为中心的核，带宽越小，这一项就越高，容易得到过小的带宽。对于只能取非负值等有边界的数据，还需要处理边界附近的估计偏差。实现细节可参考 [scikit-learn 的密度估计文档](https://scikit-learn.org/stable/modules/density.html)。

{% include density-figure.html kind="smoothing" %}

### 4.5 k 近邻：让窗口宽度随位置变化

固定带宽时，样本密集的地方窗口里有很多点，稀疏的地方可能几乎没有点。另一种选择是固定窗口内要包含的样本数，让窗口大小随位置变化。

**k 近邻方法**（k-nearest neighbors，kNN）就是这样做的：先选定 $k$，再从位置 $x$ 向两侧扩大区间，直到找到第 $k$ 个最近的样本。记这个样本到 $x$ 的距离为 $r_k(x)$，区间长度就是 $2r_k(x)$。代入局部计数公式，得到

$$
\widehat p_{\mathrm{kNN}}(x)=\frac{k}{2n r_k(x)}.
$$

在密集区域，找到 $k$ 个样本只需很小的区间，所以估计密度较高；在稀疏区域，需要覆盖更大的范围，估计密度较低。多维时用邻域体积替换区间长度即可。$k$ 越小，估计越容易波动；$k$ 越大，局部细节则越容易被平均掉。

例如，总共有 100 个样本，取 $k=10$。若第 10 个近邻的距离为 0.25，密度估计为 $10/(100\times0.5)=0.2$；在另一个位置，若这个距离为 1，密度估计就变成 $10/(100\times2)=0.05$。

不过，这个公式给出的是局部密度估计，不能保证整条曲线的积分为 1。对一维有限样本来说，当 $x$ 远离所有样本时，$r_k(x)$ 大致随 $\lvert x\rvert$ 增长，估计值的尾部约为 $1/\lvert x\rvert$，而它的积分会发散。因此，若要得到一个用于生成样本的完整概率分布，还需要额外处理。

{% include density-figure.html kind="neighbors" %}

### 4.6 为什么近邻分类等价于数票？

如果样本还带有类别标签，近邻计数就能用于分类。设 $x$ 的同一个邻域中共有 $k$ 个样本，其中 $k_j$ 个属于类别 $C_j$；全体 $n$ 个训练样本中，该类有 $n_j$ 个。用同一邻域体积 $V$ 分别估计总体密度、类内密度和类别先验：

$$
\widehat p(x)\approx\frac{k}{nV},\quad
\widehat p(x\mid C_j)\approx\frac{k_j}{n_jV},\quad
\widehat P(C_j)=\frac{n_j}{n}.
$$

将它们代入贝叶斯公式 $P(C_j\mid x)=p(x\mid C_j)P(C_j)/p(x)$，便得到

$$
\widehat P(C_j\mid x)\approx
\frac{k_j}{n_jV}\frac{n_j}{n}\frac{nV}{k}
=\frac{k_j}{k}.
$$

类内密度中的频率是 $k_j/n_j$，因为此时只统计第 $j$ 类的样本。乘以这类样本在全体中的比例 $n_j/n$，再除以总体密度后，$n_j$、$n$ 和 $V$ 都被约掉，只剩邻域中的类别比例 $k_j/k$。

例如，10 个近邻中有 7 个属于第一类、3 个属于第二类，估计的类别概率就是 0.7 和 0.3，选择概率最大的类别就得到多数投票。这个推导要求各类使用同一个邻域；如果每一类分别选择不同半径，不能这样约分。

## 5. 高斯混合模型与 EM 算法

### 5.1 高斯混合模型

高斯 KDE 在每个样本处放一个高斯分布，样本越多，需要保留的分布也越多。如果数据主要集中成几团，可以尝试用少数几个高斯分布描述它们，同时根据样本估计每个分布的位置、宽度和比例。

例如，两台机器生产的零件混在一起，每台机器的零件长度各自近似服从正态分布。随机取一个零件，可以看作先选中了某台机器，再从这台机器的长度分布中取样。把选中第 $j$ 个分布的概率记为 $\pi_j$，把分布编号记为 $Z$，则

$$
P(Z=j)=\pi_j,\qquad
p(x\mid Z=j)=\mathcal N(x\mid\mu_j,v_j),
$$

如果只知道零件长度 $x$，不知道它来自哪台机器，编号 $Z$ 就是一个**隐变量**。对所有可能的来源求和，得到整体密度：

$$
p(x\mid\theta)=\sum_{j=1}^{M}\pi_j\mathcal N(x\mid\mu_j,v_j),
\quad \pi_j\geq0,\quad\sum_j\pi_j=1.
$$

这个分布称为**高斯混合模型**（Gaussian mixture model，GMM），每一个高斯分布称为一个分量。由于各分量的密度积分为 1，混合权重之和也是 1，整体密度的积分仍为 1。

分量不一定真的对应某个已知群体。它们也可以只是为拟合复杂密度而引入的数学模型；交换分量编号不会改变整体分布。

待估计的参数 $\theta$ 包括所有混合权重 $\pi_j$、均值 $\mu_j$ 和方差 $v_j$。高斯 KDE 可以看成这个模型的一种特殊形式：分量数取 $M=n$，均值固定在样本 $x_i$ 上，权重统一为 $1/n$，方差统一为 $h^2$。而拟合 GMM 时，这些参数需要由数据估计。

仍然采用最大似然估计时，目标函数是

$$
\ell(\theta)=\sum_{i=1}^{n}
\log\!\left[\sum_{j=1}^{M}\pi_j\mathcal N(x_i\mid\mu_j,v_j)\right].
$$

与单个高斯相比，困难在于对数内部还有一个求和。由于 $\log(a+b)$ 不能拆成 $\log a+\log b$，各个分量的参数无法直接分开求解。

但如果每个样本的来源已知，问题就简单得多：把样本按来源分组，每一组分别估计均值、方差，再用组内样本数除以总样本数估计混合比例。EM 算法正是从这个容易求解的情况出发。

用 $s_{ij}=\mathbf1(Z_i=j)$ 表示样本的归属：样本 $i$ 来自分量 $j$ 时取 1，否则取 0。如果连这些归属也已观测到，完整数据的对数似然就是

$$
\ell_{\mathrm c}(\theta)
=\sum_{i=1}^{n}\sum_{j=1}^{M}s_{ij}
\left[\log\pi_j+\log\mathcal N(x_i\mid\mu_j,v_j)\right].
$$

每个样本只有一个 $s_{ij}$ 为 1，因此内层求和只保留它所属分量的那一项。这样，对数里便没有了求和，可以分别求解各组参数。实际困难是 $s_{ij}$ 未知；EM 用各个归属的条件概率作为权重，构造一个可以求解的平均目标。

### 5.2 EM：先软分配，再重新估计

**E 步：计算各个样本的归属概率。**先给定一组初始均值、正的方差和混合权重。记第 $t$ 轮参数为 $\theta^{(t)}$。根据这组参数，用贝叶斯公式计算样本 $x_i$ 来自分量 $j$ 的概率，称为**责任度**：

$$
\gamma_{ij}^{(t)}
=P(Z_i=j\mid x_i,\theta^{(t)})
=\frac{\pi_j^{(t)}\mathcal N(x_i\mid\mu_j^{(t)},v_j^{(t)})}
{\sum_\ell\pi_\ell^{(t)}\mathcal N(x_i\mid\mu_\ell^{(t)},v_\ell^{(t)})}.
$$

分子是第 $j$ 个分量在 $x_i$ 处的加权密度，分母是所有分量的加权密度之和。例如，两个分量的权重都是 0.5，在 $x_i$ 处的密度分别为 0.6 和 0.2，那么加权后分别是 0.3 和 0.1，归属概率就是 $0.3/0.4=0.75$ 和 $0.1/0.4=0.25$。

对于同一个样本，各个分量的责任度相加为 1。因为 $s_{ij}$ 只取 0 和 1，它的条件期望正好就是取 1 的条件概率：

$$
\mathbb E[s_{ij}\mid\mathcal D,\theta^{(t)}]=\gamma_{ij}^{(t)}.
$$

样本相互独立，所以给定模型参数后，判断第 $i$ 个样本的归属只需要它自身的观测值 $x_i$。在完整数据对数似然中，对未知的 $s_{ij}$ 取条件期望，就相当于把它替换为责任度。得到

$$
Q(\theta\mid\theta^{(t)})
=\sum_{i,j}\gamma_{ij}^{(t)}
\left[\log\pi_j+\log\mathcal N(x_i\mid\mu_j,v_j)\right].
$$

这就是 E 步中“期望”的含义。$Q$ 是完整数据对数似然在当前归属概率下的平均值；$i$ 遍历样本，$j$ 遍历分量。计算责任度用的是旧参数 $\theta^{(t)}$。接下来的 M 步保持这些责任度不变，再求使 $Q$ 最大的新参数 $\theta$。

**M 步：根据责任度重新估计参数。**记 $N_j=\sum_i\gamma_{ij}^{(t)}$，它是分配给第 $j$ 个分量的加权样本数。例如，一个责任度为 0.75 的样本，在这一组中按 0.75 的权重参与计算。$N_j$ 可以不是整数，但所有组的 $N_j$ 之和仍是 $n$。

把 $Q$ 中的高斯对数密度展开，并把不含待估计参数的项合并为常数：

$$
Q=\sum_jN_j\log\pi_j
-\frac12\sum_jN_j\log v_j
-\frac12\sum_j\frac1{v_j}\sum_i\gamma_{ij}^{(t)}(x_i-\mu_j)^2
+\text{const}.
$$

先对 $\mu_j$ 求导。与单高斯的计算相比，每个样本的平方误差前多了权重 $\gamma_{ij}^{(t)}$，所以结果是加权平均：

$$
\frac{\partial Q}{\partial\mu_j}
=\frac1{v_j}\sum_i\gamma_{ij}^{(t)}(x_i-\mu_j)=0
\quad\Longrightarrow\quad
\mu_j^{(t+1)}=\frac{\sum_i\gamma_{ij}^{(t)}x_i}{N_j}.
$$

再对 $v_j$ 求导，得到

$$
\frac{\partial Q}{\partial v_j}
=-\frac{N_j}{2v_j}
+\frac{\sum_i\gamma_{ij}^{(t)}(x_i-\mu_j)^2}{2v_j^2}=0.
$$

代入刚求出的均值，方差更新为

$$
v_j^{(t+1)}=\frac1{N_j}\sum_i\gamma_{ij}^{(t)}
(x_i-\mu_j^{(t+1)})^2.
$$

最后估计混合权重。$Q$ 中只有 $\sum_jN_j\log\pi_j$ 与它有关，同时还要满足 $\sum_j\pi_j=1$。引入拉格朗日乘子 $\lambda$，对 $\sum_jN_j\log\pi_j+\lambda(1-\sum_j\pi_j)$ 求导，得到 $N_j/\pi_j=\lambda$。于是 $\pi_j=N_j/\lambda$。再利用权重之和为 1，可知 $\lambda=\sum_jN_j=n$，从而

$$
\pi_j^{(t+1)}=\frac{N_j}{n}.
$$

因此，M 步仍然是估计各组的均值、方差和样本比例，只不过这里使用的是概率权重，而不是把每个样本完全划入某一组。均值和方差公式要求 $N_j>0$；如果出现空分量，需要重新初始化或采取其他处理。

例如，两个观测为 $0,2$，它们属于第一个分量的概率分别为 0.75、0.25。那么该组的加权样本数为 $N_1=1$，均值为 $(0.75\times0+0.25\times2)/1=0.5$，方差为 $[0.75(0-0.5)^2+0.25(2-0.5)^2]/1=0.75$，混合权重为 $1/2$。第二个观测仍参与计算，只是影响较小。这种按概率分配样本的方法称为软分配。

更新参数后，再用新参数计算下一轮责任度，然后重复 M 步。这两步交替进行，就是**期望最大化**（expectation maximization，EM）算法。对于多维数据，均值仍是加权平均，协方差则用加权外积计算。

下图显示两个分量的加权密度、整体密度和各轮的观测对数似然。可以单步运行，也可以暂停动画后比较不同轮数的结果。

{% include density-figure.html kind="em" %}

### 5.3 为什么每一轮不会降低观测似然？

M 步提高的是 $Q$，而我们最初希望提高的是观测对数似然 $\ell$。要说明似然为什么也不会下降，就需要建立这两个目标之间的关系。证明的关键是构造一个始终不超过 $\ell$ 的函数，并让它在当前参数处与 $\ell$ 相等。这样，提高这个函数，就能保证下一轮的似然不会低于当前值。

先考虑一个样本。把参数为 $\theta$ 时，它属于第 $j$ 个分量的后验概率记为

$$
r_{ij}(\theta)=\frac{p(x_i,Z_i=j\mid\theta)}{p(x_i\mid\theta)}.
$$

再为这个样本取一组比较用的概率 $q_{ij}$，满足 $q_{ij}\geq0$、$\sum_jq_{ij}=1$。$q_i$ 表示这一整组概率，$r_i(\theta)$ 则表示模型给出的整组后验概率。先假设各项均为正，避免对零取对数；零项可以通过取极限处理。

由后验的定义可知，联合密度等于观测密度乘以后验概率。取对数后，$\log p(x_i,Z_i=j\mid\theta)=\log p(x_i\mid\theta)+\log r_{ij}(\theta)$。将它代入下面的加权和：

$$
\begin{aligned}
\sum_jq_{ij}\log\frac{p(x_i,Z_i=j\mid\theta)}{q_{ij}}
&=\log p(x_i\mid\theta)
+\sum_jq_{ij}\log\frac{r_{ij}(\theta)}{q_{ij}}\\
&=\log p(x_i\mid\theta)
-D_{\mathrm{KL}}(q_i\Vert r_i(\theta)).
\end{aligned}
$$

第一步把联合密度拆开，且 $\log p(x_i\mid\theta)$ 不随 $j$ 改变，所以它的加权平均仍是自身。第二步使用 KL 散度的定义：$D_{\mathrm{KL}}(q_i\Vert r_i)=\sum_jq_{ij}\log(q_{ij}/r_{ij})$。

把这个等式对所有样本相加，并将左边记为

$$
\mathcal F(q,\theta)
=\sum_{i,j}q_{ij}\log\frac{p(x_i,Z_i=j\mid\theta)}{q_{ij}},
$$

便得到

$$
\ell(\theta)
=\mathcal F(q,\theta)
+\sum_iD_{\mathrm{KL}}(q_i\Vert r_i(\theta)).
$$

KL 散度非负，所以 $\mathcal F(q,\theta)\leq\ell(\theta)$，也就是说，$\mathcal F$ 是观测对数似然的下界。

KL 的非负性可由 $\log u\leq u-1$ 证明。取 $u=r_{ij}/q_{ij}$，乘以 $q_{ij}$ 后求和，有 $\sum_jq_{ij}\log(r_{ij}/q_{ij})\leq\sum_j(r_{ij}-q_{ij})=0$。左边取相反数就是 KL，因此 KL 不小于零。

E 步恰好取 $q_{ij}^{(t)}=r_{ij}(\theta^{(t)})=\gamma_{ij}^{(t)}$。此时参与比较的两组概率完全相同，KL 为零，下界便等于当前的观测对数似然。

固定 E 步算出的责任度后，把 $\mathcal F$ 展开：

$$
\mathcal F(q^{(t)},\theta)
=\underbrace{\sum_{i,j}\gamma_{ij}^{(t)}
\log p(x_i,Z_i=j\mid\theta)}_{Q(\theta\mid\theta^{(t)})}
-\underbrace{\sum_{i,j}\gamma_{ij}^{(t)}\log\gamma_{ij}^{(t)}}_{\text{与新参数无关}}.
$$

第一项就是 M 步优化的 $Q$，第二项只含已经固定的责任度。因此，增大 $Q$ 就会增大 $\mathcal F$。再结合下界关系，有

$$
\ell(\theta^{(t+1)})
\geq\mathcal F(q^{(t)},\theta^{(t+1)})
\geq\mathcal F(q^{(t)},\theta^{(t)})
=\ell(\theta^{(t)}).
$$

右端的等号来自 E 步：下界在旧参数处等于旧似然。中间的不等号来自 M 步：更新参数后，下界不减。左端的不等号则来自下界的定义：新似然不会低于更新后的下界。合起来就说明，新似然不会低于旧似然。

这个结论要求 E 步使用准确的后验，M 步确实提高同一约束下的 $Q$；也允许似然保持不变。原始分析见 [Dempster、Laird 与 Rubin 的论文](https://doi.org/10.1111/j.2517-6161.1977.tb01600.x)，下界的解释见 [Neal 与 Hinton 的论文](https://www.cs.toronto.edu/~hinton/absps/emk.pdf)。

### 5.4 似然上升之后，还要检查什么？

**初始参数会影响结果。**EM 只保证迭代时似然不下降，并不保证找到全局最优解。不同初始参数可能得到不同结果。如果两个分量的初始参数完全相同，它们的责任度和后续更新也会相同，通常无法自行分开。因此应尝试多个初始化，再比较结果。

**方差可能缩到零。**如果某个分量的均值落在一个样本上，方差不断缩小，这个样本处的密度就可能无限增大，使训练似然没有有限的最大值。交互图给方差设置了下限 $v_j\geq0.04$，因此更新时取加权方差与 0.04 中的较大者。这个下限只是图中使用的约束，实际应用中需要结合数据尺度选择。

**分量数需要另外选择。**增加分量通常可以改善训练拟合，却不一定能提高对新数据的预测效果。设参数个数为 $q$、样本量为 $n$，常用的两个比较指标是

$$
\operatorname{AIC}=2q-2\ell(\widehat\theta),
\qquad
\operatorname{BIC}=q\log n-2\ell(\widehat\theta),
$$

AIC 和 BIC 都取较小值。它们一方面用 $-2\ell$ 衡量拟合效果，另一方面惩罚参数过多。一个包含 $M$ 个分量的一维 GMM，有 $M$ 个均值、$M$ 个方差，以及 $M-1$ 个独立的混合权重，所以 $q=3M-1$。最后一个权重由总和为 1 的条件确定。这里的 $q$ 表示参数个数，与证明中的 $q_{ij}$ 无关。

不过，混合模型可能不满足这些指标在推导时所用的正则性条件。某个分量数得分更好，并不能证明真实数据一定来自这么多个群体。还应检查方差是否退化，并比较模型在未参与拟合的数据上的表现。

EM 也用于其他含有隐变量或缺失数据的模型。共同思路是：先计算缺失部分的条件分布，再对完整数据的对数似然取期望并优化。GMM 的详细推导可参考 [Bilmes 的 EM 教程](https://people.ece.uw.edu/bilmes/p/pgs/b2hd-bilmes1997-em.html)，实现与模型选择可参考 [scikit-learn 的混合模型文档](https://scikit-learn.org/stable/modules/mixture.html)。

## 6. 怎样选择一种方法？

| 方法 | 主要假设或选择 | 容易忽略的问题 |
| --- | --- | --- |
| 单高斯 MLE | 单峰椭球结构、均值与协方差 | 数据不足、模型形状不匹配、协方差奇异 |
| 贝叶斯参数估计 | 似然、先验与后验计算方法 | 先验是否合适，是否遗漏参数不确定性 |
| 直方图 | 箱宽与边界位置 | 不连续、对边界敏感、高维箱数爆炸 |
| KDE | 核、带宽、距离与尺度 | 带宽选择、边界偏差、查询与存储成本 |
| kNN 局部估计 | 近邻数、距离与邻域体积 | 距离尺度、高维稀疏、全局归一化不成立 |
| GMM + EM | 分量数、协方差结构与初始化 | 奇异解、局部驻点、对称初始化 |

选择方法时，先考虑估计密度的用途。如果只是观察一维数据的分布形状，直方图和 KDE 往往就够了；如果希望用少量参数表示分布，可以从单高斯或 GMM 开始。确定候选方法后，再用未参与拟合的数据比较结果，避免只根据训练样本上的拟合效果作决定。

## 7. 检查理解

1. 为什么似然是参数的函数，却不需要对参数积分为 1？
2. 高斯 MLE 的方差为什么用 $n$，而不是 $n-1$？
3. 后验均值与新观测的预测均值相同，是否意味着它们的方差也相同？
4. KDE 的 $1/h$ 或 $1/h^d$ 在归一化中起什么作用？
5. 为什么同一批样本的近邻半径随查询位置改变？为什么朴素 kNN 公式不能直接充当归一化生成密度？
6. EM 的 E 步为什么用责任度，而不是必须先做硬分类？
7. 对数似然每轮上升，为什么仍要检查初始化、方差塌缩和测试集表现？

**参考答案。**

1. 密度函数固定参数、考察数据；似然函数固定数据、考察参数。似然不被当作参数的概率分布，所以不要求对参数积分为 1。
2. 分母为 $n$ 的方差使高斯似然最大，分母为 $n-1$ 的方差则满足无偏性，两者采用了不同准则。
3. 不相同。预测新观测时，除了均值估计的不确定性，还要加上观测噪声的方差。
4. 带宽改变了核的宽度，$1/h$ 或 $1/h^d$ 用来保持核的积分为 1。
5. 近邻方法固定的是样本数，密集位置所需的半径较小，稀疏位置所需的半径较大。朴素估计的远端尾部可能不可积，所以不能直接当作完整的生成密度。
6. 责任度是归属指示变量的条件期望。它允许一个样本按不同概率参与各个分量的估计，而不必立即确定唯一归属。
7. 似然不下降只描述迭代过程，不能保证全局最优、排除方差退化，也不能保证对新数据的预测效果。

## 8. 符号与缩写

| 记号 | 含义 |
| --- | --- |
| $\mathcal D,n,d$ | 观测数据、样本数、数据维数 |
| $L,\ell,\widehat\theta_{\mathrm{ML}}$ | 似然、对数似然、最大似然参数估计 |
| $\sigma^2,\tau_0^2,\tau_n^2$ | 观测方差、均值参数的先验方差与后验方差 |
| $K,h,k,r_k(x)$ | 核函数、带宽、近邻数、第 k 个近邻的距离 |
| $M,\pi_j,\gamma_{ij},N_j$ | 混合分量数、权重、责任度、有效样本数 |
| $s_{ij},Q,\mathcal F$ | 归属指示变量、期望完整数据对数似然、观测对数似然的下界 |
| $r_{ij}(\theta),q_{ij}$ | 模型给出的归属后验、证明中用于比较的归属权重 |
| MLE / MAP / KDE / kNN | 最大似然 / 最大后验 / 核密度估计 / k 近邻 |
| GMM / EM | 高斯混合模型 / 期望最大化 |
| AIC / BIC | 赤池信息准则 / 贝叶斯信息准则 |

## 9. References

1. **A. P. Dempster、N. M. Laird、D. B. Rubin，1977。** [*Maximum Likelihood from Incomplete Data via the EM Algorithm*](https://doi.org/10.1111/j.2517-6161.1977.tb01600.x)。EM 的原始论文，包含似然单调性与收敛分析。
2. **Jeff A. Bilmes。** [*A Gentle Tutorial of the EM Algorithm and Its Application to Parameter Estimation for Gaussian Mixture and Hidden Markov Models*, TR-97-021](https://people.ece.uw.edu/bilmes/p/pgs/b2hd-bilmes1997-em.html)。分步骤推导混合模型与隐马尔可夫模型的参数更新。
3. **Radford M. Neal、Geoffrey E. Hinton，1998。** [*A View of the EM Algorithm that Justifies Incremental, Sparse, and Other Variants*](https://www.cs.toronto.edu/~hinton/absps/emk.pdf)。通过分布与参数交替优化的视角理解 EM。
4. **scikit-learn 官方文档。** [*Density Estimation*](https://scikit-learn.org/stable/modules/density.html) 与 [*Gaussian Mixture Models*](https://scikit-learn.org/stable/modules/mixture.html)。核函数、带宽、混合模型及模型选择的实践参考。
5. **Larry Wasserman，2006。** [*All of Nonparametric Statistics*, Chapter 6: Density Estimation](https://link.springer.com/book/10.1007/0-387-30623-4)。直方图与核密度估计的误差分析、带宽阶数及相关证明。
6. **Pradeep Ravikumar，CMU 10-716。** [*Nonparametric Density Estimation*](https://www.cs.cmu.edu/~pradeepr/716/files_sp24/lect_notes/densityestimation.pdf)。基于 Wasserman 讲义修订，可直接阅读核密度的偏差、方差和带宽推导。

**勘误。**如有公式、术语或理解上的疏漏，欢迎指出。
