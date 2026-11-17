---
title: "扩散模型（二）：够用的数学，从加噪公式推到训练与采样"
date: 2026-11-03
lang: zh
permalink: /zh/denoising-diffusion/
en_link: /en/denoising-diffusion/
series: generative-models
series_order: 6
categories: [Generative Models]
tags: [DDPM, ELBO, MNIST]
classes: [statistics-article, generative-article]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "只保留 DDPM 的完整推导主线：逐步加噪、闭式采样、反向后验、噪声参数化、MSE 训练与反向生成。"
---

{% include generative-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

[上一篇]({{ '/zh/diffusion-intuition/' | relative_url }})讲清了流程：先加噪，再学预测噪声，最后反复去噪生成。这篇回答公式之间的关系：

> **为什么要定义前向过程？为什么反向均值可以用噪声表示？噪声 MSE 又怎样接到最后的生成公式？**

下面只保留这条主线。用 $x_0$ 表示一个干净样本：它可以是 MNIST 的 $1\times28\times28$ 图像，也可以是 ShapeNet 椅子的 $2048\times3$ 点云。公式逐元素计算，$I$ 表示所有分量上的单位协方差。

## 1. 前向加噪：先规定一个简单的随机过程

每一步，稍微削弱原信号，再加入少量独立高斯噪声：

$$
q(x_t\mid x_{t-1})
=\mathcal N\!\left(\sqrt{\alpha_t}\,x_{t-1},\,\beta_t I\right),
\qquad \alpha_t=1-\beta_t,\quad 0<\beta_t<1.
$$

等价地，可以直接写成程序能执行的形式：

$$
x_t=\sqrt{\alpha_t}\,x_{t-1}+\sqrt{\beta_t}\,z_t,
\qquad z_t\sim\mathcal N(0,I).
$$

$\sqrt{\alpha_t}$ 是信号系数，$\sqrt{\beta_t}$ 是新噪声的标准差。每一步的 $z_t$ 独立采样；$\beta_1,\ldots,\beta_T$ 由我们指定，叫噪声日程。

对于 MNIST，这一步改变像素值；对于椅子，它改变每个点的三个坐标。这里没有要学习的参数。

## 2. 闭式表达：直接得到任意噪声水平

训练时，我们希望随手抽取第 $t$ 步，而不是每次都从第一步开始模拟。前向高斯过程恰好允许这样做。

定义累计系数：

$$
\bar\alpha_t=\prod_{s=1}^t\alpha_s,\qquad \bar\alpha_0=1.
$$

将逐步加噪合并，可以得到：

$$
q(x_t\mid x_0)
=\mathcal N\!\left(\sqrt{\bar\alpha_t}\,x_0,\,
(1-\bar\alpha_t)I\right).
$$

因此，只抽一份标准高斯噪声就可以构造 $x_t$：

$$
\boxed{
x_t=\sqrt{\bar\alpha_t}\,x_0+
\sqrt{1-\bar\alpha_t}\,\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
}
$$

为什么方差是 $1-\bar\alpha_t$？把前两步展开，噪声方差为
$\alpha_2\beta_1+\beta_2=\alpha_2(1-\alpha_1)+(1-\alpha_2)=1-\alpha_1\alpha_2$；继续递推就是上式。

注意，$\epsilon$ 表示合并后的总噪声，不是第一节某一步新抽的 $z_t$。之后网络预测的是这个 $\epsilon$。

**这个闭式公式负责制造训练输入。** 选好日程，使 $\bar\alpha_T$ 足够小，终点分布便接近标准高斯。

## 3. 反向去噪：先看一个能算出答案的版本

生成需要从 $x_t$ 走到 $x_{t-1}$。但真实反向分布 $q(x_{t-1}\mid x_t)$ 依赖未知的数据分布，不能直接写出。

训练时有个额外优势：我们知道干净样本 $x_0$。给定它以后，就能计算：

$$
q(x_{t-1}\mid x_t,x_0)
=\mathcal N\!\left(\tilde\mu_t(x_t,x_0),\,\tilde\beta_t I\right),
\qquad t\geq2.
$$

它为什么容易算？贝叶斯公式给出

$$
q(x_{t-1}\mid x_t,x_0)
\propto q(x_t\mid x_{t-1})\,q(x_{t-1}\mid x_0).
$$

右侧两项都是关于 $x_{t-1}$ 的高斯。相乘并配方，得到均值和方差：

$$
\tilde\mu_t=
\frac{\sqrt{\bar\alpha_{t-1}}\beta_t}{1-\bar\alpha_t}\,x_0+
\frac{\sqrt{\alpha_t}(1-\bar\alpha_{t-1})}{1-\bar\alpha_t}\,x_t,
$$

$$
\tilde\beta_t=
\frac{1-\bar\alpha_{t-1}}{1-\bar\alpha_t}\,\beta_t.
$$

不用背这两个系数。现在只要看清：**知道干净答案 $x_0$，就能写出该怎样往回走；生成时没有 $x_0$，所以需要网络。**

我们用一个可学习的高斯转移近似真实反向过程：

$$
p_\theta(x_{t-1}\mid x_t)
=\mathcal N\!\left(\mu_\theta(x_t,t),\,\sigma_t^2 I\right).
$$

先固定反向方差，把学习任务集中在均值 $\mu_\theta$ 上。后面采样使用 $\sigma_t^2=\tilde\beta_t$（$t\geq2$）这一种常见设置。

## 4. 关键换元：把未知原图换成未知噪声

第二节的闭式公式可以解出：

$$
x_0=
\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon}
{\sqrt{\bar\alpha_t}}.
$$

