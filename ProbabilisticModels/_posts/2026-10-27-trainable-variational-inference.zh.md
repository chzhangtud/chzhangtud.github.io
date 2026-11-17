---
title: "让变分推断可以训练：采样、重参数化与摊销"
date: 2026-10-27
lang: zh
permalink: /zh/trainable-variational-inference/
en_link: /en/trainable-variational-inference/
series: generative-models
series_order: 3
categories: [Probabilistic Models]
tags: [Variational Inference, Reparameterization, Amortized Inference]
classes: statistics-article
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "分别解决期望难算、采样梯度和逐样本优化的开销：用蒙特卡洛估计、重参数化与共享编码器，把 ELBO 变成可以训练的目标。"
---

{% include vae-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

前两篇已经有了 [ELBO]({{ '/zh/variational-inference/' | relative_url }}) 和[网络概率输出]({{ '/zh/neural-probability-models/' | relative_url }})。但“把近似分布写出来”距离“能高效训练”还有三步：计算期望、计算梯度，以及为大量观测复用推断。

本文分别处理这三个问题。重参数化处理采样梯度，摊销推断处理不同输入之间的共享；它们解决的不是同一件事。


<div class="pgm-reading-guide" markdown="1">

**阅读方式。** 可以先读每节的思路、主要结果和小结，再按需展开推导或代码。交互图保留在正文中，跳过计算细节也能继续阅读。

</div>

---

## 1. 蒙特卡洛期望估计

<div class="pgm-section-intro" markdown="1">

**思路。** ELBO 中的平均值可能难以直接积分。先抽几次潜变量，分别计算目标，再用样本平均估计它。

</div>

设我们需要计算

$$
J(\lambda)=\mathbb E_{q_\lambda(Z)}[f(Z)]
=\int q_\lambda(z)f(z)\,dz.
$$

若能独立采样 $z^{(1)},\ldots,z^{(L)}\sim q_\lambda$，可用**蒙特卡洛**（Monte Carlo，MC）估计

$$
\widehat J_L=\frac1L\sum_{\ell=1}^L f(z^{(\ell)}).
$$

<details class="pgm-derivation" markdown="1">
<summary>计算细节：估计方差与采样数</summary>

当期望存在时，这个样本平均是无偏的；当方差有限且样本独立同分布时，

$$
\operatorname{Var}(\widehat J_L)=\frac{\operatorname{Var}(f(Z))}{L}.
$$

标准误差因此通常按 $L^{-1/2}$ 缩小。它描述重复实验的波动，不保证某一次把样本数加倍，就一定比前一次更接近答案。

</details>

增加样本数能减小重复估计时的典型波动，但不保证某一次估计一定更准。

这一步没有要求先掌握 MCMC：后续的对角高斯可以直接从标准正态变换采样。

后面会推导 $J=\mathbb E[(Z-1)^2]$ 对均值的采样梯度。先用下面的图观察同一个估计重复进行时的波动，再回到推导核对：

{% include vae-explainer.html kind="gradient" %}

保持 $\mu,\sigma$ 不变，逐渐增加 $L$。“梯度波动”视图的直方图应向解析梯度附近收拢；“采样数与误差”视图显示标准差如何按 $L^{-1/2}$ 变化。这里画的是“梯度估计量的分布”，不是潜变量本身的分布。

<div class="pgm-section-summary" markdown="1">

**小结。** 蒙特卡洛估计解决了期望的计算，但它有抽样波动。接下来还要处理样本分布随参数变化时的梯度。

</div>

## 2. 采样分布与参数梯度

<div class="pgm-section-intro" markdown="1">

**思路。** 改变均值或方差会改变抽到的样本，因此损失受到的影响不能只在抽样结束后按常数计算。

</div>

如果样本来自依赖参数的分布 $q_\lambda$，对样本平均求导时，必须处理采样分布本身的变化。

一个简单反例是 $Z\sim\mathcal N(\mu,1)$、$f(z)=z$。真实目标为 $J(\mu)=\mu$，导数为 1；若把抽出的 $z$ 当成一个与 $\mu$ 完全无关的常数，自动微分会得到 0。

这不是说概率采样的梯度不存在。可以构造不同的梯度估计器；这里选用适合连续高斯的**重参数化**（reparameterization），把参数依赖显式放回计算路径。

<div class="pgm-section-summary" markdown="1">

**小结。** 需要把参数如何影响样本这条依赖也计入梯度。重参数化会把这条依赖写成可微的计算。

</div>

## 3. 重参数化梯度

<div class="pgm-section-intro" markdown="1">

**思路。** 把抽样拆成固定分布的噪声和一个由参数控制的变换。这样就可以沿变换计算参数对损失的影响。

</div>



### 3.1 高斯的重参数化

<div class="pgm-section-intro" markdown="1">

**思路。** 先抽标准正态噪声，再按当前均值和标准差缩放、平移它。求本次梯度时保持这份噪声不变。

</div>

令 $r=\log\sigma^2$，采样写成

$$
\epsilon\sim\mathcal N(0,1),\qquad
z=\mu+\exp(r/2)\epsilon.
$$

<details class="pgm-derivation" markdown="1">
<summary>推导：高斯重参数化的路径梯度</summary>

于是

$$
\mathbb E_{q_{\mu,r}(Z)}[f(Z)]
=\mathbb E_{p(\epsilon)}\left[f\!\left(\mu+\exp(r/2)\epsilon\right)\right].
$$

噪声分布不再依赖待优化参数；从参数到 $z$，再到损失，都是可微运算。在可以交换求导与积分的条件下，对没有显式参数依赖的 $f$，

$$
\frac{\partial J}{\partial\mu}=\mathbb E[f'(Z)],
\qquad
\frac{\partial J}{\partial r}
=\mathbb E\left[f'(Z)\frac12\exp(r/2)\epsilon\right].
$$

这类梯度称为**路径导数**（pathwise derivative）：对同一份噪声，观察变换后的样本怎样随参数移动。

</details>

由此可以固定本次噪声，沿参数到样本再到损失的计算路径求导。

<div class="pgm-section-summary" markdown="1">

**小结。** 变化的是参数对样本的可微变换，噪声自身不需要梯度。满足相应条件时，可以用这些路径导数估计期望的梯度。

</div>

### 3.2 采样梯度的数值核对

<div class="pgm-section-intro" markdown="1">

**思路。** 用一个能算出准确导数的小目标检验采样梯度。比较两者，可以区分实现错误与正常的抽样波动。

</div>

取 $f(z)=(z-1)^2$，则

$$
J=(\mu-1)^2+\exp r,
\qquad
\partial_\mu J=2(\mu-1),\qquad
\partial_r J=\exp r.
$$

<details class="pgm-derivation" markdown="1">
<summary>计算细节：这个目标的样本梯度</summary>

对应的样本梯度为

$$
\widehat{\partial_\mu J}=\frac1L\sum_\ell2(z^{(\ell)}-1),
\qquad
\widehat{\partial_r J}=\frac1L\sum_\ell(z^{(\ell)}-1)\sigma\epsilon^{(\ell)}.
$$

</details>

{% include vae-figure.html kind="reparam" %}

拖动均值或标准差时，图中复用同一组噪声，这样能看清参数如何移动样本。点击重新采样，再观察同一参数处的估计波动。实现使用固定种子，图中显示的梯度确实来自这些样本。

<div class="pgm-section-summary" markdown="1">

**小结。** 固定噪声有助于看清参数如何移动样本，重新采样则显示估计会怎样波动。单次采样梯度不必等于准确梯度。

</div>

### 3.3 目标函数的直接参数依赖

<div class="pgm-section-intro" markdown="1">

**思路。** 有些目标通过样本依赖参数，也直接使用参数。求导时要同时追踪这两条路径。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：显式依赖与采样路径的链式法则</summary>

若被积函数本身也依赖参数，写成 $f_\phi(z)$，则完整链式法则是

$$
\nabla_\phi f_\phi(g_\phi(\epsilon))
=\left.\partial_\phi f_\phi(z)\right|_{z=g_\phi(\epsilon)}
+\left.\nabla_zf_\phi(z)\right|_{z=g_\phi(\epsilon)}\nabla_\phi g_\phi(\epsilon).
$$

第一项不能凭空省略。在 VAE 的重建期望中，固定解码器参数后，$\log p_\theta(x\mid z)$ 对编码器参数没有显式依赖，因此编码器的这部分梯度可以沿 $z$ 传回。若同时把 $\log q_\phi(z\mid x)$ 放进采样目标，就必须考虑它的直接依赖；或者使用下一篇的解析 KL。

</details>

如果损失还直接使用编码器参数，就要把直接求导和经过样本的求导两条路径都算上。

重参数化也不意味着任意分布的任意采样程序都能直接求导。这里的构造针对连续高斯，并依赖相应的可微与可积条件。

<div class="pgm-section-summary" markdown="1">

**小结。** 只沿样本求导可能漏项。VAE 中通常将可解析的先验 KL 单独计算，再对重建期望使用重参数化。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 3 节小结。** 高斯重参数化保留了原来的采样分布，同时为梯度建立了路径。还要根据目标是否直接依赖参数，保留所有求导项。

</div>

## 4. 编码器与摊销推断

<div class="pgm-section-intro" markdown="1">

**思路。** 逐个观测优化近似后验会很慢。现在训练一个共享函数，读入观测后直接给出近似后验的参数。

</div>



### 4.1 共享的后验参数映射

<div class="pgm-section-intro" markdown="1">

**思路。** 让编码器根据输入预测潜变量的均值和方差，代替每次从头调整这些参数。

</div>

此前可以为每个观测单独寻找

$$
\lambda_i^\star=\arg\max_{\lambda_i}\mathcal L(q_{\lambda_i},\theta;x_i).
$$

新观测到来，需要再执行一轮优化。现在让共享网络直接输出这些参数：

$$
(\mu_\phi(x_i),r_\phi(x_i))=e_\phi(x_i),
\qquad
q_\phi(z_i\mid x_i)=\mathcal N\!\left(z_i\mid\mu_\phi(x_i),
\operatorname{diag}(\exp r_\phi(x_i))\right).
$$

不同观测共享同一组 $\phi$，但输出的均值与方差仍可以不同。这是**摊销推断**（amortized inference）：把大量观测的推断工作，分摊到一次共享函数的训练中。

它不要求近似后验忽略输入，也不是“只估计一个对所有样本相同的高斯”。

{% include vae-figure.html kind="amortized" %}

这个演示的真实后验有闭式解，便于比较。把斜率 $k$ 调到约 $1/1.36$，再移动 $x$，一个共享函数就能对不同观测给出正确的均值。图里是手动调参，不是训练过程。

<div class="pgm-section-summary" markdown="1">

**小结。** 所有观测共享同一个函数和权重，不代表它们共享同一个后验。不同输入仍然可以产生不同的均值和方差。

</div>

### 4.2 近似误差与摊销误差

<div class="pgm-section-intro" markdown="1">

**思路。** 检查共享编码器的答案离理想结果还有多远，并区分误差来自候选分布的限制，还是来自编码器给出的参数。

</div>

<details class="pgm-derivation" markdown="1">
<summary>推导：近似差距与摊销差距的分解</summary>

固定生成模型，假设编码器输出属于同一个近似族。若 $\lambda^\star(x)$ 是逐样本优化的全局最优值，则

$$
\log p_\theta(x)-\mathcal L(\phi;x)
=\underbrace{\log p_\theta(x)-\mathcal L(\lambda^\star(x);x)}_{\text{近似族本身的差距}}
+\underbrace{\mathcal L(\lambda^\star(x);x)-\mathcal L(\phi;x)}_{\text{共享编码器的额外差距}}.
$$

这说明两件事：分布族可能装不下真实后验；共享网络也可能尚未给每个输入找到这个族中的最好答案。实际优化未必找到上述理想最优值，因此实验中的差距还可能受到优化质量影响。

</details>

总差距包含分布族的限制，以及共享编码器没有给出族内最好答案造成的额外差距。实际结果还受优化质量影响。

<div class="pgm-section-summary" markdown="1">

**小结。** 增加网络能力只能针对其中一部分误差。如果近似族本来就不能表示真实后验，仅改进编码器也无法消除这部分差距。

</div>

<div class="pgm-section-wrapup" markdown="1">

**第 4 节小结。** 摊销推断减少了新观测所需的计算，但共享网络可能没有给每个输入选到最好的近似。更快与更准确需要分别评价。

</div>

## 5. 小批量 ELBO 训练

<div class="pgm-section-intro" markdown="1">

**思路。** 每次用一小批观测估计训练目标，再为每个观测抽潜变量。这里区分批量大小和潜变量采样数，避免重复或遗漏缩放。

</div>

对整个数据集的总目标是 $\sum_{i=1}^N\mathcal L_i$。若批量 $B$ 中有 $M$ 个均匀抽取的观测，则总目标的无偏估计使用

$$
\frac NM\sum_{i\in B}\widehat{\mathcal L}_i.
$$

如果优化的是**每个观测的平均目标**，则使用 $\frac1M\sum_{i\in B}\widehat{\mathcal L}_i$。二者只差固定的数据量因子，但代码中的报告方式和学习率解释应保持一致。

批量样本数 $M$ 与每个观测的潜变量采样数 $L$ 是两个独立的维度。即使每个观测只抽一个 $z$，也可以从不同观测和不同步骤获得随机梯度；估计质量与训练效果仍需检查。

**下界与下界估计也要分开。**准确期望定义的 ELBO 不超过 $\log p_\theta(x)$；某次有限样本的蒙特卡洛估计可能高于它。随机梯度更新也没有准确 EM 那样的逐步似然单调性保证。

<div class="pgm-section-summary" markdown="1">

**小结。** 小批量和潜变量采样分别带来随机性。ELBO 是边缘对数似然的下界，但某一次有限样本的估计值不一定仍位于它下方。

</div>

## 6. 训练方法小结

<div class="pgm-section-intro" markdown="1">

**思路。** 把三项工具放在同一条训练流程里，明确每一步各自解决的计算问题。

</div>

| 工具 | 解决的问题 |
| --- | --- |
| 蒙特卡洛估计 | 用样本平均计算难以直接积分的期望 |
| 重参数化 | 在适用条件下计算采样期望对分布参数的梯度 |
| 摊销推断 | 用共享编码器为不同观测提供近似后验参数 |

生成模型仍然由 $p(z)p_\theta(x\mid z)$ 定义。现在把它、编码器与这些训练工具组合起来，就得到下一篇的 [VAE]({{ '/zh/variational-autoencoder/' | relative_url }})。

<div class="pgm-section-summary" markdown="1">

**小结。** 样本平均用于估计期望，重参数化用于传回采样梯度，编码器用于复用推断。下一篇把它们与生成模型组合成 VAE。

</div>

## 7. 检查理解与符号

- 将一个高斯样本当成与均值无关的常数，会丢失哪条计算路径？
- 为什么重新采样会改变蒙特卡洛梯度，而不会改变解析梯度？
- 摊销推断共享的是隐变量取值，还是产生分布参数的函数？
- ELBO 的一次采样估计为什么可能超过真实对数证据？

$M$ 表示批量观测数，$L$ 表示每个观测的采样数，$\epsilon$ 表示与参数无关的基础噪声。MC 是蒙特卡洛，SGVB 是随机梯度变分贝叶斯（stochastic gradient variational Bayes）。

## 8. 参考文献

1. **Christopher M. Bishop，2006。** [*Pattern Recognition and Machine Learning*](https://link.springer.com/book/9780387310732)，第 11 章开头，印刷页 523–525。期望的采样估计与方差。
2. **Diederik P. Kingma、Max Welling。** [*Auto-Encoding Variational Bayes*，§2.2–2.4](https://arxiv.org/html/1312.6114v11)。重参数化、SGVB 与共享推断网络。
3. **Chris Cremer、Xuechen Li、David Duvenaud，2018。** [*Inference Suboptimality in Variational Autoencoders*](https://proceedings.mlr.press/v80/cremer18a.html)。区分近似族与摊销造成的推断差距。

**来源与勘误。**本文参考以上文献重新推导；交互示例使用明确给出的函数与模型，未复制论文图表。原材料的权利归相应作者或出版方所有。如有公式、术语或理解上的疏漏，欢迎指出。
