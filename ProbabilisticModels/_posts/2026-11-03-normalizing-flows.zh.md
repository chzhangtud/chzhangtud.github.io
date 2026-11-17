---
title: "连续时间生成（二）：从可逆变换到 Normalizing Flow"
date: 2026-11-03
lang: zh
permalink: /zh/normalizing-flows/
en_link: /en/normalizing-flows/
series: generative-models
series_order: 9
categories: [Generative Models]
tags: [Normalizing Flow, CNF, Geometry]
classes: [statistics-article, generative-article]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "从图形学熟悉的坐标变换解释概率质量与雅可比行列式，再连接连续性方程、连续归一化流与 Flow Matching 的训练动机。"
---

{% include generative-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

[上一篇]({{ '/zh/score-based-models/' | relative_url }})告诉我们，一条确定性的 ODE 可以把噪声分布运输到数据分布。这篇先暂时离开扩散，直接讨论一个图形学读者熟悉的问题：如果一个坐标变换拉伸了空间，变换后的概率密度应该怎样变化？

## 1. 变换保留的是概率质量

设 $Z$ 服从已知密度 $p_Z$，我们通过可逆映射 $X=F(Z)$ 生成数据。对于一维变换 $X=2Z$，原来宽度为 $\Delta z$ 的小区间会变成宽度约为 $2\Delta z$ 的区间。对应样本仍然属于这个区间，因此概率质量没有凭空增加，但是单位长度上的密度必须减半。

一般的变量替换公式为

$$
p_X(F(z))=\frac{p_Z(z)}{|\det J_F(z)|},
\qquad
\log p_X(x)=\log p_Z(F^{-1}(x))-
\log|\det J_F(F^{-1}(x))|.
$$

$J_F$ 是雅可比矩阵，其行列式的绝对值给出局部体积倍率。我们关心的不是变换后某一点看起来移动了多远，而是该点附近的一小块区域被放大或压缩了多少。

{% include generative-figure.html kind="jacobian" %}

这张图使用均匀源分布，因此左边每个等面积单元携带相同质量。右图中，某些单元被拉长，另一些单元被压扁。请留意：剪切和弯曲本身不必改变面积，真正的面积倍率来自变换的雅可比行列式。

图中变换为 $x=z_1$、$y=\exp(a z_1)z_2+0.4\sin(2z_1)$，所以 $\det J_F=\exp(a z_1)>0$。这也保证我们能先从 $x$ 恢复 $z_1$，再从 $y$ 恢复 $z_2$。图中的坐标扭曲同时展示了可逆性和密度变化，不是随意画出的波纹。

## 2. Normalizing Flow 怎样组成一个模型？

归一化流（normalizing flow）把多个可逆变换串起来：

$$
z_K=F_K\circ\cdots\circ F_1(z_0),
\qquad
\log p_K(z_K)=\log p_0(z_0)-\sum_{k=1}^{K}\log|\det J_{F_k}(z_{k-1})|.
$$

如果逆映射和行列式都容易计算，我们就能对数据计算密度，并通过最大似然训练。生成时则从简单分布中抽样，再沿正向变换得到结果。

问题在于，一个任意神经网络通常既不可逆，也没有容易计算的行列式。Real NVP 等模型会设计特殊的耦合层，使一部分坐标控制另一部分坐标的平移和缩放。这样的雅可比具有方便的结构，可以避免每次都计算一个巨大的稠密行列式。

对于 MNIST，我们可以把图像暂时看成 784 维向量。但像素是离散值，普通连续流给出的是连续密度；如果要报告离散图像的似然，通常还需要明确去量化等处理。直接把一个连续密度值称为“这张离散图像出现的概率”会混淆单位。

## 3. 连续流怎样连接图形学中的速度场？

我们也可以让坐标变换由 ODE 定义：

$$
\frac{dx_t}{dt}=v_\theta(x_t,t),
\qquad x_0=z.
$$

在速度场足够规则、解存在且唯一的区间内，初始位置决定整条轨迹，而反向积分可以恢复起点。这里的可逆性来自 ODE 解的性质，不是来自每一步都使用特殊的可逆网络层。

把流体中的示踪粒子想象成随机样本很有帮助。速度场决定每个粒子怎样移动，粒子在空间中的总体密度则满足连续性方程：

$$
\partial_t p_t(x)+\nabla\cdot\bigl(p_t(x)v_\theta(x,t)\bigr)=0.
$$

它表达的是概率质量守恒。在图形学中，我们可能用速度场推动烟雾或变形网格；在生成模型中，我们推动的是随机变量的分布。两者可以共享微分方程工具，但是生成模型的时间不必是物理时间，速度场也不必满足真实材料的力学定律。

## 4. 散度为什么决定密度变化？

沿着一条流轨迹，连续性方程可以化为

$$
\frac{d}{dt}\log p_t(x_t)=-\nabla\cdot v_\theta(x_t,t).
$$

散度为正，表示局部流出多于流入，样本团被撑开，密度降低；散度为负，表示局部压缩，密度升高。例如，在 $d$ 维空间中取 $v(x)=a x$，就有 $x_t=e^{at}x_0$、$\nabla\cdot v=da$，因此密度沿轨迹按 $e^{-dat}$ 缩放。这与离散变换的体积因子完全一致。

这类模型叫作连续归一化流（continuous normalizing flow，CNF）。它可以通过同时积分坐标和对数密度来计算似然。不过，“理论上存在密度公式”与“数值计算毫无误差”是不同的陈述。ODE 容差、散度计算方式以及高维迹估计都会影响实际计算。

## 5. 可逆性对几何生成施加了哪些限制？

如果我们在 $\mathbb R^3$ 中对标准高斯施加一个光滑、非奇异的可逆流，它不会在有限时间内把一个有体积的分布精确压成零厚度的三角网格表面。模型可以逼近一层很薄的表面邻域，但精确的低维支撑需要另作处理。前面 Score 一篇强调零噪声端点，原因与这里相通。

几何生成还常常把一个随机变量定义为完整点云 $X\in\mathbb R^{3N}$。此时流发生在整件形状的坐标空间，不能把它误解为“在一件固定物体表面上推动一个点”。前者学习形状之间的变化，后者只涉及某一件形状上的采样密度。

另一种路线是在低维潜空间中学习流，再让解码器生成点云、网格顶点或隐式场。解码器可以不保持维度，也可以不保持可逆性。因此，潜空间流的可逆性限制不能直接搬到最终曲面的连通分量或拓扑上。最终几何能否改变拓扑，还取决于表示和解码过程。

## 6. 为什么接下来需要 Flow Matching？

如果我们通过似然训练 CNF，训练中通常需要求解 ODE，并计算或估计散度。这给高维模型带来额外开销。我们于是会问：能否提前规定一条从噪声到数据的概率路径，再直接教网络预测这条路径所需的速度？

这就是[下一篇 Flow Matching]({{ '/zh/flow-matching/' | relative_url }})的出发点。连续流是我们定义生成器的方式，Flow Matching 则是一种训练这种流的方法。区分模型形式与训练目标，能够帮助我们理解它与扩散模型之间的联系。

**符号与缩写。** $J_F$ 表示变换的雅可比矩阵，$\det J_F$ 表示有向体积倍率，$v_\theta$ 表示速度场，$\nabla\cdot v_\theta$ 表示散度。CNF 表示连续归一化流。

**参考与来源。** 变量替换与流的建模参考 [Variational Inference with Normalizing Flows](https://arxiv.org/abs/1505.05770) 和 [Density Estimation Using Real NVP](https://arxiv.org/abs/1605.08803)。连续密度公式参考 [Neural Ordinary Differential Equations，§4](https://arxiv.org/abs/1806.07366)，训练动机参考 [Flow Matching for Generative Modeling，§2–3](https://arxiv.org/html/2210.02747v2)。图表和局部变形例子为独立实现。原论文权利归相应作者。如有疏漏，欢迎勘误。
