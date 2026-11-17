---
title: "概率统计基础"
date: 2026-10-27
lang: zh
permalink: /zh/probability-statistics/
en_link: /en/probability-statistics/
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
toc_label: 本文目录
toc_sticky: true
excerpt: "从随机变量、常见分布到贝叶斯公式、指数族与交叉熵，用一条连续的思路和五组交互图理解机器学习的概率统计基础。"
---

{% include statistics-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

一个分类器为什么输出概率？回归里的平方误差为什么总与高斯分布一起出现？sigmoid、softmax 和交叉熵又是怎样连到一起的？这些看似分散的概念，其实共享同一套概率统计语言。

本篇从随机变量与分布出发，逐步连接贝叶斯推断、指数族与常见学习目标。图表可以直接调节参数，推导参考与延伸阅读放在文末。

---

## 1. 先确定：什么东西是随机的？

### 1.1 从数据生成过程到随机变量

考虑一张图片及其类别。在拿到图片之前，我们不知道它的像素，也不知道它属于哪个类别；拿到图片之后，像素已经确定，但类别仍可能不明确。我们可以用随机变量 $X$ 表示输入，用 $Y$ 表示类别，再用一个联合分布 $p(x,y)$ 描述它们怎样共同出现。

更正式地说，随机变量是把随机试验的结果映射为数值的函数。大写的 $X$ 表示变量，小写的 $x$ 表示它的一次取值。随机向量则把多个分量合在一起，例如一张图片的像素向量 $\mathbf X$。

这给了机器学习一个出发点：数据来自某个未知的生成过程，我们只有有限的样本。概率模型提出关于这个过程的假设，统计推断再用数据估计其中的参数。模型的假设很重要——连续收集的传感器读数未必独立，训练与部署时的分布也未必相同。

### 1.2 离散概率与连续密度

如果 $X$ 只能取有限或可数个值，例如类别编号，我们用**概率质量函数**（probability mass function，PMF）直接给每个值分配概率：

$$
p_X(x)=P(X=x),\qquad p_X(x)\geq 0,\qquad \sum_x p_X(x)=1.
$$

如果 $X$ 有概率密度，例如连续测量误差，那么 $p_X(x)$ 描述的是概率在 $x$ 附近聚集的程度。概率要靠区间上的积分得到：

$$
P(a\leq X\leq b)=\int_a^b p_X(x)\,dx,
\qquad \int_{-\infty}^{\infty}p_X(x)\,dx=1.
$$

对于这样的连续变量，单点概率 $P(X=x)=0$。**密度的高度不是单点概率，密度也可以大于 1。**例如 $X\sim\mathcal U(0,0.2)$ 的密度在区间内等于 5，但总面积仍然是 $5\times0.2=1$。

若希望用统一方式表示“落在某个阈值之前的概率”，就引入**累积分布函数**（cumulative distribution function，CDF）：

$$
F_X(t)=P(X\leq t).
$$

离散情形通过累加 PMF 得到 CDF，有密度的连续情形通过积分得到它。实际做预测区间、分位数和阈值判断时，CDF 往往比某一点的密度更直接。

## 2. 常见分布：先问它描述什么，再看公式

### 2.1 一次成功、成功次数与事件计数

最简单的问题只有两种结果。设 $X\in\lbrace 0,1\rbrace$，成功概率为 $\theta$，那么

$$
p(x\mid\theta)=\theta^x(1-\theta)^{1-x},
\qquad X\sim\operatorname{Bernoulli}(\theta).
$$

这个紧凑写法只是把 $p(1)=\theta$ 与 $p(0)=1-\theta$ 合在一起。它的均值和方差为 $\mathbb E[X]=\theta$、$\operatorname{Var}(X)=\theta(1-\theta)$。二分类器预测的概率，就可以作为这样一个分布的参数。

如果问题变成“独立地重复 $n$ 次，有多少次成功”，令 $M=X_1+\cdots+X_n$。当每次试验独立且成功概率相同，$M$ 服从**二项分布**：

$$
P(M=m)=\binom nm\theta^m(1-\theta)^{n-m},
\qquad m=0,\ldots,n.
$$

其中 $\theta^m(1-\theta)^{n-m}$ 是某个确定排列的概率；$\binom nm$ 则数出了有多少种排列产生相同的成功次数。因此

$$
\mathbb E[M]=n\theta,\qquad
\operatorname{Var}(M)=n\theta(1-\theta).
$$

有些计数没有自然的试验总次数，例如一小段时间内到达的请求数。让二项模型中的 $n\to\infty$、$\theta\to0$，同时保持 $n\theta=\lambda$，得到**泊松分布**：

$$
P(M=m)=\frac{\lambda^m e^{-\lambda}}{m!},
\quad m=0,1,\ldots,\qquad
\mathbb E[M]=\operatorname{Var}(M)=\lambda.
$$

这里 $\lambda$ 是给定观察区间内的平均事件数。如果用恒定事件率 $r$ 建模，长度为 $\Delta t$ 的区间对应 $\lambda=r\Delta t$。例如假设请求符合泊松过程、平均每秒到达 40 次，那么 0.01 秒内至少出现一次的概率是 $1-e^{-0.4}\approx0.3297$。这一结论依赖模型假设；出现明显聚集或随时间变化的到达率时，就不能直接套用。

{% include statistics-figure.html kind="discrete" %}

### 2.2 从二分类到多分类

一次试验有 $K$ 个互斥类别时，用独热编码（one-hot encoding）$\mathbf x$ 表示结果：只有一个分量等于 1，其余为 0。设类别概率为 $\boldsymbol\pi=(\pi_1,\ldots,\pi_K)^\top$，其中 $\pi_k\geq0$ 且 $\sum_k\pi_k=1$。**类别分布**（categorical，也称 multinoulli）写成

$$
p(\mathbf x\mid\boldsymbol\pi)=\prod_{k=1}^{K}\pi_k^{x_k},
\qquad \mathbb E[\mathbf X]=\boldsymbol\pi.
$$

这正是伯努利分布从两个类别到多个类别的推广。若独立重复 $n$ 次，统计各类别出现次数 $\mathbf M=(M_1,\ldots,M_K)$，便得到**多项分布**：

$$
P(\mathbf M=\mathbf m)
=\frac{n!}{\prod_{k=1}^{K}m_k!}\prod_{k=1}^{K}\pi_k^{m_k},
\qquad \sum_{k=1}^{K}m_k=n.
$$

每个计数的均值是 $n\pi_k$、方差是 $n\pi_k(1-\pi_k)$；不同类别的计数则满足

$$
\operatorname{Cov}(M_j,M_k)=-n\pi_j\pi_k,\qquad j\ne k.
$$

负号有很直接的原因：总次数固定，一个类别多占一次，其他类别能分到的次数就少一次。**不同试验可以独立，但同一次统计里的各类别计数并不独立。**

### 2.3 连续变量与高斯分布

均匀分布 $\mathcal U(a,b)$ 认为区间内等长的小段应有相同概率，因而密度为 $1/(b-a)$。如果取值更集中在某个中心附近，一个常用模型是**高斯分布**：

$$
p(x\mid\mu,\sigma^2)
=\frac{1}{\sqrt{2\pi}\,\sigma}
\exp\!\left[-\frac{(x-\mu)^2}{2\sigma^2}\right],\qquad \sigma>0.
$$

$\mu$ 决定中心，$\sigma$ 决定散布尺度，而 $\sigma^2$ 是方差。分母中的归一化系数保证：曲线变宽时必须变矮，曲线变窄时必须变高，才能保持面积为 1。

若记标准正态分布的 CDF 为 $\Phi$，区间概率便可写为

$$
P(a\leq X\leq b)
=\Phi\!\left(\frac{b-\mu}{\sigma}\right)
-\Phi\!\left(\frac{a-\mu}{\sigma}\right),\qquad a\leq b.
$$

{% include statistics-figure.html kind="gaussian" %}

### 2.4 为什么高斯分布经常出现？

一种解释来自许多小扰动的累积。设 $X_1,\ldots,X_n$ **独立同分布**（independent and identically distributed，i.i.d.），均值为 $\mu$，方差满足 $0<\sigma^2<\infty$。经典的**中心极限定理**（central limit theorem，CLT）给出

$$
Z_n=\frac{\sum_{i=1}^{n}X_i-n\mu}{\sigma\sqrt n}
\xrightarrow{\mathrm d}\mathcal N(0,1).
$$

需要趋近高斯的是**中心化、标准化之后的和**。原始和的均值为 $n\mu$、方差为 $n\sigma^2$，二者会随 $n$ 增长；样本平均值的方差却是 $\sigma^2/n$。这两个方向相反的变化，解释了为什么总误差可能变宽，而平均误差逐渐集中。

也不能从 CLT 推出“任何数据都应该用高斯分布拟合”。强依赖、无限方差或复杂的混合群体，都可能使这条直觉失效；有限样本下的近似效果也取决于原分布。

下图沿用“把均匀变量相加”的问题，但重新计算并绘制密度。此时 $\mu=1/2$、$\sigma^2=1/12$，因而 $Z_n=(\sum_iX_i-n/2)/\sqrt{n/12}$。关于标准化与收敛条件，可以继续读 [ProbabilityCourse 的 CLT 章节](https://www.probabilitycourse.com/chapter7/7_1_2_central_limit_theorem.php)。

{% include statistics-figure.html kind="clt" %}

### 2.5 多维高斯的形状由协方差决定

一个数据点通常不止一个分量。把均值扩展为向量 $\boldsymbol\mu$，把方差扩展为协方差矩阵 $\Sigma$，就得到 $D$ 维高斯密度：

$$
p(\mathbf x)
=\frac{1}{(2\pi)^{D/2}|\Sigma|^{1/2}}
\exp\!\left[-\frac12(\mathbf x-\boldsymbol\mu)^\top
\Sigma^{-1}(\mathbf x-\boldsymbol\mu)\right].
$$

这里假设 $\Sigma$ 对称正定；奇异协方差对应集中在低维子空间上的退化高斯，不能直接代入这个含逆矩阵的密度公式。$\det(\Sigma)$ 表示行列式，$\Lambda=\Sigma^{-1}$ 称为精度矩阵。

指数中的二次型

$$
d_M^2=(\mathbf x-\boldsymbol\mu)^\top\Sigma^{-1}
(\mathbf x-\boldsymbol\mu)
$$

是马氏距离的平方。若 $\Sigma=U\operatorname{diag}(\lambda_1,\ldots,\lambda_D)U^\top$，并令 $z_i=\mathbf u_i^\top(\mathbf x-\boldsymbol\mu)$，则

$$
d_M^2=\sum_{i=1}^{D}\frac{z_i^2}{\lambda_i}.
$$

这说明高斯分布会沿自己的主轴衡量距离：本来就变化很大的方向，走出同样的欧氏距离并不算特别异常。等密度线因此是椭圆，主轴方向是特征向量，轴的尺度与 $\sqrt{\lambda_i}$ 成正比。

## 3. 观测到数据之后，怎样更新判断？

### 3.1 联合、边缘与条件是同一张分布的不同视角

联合分布 $p(x,y)$ 描述两个变量共同发生的情况。如果只关心 $X$，就把 $Y$ 的所有可能性加起来：

$$
p(x)=\sum_y p(x,y)
\quad\text{或}\quad
p(x)=\int p(x,y)\,dy.
$$

这叫**边缘化**。它是把不关心的变量消去；并不要求这个变量与其他变量独立。

如果 $Y=y$ 已经观测到，我们需要把注意力限制在这个条件下，再重新归一化：

$$
p(x\mid y)=\frac{p(x,y)}{p(y)},
\qquad p(x,y)=p(x\mid y)p(y).
$$

对离散事件要求 $P(Y=y)>0$；对有联合密度的连续变量，密度比公式用于 $p_Y(y)>0$ 的位置，并不意味着单点事件 $Y=y$ 有正概率。

反复使用乘法公式，就得到**概率链式法则**：

$$
p(x_1,\ldots,x_D)
=p(x_1)\prod_{j=2}^{D}p(x_j\mid x_1,\ldots,x_{j-1}).
$$

链式法则本身不需要独立假设。如果 $X$ 与 $Y$ 独立，才可以进一步写成 $p(x,y)=p(x)p(y)$。条件独立则是另一件事：$X\perp Y\mid Z$ 表示在给定 $Z$ 后可以分解条件分布，不保证它们在边缘分布下独立。

### 3.2 贝叶斯公式把“生成数据”反过来用

如果我们容易描述某个类别会产生什么观测，即 $p(x\mid y)$，但实际要回答的是“看见 $x$ 后属于哪个类别”，就把联合分布按两个方向分解：

$$
p(y\mid x)=\frac{p(x\mid y)p(y)}{p(x)},
\qquad p(x)=\sum_y p(x\mid y)p(y).
$$

$p(y)$ 是先验，$p(x\mid y)$ 是把 $y$ 视为待比较假设时的似然，$p(y\mid x)$ 是后验。分母 $p(x)$ 汇总所有类别生成该观测的可能性，确保后验概率相加为 1。

**例子。**假设 10% 的邮件是垃圾邮件；某个词在垃圾邮件中出现的概率为 0.8，在正常邮件中为 0.2。那么看见这个词后，邮件属于垃圾邮件的概率为

$$
\frac{0.8\times0.1}{0.8\times0.1+0.2\times0.9}
=\frac4{13}\approx0.3077.
$$

这个词确实提高了垃圾邮件的可能性，但 0.8 不是答案。较低的先验概率与正常邮件中也会出现该词的情况，都必须计算进去。

### 3.3 高斯分布为什么便于推断？

高斯分布有一个非常实用的封闭性质：联合分布是高斯时，边缘分布与条件分布仍是高斯。将随机向量分块：

$$
\begin{bmatrix}\mathbf X_a\\\mathbf X_b\end{bmatrix}
\sim\mathcal N\!\left(
\begin{bmatrix}\boldsymbol\mu_a\\\boldsymbol\mu_b\end{bmatrix},
\begin{bmatrix}\Sigma_{aa}&\Sigma_{ab}\\\Sigma_{ba}&\Sigma_{bb}\end{bmatrix}
\right).
$$

只看 $\mathbf X_a$ 时，直接取出对应的均值块和协方差块：$\mathbf X_a\sim\mathcal N(\boldsymbol\mu_a,\Sigma_{aa})$。而观测到 $\mathbf X_b=\mathbf x_b$ 之后，条件分布的参数为

$$
\boldsymbol\mu_{a\mid b}
=\boldsymbol\mu_a+\Sigma_{ab}\Sigma_{bb}^{-1}
(\mathbf x_b-\boldsymbol\mu_b),
$$

$$
\Sigma_{a\mid b}
=\Sigma_{aa}-\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}.
$$

第一式用观测偏离自身均值的程度修正预测中心；第二式减去已被观测解释的那部分不确定性。两者依赖跨变量的协方差块 $\Sigma_{ab}$。

最简单的二维例子里，两个变量均值为 0、方差为 1，相关系数为 $\rho$，于是

$$
\bigl(X\mid Y=y\bigr)\;\sim\;\mathcal N(\rho y,1-\rho^2),
\qquad |\rho|<1.
$$

左侧括号中的整体表示“给定 $Y=y$ 后的 $X$”：$y$ 是固定的观测值，仍然随机的是 $X$。

当 $\rho=0$，观测 $Y$ 不会改变 $X$ 的分布；$\lvert\rho\rvert$ 越大，观测提供的信息越多，条件方差越小。这里“不相关意味着独立”依赖**联合高斯**这一前提。

{% include statistics-figure.html kind="conditional" %}

## 4. 如何用几个数概括一整个分布？

### 4.1 期望是按概率加权的平均

知道分布后，我们经常关心某个函数 $f(X)$ 的平均表现，例如模型的损失。期望把每种取值的函数值按其概率加权：

$$
\mathbb E[f(X)]
=\sum_x f(x)p(x)
\quad\text{或}\quad
\mathbb E[f(X)]=\int f(x)p(x)\,dx.
$$

因此 $\mathbb E[X]$ 并不是“最可能出现的值”。公平骰子的期望是 3.5，但骰子不会掷出 3.5。条件期望也是同样的加权，只是把权重替换为条件分布 $p(x\mid y)$。

期望的线性性尤其有用：只要相关期望存在，就有

$$
\mathbb E\!\left[\sum_i a_iX_i+b\right]
=\sum_i a_i\mathbb E[X_i]+b.
$$

这里**不需要独立性**。独立性可以保证 $\mathbb E[XY]=\mathbb E[X]\mathbb E[Y]$，但这个等式成立本身不能反过来保证独立。一般也不能把函数移到期望外面，即 $\mathbb E[f(X)]\ne f(\mathbb E[X])$。

### 4.2 方差、协方差与二阶矩

平均值只告诉我们中心，还需要描述数据离中心有多远。对偏差取平方再求平均，得到方差：

$$
\operatorname{Var}(X)
=\mathbb E[(X-\mu)^2]
=\mathbb E[X^2]-\mu^2,\qquad \mu=\mathbb E[X].
$$

例如 $X$ 以相同概率取 $-1$ 与 $1$，则 $\mathbb E[X]=0$，但 $\mathbb E[X^2]=1$。这同时说明非线性变换与期望不能随意交换。

两个变量是否一起变化，由协方差描述：

$$
\operatorname{Cov}(X,Y)
=\mathbb E[(X-\mathbb E[X])(Y-\mathbb E[Y])]
=\mathbb E[XY]-\mathbb E[X]\mathbb E[Y].
$$

因此和的方差为

$$
\operatorname{Var}(X+Y)
=\operatorname{Var}(X)+\operatorname{Var}(Y)
+2\operatorname{Cov}(X,Y).
$$

独立变量的协方差为 0，可以直接相加方差。但零协方差只排除了这种线性共变关系。例如 $X\sim\mathcal U(-1,1)$、$Y=X^2$ 时，$\operatorname{Cov}(X,Y)=0$，而 $Y$ 显然由 $X$ 完全决定。

对向量，把所有分量间的协方差放在一个矩阵里：

$$
\Sigma=\mathbb E[(\mathbf X-\boldsymbol\mu)
(\mathbf X-\boldsymbol\mu)^\top],
\qquad \mathbb E[\mathbf X\mathbf X^\top]
=\Sigma+\boldsymbol\mu\boldsymbol\mu^\top.
$$

现在可以更准确地理解多维高斯公式里的 $\Sigma$：对角线给出每个方向的方差，非对角元素给出不同分量共同变化的程度。

### 4.3 从理论期望到样本估计

真实分布通常未知，也未必能解析积分。如果能够从 $p$ 独立抽取样本 $x_1,\ldots,x_n$，就可以用样本平均近似期望：

$$
\widehat{\mathbb E[f(X)]}
=\frac1n\sum_{i=1}^{n}f(x_i).
$$

当 $\mathbb E[\lvert f(X)\rvert]<\infty$ 时，大数定律保证这种平均会收敛到期望。若方差有限，估计量的方差为 $\operatorname{Var}(f(X))/n$，所以标准误差按 $1/\sqrt n$ 缩小。随机抽样能近似积分，但想把误差缩小到原来一半，通常需要约四倍样本。

以均值和方差为例，i.i.d. 样本给出

$$
\bar x=\frac1n\sum_{i=1}^{n}x_i,
\qquad s^2=\frac1{n-1}\sum_{i=1}^{n}(x_i-\bar x)^2,\quad n>1.
$$

这里 $s^2$ 用 $n-1$ 修正了先用同一批数据估计均值带来的偏差。它与高斯模型中用分母 $n$ 的方差最大似然估计，解决的是不同的估计要求。

### 4.4 更高阶的矩描述什么？

原点矩为 $m_r=\mathbb E[X^r]$，中心矩为 $c_r=\mathbb E[(X-\mu)^r]$。二阶中心矩就是方差。比较不同尺度的分布时，我们通常进一步标准化：

$$
\text{偏度}=\frac{c_3}{\sigma^3},
\qquad \text{峰度}=\frac{c_4}{\sigma^4}.
$$

偏度刻画不对称性，峰度与尾部及极端值的表现有关，不能简单理解成曲线“有多尖”。高斯分布的峰度为 3，所以也常报告**超额峰度** $c_4/\sigma^4-3$。这些定义要求相应矩存在，不能对任意重尾分布直接套用。

## 5. 为什么很多分布能用同一种形式表达？

### 5.1 指数族把参数与数据分开

先把“自然参数、充分统计量”这些名字放到一边。**指数族可以从一个统一的构造过程理解：给结果打分，取指数得到正的权重，再归一化。**其中，分数写成参数与固定数据特征的线性组合。

从伯努利分布看这个过程。它只有 0 和 1 两个结果，我们用一个实数 $\eta$，把结果 $x$ 的分数设为 $\eta x$：

- 对结果 0，分数为 0，取指数后的权重为 $e^0=1$。
- 对结果 1，分数为 $\eta$，取指数后的权重为 $e^\eta$。

这些权重还没有加起来等于 1。除以总权重，就得到概率：

$$
P(X=0)=\frac1{1+e^\eta},
\qquad P(X=1)=\frac{e^\eta}{1+e^\eta}.
$$

例如取 $\eta=\log3$，两个权重就是 1 和 3，归一化后的概率分别为 $1/4$ 和 $3/4$。第二个概率的表达式正是 sigmoid。这里可以先看到，归一化如何把一个没有范围限制的实数参数，变成合法的二分类概率。

把这种构造推广，加入固定的基础权重 $h(x)$，就得到

$$
p(x\mid\boldsymbol\eta)
=\frac{h(x)\exp[\boldsymbol\eta^\top T(x)]}{Z(\boldsymbol\eta)}.
$$

每个符号都负责一件具体的事：

- **$T(x)$：从数据中取出的固定特征。**例如 $x$，或者向量 $(x,x^2)^\top$；它不随待估计参数改变。
- **$\boldsymbol\eta$：这些特征的权重。**点积 $\boldsymbol\eta^\top T(x)$ 给出分数，这些权重称为自然参数。
- **$h(x)$：预先固定的基础权重。**上面的伯努利例子中，它等于 1。
- **$Z(\boldsymbol\eta)$：所有未归一化权重的总和。**离散变量用求和，连续变量用积分，保证最终的概率或密度归一化。

文章中常用的指数族形式，只是把这个分母放进指数：令

$$
A(\boldsymbol\eta)=\log Z(\boldsymbol\eta),
$$

就有

$$
p(x\mid\boldsymbol\eta)
=h(x)\exp\!\left[
\boldsymbol\eta^\top T(x)-A(\boldsymbol\eta)\right].
$$

所以 **$A(\boldsymbol\eta)$ 首先可以理解成负责归一化的那一项**，正式名称是对数配分函数。连续情形下，

$$
A(\boldsymbol\eta)
=\log\int h(x)\exp[\boldsymbol\eta^\top T(x)]\,dx.
$$

离散情形把积分换成求和。允许的参数必须使归一化常数有限；这个结构本身不保证分布单峰。

再回头看 $T(x)$ 的正式名称：**充分统计量**。这里“充分”的意思是，在相应模型中，统计量保留了数据中用于推断该参数的信息。对独立样本，取对数后的似然会用到 $\sum_iT(x_i)$，而不一定需要保留每个样本的全部细节。这个观点解释了为什么均值、计数与平方和会反复出现在参数估计中。

高斯分布也能放进这个模板：取 $h(x)=1$、$T(x)=(x,x^2)^\top$，分数就是 $\eta_1x+\eta_2x^2$。当二次项系数为负时，取指数并归一化，就得到高斯形状，5.4 节会具体展开。指数族这个分类的价值，就在于伯努利、高斯、泊松等不同分布可以用这种固定结构分开数据特征与参数，后续的求导、求期望和参数估计便能共用一套方法。

### 5.2 伯努利分布自然引出 sigmoid

对伯努利 PMF 取对数并整理，在 $0<\theta<1$ 时有

$$
\begin{aligned}
\log p(x\mid\theta)
&=x\log\theta+(1-x)\log(1-\theta)\\
&=x\log\frac{\theta}{1-\theta}+\log(1-\theta).
\end{aligned}
$$

令自然参数 $\eta=\log[\theta/(1-\theta)]$，便得到 $T(x)=x$、$h(x)=1$、$A(\eta)=\log(1+e^\eta)$。这也解释了上一节中“分数”的含义：$\theta/(1-\theta)$ 是发生概率与不发生概率之比，称为几率（odds），$\eta$ 就是它的对数。反过来求概率：

$$
\theta=\frac{e^\eta}{1+e^\eta}
=\frac1{1+e^{-\eta}}=\operatorname{sigmoid}(\eta).
$$

自然参数可以取任意实数，而概率必须落在 $(0,1)$。sigmoid 正好连接了这两个空间。逻辑回归把 $\eta$ 建模为输入特征的线性函数，再通过 sigmoid 得到条件成功概率。

### 5.3 类别分布自然引出 softmax

多分类时给每一类一个实数得分 $\eta_k$，再用一个共同的归一化项：

$$
\pi_k=\frac{e^{\eta_k}}{\sum_{j=1}^{K}e^{\eta_j}},
\qquad A(\boldsymbol\eta)=\log\sum_{j=1}^{K}e^{\eta_j}.
$$

这就是 softmax。给所有得分加上相同常数不会改变概率，因此 $K$ 个得分有一个冗余自由度；也可以选择某一类作为基准，将它的得分固定为 0。

工程实现时，常先减去最大得分再求指数，避免溢出。这种数值处理利用的正是上述平移不变性。

### 5.4 高斯也属于指数族

展开一维高斯中的平方项：

$$
\log p(x)
=\frac\mu{\sigma^2}x-\frac1{2\sigma^2}x^2
-\frac{\mu^2}{2\sigma^2}-\frac12\log(2\pi\sigma^2).
$$

取 $T(x)=(x,x^2)^\top$，自然参数为 $(\mu/\sigma^2,-1/(2\sigma^2))^\top$。这里第二个自然参数必须为负，才能归一化。选取 $h(x)=1$ 时，剩下的项组成

$$
A(\boldsymbol\eta)
=-\frac{\eta_1^2}{4\eta_2}
+\frac12\log\!\left(-\frac\pi{\eta_2}\right),\qquad \eta_2<0.
$$

在可交换微分与积分等正则条件下，对数配分函数的一阶导数给出 $T(X)$ 的期望，二阶导数给出其协方差：

$$
\nabla A(\boldsymbol\eta)=\mathbb E[T(X)],
\qquad \nabla^2 A(\boldsymbol\eta)=\operatorname{Cov}(T(X)).
$$

这提供了连接“分布的参数”与“分布的矩”的统一方法。更系统的推导见 [Will Fithian 的指数族讲义](https://www.stat.berkeley.edu/~wfithian/courses/stat210a/exponential-families.html)。

## 6. 从不确定性走到学习目标

### 6.1 信息量与熵：发生了什么，平均有多难预测？

一个几乎必然发生的事件，发生时不会带来太多新信息；一个很少发生的事件则更出乎意料。若还要求独立事件的信息量相加，就自然得到负对数形式：

$$
I(x)=-\log p(x).
$$

对事件的信息量取期望，得到离散分布的**熵**：

$$
H(p)=-\sum_xp(x)\log p(x),
\qquad 0\log0:=0.
$$

全文这里的 $\log$ 使用自然对数，单位是 nat；若使用 $\log_2$，单位则为 bit。对固定的 $K$ 个可能结果，均匀分布的熵最大，为 $\log K$。伯努利分布在 $p=1/2$ 时最不确定，熵为 $\log2$；当概率趋近 0 或 1，熵趋近 0。

连续变量可以类似定义微分熵 $h(p)=-\int p(x)\log p(x)\,dx$，但它会受坐标单位影响，也可能为负，不能直接照搬离散编码长度的解释。

### 6.2 交叉熵与 KL：用错分布要付出多少代价？

假设数据实际来自 $p$，而我们用 $q$ 预测。对真实数据计算预测负对数的期望，得到**交叉熵**：

$$
H(p,q)=-\sum_xp(x)\log q(x).
$$

与使用真实分布时的熵相比，多付出的那部分就是 **Kullback–Leibler 散度**（KL divergence）：

$$
\begin{aligned}
D_{\mathrm{KL}}(p\Vert q)
&=\sum_xp(x)\log\frac{p(x)}{q(x)}\\
&=H(p,q)-H(p)\geq0.
\end{aligned}
$$

当存在 $p(x)>0$ 而 $q(x)=0$ 的取值时，KL 为无穷大；为零则表示两个分布相同（连续情形为几乎处处相同）。它一般不对称，也不满足距离所需的全部性质。

这个分解把两种原因区分开了：$H(p)$ 是数据本身的不确定性，$D_{\mathrm{KL}}(p\Vert q)$ 是模型偏离真实分布额外造成的代价。下面固定二分类问题，直接比较它们。

{% include statistics-figure.html kind="entropy" %}

### 6.3 为什么训练时会出现交叉熵和平方误差？

真实期望不好计算，但手上有样本。假设训练样本独立同分布，最大似然估计选择让观测数据整体最可能的参数：

$$
\widehat{\boldsymbol\theta}
=\arg\max_{\boldsymbol\theta}\prod_{i=1}^{n}q_{\boldsymbol\theta}(x_i)
=\arg\min_{\boldsymbol\theta}
\left[-\frac1n\sum_{i=1}^{n}\log q_{\boldsymbol\theta}(x_i)\right].
$$

后一项称为平均**负对数似然**（negative log-likelihood，NLL）。从真实分布的视角看，它是交叉熵的样本估计；从经验分布的视角看，它就是经验交叉熵。真实数据分布固定时，最小化交叉熵也就最小化对应的 KL。

对监督学习，把概率换成 $q_{\boldsymbol\theta}(y_i\mid x_i)$。若每个标签服从伯努利分布，模型输出 $q_i$，单个样本的 NLL 就是

$$
\ell_i=-y_i\log q_i-(1-y_i)\log(1-q_i),
$$

也就是二元交叉熵。如果类别用独热向量编码，类别分布给出的损失则是 $-\sum_k y_{ik}\log q_{ik}$，即多分类交叉熵。

若回归模型假设

$$
\bigl(Y\mid X=x\bigr)\;\sim\;\mathcal N(f_{\boldsymbol\theta}(x),\sigma^2),
$$

并把同一个 $\sigma^2$ 固定为已知常数，那么单个样本的 NLL 为

$$
\ell_i=\frac{(y_i-f_{\boldsymbol\theta}(x_i))^2}{2\sigma^2}
+\frac12\log(2\pi\sigma^2).
$$

对 $\boldsymbol\theta$ 优化时，第二项是常数，于是最大似然等价于最小化平方误差。若方差也由模型预测，就必须保留包括 $\log\sigma_i^2$ 在内的项，不能只留下一个随意加权的平方误差。

至此，分类中的 sigmoid / softmax 与交叉熵、回归中的高斯噪声与平方误差，都可以从“为输出指定条件分布，再最大化观测似然”这一条思路得到。

## 7. 用几个问题检查自己是否理解

1. 高斯曲线某处的密度为 1.5，是否违反概率不超过 1？
2. 为什么二项分布要乘组合数，而一次伯努利试验不需要？
3. $\mathbb E[X+Y]=\mathbb E[X]+\mathbb E[Y]$ 需要独立吗？方差直接相加又需要什么条件？
4. 对标准二维相关高斯，观测 $Y=1$ 后，$X$ 的条件均值和条件方差分别是什么？
5. 为什么“一个模型的交叉熵比较大”不一定意味着真实分布本身更容易预测？
6. 从高斯 NLL 推到平方误差时，固定方差这个条件在哪里发挥作用？

**核对思路。**密度需要积分才得到概率；组合数累计不同的试验排列；期望线性性无需独立，和的方差直接相加要求协方差为零；高斯例子的答案为 $\rho$ 和 $1-\rho^2$；交叉熵同时包含真实分布的熵与模型误差；固定方差使尺度项和对数归一化项不随待优化的预测均值变化。

## 8. 符号与缩写

| 记号 | 含义 |
| --- | --- |
| $X,x$；$\mathbf X,\mathbf x$ | 随机变量与取值；随机向量与取值 |
| PMF / PDF / CDF | 概率质量函数 / 概率密度函数 / 累积分布函数 |
| $\theta$；$\boldsymbol\theta$ | 伯努利成功概率；一般模型参数向量，依上下文区分 |
| $\boldsymbol\pi,\mu,\sigma^2,\Sigma$ | 类别概率、均值、方差、协方差矩阵 |
| $\rho,\lambda$ | 相关系数、泊松平均事件数；$\lambda_i$ 在谱分解中表示特征值 |
| $\boldsymbol\eta,T,A$ | 指数族自然参数、充分统计量、对数配分函数 |
| i.i.d. / CLT / NLL | 独立同分布 / 中心极限定理 / 负对数似然 |
| $H(p),H(p,q),D_{\mathrm{KL}}(p\Vert q)$ | 熵、交叉熵、KL 散度 |

## 9. References

1. **Ian Goodfellow、Yoshua Bengio、Aaron Courville。** [*Deep Learning*, Chapter 3: Probability and Information Theory](https://www.deeplearningbook.org/contents/prob.html)。适合延伸阅读条件概率与信息量的统一表述。
2. **Will Fithian。** [*Exponential Families*, UC Berkeley Stat 210A](https://www.stat.berkeley.edu/~wfithian/courses/stat210a/exponential-families.html)。用于进一步理解自然参数、充分统计量与对数配分函数。
3. **Hossein Pishro-Nik。** [*Introduction to Probability, Statistics, and Random Processes*, §7.1.2 Central Limit Theorem](https://www.probabilitycourse.com/chapter7/7_1_2_central_limit_theorem.php)。给出 CLT 的标准化形式及适用条件。

**勘误。**如有公式、术语或理解上的疏漏，欢迎指出。
