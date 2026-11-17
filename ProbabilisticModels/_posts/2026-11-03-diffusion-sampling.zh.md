---
title: "扩散模型（三）：DDPM 与 DDIM，训练相同，采样怎样不同？"
date: 2026-11-03
lang: zh
permalink: /zh/diffusion-sampling/
en_link: /en/diffusion-sampling/
series: generative-models
series_order: 7
categories: [Generative Models]
tags: [DDIM, Diffusion, Numerical Analysis]
classes: [statistics-article, generative-article]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "用同一个噪声网络理解 DDPM 的随机更新、DDIM 的确定性更新与跳步，再连接逆向 SDE 和概率流 ODE。"
---

{% include generative-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

DDPM 和 DDIM 的关系，可以先记成一句话：

> **在常用的噪声预测训练下，DDIM 可以复用 DDPM 训练好的网络；它主要改变的是生成时怎样使用预测，以及怎样从一个时间走到下一个时间。**

所以，理解两者时要分清两件事：**网络学到了什么，采样器拿它来做什么。** 下面先讲离散更新，再接到逆向 SDE 和概率流 ODE。

## 1. 先固定训练：网络只负责预测当前噪声

沿用[上一篇]({{ '/zh/denoising-diffusion/' | relative_url }})，取一张 MNIST 数字或一把 ShapeNet 椅子点云，随机选时间 $t$，构造：

$$
x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
$$

让网络看 $x_t,t$，预测 $\epsilon$，用 MSE 训练：

$$
L=\mathbb E_{x_0,t,\epsilon}
\left[\|\epsilon-\epsilon_\theta(x_t,t)\|^2\right].
$$

这次练习只涉及一个噪声水平。它没有要求生成时必须走 1000 步，也没有要求中途每一步都重新加噪。

训练好以后，网络可以在不同时间回答“当前噪声大概是什么”。**怎样把这个回答变成下一个状态，是采样器的职责。**

## 2. DDPM：预测均值，再随机抽取下一步

经典 DDPM 从 $x_T\sim\mathcal N(0,I)$ 开始，逐步生成 $x_{T-1},\ldots,x_0$。每一步先用噪声预测计算均值：

$$
\mu_\theta(x_t,t)=\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,
\epsilon_\theta(x_t,t)\right),
\qquad \alpha_t=1-\beta_t.
$$

然后围绕这个均值抽取下一状态：

$$
x_{t-1}=\mu_\theta(x_t,t)+\sigma_t z_t,
\qquad z_t\sim\mathcal N(0,I).
$$

这里 $\sigma_t$ 是所选反向方差的平方根；例如可以取
$\sigma_t^2=\tilde\beta_t=\beta_t(1-\bar\alpha_{t-1})/(1-\bar\alpha_t)$。最后一步不再添加随机扰动。

把它放回例子：

- 对 MNIST，网络预测各个像素的噪声，采样器得到稍干净的数字；
- 对椅子，网络预测各个坐标的噪声，采样器得到下一份点云。

**随机性有两个来源：最初的 $x_T$，以及中途新抽的 $z_t$。** 因此，只固定起始噪声而改变中途随机数，输出仍可能不同；固定全部随机数后，也可以复现实验。

## 3. DDIM：先估计干净样本，再按新时间重新组合

DDIM 换了一种使用预测的方式。先从当前 $x_t$ 估计干净样本：

$$
\hat x_0=
\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon_\theta(x_t,t)}
{\sqrt{\bar\alpha_t}}.
$$

然后选择更干净的时刻 $s<t$，把干净估计与噪声估计，按 $s$ 时刻的比例重新组合：

$$
\boxed{
x_s=\sqrt{\bar\alpha_s}\,\hat x_0+
\sqrt{1-\bar\alpha_s}\,\epsilon_\theta(x_t,t).
}
$$

这就是常用的**确定性 DDIM 更新**。两项分别表示：

| 项 | 做什么 |
| --- | --- |
| $\sqrt{\bar\alpha_s}\,\hat x_0$ | 放入新时刻所需的信号成分 |
| $\sqrt{1-\bar\alpha_s}\,\epsilon_\theta(x_t,t)$ | 保留新时刻所需的噪声成分 |

$s$ 更接近干净端，所以增加信号比例、降低噪声比例。到 $x_s$ 后，网络再看新的状态，重新预测。它不会只在最初预测一次，再一路使用同一个输出。

设置 $\bar\alpha_0=1$，最后跳到 $s=0$ 时，噪声项消失，返回 $\hat x_0$。

**为什么可以用同一个网络？** 因为训练主要用到每个时刻的加噪分布 $q(x_t\mid x_0)$，没有唯一规定所有时刻必须怎样连接。DDIM 构造了保留这些加噪边缘分布的另一族过程，使常用噪声训练目标仍可复用，再使用相应的生成更新。

## 4. 为什么 DDIM 可以快很多？

关键在于，它的更新公式直接允许从 $t$ 走到任意所选的 $s<t$。例如，训练时间有 1000 个，生成可以只访问：

$$
1000\longrightarrow980\longrightarrow960
\longrightarrow\cdots\longrightarrow20\longrightarrow0.
$$

