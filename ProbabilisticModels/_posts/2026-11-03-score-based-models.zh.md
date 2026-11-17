---
title: "连续时间生成（一）：同一个 score，为什么能用 SDE 或 ODE 生成？"
date: 2026-11-03
lang: zh
permalink: /zh/score-based-models/
en_link: /en/score-based-models/
series: generative-models
series_order: 8
categories: [Generative Models]
tags: [Score Matching, SDE, ODE, Diffusion]
classes: [statistics-article, generative-article]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "先分清前向加噪、网络训练和反向生成，再理解 SDE、score 与概率流 ODE：训练共用网络，采样选择动力学。"
---

{% include generative-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

[上一篇]({{ '/zh/diffusion-sampling/' | relative_url }})说，同一个噪声网络可以配合不同采样方式。这篇把背后的连续时间逻辑讲清楚：

> **先规定前向加噪过程，训练去噪网络学习 score 或其噪声参数化；训练好后，同一个网络既可以用于随机的逆向 SDE，也可以用于确定性的概率流 ODE。**

最容易混淆的是把“加噪方程”“网络学的量”和“生成方程”当成同一件事。我们按这三个环节分别看。

## 1. SDE 是什么？先与普通微分方程比较

常微分方程（Ordinary Differential Equation，ODE）规定当前状态的速度：

$$
\frac{dx}{d\tau}=f(x,\tau).
$$

给定起点，小步更新可以写成 $x\leftarrow x+f(x,\tau)h$。在解唯一的条件下，起点确定，整条轨迹也确定。

随机微分方程（Stochastic Differential Equation，SDE）再加入随机扰动：

$$
dX_\tau=f(X_\tau,\tau)\,d\tau+g(\tau)\,dW_\tau.
$$

$f$ 是漂移，描述确定性变化；$g$ 控制噪声强度；$W$ 是布朗运动。对应的小步模拟是：

$$
X_{\tau+h}\approx X_\tau+f(X_\tau,\tau)h+
g(\tau)\sqrt h\,z,
\qquad z\sim\mathcal N(0,I).
$$

因此，**即使起点相同，中途抽到的随机数不同，SDE 的路径也可以不同。** 注意噪声按 $\sqrt h$ 缩放；布朗运动的增量不能当成普通可微函数的导数。

在 MNIST 中，状态是一张图；在 ShapeNet 中，状态可以是一整把椅子的坐标数组。方程让这些分量一起随时间变化。

## 2. 前向 SDE：只负责加噪，不需要 score

现在让 $\tau$ 从 0 走向 $T$，表示**数据到噪声**的时间。前向过程就是上面的形式：

$$
dX_\tau=f(X_\tau,\tau)\,d\tau+g(\tau)\,dW_\tau,
\qquad \tau:0\longrightarrow T.
$$

例如，与小步 DDPM 相应的方差保持型过程，可以选择：

$$
f(x,\tau)=-\tfrac12\beta(\tau)x,
\qquad g(\tau)=\sqrt{\beta(\tau)}.
$$

前一项削弱原信号，后一项混入噪声。对数字，它逐渐破坏笔画；对椅子，它逐渐打散表面。

**这个公式里确实没有 score。** 因为把数据变成噪声的规则已经由我们规定，不需要网络告诉程序怎样破坏样本。

接下来的问题是：从噪声往回走，为什么不能直接把这个过程倒过来？

## 3. 反向过程缺少的信息，就是 score 提供的

加噪把许多不同的数字或椅子混在了一起。仅仅知道“信号怎样缩小、噪声加了多强”，不足以判断当前点团应该怎样形成合理结构。

记所有带噪样本在时间 $\tau$ 的密度为 $p_\tau(x)$，定义：

$$
s_\tau(x)=\nabla_x\log p_\tau(x).
$$

它叫 **score，即对数概率密度对样本坐标的梯度**。它描述当前位置附近，密度往哪个方向增加。这里对 $x$ 求导，不是对网络参数求导。

在一维高斯中：

$$
p(x)=\mathcal N(\mu,\sigma^2)
\quad\Longrightarrow\quad
s(x)=-\frac{x-\mu}{\sigma^2}.
$$

均值左侧方向为正，右侧为负。对于椅子，score 的每一行是某个点的三个分量，但它取决于整件形状，不能简单理解成某个固定表面的法线。

{% include generative-figure.html kind="score" %}

双峰图帮助我们看清噪声尺度的作用。小噪声下能分辨两种结构，大噪声下两个峰逐渐合并。沿 score 一直爬到峰值，与保留正确分布的采样仍是不同任务；生成方程还要结合漂移、噪声日程与时间方向。

## 4. 训练：噪声预测怎样变成 score？

我们没有 $p_\tau$ 的显式表达，但有真实样本，也能自己加噪。把高斯加噪写成：

$$
x_\tau=a_\tau x_0+b_\tau\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
$$

这里 $b_\tau$ 是前向噪声的标准差；离散 DDPM 中对应
$b_t=\sqrt{1-\bar\alpha_t}$。

固定 $x_0$ 时，条件分布是已知高斯，所以：

$$
\nabla_{x_\tau}\log q(x_\tau\mid x_0)
=-\frac{x_\tau-a_\tau x_0}{b_\tau^2}
=-\frac{\epsilon}{b_\tau}.
$$

因此，我们可以用已知的 $-\epsilon/b_\tau$ 监督 score 网络。这叫去噪 score matching。平方误差会对所有可能的干净来源取条件平均，理想结果就是 $s_\tau(x)$。

如果沿用前面训练的噪声网络，只需换算：

$$
\boxed{
s_\theta(x,\tau)=-\frac{\epsilon_\theta(x,\tau)}{b_\tau}.
}
$$

**噪声预测与 score 预测在这里是同一份信息的两种表达。** 换算系数依赖时间，所以两种未加权 MSE 不会自动完全相同；但切换下面的两种采样器，可以复用同一个训练好的网络。

<details class="generative-details" markdown="1">
<summary>够用的推导：为什么回归条件 score 能学到整体 score？</summary>

对 $p_\tau(x)=\int q_\tau(x\mid x_0)p_{\mathrm{data}}(x_0)\,dx_0$ 求导，并除以 $p_\tau(x)$：

$$
\nabla_x\log p_\tau(x)
=\mathbb E[\nabla_x\log q_\tau(x\mid X_0)\mid X_\tau=x]
=-\frac{\mathbb E[\epsilon\mid X_\tau=x]}{b_\tau}.
$$

平方误差回归的理想解就是这个条件均值。因此，不需要先估计每个位置的密度数值，也能训练密度的对数梯度。

</details>

## 5. 第一种生成方式：把 score 放进逆向 SDE

在适当光滑性条件下，前向 SDE 的时间反演为：

$$
dX_\tau=
\left[f(X_\tau,\tau)-g(\tau)^2s_\tau(X_\tau)\right]d\tau
+g(\tau)\,d\bar W_\tau,
\qquad \tau:T\longrightarrow0.
$$

把未知的真实 score 换成网络 $s_\theta$，就可以从噪声端数值模拟这条方程。

现在可以直接回答“前面的 SDE 为什么没看到 score”：

- **前向 SDE** 按固定规则加噪，所以没有 score；
- **逆向 SDE** 要利用学到的数据分布信息，所以出现 score。

生成沿递减的 $\tau$ 进行，$d\tau<0$。取一个正步长 $h$，反向更新中的确定性部分乘 $-h$，随机项标准差按 $\sqrt h$ 计算。不能只看括号里的负号来判断移动方向。

## 6. 第二种生成方式：把同一个 score 放进概率流 ODE

与前向扩散相对应的概率流 ODE 是：

$$
\boxed{
\frac{dx}{d\tau}
=f(x,\tau)-\tfrac12g(\tau)^2s_\tau(x).
}
$$

它也可以从 $\tau=T$ 向 0 积分生成。用 $s_\theta$ 代替真实 score，**无需为这条 ODE 单独训练另一个去噪网络。**

把两个生成公式并排看：

| | 逆向 SDE | 概率流 ODE |
| --- | --- | --- |
| 漂移 / 速度 | $f-g^2s_\theta$ | $f-\tfrac12g^2s_\theta$ |
| 中途随机项 | $g\,d\bar W_\tau$ | 无 |
| 给定起点后 | 还取决于中途随机数 | 解唯一时轨迹确定 |
| 使用哪个网络？ | 同一个 $s_\theta$ | 同一个 $s_\theta$ |

这里不仅删去了随机项，**score 的系数也从 1 变成了 $1/2$**。这项改变用来补偿随机扩散对整体密度演化的影响。

<details class="generative-details" markdown="1">
<summary>够用的推导：二分之一从哪里来？</summary>

当 $g$ 只依赖时间时，前向 SDE 的密度满足 Fokker–Planck 方程：

$$
\partial_\tau p=-\nabla\cdot(fp)+\tfrac12g^2\Delta p.
$$

由于 $\nabla p=p\,s$，它可以改写成：

$$
\partial_\tau p=-\nabla\cdot[(f-\tfrac12g^2s)p].
$$

这正是速度场 $f-\tfrac12g^2s$ 产生的连续性方程，所以确定性运动可以产生相同的边缘密度演化。

</details>

## 7. 路径不同，为什么还能说“分布相同”？

想象同时生成一万把椅子，在某个时间暂停：

- SDE 中，每份点云走的是受随机扰动影响的路径；
- ODE 中，每份点云沿确定的速度场移动。

理论上的相同，是说此时所有样本构成的**整体分布**相同，不是说第 17 份点云在两种过程中坐标完全一样。你可以把它理解成“合照里的样本分布一致，单个样本的行程不同”。

这个结论需要真实 score、相容初始分布和精确求解等条件。网络近似和有限步长会让实际采样结果不同。确定性也不消除多样性：不同初始噪声仍然可以得到不同椅子。

## 8. 到底是 decoder 在学 score，还是整个网络？

更准确地说，是**整个去噪网络**在学习 score 或其噪声参数化。若网络是 U-Net，编码与解码两部分共同参与预测；它们不是分别负责加噪与去噪。

潜空间扩散里还有另一个容易混淆的 decoder：自编码器的解码器。它把生成的潜变量还原成图像或几何，与这里反复调用的去噪网络承担不同工作。

整个过程可以这样记：

| 阶段 | 做什么 | 是否依赖训练好的 score |
| --- | --- | --- |
| 前向加噪 | 用指定的 $f,g$ 制造带噪样本 | 不需要 |
| 网络训练 | 由带答案的加噪练习学习噪声或 score | 训练得到它 |
| 逆向 SDE 生成 | 用 score 修正漂移，并保留随机项 | 使用它 |
| 概率流 ODE 生成 | 用同一 score 构造确定性速度 | 使用同一个它 |

> **训练学去噪所需的信息，生成选择怎样使用它。前向过程固定；逆向 SDE 与概率流 ODE 共用网络，但采样动力学不同。**

对 MNIST，网络输入和输出是一批图像；对 ShapeNet，它们可以是一批 $N\times3$ 点云。改变数据表示会改变网络结构，不会改变上面这层分工。

[连续流]({{ '/zh/normalizing-flows/' | relative_url }})接着介绍速度场怎样运输概率密度。[Flow Matching]({{ '/zh/flow-matching/' | relative_url }})则更进一步：直接构造速度监督来训练网络。它可以使用不同路径，因此不必都从“先学 score”出发。

**参考与来源。** 问题推进参考读者提供的 [DeepSeek 对话](https://chat.deepseek.com/share/qkai6x2oonl72m9rv2)。技术依据为 [Score-Based Generative Modeling through SDEs，§3–4 与附录 D](https://arxiv.org/abs/2011.13456)，噪声参数化见 [DDPM](https://arxiv.org/abs/2006.11239)。正文公式假定 $g$ 是只依赖时间的标量；零噪声端点可能需要取极限或保留少量噪声。图表使用解析分布，未运行训练好的生成网络。
