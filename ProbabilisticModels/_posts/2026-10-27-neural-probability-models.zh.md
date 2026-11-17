---
title: "神经网络如何表示概率分布"
date: 2026-10-27
lang: zh
permalink: /zh/neural-probability-models/
en_link: /en/neural-probability-models/
series: generative-models
series_order: 2
categories: [Probabilistic Models]
tags: [Neural Networks, Probability, Backpropagation]
classes: statistics-article
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "只补 VAE 需要的神经网络知识：前向计算、反向传播、梯度更新，以及怎样让网络输出高斯或伯努利分布的参数。"
---

{% include vae-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

[上一篇]({{ '/zh/variational-inference/' | relative_url }})把隐变量推断写成了优化近似分布的问题。现在需要一种可学习的函数，把输入映射到分布参数。神经网络正好承担这个角色。

本文只介绍后续会用到的前馈网络、链式求导和小批量更新。我们的重点是：一个确定性的网络，怎样参与构造一个随机模型？


<div class="pgm-reading-guide" markdown="1">

**阅读方式。** 可以先读每节的思路、主要结果和小结，再按需展开推导或代码。交互图保留在正文中，跳过计算细节也能继续阅读。

</div>

---

## 1. 神经网络的前向计算

<div class="pgm-section-intro" markdown="1">

**思路。** 先明确网络的基本工作：输入一组数，按当前参数算出另一组数。固定已有参数做前向计算、得到输出，通常称为**模型推理**；根据数据和损失学习参数，称为**训练**。

</div>



### 1.1 网络层与非线性

<div class="pgm-section-intro" markdown="1">

**思路。** 把一层网络看成先做加权组合，再做一次非线性变换。多层网络重复这个过程。

</div>

给定输入向量 $u$，一层网络先做仿射变换，再逐元素使用激活函数：

$$
a=Wu+b,\qquad h=\tanh(a).
$$

$W$ 的行数是输出维度，列数是输入维度；$b$ 是偏置。多层网络把这些函数复合起来：

$$
h=\tanh(W_1u+b_1),\qquad o=W_2h+b_2.
$$

两层之间的非线性很重要。若所有激活都是恒等函数，多层仿射变换仍然只是一个仿射变换。这里选择 $\tanh$ 只是为了便于展示，不是 VAE 对激活函数的要求。

<div class="pgm-section-summary" markdown="1">

**小结。** 前向计算确定了输入怎样影响输出，非线性让多层组合能表达更丰富的关系。它还没有引入概率采样。

</div>

### 1.2 输入、参数与训练

<div class="pgm-section-intro" markdown="1">

**思路。** 区分三个对象：给定的输入、需要学习的权重，以及稍后从分布中抽取的隐变量样本。

</div>

网络权重、偏置是被优化的参数；输入数据是给定的，损失函数说明当前输出有多合适。一次前向计算不会自动学习。训练还需要算出损失对参数的导数，再改变参数。

模型推理（inference）使用已有参数计算输出；训练（training）也会先做前向计算，随后求梯度并更新参数。这里的“模型推理”指使用网络的计算过程；前文的“后验推断”指求隐变量的条件分布。在 VAE 中，编码器可以通过一次前向计算给出近似后验的参数。

对 VAE，会有两组不同的网络参数：生成网络的 $\theta$ 和推断网络的 $\phi$。这与每个观测各自拥有的随机隐变量 $z_i$ 是三类不同的对象。

<div class="pgm-section-summary" markdown="1">

**小结。** 训练更新权重和偏置。编码器参数、解码器参数与每个观测的随机隐变量不能混为一谈。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 1 节小结。** 网络提供可调整的函数；训练才改变这个函数。接下来让它输出概率分布的参数。

</div>

## 2. 网络输出与概率分布

<div class="pgm-section-intro" markdown="1">

**思路。** 让网络输出一个分布的设定，例如均值、方差或二元事件概率。随后按这个分布采样，才产生随机结果。

</div>



### 2.1 高斯输出：均值与对数方差

<div class="pgm-section-intro" markdown="1">

**思路。** 对连续结果，同时预测它大致落在哪里、可能有多大波动。高斯的均值和方差分别表达这两件事。

</div>

例如让一个网络输出两个向量：

$$
(\mu_\theta(u),r_\theta(u))=f_\theta(u),
\qquad r_j=\log\sigma_j^2.
$$

它们定义一个对角高斯条件分布：

$$
p_\theta(y\mid u)
=\mathcal N\!\left(y\mid\mu_\theta(u),
\operatorname{diag}(\exp r_\theta(u))\right).
$$

网络本身依然是确定性函数。随机性来自之后按这个分布采样。输出对数方差保证方差为正，而且允许输出头取任意实数。注意

$$
\sigma^2=\exp r,\qquad \sigma=\exp(r/2).
$$

把 $\exp r$ 当成标准差，会使采样与模型所声明的方差不一致。

{% include vae-figure.html kind="network" %}

<details class="pgm-derivation" markdown="1">
<summary>示例参数：交互图中的固定网络</summary>

图中的小网络采用

$$
\begin{aligned}
\mu(x)&=0.8\tanh(1.2x+0.4)-0.5\tanh(-0.7x)+b,\\
r(x)&=-1+0.5\tanh x.
\end{aligned}
$$

</details>

改变输入会同时改变分布的位置和宽度；改变 $b$ 只平移均值。图中没有训练，也没有给这些固定权重赋予真实数据意义。

<div class="pgm-section-summary" markdown="1">

**小结。** 固定输入与权重时，网络给出的分布仍然固定；从中抽样的结果才会变化。采样使用标准差，而网络这里输出的是对数方差。

</div>

### 2.2 伯努利输出

<div class="pgm-section-intro" markdown="1">

**思路。** 二元结果需要一个合法概率。把网络输出转换到零和一之间，再用它决定两种结果的概率。

</div>

若 $Y$ 是一个二元结果，可以输出一个实数 $a_\theta(u)$，再令

$$
\pi_\theta(u)=\operatorname{sigmoid}(a_\theta(u)),
\qquad
p_\theta(y\mid u)=\pi_\theta(u)^y(1-\pi_\theta(u))^{1-y}.
$$

网络输出、概率参数、采样结果是三个不同层次。伯努利要求实际结果是 0 或 1；某个连续量恰好落在 $[0,1]$，并不自动让它成为伯努利变量。后面的最小 VAE 实验会使用连续高斯观测，不需要为了套交叉熵而改变数据类型。

<div class="pgm-section-summary" markdown="1">

**小结。** 网络输出的实数、转换后的概率和最终抽到的零或一是不同对象。观测模型要与数据类型一致。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 2 节小结。** 神经网络负责确定分布参数，概率模型负责规定取值与采样。接下来按这个模型写出训练损失。

</div>

## 3. 条件观测模型与训练损失

<div class="pgm-section-intro" markdown="1">

**思路。** 训练要奖励给真实观测较高密度的网络输出。负对数似然把这个要求变成可以最小化的损失。

</div>

对于上面的高斯分布，一个样本的负对数似然为

$$
\ell(y,u;\theta)
=\frac12\sum_{j=1}^D
\left[(y_j-\mu_j)^2\exp(-r_j)+r_j+\log(2\pi)\right].
$$

<details class="pgm-derivation" markdown="1">
<summary>计算细节：均值与对数方差的梯度</summary>

其中 $\mu_j,r_j$ 都由输入 $u$ 经网络得到。对两个输出头求导：

$$
\frac{\partial\ell}{\partial\mu_j}
=(\mu_j-y_j)\exp(-r_j),
\qquad
\frac{\partial\ell}{\partial r_j}
=\frac12\left[1-(y_j-\mu_j)^2\exp(-r_j)\right].
$$

</details>

大方差会降低误差项的权重，但 $r_j$ 项会为过大的方差付出代价。若方差是待学习的量，就不能只保留平方误差。

若所有维度的观测标准差固定为 $\tau$，则

$$
\ell=\frac{\|y-\mu_\theta(u)\|^2}{2\tau^2}
+D\log\tau+\frac D2\log(2\pi).
$$

固定 $\tau$ 时，后两项对网络梯度是常数；但它们影响报告的数值。后续代码会保留它们，统一用每个观测的 nat 表示损失。

<div class="pgm-section-summary" markdown="1">

**小结。** 固定高斯方差时，损失对应加权平方误差；学习方差时还必须保留方差相关项，不能只靠增大不确定性来淡化误差。

</div>

## 4. 反向传播与参数更新

<div class="pgm-section-intro" markdown="1">

**思路。** 已知损失后，还要知道每个权重该往哪个方向改。反向传播计算这些影响，优化器再执行更新。

</div>



### 4.1 链式法则与梯度传播

<div class="pgm-section-intro" markdown="1">

**思路。** 从输出误差开始，沿着前向计算的相反方向传递影响。矩阵求导细节可展开查看，交互图展示同一个过程。

</div>

<details class="pgm-derivation" markdown="1">
<summary>计算细节：两层网络的反向传播</summary>

仍考虑 $o=W_2h+b_2$、$h=\tanh(a)$、$a=W_1u+b_1$。假设已经知道损失对输出的导数 $\delta_o=\partial\ell/\partial o$，则

$$
\begin{aligned}
\nabla_{W_2}\ell&=\delta_o h^\top,&
\nabla_{b_2}\ell&=\delta_o,\\
\delta_a&=(W_2^\top\delta_o)\odot(1-h\odot h),\\
\nabla_{W_1}\ell&=\delta_a u^\top,&
\nabla_{b_1}\ell&=\delta_a.
\end{aligned}
$$

$\odot$ 表示逐元素相乘。先算输出对损失的影响，再沿计算依赖向前面的参数传播，就是**反向传播**（backpropagation）。这里写的是单个样本、列向量约定；批量实现会把各样本的梯度累加或平均。

</details>

自动微分库记录前向计算的依赖，再执行相应的局部求导规则。它不会替我们判断损失是否符合所声明的概率模型。

{% include vae-explainer.html kind="backprop" %}

先看“计算链”视图，确认当前权重怎样经过乘法、非线性和误差进入损失。“损失与更新”视图中的虚线预告一次更新，点击按钮才真正改变权重。保持输入和目标不变，连续更新几次；再增大学习率，检查一步跨得更远是否一定更好。

<div class="pgm-section-summary" markdown="1">

**小结。** 链式法则把每一步的局部影响连起来，从而得到所有权重的梯度。自动微分替我们执行计算，但仍需要正确的计算依赖。

</div>

### 4.2 小批量梯度更新

<div class="pgm-section-intro" markdown="1">

**思路。** 用梯度给出的方向小幅调整权重，再用下一批数据重复。学习率决定每次走多远。

</div>

把所有网络参数暂记为 $w$，对批量 $B$ 最小化平均损失：

$$
J_B(w)=\frac1{|B|}\sum_{i\in B}\ell_i(w),
\qquad
w\leftarrow w-\eta\nabla_wJ_B(w).
$$

$\eta$ 是学习率。小批量随机梯度下降用部分数据估计整体更新方向，节省每一步的计算，但不保证每一步都降低整个数据集上的损失。Adam 也利用梯度，并对更新进行自适应缩放；它不能修正错误的模型或错误的归约维度。

在下面的训练代码里，要依次清空旧梯度、计算当前损失、反向传播，再更新参数。忘记清空会把不同步骤的梯度累加起来。

<div class="pgm-section-summary" markdown="1">

**小结。** 小批量更新节省计算，但单次损失可能波动。实现时还要按顺序清空梯度、求导和更新，避免把不同步骤的梯度误累加。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 4 节小结。** 反向传播负责求梯度，优化器负责用梯度修改权重。二者不会自动保证概率模型和损失写得正确。

</div>

## 5. 编码器与解码器

<div class="pgm-section-intro" markdown="1">

**思路。** 把这些网络工具放回隐变量模型：一个网络由观测估计潜变量分布，另一个由潜变量给出观测分布。

</div>

普通自编码器把输入经过一个瓶颈，再尝试重建：

$$
z=e_\phi(x),\qquad \widehat x=d_\theta(z).
$$

它有助于理解编码与解码的计算方向。仅有重建损失，并没有指定一个从哪里抽取 $z$ 的概率模型，也没有保证某个任意先验抽出的点都有合理的解码。

对于后续的 VAE，我们将分别定义

$$
q_\phi(z\mid x)=\mathcal N\!\left(z\mid\mu_\phi(x),
\operatorname{diag}(\exp r_\phi(x))\right),
$$

$$
p_\theta(x\mid z)=\mathcal N\!\left(x\mid m_\theta(z),\tau^2I\right).
$$

编码器输出一个近似后验的参数，解码器输出观测条件分布的参数。生成图中的方向仍是 $Z\to X$；用于推断的 $q_\phi(z\mid x)$ 是另外构造的近似分布，不能把它当成给同一个生成图随意添加一条反向边。

现在网络前向和普通链式求导都清楚了。但编码器和解码器之间还要采样一个 $z$，怎样把损失对编码器参数的梯度算回来？下一篇介绍[采样、重参数化与摊销推断]({{ '/zh/trainable-variational-inference/' | relative_url }})。

<div class="pgm-section-summary" markdown="1">

**小结。** 编码器输出近似后验参数，解码器输出条件观测参数。两者之间的采样还需要可计算的梯度，下一篇解决这个问题。

</div>

## 6. 检查理解与符号

- 输入和权重固定时，高斯输出网络为什么还可以定义随机模型？
- 输出 $r=\log\sigma^2$ 时，采样应该使用 $\exp r$ 还是 $\exp(r/2)$？
- 学习观测方差时，为什么不能把高斯负对数似然直接简化成平方误差？
- 在计算图中，隐变量样本、编码器参数、解码器参数分别是什么？

| 符号 | 含义 |
| --- | --- |
| $W,b$ / $h$ | 权重、偏置 / 隐藏层输出 |
| $r$ | 对数方差，不是对数标准差 |
| $\theta$ / $\phi$ | 生成网络 / 推断网络参数 |
| MLP / SGD | 多层感知机 / 随机梯度下降 |

## 7. 参考文献

1. **Christopher M. Bishop，2006。** [*Pattern Recognition and Machine Learning*](https://link.springer.com/book/9780387310732)，§5.1–5.3、§12.4.2。网络概率输出、误差反传，以及自联想网络的瓶颈表示。
2. **David E. Rumelhart、Geoffrey E. Hinton、Ronald J. Williams，1986。** [*Learning representations by back-propagating errors*](https://doi.org/10.1038/323533a0)。反向传播学习表示的原始研究。
3. **Diederik P. Kingma、Max Welling。** [*Auto-Encoding Variational Bayes*，附录 C](https://arxiv.org/html/1312.6114v11)。用 MLP 参数化概率编码器和解码器。

**来源与勘误。**本文结合课程神经网络讲义与以上文献，围绕后续 VAE 所需的知识重新组织；公式使用文内约定，交互图为独立制作。原材料的权利归相应作者或出版方所有。如有公式、术语或理解上的疏漏，欢迎指出。