这里是 50 次更新，每次调用一次网络；相邻时间的经典 DDPM 链则是 1000 次调用。**少调用昂贵的去噪网络，才是主要的加速来源。** 省掉抽取随机数本身并不是关键。

跳步也不是“少做几次相邻更新就停下”。每一步都要把当前时间 $t$ 和目标时间 $s$ 代入正确的系数，确保最后到达干净端。DDPM 也可以构造与较粗时间网格相容的随机采样；DDIM 提供了一种直接、常用的跳步方式。

步数越少，每次预测要跨越的变化越大，质量可能下降。上面的 50 步是说明调用次数的例子，不表示任何模型都能在 50 步达到相同质量。

## 5. 确定性会不会让生成失去多样性？

不会。确定性 DDIM 的意思是：

> **给定同一个初始噪声、网络和采样设置，后续更新是确定的。**

初始 $x_T$ 仍然是随机的。换一份噪声，可以得到另一个数字，或另一把椅子。

DDIM 还有带随机性的广义更新：

$$
x_s=\sqrt{\bar\alpha_s}\,\hat x_0+
\sqrt{1-\bar\alpha_s-\sigma_{t\to s}^2}\,
\epsilon_\theta(x_t,t)+\sigma_{t\to s}z,
\qquad z\sim\mathcal N(0,I),
$$

$$
\sigma_{t\to s}=\eta
\sqrt{\frac{1-\bar\alpha_s}{1-\bar\alpha_t}}\,
\sqrt{1-\frac{\bar\alpha_t}{\bar\alpha_s}},
\qquad 0\leq\eta\leq1.
$$

$\eta=0$ 时，就回到第三节的确定性公式；$\eta>0$ 时，中途也有新噪声。相邻时刻、$\eta=1$ 并选择相容的后验方差时，可以得到对应的 DDPM 更新。

所以，DDIM 不是“永远没有随机项”的同义词。比较时应当说清楚使用的是哪种设置。

## 6. 用一张表分清两者

| 问题 | 经典 DDPM 采样 | 常用确定性 DDIM 采样 |
| --- | --- | --- |
| 能否使用同一个噪声预测网络？ | 可以 | 可以 |
| 每次怎样更新？ | 计算反向均值，再按方差抽样 | 估计干净样本，再按目标时间重组 |
| 中途是否抽新噪声？ | 通常抽取，末步除外 | 不抽取，$\eta=0$ |
| 随机性来自哪里？ | 初始噪声与中途噪声 | 初始噪声 |
| 怎样减少调用？ | 使用相容的粗网格随机更新等方法 | 直接选择较短的采样时间子序列 |
| 换采样器是否必须重新训练？ | 在相容的路径与参数化下不必 | 通常可以直接复用模型 |

对 MNIST，可以固定同一组初始噪声，比对笔画是否连贯、不同数字是否覆盖。对 ShapeNet，保持点数、坐标尺度与相机一致，查看椅腿是否断裂、背面是否完整、有没有离群点。

同一份初始噪声方便控制变量，但不保证 DDPM 与 DDIM 输出同一张图或同一把椅子。二者使用的更新过程不同。

## 7. 这与 SDE、概率流 ODE 是什么关系？

把离散时间变成连续时间，就能进一步分清**共同学到的量**与**生成时选择的动力学**：

- DDPM 与连续扩散的逆向 SDE 有联系，生成轨迹包含随机扰动。
- 确定性 DDIM 在适当连续极限和变量变换下，与概率流 ODE 的确定性采样联系起来。
- 同一个噪声网络可以换算成 score，为两种连续采样方式提供所需的信息。

这里的联系不意味着“有限步 DDIM 就是概率流 ODE 的精确解”。离散步长和求解方式仍然会影响结果。

[下一篇]({{ '/zh/score-based-models/' | relative_url }})专门回答：SDE 是什么，score 为什么不出现在前向 SDE 中，以及训练好的同一个网络怎样同时用于逆向 SDE 和概率流 ODE。

**补充直觉：步长为什么重要？** 下面的旋转例子把真实速度场固定，让我们单独观察数值求解误差。Euler 沿当前方向走一步，Heun 再参考预测终点的方向。它不是 DDPM/DDIM 的生成质量对比。

{% include generative-figure.html kind="sampler" %}

增加步数，两种方法都逐渐接近圆弧。比较计算量时，还要看函数求值次数（NFE）：这里 Heun 每步查询两次，Euler 每步一次。对生成模型，真正昂贵的就是这些网络调用。

**主线。** 训练阶段学当前状态下的噪声预测，采样阶段决定怎样使用它。DDPM 的经典更新是随机的，DDIM 的常用更新是确定的；两者都能从随机初始状态生成样本。

**参考与来源。** 问题组织参考读者提供的 [DeepSeek 对话](https://chat.deepseek.com/share/qkai6x2oonl72m9rv2)。DDIM 的同目标训练与广义采样依据 [Denoising Diffusion Implicit Models，§3–4、附录 B–C](https://arxiv.org/abs/2010.02502)，连续时间联系见 [Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456)。旋转图为独立实现的解析例子；本文未报告 MNIST 或 ShapeNet 采样质量实验。
