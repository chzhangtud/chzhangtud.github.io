---
title: "几何生成：把 ShapeNet 椅子变成点云或几何场"
date: 2026-11-03
lang: zh
permalink: /zh/generative-geometry/
en_link: /en/generative-geometry/
series: generative-models
series_order: 11
categories: [Generative Models]
tags: [Point Clouds, ShapeNet, Stanford Bunny, Flow Matching]
classes: [statistics-article, generative-article]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "把 DDPM 与 Flow Matching 落到一把椅子：准备点云、学习噪声或速度、生成新形状，再扩展到 SDF 潜空间与条件补全。"
---

{% include generative-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

现在把 [DDPM]({{ '/zh/denoising-diffusion/' | relative_url }}) 与 [Flow Matching]({{ '/zh/flow-matching/' | relative_url }}) 落到一个完整的三维任务：**用许多把 ShapeNet 椅子训练模型，从随机数生成一把新椅子，并得到可查看的表面。**

先从点云开始，再看怎样换成几何场。两条流程的差别，主要在于“一件样本用什么表示”。

## 1. 准备数据：一件样本就是一把椅子

从每个椅子网格的三角形表面按面积采样 $N=2048$ 个点，统一朝向、平移和尺度，得到 $y\in\mathbb R^{N\times3}$。一批训练数据就是 `[B,N,3]`。

要让模型学会椅子的变化，训练集需要包含不同椅子：有扶手、无扶手、不同椅背、不同腿型。只从同一把椅子反复采点，能提供同一表面的不同观测，却没有提供椅子之间的形状多样性。训练集与测试集应当先按物体身份划分，再做表面采样。

下面的真实 Stanford Bunny 用来观察表面坐标加噪。它与椅子使用同样的点云表示：

{% include generative-figure.html kind="bunny" %}

增大噪声后，薄表面变成有厚度的点团，耳朵等细结构逐渐消失。训练扩散模型，就是让网络在许多形状、许多噪声水平下学习怎样组织这些点。

## 2. 训练：选噪声目标，或选速度目标

同一批干净椅子 $y$ 可以用两种方式训练：

| | DDPM | 线性 Flow Matching |
| --- | --- | --- |
| 抽取随机量 | 噪声 $z$、加噪时间 $\tau$ | 噪声 $z$、生成时间 $t$ |
| 中间输入 | $x_\tau=a_\tau y+b_\tau z$ | $x_t=(1-t)z+ty$ |
| 网络输出 | $\epsilon_\theta(x_\tau,\tau)$ | $v_\theta(x_t,t)$ |
| 监督目标 | $z$ | $y-z$ |
| 生成 | 反向去噪更新 | 从 $t=0$ 到 1 积分速度 |

两个输出都是 $N\times3$。网络要把所有点作为一件形状处理：判断一个点该怎样移动时，需要知道坐面、椅背和其它点在哪里。

点的行顺序没有几何意义，所以通常要求网络满足置换等变性：把输入行顺序打乱，输出向量跟着相同顺序变化。它让模型尊重点集表示，同时保留逐点更新所需的对应关系。

## 3. 生成：一团高斯点怎样成为新形状？

以 FM 为例，先抽 $x(0)\sim\mathcal N(0,I_{3N})$，再反复执行

$$
x(t+h)=x(t)+h\,v_\theta(x(t),t).
$$

直到 $t=1$。这时的 $N$ 个坐标就是生成点云。DDPM 则从高噪声时间往回走，使用噪声预测计算每一步的均值与随机扰动。

生成时，网络没有目标椅子。它靠训练中学到的整体形状规律来安排坐标。换一份初始噪声，可以得到另一把椅子；若想指定类别或部分观测，则要加入条件。

**点云还没有三角形连接。** 它能展示表面上的采样点，若需要网格，还要执行表面重建。希望直接得到可提取表面的连续表示时，可以换用下一节的几何场。

## 4. 换成几何场：在潜空间生成 SDF

符号距离函数（Signed Distance Function，SDF）为每个空间位置 $r\in\mathbb R^3$ 返回一个带符号的距离。采用内部为负的约定，椅子表面就是零等值面：

$$
f(r)<0\ \text{在内部},\qquad
f(r)=0\ \text{在表面},\qquad
f(r)>0\ \text{在外部}.
$$

我们要生成的是**一整件物体的函数**，而不是单次查询返回的一个距离。一个清楚的教学方案是：

1. 训练形状自编码器，把每把椅子编码成潜变量 $h=E(y)$。
2. 训练解码器 $D(h,r)$，让它在查询位置 $r$ 预测该椅子的 SDF。
3. 固定这个自编码器，在许多椅子的潜变量 $h$ 上训练扩散或 FM。
4. 生成新潜变量 $h_{\mathrm{new}}$，查询 $D(h_{\mathrm{new}},r)$，再提取零等值面。

FM 的训练输入随之变成 $h_t=(1-t)z+t h$，目标是 $h-z$。**运动发生在形状潜空间，表面由解码器得到。** 这与像素扩散改成潜空间扩散是同一种分工：先选择便于建模的表示，再学习它的分布。

解码器误差、场的查询分辨率和等值面提取都会影响最终网格。对不封闭网格，内外符号也需要明确的数据处理。以上是一条可实施的教学流程，不表示仓库已经训练好了 ShapeNet SDF 模型。

## 5. 想让椅子符合要求：把条件一起输入

无条件生成只要求“像一把椅子”。若给定一片正面扫描，希望补出背面，可以把部分点云记为 $c$，让网络学习

$$
\epsilon_\theta(x_\tau,\tau,c)
\quad\text{或}\quad
v_\theta(x_t,t,c).
$$

训练时，用完整椅子作为目标，用模拟可见表面作为条件；生成时固定同一份观测 $c$，更换初始噪声，就能表达不同的合理补全。

同样可以把类别、文字或图像编码为条件特征。若只希望生成某个类别，类别嵌入通常比引入整套文本模型更直接。条件告诉网络“这次要什么”，加噪或速度目标仍负责训练生成过程。

## 6. 怎样知道生成得好不好？

先转动相机：坐面是否完整，椅腿是否断裂，背面是否有离群点。再看一批样本：是否总生成同一把椅子，是否覆盖不同椅背和腿型。SDF 输出还要查看提取网格是否出现空洞、自相交或薄结构丢失。

点云常用 Chamfer 距离比较表面位置：

$$
\operatorname{CD}(A,B)=
\frac1{|A|}\sum_{a\in A}\min_{b\in B}\|a-b\|^2+
\frac1{|B|}\sum_{b\in B}\min_{a\in A}\|b-a\|^2.
$$

它查找最近点，能反映明显的位置偏差，但不检查三角形连接，也可能忽略重复点造成的密度差异。单个样本的距离也不能证明整个生成分布有足够多样性。

<details class="generative-details" markdown="1">
<summary>几何补充：为什么两个正确端点之间的插值仍可能很奇怪？</summary>

数组插值默认第 $i$ 个起点与第 $i$ 个终点对应。若对应打乱，中间点可能穿过物体内部。这个问题影响形状之间的变形与插值；噪声到形状的 CFM 可以使用随机配对，不要求预先建立不同椅子的语义对应。

</details>

{% include generative-figure.html kind="correspondence" %}

到这里，一条完整流程已经清楚了：**用点云或潜变量表示整件形状，用扩散或 FM 学习它的分布，再把生成结果转换为可查看的几何。** 完整三维场景还要表达物体布局、关系与尺度，可以在这个单物体基础上继续扩展。

**参考与来源。** 数据背景见 [ShapeNet](https://arxiv.org/abs/1512.03012) 与 [Stanford 3D Scanning Repository](https://graphics.stanford.edu/data/3Dscanrep/)。方法背景见 [3D 点云扩散](https://arxiv.org/abs/2103.01458)、[Flow Matching](https://arxiv.org/abs/2210.02747) 与 [DeepSDF](https://arxiv.org/abs/1901.05103)。潜空间生成流程为教学组织，不是对这些论文某个具体架构的复现。

**数据与使用说明。** Bunny 点云由 Stanford University Computer Graphics Laboratory 的真实网格按面积采样 1024 点，并作统一缩放；来源、准备脚本见[数据脚本]({{ '/assets/examples/prepare_generative_examples.py' | relative_url }})。使用条款以[原站说明](https://graphics.stanford.edu/data/3Dscanrep/)为准。其它数据与论文的权利归相应提供者。文中未报告已执行的 ShapeNet 训练实验。