将它代入上一节的 $\tilde\mu_t$，合并系数，就得到：

$$
\tilde\mu_t=
\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,\epsilon\right).
$$

这一步把依赖 $x_0$ 的均值，改写成依赖 $\epsilon$ 的均值。于是，让网络输出噪声估计 $\epsilon_\theta(x_t,t)$，就可以定义：

$$
\boxed{
\mu_\theta(x_t,t)=
\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,
\epsilon_\theta(x_t,t)\right).
}
$$

**为什么预测噪声能做生成？因为网络的噪声预测经过这个公式，就变成了反向更新所需的均值。**

网络仍然只输入 $x_t,t$，没有偷偷获得原图。它也可以改为预测干净样本等其它量；噪声预测是这里采用的一种方便参数化。

## 5. 训练目标：用已知噪声监督网络

训练时，$x_0$ 来自数据集，$t$ 随机选取，$\epsilon$ 由程序采样。把它们代入闭式公式，网络的输入和目标就齐了：

$$
L_{\mathrm{simple}}
=\mathbb E_{x_0,t,\epsilon}
\left[
\left\|\epsilon-
\epsilon_\theta\!\left(
\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon,t
\right)\right\|^2
\right].
$$

它的操作含义与上一篇完全一致：取样本，选时间，加噪，预测，比较平方误差。

这与似然训练有什么关系？DDPM 的变分下界（ELBO）会要求学到的反向转移接近第三节可计算的后验；固定方差后，高斯之间的 KL 散度可化成均值 MSE。再代入第四节，就得到**带时间权重的噪声 MSE**。常用的 $L_{\mathrm{simple}}$ 进一步去掉了这些时间权重。

所以它有明确推导来源，但不是未经改动的负对数似然。我们在这里保留结论，不展开整条 ELBO。

训练核心如下，广播形状同时适用于图像和点云：

```python
index = torch.randint(T, (clean.shape[0],), device=clean.device)
a = alpha_bar[index].view((-1,) + (1,) * (clean.ndim - 1))
epsilon = torch.randn_like(clean)
noisy = a.sqrt() * clean + (1 - a).sqrt() * epsilon
prediction = model(noisy, (index.float() + 1) / T)
loss = (prediction - epsilon).square().mean()
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

这里 <code>alpha_bar[0]</code> 对应 $\bar\alpha_1$，所以传入网络的归一化时间是 <code>(index + 1) / T</code>。MNIST 用图像网络，ShapeNet 用能聚合整体形状信息的点云网络。

严重加噪后，单次噪声通常不能被唯一确定。MSE 的理想解是 $\mathbb E[\epsilon\mid x_t,t]$；训练并不要求网络恢复每次采样所用的随机数种子。

## 6. 采样生成：把预测代入反向更新

训练好后，丢开数据集，从新的高斯噪声开始：

$$
x_T\sim\mathcal N(0,I).
$$

对 $t=T,T-1,\ldots,1$，先预测 $\epsilon_\theta(x_t,t)$，再更新：

$$
\boxed{
x_{t-1}=
\frac1{\sqrt{\alpha_t}}
\left(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,
\epsilon_\theta(x_t,t)\right)
+\sqrt{\tilde\beta_t}\,z.
}
$$

$t>1$ 时，$z\sim\mathcal N(0,I)$；最后一步不再加噪，直接返回均值。这里用 $\bar\alpha_0=1$ 延拓方差公式，有 $\tilde\beta_1=0$。

这条更新包含三件事：

- 减去一部分网络预测的噪声；
- 补偿前向过程对信号的缩小；
- 在中间步骤按所选方差加入随机扰动。

最后得到的 $x_0$，就是新生成的数字或椅子点云。整个采样只使用当前状态、时间、网络与随机数，不需要原始样本。

## 7. 把所有公式连成一条线

| 环节 | 使用什么 | 得到什么 |
| --- | --- | --- |
| 定义前向过程 | 日程 $\beta_t$ | 可控的逐步加噪 |
| 合并前向过程 | $x_0,t,\epsilon$ | 可直接采样的 $x_t$ |
| 计算训练后验 | $x_t,x_0$ | 可计算的反向均值 |
| 改写均值 | 用噪声表达 $x_0$ | $\mu_\theta$ 的噪声参数化 |
| 训练 | 真实样本与自己抽的噪声 | $\epsilon_\theta(x_t,t)$ |
| 生成 | 新噪声与训练好的网络 | 新样本 $x_0$ |

一句话连接训练与生成：

> **闭式公式负责加噪，MSE 负责教网络预测噪声，反向均值公式负责把预测变成生成步骤。**

至此，DDPM 的整体过程已经闭合。想运行 MNIST，可以使用[教学脚本]({{ '/assets/examples/generative_mnist.py' | relative_url }})的 <code>--model ddpm --epochs 10</code> 选项；想理解为什么能少走一些步骤，继续读 [DDIM 采样]({{ '/zh/diffusion-sampling/' | relative_url }})；想把预测目标换成移动速度，则读 [Flow Matching]({{ '/zh/flow-matching/' | relative_url }})。

**参考与来源。** 推导顺序参考读者提供的 [DeepSeek 分享回答](https://chat.deepseek.com/share/ommd8ohmqvu2lxjvpo)，公式以 [DDPM，§2–3 与附录](https://arxiv.org/abs/2006.11239)为依据。形状应用背景见 [Diffusion Probabilistic Models for 3D Point Cloud Generation](https://arxiv.org/abs/2103.01458)。本文讨论通用训练机制，不复现该论文的具体网络；MNIST 脚本为教学实现，未报告 ShapeNet 训练结果。
