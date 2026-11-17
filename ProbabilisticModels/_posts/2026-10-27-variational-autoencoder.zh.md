---
title: "VAE：从隐变量概率模型到生成"
date: 2026-10-27
lang: zh
permalink: /zh/variational-autoencoder/
en_link: /en/variational-autoencoder/
series: generative-models
series_order: 4
categories: [Probabilistic Models]
tags: [VAE, Generative Models, Variational Inference]
classes: statistics-article
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "从怎样生成新的手写数字出发，解释潜变量、编码器和解码器为什么出现，推导训练目标，再用二维数据与 MNIST 实验观察重建和生成。"
---

{% include vae-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

假设我们有一批手写数字图像，希望训练出一个程序：每运行一次，它就画出一个新的数字。程序应该能画出不同的笔迹和形状，同时保留手写数字共有的结构。

直接给 784 个像素各抽一个随机数，通常只会得到噪声。我们需要学到像素之间的关系，例如哪些位置应该连成笔画、哪些区域应该留白。**变分自编码器**（variational autoencoder，VAE）解决这个问题的思路是：先抽取一小组随机数，再通过一个学出来的模型，把它们变成有结构的数据。

生成这一步容易写成程序。真正困难的是：只有训练图像、没有与它们对应的那组随机数，应该怎样训练这个模型？编码器、变分下界和重参数化，都是为了解决这件事而引入的。下面沿着这个问题逐步展开，最后用页面上已训练好的模型观察结果。

## 1. 从几个随机数开始，怎样生成有结构的数据？

<div class="pgm-section-intro" markdown="1">

**先把生成过程想清楚。** 如果能够把容易抽取的随机数变成复杂数据，就可以反复运行这个过程来产生新样本。我们首先需要定义这两个部分：随机数从哪里来，以及怎样把它变成观测。

</div>

先用比图像简单的例子。设训练数据是平面上的一片弯曲点云。虽然每个点有两个坐标，但它们大致沿着一条曲线分布。我们可以用一个数 $z$ 表示沿曲线的位置，再用函数 $m_\theta(z)$ 把这个位置变成平面上的点。这里 $\theta$ 表示函数中需要学习的参数；实际使用的是神经网络。

$z$ 没有出现在训练数据里，因此叫作**隐变量**，也常叫潜变量。为了能在生成时抽到它，先指定一个简单分布，例如标准正态分布：

$$
Z\sim p(z)=\mathcal N(0,1).
$$

这个分布称为**先验**，它描述看到任何具体观测之前，我们怎样抽取 $z$。取标准正态，是因为它容易采样、计算方便；曲线的复杂形状交给网络来学习。

实际点云通常有厚度。即使两个点来自同一段曲线，也可能因为测量误差等原因略有不同。可以用固定标准差 $\tau$ 的高斯噪声描述这种变化：

$$
X=m_\theta(Z)+\tau\eta,\qquad \eta\sim\mathcal N(0,I_2).
$$

例如曲线函数暂时取 $m(z)=(z,(z^2-1)/2)^\top$：抽到 $z=0$，中心位置是 $(0,-0.5)$；抽到 $z=1$，中心位置是 $(1,0)$。再加一点噪声，就在中心附近得到一个点。训练时我们知道点的位置，但不知道这条函数，模型要从点云中学习它。

{% include vae-concept.html kind="mapping" %}

把“固定 $z$ 后，在中心附近抽一个点”写成条件分布，就是

$$
p_\theta(x\mid z)=\mathcal N(x\mid m_\theta(z),\tau^2I_2).
$$

网络负责给出这个分布的均值，所以叫**解码器**：它把潜变量变成观测空间中的分布参数。对于图像，可以让它输出各个像素的概率，第 6 节再具体说明。

先抽 $z$、再抽 $x$，也就定义了联合分布：

$$
p_\theta(x,z)=p(z)p_\theta(x\mid z).
$$

这三个符号分别回答三个问题：$p(z)$ 决定会访问哪些潜变量位置；$p_\theta(x\mid z)$ 决定每个位置会产生什么观测；$p_\theta(x,z)$ 描述二者共同出现的密度。

<div class="pgm-section-summary" markdown="1">

**这一节得到的模型。** 从标准正态抽一个潜变量，经解码器得到中心位置，再加入观测噪声，就产生一个新点。接下来要学习的是解码器的参数，让生成的点云与训练数据相符。

</div>

## 2. 只有观测，怎样训练解码器？

<div class="pgm-section-intro" markdown="1">

**现在遇到训练问题。** 如果知道每个训练点对应哪个潜变量，就能直接调整解码器，让输出靠近那个点。但数据只提供了点的位置，我们需要把所有可能产生它的潜变量都考虑进去。

</div>

给定一个训练观测 $x$，一种自然的学习标准是：让模型认为这个观测容易出现。由于同一个 $x$ 可能由不同的 $z$ 产生，它在模型中的密度要把所有可能性加起来：

$$
p_\theta(x)=\int p(z)p_\theta(x\mid z)\,dz.
$$

这个式子叫作对隐变量的**边缘化**。积分中的每一项，都在问“抽到这个 $z$ 的可能性有多大，它又能在多大程度上解释 $x$”。最大似然训练希望提高训练数据的平均 $\log p_\theta(x)$。

问题在于，解码器是非线性网络，这个积分通常没有方便的解析结果。潜变量维度较高时，直接用密集网格积分也很昂贵。从先验随意抽一些 $z$ 虽然可以估计密度，但对某个给定的 $x$，许多抽样可能都解码到离它很远的位置，计算效率很低。

于是我们希望反过来问：**看到这个 $x$，哪些 $z$ 比较可能解释它？**这个问题的精确答案是后验分布：

$$
p_\theta(z\mid x)=\frac{p(z)p_\theta(x\mid z)}{p_\theta(x)}.
$$

可是分母恰好又是刚才难算的积分。我们因此训练另一个网络，让它根据 $x$ 给出一个容易计算、容易采样的近似分布 $q_\phi(z\mid x)$。这个网络叫**编码器**，参数记为 $\phi$。

在常见 VAE 中，编码器为每个输入输出一组均值和方差，规定近似后验为对角高斯：

$$
q_\phi(z\mid x)=\mathcal N\!\left(z\mid\mu_\phi(x),
\operatorname{diag}(\exp r_\phi(x))\right).
$$

这里 $r_\phi(x)$ 是**对数方差**，所以方差是 $\exp r_\phi(x)$、标准差是 $\exp(r_\phi(x)/2)$，指数运算逐元素进行。这样网络可以输出任意实数，同时保证得到正方差。

例如对一个训练点，编码器可能给出一维分布 $\mathcal N(0.8,0.2^2)$。它表达的是“这个点可能对应 $0.8$ 附近的一些潜变量位置”。均值给出中心，标准差描述范围。用分布来表示推断，可以表达我们对潜变量的不确定性；对角高斯只是计算方便的一种近似，遇到复杂后验时也可能不够准确。

{% include vae-concept.html kind="inference" %}

此时两套网络的工作就清楚了：解码器从 $z$ 出发描述可能的 $x$；编码器看到 $x$ 后，寻找可能的 $z$。剩下的关键是，怎样用同一个目标把它们一起训练起来。

<div class="pgm-section-summary" markdown="1">

**编码器出现的原因。** 训练观测对应的潜变量未知，而精确后验又难算。编码器提供一个可学习的近似后验，让计算集中到能够解释当前输入的潜变量附近。

</div>

## 3. ELBO：把难算的似然变成能计算的目标

<div class="pgm-section-intro" markdown="1">

**还缺一个可训练的目标。** 编码器已经能建议去哪一段潜空间找解释，但它给出的分布也有待学习。我们需要一个量，同时评价这些解释是否有用，并推动解码器更好地描述数据。

</div>

变分推断给出一个可计算的下界，称为**证据下界**（evidence lower bound，ELBO），用 $\mathcal L$ 表示：

$$
\begin{aligned}
\mathcal L(\theta,\phi;x)
&=\underbrace{\mathbb E_{q_\phi(z\mid x)}[\log p_\theta(x\mid Z)]}_{\text{用推断出的潜变量解释输入}}\\
&\quad-\underbrace{D_{\mathrm{KL}}(q_\phi(z\mid x)\Vert p(z))}_{\text{近似后验相对先验的偏离}}.
\end{aligned}
$$

先看第一项。把一幅图或一个点 $x$ 交给编码器，抽取它认为合理的潜变量，再交给解码器。如果解码器在这些位置给 $x$ 较高的概率密度，这一项就大。由于计算绕了一圈回到输入，通常称它为**重建项**。

第二项使用 **KL 散度**衡量两个分布的差异。它比较当前输入的近似后验与事先选好的先验。训练通过编码器选取潜变量，生成时却要从先验抽取潜变量；把它们放在共同的概率目标中约束，有助于让这两种使用方式协调起来。它与重建项之间的取舍来自下界的推导。

**这条下界怎样从似然得到？**对固定的 $x$，简记 $q(z)=q_\phi(z\mid x)$。在积分中乘除同一个 $q(z)$，再利用对数的凹性：

$$
\begin{aligned}
\log p_\theta(x)
&=\log\mathbb E_q\!\left[\frac{p(Z)p_\theta(x\mid Z)}{q(Z)}\right]\\
&\geq\mathbb E_q[\log p_\theta(x\mid Z)]
-\mathbb E_q\!\left[\log\frac{q(Z)}{p(Z)}\right]
=\mathcal L.
\end{aligned}
$$

最后一个期望就是 KL 散度。这说明我们可以通过提高下界来学习模型，并且计算目标时只需要先验、解码器和编码器给出的分布，避开了直接计算 $p_\theta(x)$。

实际优化通常写成最小化损失，因此把符号取反：

$$
\boxed{J(x)=-\mathcal L
=\mathbb E_{q_\phi(z\mid x)}[-\log p_\theta(x\mid Z)]
+D_{\mathrm{KL}}(q_\phi(z\mid x)\Vert p(z)).}
$$

这就是常见的“重建损失加 KL”。重建损失大，说明抽到的潜变量经过解码后难以解释输入；先验 KL 大，说明编码分布偏离先验较多。两项分别描述不同事情，总和才是本篇使用的负 ELBO 训练目标。

<details class="pgm-derivation" markdown="1">
<summary>进一步理解：下界与真实似然还差多少？</summary>

用贝叶斯公式代入 KL 的定义，可得到精确恒等式：

$$
\log p_\theta(x)-\mathcal L
=D_{\mathrm{KL}}(q_\phi(z\mid x)\Vert p_\theta(z\mid x)).
$$

右边比较的是近似后验与**真实后验**。固定解码器参数 $\theta$ 时，$\log p_\theta(x)$ 不随编码器变化，因此提高 ELBO 就是在缩小后验近似的差距。两套网络共同更新时，还同时在改变生成模型本身。

这个差距里的 KL，与训练损失中“近似后验对先验”的 KL 有不同的比较对象。前者通常难以直接计算，后者可以计算。因此训练日志里的先验 KL 不能直接告诉我们后验近似有多准确。

</details>

<div class="pgm-section-summary" markdown="1">

**现在有了训练标准。** 用编码器抽到的潜变量重建输入，计算重建代价，再加上相对先验的 KL。最小化这个总和，就能在不直接计算边缘似然的情况下共同学习两个网络。

</div>

## 4. 从这个目标到一次参数更新

<div class="pgm-section-intro" markdown="1">

**目标还需要落实为计算。** KL 能否直接求出？期望怎样估计？抽样以后，梯度怎样回到编码器？解决这三个问题，就能写出一次完整的训练更新。

</div>

**先计算 KL。**当先验为标准高斯、近似后验为对角高斯时，有解析式：

$$
D_{\mathrm{KL}}(q\Vert p)
=\frac12\sum_{j=1}^d[\mu_j^2+\exp r_j-1-r_j].
$$

其中 $d$ 是潜变量维度。代入 $\mu=0,r=0$，得到 KL 为 0，因为此时均值为 0、方差为 1，两个分布相同。若只有一维且 $\mu=1,r=0$，KL 为 $1/2$；若均值不变、方差继续缩小，KL 也会发生变化。因此这项既约束中心，也约束分布的宽度。

<details class="pgm-derivation" markdown="1">
<summary>推导：高斯 KL 的四项分别从哪里来？</summary>

先看一维，$q=\mathcal N(\mu,\sigma^2)$、$p=\mathcal N(0,1)$。由密度公式，

$$
\log\frac{q(z)}{p(z)}
=-\log\sigma-\frac{(z-\mu)^2}{2\sigma^2}+\frac{z^2}{2}.
$$

对 $q$ 取期望，使用 $\mathbb E_q[(Z-\mu)^2]=\sigma^2$ 和 $\mathbb E_q[Z^2]=\mu^2+\sigma^2$：

$$
D_{\mathrm{KL}}(q\Vert p)=\frac12(\mu^2+\sigma^2-1-\log\sigma^2).
$$

令 $r=\log\sigma^2$，再把各个独立分量相加，就得到正文公式。

</details>

**再估计重建期望。**编码器针对每个 $x$ 给出 $\mu$ 和 $r$。从这个高斯分布中抽取几个 $z$，逐个算重建损失，再取平均，就能估计期望。

为了让梯度沿着计算过程传回编码器，把高斯抽样写成

$$
\epsilon\sim\mathcal N(0,I_d),\qquad
z=\mu_\phi(x)+\exp(r_\phi(x)/2)\odot\epsilon.
$$

这叫**重参数化**，$\odot$ 表示逐元素乘法。随机数 $\epsilon$ 来自一个固定分布；均值和标准差怎样影响 $z$，现在都写成了可求导的运算。例如一维时 $\partial z/\partial\mu=1$、$\partial z/\partial r=\tfrac12e^{r/2}\epsilon$。于是解码后的重建损失也能沿着 $z$ 影响编码器参数。

例如编码器给出 $\mu=0.8$、$\sigma=0.2$，本次抽到 $\epsilon=-0.5$，就得到 $z=0.7$。解码器拿这个 $z$ 产生观测分布，再评价原来的 $x$ 在其中是否容易出现。

**最后计算重建损失。**对第 1 节固定方差的高斯观测模型，负对数密度为

$$
-\log p_\theta(x\mid z)
=\frac{\lVert x-m_\theta(z)\rVert^2}{2\tau^2}
+D\log\tau+\frac D2\log(2\pi),
$$

其中 $D$ 为观测维度，二维点云中 $D=2$。第一项是平方距离：输出中心离训练点越远，代价越大。$\tau$ 描述我们允许多大的观测波动；同样的距离，在更窄的高斯下受到更大惩罚。后两项是高斯密度的归一化常数，$\tau$ 固定时不影响参数梯度，但报告负 ELBO 数值时需要保留。

每个观测使用 $L$ 个独立潜变量样本时，总损失估计为

$$
\widehat J(x)=\frac1L\sum_{\ell=1}^L[-\log p_\theta(x\mid z^{(\ell)})]
+\frac12\sum_{j=1}^d[\mu_j^2+\exp r_j-1-r_j].
$$

下面的实验训练时每个输入只抽一次，即 $L=1$，并在一个小批量上取平均。单次抽样会有波动，但多次参数更新会反复看到不同噪声。编码器输出分布、抽样、解码、计算损失、反向传播，这几步便组成了 VAE 训练。

<details class="pgm-derivation" markdown="1">
<summary>代码：把上述步骤对应到 PyTorch</summary>

代码来自[二维实验的完整脚本]({{ '/assets/examples/vae_toy.py' | relative_url }})。`batch` 的形状是 `[M, 2]`，潜变量是一维。

```python
mu, logvar = model.encode(batch)
std = (0.5 * logvar).exp()
z = mu + std * torch.randn_like(mu)
mean = model.decoder(z)

nll = ((batch - mean).square() / (2 * tau**2)
       + math.log(tau) + 0.5 * math.log(2 * math.pi)).sum(-1)
kl = 0.5 * (mu.square() + logvar.exp() - 1 - logvar).sum(-1)
loss = (nll + kl).mean()

optimizer.zero_grad()
loss.backward()
optimizer.step()
```

`.sum(-1)` 分别把观测坐标、潜变量坐标的贡献相加；最后 `.mean()` 对样本取平均。这与正文的每观测负 ELBO 一致。若把重建项额外除以像素数，却保持 KL 不变，两项的相对权重就改变了。

这段计算保留着从 `mean` 经 `z` 到 `mu`、`logvar` 的依赖。若在中间对 `z` 调用 `detach()`，重建项就无法沿这条路径更新编码器。

</details>

<div class="pgm-section-summary" markdown="1">

**一次训练更新已经完整了。** 高斯 KL 直接计算；重建期望通过抽样估计；重参数化把抽样写成可求导的运算。两项相加后反向传播，同时更新编码器和解码器。

</div>

## 5. 在二维点云上，看模型究竟学到了什么

<div class="pgm-section-intro" markdown="1">

**用一个看得见的例子检查模型。** 曲线附近的点既能画出训练观测，也能画出解码器的输出。这样可以直接看到：给一个已有点寻找潜变量，与从随机潜变量产生新点，分别做了什么。

</div>

实验数据就是第 1 节提到的抛物线加噪声：

$$
U\sim\mathcal N(0,1),\qquad
X=\begin{pmatrix}U\\(U^2-1)/2\end{pmatrix}+0.18\eta,
\qquad\eta\sim\mathcal N(0,I_2).
$$

训练只提供 $X$。数据生成时的 $U$ 没有作为标签送给模型，VAE 要自己学出潜变量坐标和解码函数。学到的坐标方向可能与 $U$ 相反，但只要生成的数据分布相符，这仍然可以是合理的模型。

{% include vae-figure.html kind="vae" %}

先看图中的解码器均值曲线，再拖动 $z$。绿色点显示 $m_\theta(z)$：它让我们看到，解码器把潜变量轴上的不同位置映射到了平面上的哪里。曲线周围的灰点，则是从标准正态先验抽 $z$、解码后再加入观测噪声得到的生成样本。曲线描述中心位置，散点体现同一模型的随机变化。

接着选择一个留出观测，比较红色输入与橙色重建点。橙点的计算是

$$
x\xrightarrow{\text{编码器}}\mu_\phi(x)
\xrightarrow{\text{解码器}}m_\theta(\mu_\phi(x)).
$$

这里采用后验均值作为代表位置，因此每次选择相同输入都会得到同一个橙点。若切到“潜变量分布”视图，还能看到编码器给出的整条近似后验。重建反映模型怎样解释一个已有观测；灰色生成点则反映没有指定观测时，模型自己会产生什么。

点击重新采样会更换灰点的随机数。网络权重固定，所以解码器曲线不随它变化。网页加载的是离线训练后的模型，下面给出复现方法。

<details class="pgm-derivation" markdown="1">
<summary>复现二维实验：网络、训练设置与指标</summary>

编码器为 $2\to16\to16\to2$，最后两个数是一维均值与对数方差；解码器为 $1\to16\to16\to2$。隐藏层使用 $\tanh$，观测标准差固定为 $\tau=0.18$。

训练使用 512 个观测，批量 128，Adam 学习率 0.003，共 2500 次更新，每个观测一个潜变量样本。编码器对数方差限制在 $[-8,5]$。训练种子为 13，训练数据和留出数据种子分别为 21、22。评估使用 256 个独立留出观测，每个观测 32 个固定噪声样本。

在装有 PyTorch 的环境中，从仓库根目录执行：

```text
python assets/examples/vae_toy.py
```

脚本生成数据并导出[网页模型文件]({{ '/assets/data/vae-toy-model.json' | relative_url }})，其中记录权重、配置、指标、运行版本和前向核对值。运行环境不同，精确数值可能略有差异。

当前模型的留出集平均负 ELBO 估计从 22.4332 降到 1.4667 nat/观测。最终重建负对数密度约为 −0.4836，先验 KL 约为 1.9503，两项相加得到总损失。这里使用自然对数，单位为 nat。

重建项出现负数，是因为连续密度可以大于 1，其负对数便可以小于 0。例如很窄的高斯在中心有很高的密度。区间概率仍需对密度积分，仍在 0 与 1 之间。

确定性重建 $m_\theta(\mu_\phi(x))$ 只解码一个代表位置；对非线性解码器，它一般不等于对整个近似后验求平均的 $\mathbb E_q[m_\theta(Z)]$。图形窗口外的生成点会被裁切，抽取潜变量时使用的高斯本身没有截断。

</details>

<div class="pgm-section-summary" markdown="1">

**图中对应着两个任务。** 重建从一个已知观测出发，检查编码与解码能否解释它；生成从先验出发，检查整个模型会产生怎样的数据。它们使用同一个解码器，但潜变量的来源不同。

</div>

## 6. 换成手写数字，哪些地方需要改变？

<div class="pgm-section-intro" markdown="1">

**现在回到画数字的目标。** 二维实验已经具备了完整的训练方法。处理图像时，需要把两个坐标换成像素，并为这些像素选择合适的观测分布；编码、抽样和变分学习的基本过程可以沿用。

</div>

MNIST 的每张图有 $28\times28=784$ 个像素。这个教学模型先把像素二值化：原始 0–255 数值大于 127 的像素取 1，其余取 0。这样每个像素就可以用伯努利分布表示。

给定一个二维潜变量 $z$，解码器输出 784 个数 $a_{\theta,j}(z)$，再经过 sigmoid 得到各像素为 1 的概率：

$$
\pi_{\theta,j}(z)=\operatorname{sigmoid}(a_{\theta,j}(z)).
$$

例如一个像素的概率为 0.9，意味着在这个位置抽取二值像素时，90% 的机会得到 1。生成整张图时，对 784 个位置分别抽样。这是在**给定同一个 $z$** 后的条件独立假设；不同图像共享的笔画结构，来自潜变量对所有像素概率的共同影响。

因此，观测模型和重建损失分别为

$$
p_\theta(x\mid z)=\prod_{j=1}^{784}
\pi_{\theta,j}(z)^{x_j}(1-\pi_{\theta,j}(z))^{1-x_j},
$$

$$
-\log p_\theta(x\mid z)
=-\sum_{j=1}^{784}\left[x_j\log\pi_{\theta,j}(z)
+(1-x_j)\log(1-\pi_{\theta,j}(z))\right].
$$

这就是二元交叉熵。一个真实值为 1 的像素，若预测概率为 0.9，损失约为 $-\log0.9=0.105$；若只给 0.1，损失约为 2.303。它评价的是解码器对输入像素的解释。先验、近似后验、高斯 KL 和重参数化都沿用前面的形式。

**先看重建：一个输入能否通过潜变量保留下来？**

{% include vae-mnist.html kind="reconstruction" %}

选择一张测试图，沿着“输入 → 编码分布 → 潜变量 → 解码图”看一遍。编码器把 784 个像素变成二维均值和二维对数方差。页面列出的 $\mu$、$\log\sigma^2$、$\epsilon$ 和 $z$ 对应第 4 节的抽样公式。

这里有两种重建：“均值重建”直接解码 $\mu_\phi(x)$；“采样重建”先从近似后验抽 $z$ 再解码。点击重新采样时，前者固定，后者可能改变。两幅重建都用灰度显示各像素的伯努利概率，例如 0.7 显示成相应亮度，方便我们看清解码器的输出。

如果重建丢掉了笔画或变得模糊，可以联系这个模型的限制理解：信息需要经过二维潜变量，网络也比较小。重建图让我们看到这种表示最终保留了哪些细节。

**再看生成：不给输入图，模型会画出什么？**

{% include vae-mnist.html kind="generation" %}

均匀坐标网格展示潜空间不同位置的解码结果。拖动 $z_1,z_2$，可以观察邻近位置的图像怎样变化。它像是一张解码器地图：边角和中心都被展示，便于比较不同位置。

模型实际生成时，位置来自标准高斯先验，因此中心附近比远处更常被访问。切换到“标准高斯先验抽样”，图块就改为解码随机抽到的位置。再选择“伯努利抽样图”，便会根据像素概率抽出 0 或 1，完成“抽潜变量 → 算像素概率 → 抽图像”的完整生成过程。

这个模型没有接收数字类别标签。某次抽样得到什么数字，取决于抽到的潜变量与解码器学到的映射。

**最后看插值：两个编码之间，解码器怎样过渡？**

{% include vae-mnist.html kind="interpolation" %}

选择两张图 A、B，编码得到各自的均值，再在两点之间取位置：

$$
z_\alpha=(1-\alpha)\mu_\phi(x_A)+\alpha\mu_\phi(x_B),\qquad 0\leq\alpha\leq1.
$$

每一个中间位置都交给同一个解码器生成概率图。$\alpha=0$、$\alpha=1$ 对应两端的均值重建，其他位置展示潜空间中间的输出。因此过渡路径取决于学到的表示；它可能平滑，也可能经过模糊或形状不清的位置。通过它可以观察模型如何组织图像之间的关系。

<details class="pgm-derivation" markdown="1">
<summary>复现 MNIST 实验：数据划分、网络与训练代码</summary>

使用 [torchvision 的 MNIST 数据集](https://docs.pytorch.org/vision/stable/generated/torchvision.datasets.MNIST.html)。从官方 60000 张训练图中，以种子 33 随机划出 55000 张训练、5000 张验证；官方 10000 张测试图在训练结束后评估。数字标签不进入编码器或损失。

编码器为 $784\to128\to64\to4$，末尾拆成二维均值与二维对数方差；解码器为 $2\to64\to128\to784$。隐藏层用 $\tanh$，末层给出 logits。二维潜空间便于直接浏览，也限制了表示能力。

每批 256 张图，每张一个潜变量样本。Adam 学习率 0.001，训练种子 31，固定训练 16 轮，KL 权重为 1。对数方差限制在 $[-8,5]$。核心更新为：

```python
mu, logvar = model.encode(x)
z = mu + (0.5 * logvar).exp() * torch.randn_like(mu)
logits = model.decoder(z)

nll = F.binary_cross_entropy_with_logits(
    logits, x, reduction="none").sum(-1)
kl = 0.5 * (mu.square() + logvar.exp() - 1 - logvar).sum(-1)
loss = (nll + kl).mean()

optimizer.zero_grad()
loss.backward()
optimizer.step()
```

`binary_cross_entropy_with_logits` 以数值稳定的方式把 sigmoid 与伯努利负对数似然一起算出。对像素求和后再对批量平均，所以损失单位为 nat/图像。

完整脚本是 [vae_mnist.py]({{ '/assets/examples/vae_mnist.py' | relative_url }})。装有 torch 和 torchvision 后，在仓库根目录运行：

```text
python assets/examples/vae_mnist.py --epochs 16
```

首次运行会下载数据，可通过 `--data-dir` 指定缓存位置、`--output` 指定导出文件。网页使用[导出的模型权重]({{ '/assets/data/vae-mnist-model.json' | relative_url }})，同时打包了前 40 张测试图供交互浏览；最终指标使用完整 10000 张测试图。网页操作只做前向计算。

</details>

<div class="pgm-section-summary" markdown="1">

**图像版沿用了同一种方法。** 解码器现在描述二值像素的概率，重建代价相应变成二元交叉熵。重建检查某个输入能保留多少信息，先验生成检查模型自己能画出什么，插值展示它怎样组织潜空间。

</div>

## 7. 怎样判断这个 VAE 学得好不好？

<div class="pgm-section-intro" markdown="1">

**几张清楚的生成图还不足以描述整个模型。** 我们还想知道它能否处理没见过的图、是否经常生成合理结果，以及潜变量有没有真正参与生成。这些问题需要结合独立数据、损失和模型行为来判断。

</div>

先看模型在独立数据上的目标。实验每轮在验证集上，用每张图一个固定噪声样本估计负 ELBO；预先设定的 16 轮训练结束后，再评估测试集。当前导出模型的结果如下：

| 数据与指标 | 数值 / nat 每图 |
| --- | --- |
| 验证集初始负 ELBO 估计 | 544.6864 |
| 验证集第 16 轮负 ELBO 估计 | 145.9615 |
| 测试集重建负对数似然估计 | 141.1539 |
| 测试集先验 KL | 5.7046 |
| 测试集负 ELBO 估计 | 146.8585 |

验证损失下降，说明这个目标下模型对未参与训练的图像有了更好的解释。测试集的最后两项也能核对：$141.1539+5.7046=146.8585$。这些数值属于当前的固定二值化、二维潜变量和小型网络，比较不同模型时需要保持数据处理和评估方法一致。

接着把指标与交互图联系起来。重建较清楚，说明从输入推断出的潜变量保留了有用信息；从先验反复抽样也经常得到合理数字，才说明生成时访问的位置得到了较好的训练。两种表现都与最终目标有关，观察它们能帮助判断问题出在哪个环节。

有一种特殊的失败情况叫**后验坍塌**。编码器对许多不同输入都给出接近先验的分布，解码器也几乎不随 $z$ 变化。这时潜变量携带的输入信息很少，先验 KL 可能很小；如果同时看到不同输入的编码几乎相同、改变 $z$ 也难以改变输出，就有理由怀疑模型没有利用好这条通道。KL 小本身并不足以判断，需要结合这些行为。

至此也能理解“变分自编码器”这个名字。它有“编码后再解码”的重建路径，而编码得到的是潜变量分布；这个分布通过变分下界参与生成模型的学习。训练让编码器帮助解码器学习，学好以后，先验与解码器便能独立产生新样本。

<div class="pgm-section-summary" markdown="1">

**整篇文章解决的问题。** 我们想从简单随机数生成复杂数据，却只拥有观测。编码器帮助寻找每个观测的潜变量解释，ELBO 提供可计算的学习目标，重参数化让目标能通过抽样回传梯度。训练后，从先验抽潜变量、经解码器抽观测，就得到生成过程。

</div>

后续的[扩散模型文章]({{ '/zh/diffusion-intuition/' | relative_url }})会从另一个角度研究生成：通过学习逐步去噪，把随机噪声转变成有结构的数据。

## 8. 符号与参考资料

| 符号 | 含义 |
| --- | --- |
| $x,z$ | 观测、潜变量 |
| $\theta,\phi$ | 解码器参数、编码器参数 |
| $p(z),p_\theta(x\mid z)$ | 先验、给定潜变量的观测分布 |
| $q_\phi(z\mid x)$ | 编码器给出的近似后验 |
| $\mu_\phi,r_\phi$ | 近似后验均值、对数方差 |
| $m_\theta,\tau$ | 高斯观测模型的均值、固定标准差 |
| $d,D,L$ | 潜变量维度、观测维度、每个输入的潜变量抽样数 |
| $\mathcal L,J$ | ELBO、负 ELBO 损失 |

1. **Diederik P. Kingma、Max Welling。** [*Auto-Encoding Variational Bayes*](https://arxiv.org/html/1312.6114v11)，§2–3 与附录 B、C。变分目标、重参数化及高斯与伯努利模型的主要依据。
2. **Diederik P. Kingma、Max Welling，2019。** [*An Introduction to Variational Autoencoders*](https://arxiv.org/abs/1906.02691)。生成模型、变分学习与推断的系统介绍。
3. **Chris Cremer、Xuechen Li、David Duvenaud，2018。** [*Inference Suboptimality in Variational Autoencoders*](https://proceedings.mlr.press/v80/cremer18a.html)。近似推断误差的进一步分析。
4. **Torchvision 官方文档。** [MNIST 数据集接口](https://docs.pytorch.org/vision/stable/generated/torchvision.datasets.MNIST.html)。

**来源与勘误。**本文根据以上文献自主组织和推导。合成数据示例、训练脚本和交互图为本文独立实现；MNIST 图像来自上述数据集，相关权利归原提供者。原论文与教材的权利归相应作者或出版方所有。如有公式、术语或理解上的疏漏，欢迎指出。
