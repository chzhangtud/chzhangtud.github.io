---
title: "Flow Matching：把去噪改写成从噪声到椅子的运动"
date: 2026-11-03
lang: zh
permalink: /zh/flow-matching/
en_link: /en/flow-matching/
series: generative-models
series_order: 10
categories: [Generative Models]
tags: [Flow Matching, CNF, MNIST, Geometry]
classes: [statistics-article, generative-article]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "从直线插值、速度监督到 ODE 采样，再用同一条高斯路径说明 Flow Matching 与扩散的准确联系。"
---

{% include generative-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

在 [DDPM]({{ '/zh/denoising-diffusion/' | relative_url }}) 中，我们问网络：“这把带噪椅子里混入了多少噪声？”换一个问法：**“当前这些点，下一刻应该朝哪里移动？”** 就进入了 Flow Matching（流匹配，FM）的视角。

先不碰随机微分方程。我们只需要一把训练椅子、一团随机噪声，以及连接它们的直线，就能写出可用的训练目标。

## 1. 连一条从噪声到椅子的直线

记干净椅子为 $y$，随机噪声为 $z\sim\mathcal N(0,I)$，两者形状都是 $2048\times3$。这篇用递增的**生成时间** $t\in[0,1]$：

$$
x_t=(1-t)z+t y.
$$

$t=0$ 时全是噪声，$t=1$ 时就是椅子，中间是二者混合。例如 $t=0.3$，当前数组就是 $0.7z+0.3y$。

注意时间方向变了：DDPM 中的 $t$ 越大噪声越强；这篇的 $t$ 越大越接近数据。为避免混淆，后面统一用 $y,z$ 表示数据与噪声端点。

{% include generative-figure.html kind="chair-flow" %}

图中固定了同一把教学椅子和一份噪声，方便观察训练插值。终点是事先给定的，**这不是网络生成的椅子**。真正生成时，我们只有新噪声和学到的速度场。

## 2. 速度监督几乎可以直接读出来

对刚才的直线求时间导数：

$$
u=\frac{dx_t}{dt}=y-z.
$$

所以训练规则是：取椅子 $y$、噪声 $z$ 和随机时间 $t$，构造 $x_t$，让网络预测 $y-z$：

$$
L_{\mathrm{CFM}}
=\mathbb E_{y,z,t}
\left[\|v_\theta((1-t)z+ty,t)-(y-z)\|^2\right].
$$

这里叫条件流匹配（Conditional Flow Matching，CFM），因为监督速度来自给定端点的一条条件路径。和 DDPM 并排看，差别非常具体：

| 步骤 | DDPM 噪声预测 | 这里的线性 CFM |
| --- | --- | --- |
| 构造输入 | $a_t y+b_t z$，由扩散日程规定 | $(1-t)z+ty$ |
| 网络预测 | 噪声 $z$ | 速度 $y-z$ |
| 训练损失 | 噪声预测的平方误差 | 速度预测的平方误差 |
| 生成更新 | DDPM、DDIM 或概率流求解器 | 对 $dx/dt=v_\theta(x,t)$ 积分 |

对 MNIST，$y-z$ 是一张“像素变化速度图”；对点云，它是所有点的三维移动速度。张量大小没有改变，输出的含义改变了。

## 3. 生成时没有椅子，速度从哪里来？

训练结束后，从新的 $x(0)\sim\mathcal N(0,I)$ 开始，反复用网络查询当前速度。最简单的 Euler 更新是

$$
x(t+h)=x(t)+h\,v_\theta(x(t),t).
$$

从 $t=0$ 走到 $t=1$，得到新椅子。小网络的 MNIST 例子可以沿用同一个流程：

```python
# 训练；clean 可以是图像 [B,1,28,28] 或点云 [B,N,3]
t = torch.rand(clean.shape[0], device=clean.device)
weight = t.view((-1,) + (1,) * (clean.ndim - 1))
z = torch.randn_like(clean)
middle = (1 - weight) * z + weight * clean
loss = (model(middle, t) - (clean - z)).square().mean()
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

[MNIST 教学脚本]({{ '/assets/examples/generative_mnist.py' | relative_url }})的 `--model fm --epochs 10` 选项实现了这个目标，采样使用每步查询两次速度的 Heun 方法。

一个重要问题随之出现：不同的椅子与噪声配对，可能经过相近的中间状态，却要求不同速度。网络只看 $x,t$，该听谁的？平方误差给出的答案是：

$$
v^\star(x,t)=\mathbb E[y-z\mid x_t=x,t].
$$

它学到的是**当前位置所有可能配对的平均速度**。生成时，网络沿途重新判断，不必追随训练集中某一对端点的直线。

<details class="generative-details" markdown="1">
<summary>推导补充：为什么条件速度的回归能训练整体速度场？</summary>

设 $U=y-z$。条件均值的平方误差分解给出

$$
\mathbb E\|v_\theta-U\|^2
=\mathbb E\|v_\theta-v^\star\|^2+
\mathbb E\|U-v^\star\|^2.
$$

最后一项与参数无关，所以条件回归和直接回归边缘速度具有相同的参数梯度。各条条件路径满足的概率守恒关系在平均后仍成立；在相应正则性条件下，边缘速度就能运输整体样本分布。

</details>

## 4. 这怎样与扩散模型结合？

把两者统一写成一条高斯混合路径：

$$
x_t=a(t)y+b(t)z.
$$

扩散选择特定的信号、噪声日程；上面的线性 CFM 选择 $a(t)=t,b(t)=1-t$。对一般可微日程，一对已知端点的目标速度是

$$
u_t=\dot a(t)y+\dot b(t)z.
$$

因此，**保留扩散对应的概率路径，也可以改用 Flow Matching 回归速度**。或者连路径一起改成线性插值，得到前面的训练方式。

已有噪声网络也能换算成速度。设它估计 $\hat z=\epsilon_\theta(x,t)$，先用当前状态估计数据 $\hat y=(x-b\hat z)/a$，再代入速度：

$$
v_\theta(x,t)
=\frac{\dot a(t)}{a(t)}x+
\left(\dot b(t)-\frac{\dot a(t)b(t)}{a(t)}\right)
\epsilon_\theta(x,t).
$$

这就是“预测噪声”与“预测速度”之间的桥。它适用于相同路径的内部时刻 $a(t)\neq0$；不是把任意预训练 DDPM 的输出直接改名为线性流的速度。

<details class="generative-details" markdown="1">
<summary>再深一层：它与 Score、概率流 ODE 是什么关系？</summary>

高斯噪声路径满足 $s_t(x)=-\mathbb E[z\mid x_t=x]/b(t)$。代入上面的关系，得到

$$
v_t(x)=\frac{\dot a}{a}x+
\left(\frac{\dot a}{a}b^2-\dot b\,b\right)s_t(x).
$$

当日程来自对应的线性高斯扩散 SDE 时，这与其概率流 ODE 的速度一致，时间方向也要一起转换。它们联系的是每个时刻的分布，不是逐样本轨迹。

改变预测目标也会改变训练权重。令 $c(t)=\dot b-\dot a b/a$，使用这种相容参数化时，速度误差等于 $c(t)$ 乘以噪声误差，所以速度 MSE 等于按 $c(t)^2$ 加权的噪声 MSE。不能因此认定两个未加权损失完全相同。端点处的除零需要极限或专门处理。

</details>

## 5. 直线训练，是不是意味着一步就生成？

不意味着。训练时每对端点的直线速度不变，但网络学到的是随位置和时间改变的平均速度，因此实际采样轨迹可以弯曲：

{% include generative-figure.html kind="matching" %}

灰色虚线是训练配对的条件直线，蓝线是对解析平均速度场积分的轨迹。条件直线与蓝色生成轨迹不必逐条对应。

较容易积分的路径可能帮助减少采样调用，但效果还取决于学到的场、求解器和训练方式。独立配对的直线也没有自动求出噪声与数据之间的全局最优传输。

## 6. 换成 ShapeNet，需要做什么？

把一件训练样本换成一整把椅子的 $N\times3$ 坐标，取同形状高斯噪声，训练目标仍是 $y-z$。最重要的改变在网络：它需要利用整件椅子的结构，让所有点协同移动。

噪声与目标数组的第 $i$ 行配对，会定义一条训练路径；不需要先找出不同椅子之间的“语义对应点”。但输入与监督必须一起换序，才能保留逐点监督的关系。点云速度网络通常应当对点的排列等变。

想生成几何场，也可以先把椅子编码成潜变量，再在潜空间学习速度，最后解码为符号距离场（SDF）。[几何篇]({{ '/zh/generative-geometry/' | relative_url }})接着说明这条流程。

**关系记法。** 扩散与 FM 可以采用相同的高斯概率路径，并通过 Score 或噪声预测换算速度；FM 也能选择其它路径。扩散已有确定性的概率流采样，FM 的主要变化在于如何构造路径与训练速度场。

**参考与来源。** 条件目标、平均速度与高斯路径见 [Flow Matching for Generative Modeling，§3–4](https://arxiv.org/abs/2210.02747)。概率流联系见 [Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456)。椅子图为程序示意，双峰图使用解析分布，均不是训练结果。本文代码与解释独立编写，未报告 ShapeNet 实验。
