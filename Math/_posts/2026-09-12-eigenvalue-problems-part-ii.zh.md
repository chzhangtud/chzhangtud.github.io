---
title: "数值分析讲义（六）：特征值和特征向量计算方法 Part II"
lang: "zh"
date: 2026-09-12
permalink: /zh/eigenvalue-problems-part-ii/
en_link: /en/eigenvalue-problems-part-ii/
categories:
  - Math
tags:
  - Numerical Methods
  - Eigenvalue Problems
  - Vector Iteration
  - Matrix Computations
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.eigenvalue-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.eigenvalue-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.eigenvalue-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.eigenvalue-figure__note {
  border-top: 1px solid #d7dee2;
  color: #455461;
  margin: 0;
  padding: 0.75rem 0.9rem;
}

@media (max-width: 640px) {
  mjx-container[display='true'] {
    -webkit-overflow-scrolling: touch;
    display: block;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.2rem;
  }

  mjx-container[display='true'] > svg,
  mjx-container[display='true'] > mjx-math {
    max-width: none;
  }
}
</style>

<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<a href="{{ page.en_link }}" class="btn">Read in English</a>

建议先阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part I]({{ '/zh/eigenvalue-problems-part-i/' | relative_url }})。本篇是第六章第二篇，专门讨论向量迭代、Rayleigh quotient（Rayleigh 商）以及 Wielandt 逆迭代。

---

## 6.2 向量迭代

### 6.2.1 向量迭代的定义和性质

**定义 6.2.1** 对于矩阵 $B\in\mathbb{C}^{n\times n}$，相应的向量迭代定义为

$$
z^{(k+1)}=\frac{1}{\|Bz^{(k)}\|}Bz^{(k)},
\qquad
k=0,1,\ldots
\tag{6.2}
$$

其中初始向量 $z^{(0)}\in\mathbb{C}^n\setminus\{0\}$。

直观上，每一步先用 $B$ 作用于当前向量，再用范数归一化。因此它主要改变向量的方向，而不会让向量长度不断变大或变小。若 $B$ 的选择合适，迭代向量的方向会逐渐接近某个特征向量，Rayleigh quotient（Rayleigh 商）则用来近似对应的特征值。实际计算中还需要保证 $Bz^{(k)}\ne0$，否则归一化没有定义。

<figure class="eigenvalue-figure">
  <figcaption class="eigenvalue-figure__caption">向量迭代示意：主导特征方向会逐步保留下来</figcaption>
  <svg viewBox="0 0 760 360" role="img" aria-labelledby="eigen-power-title eigen-power-desc">
    <title id="eigen-power-title">向量迭代靠近主导特征向量</title>
    <desc id="eigen-power-desc">二维示意中，迭代向量从初始方向出发，连续经过矩阵作用和归一化，方向逐渐靠近主导特征向量 x1。图中的向量长度仅用于排版，实际算法每一步都会归一化。</desc>
    <defs>
      <marker id="eigen-power-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#334155"></path>
      </marker>
    </defs>
    <line x1="82" y1="278" x2="690" y2="278" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#eigen-power-arrow)"></line>
    <line x1="110" y1="315" x2="110" y2="48" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#eigen-power-arrow)"></line>
    <line x1="110" y1="278" x2="650" y2="112" stroke="#2563eb" stroke-width="2.4" stroke-dasharray="8 6"></line>
    <text x="632" y="101" font-size="14" fill="#1d4ed8">主导方向 x₁</text>
    <line x1="110" y1="278" x2="302" y2="128" stroke="#64748b" stroke-width="2.2" marker-end="url(#eigen-power-arrow)"></line>
    <line x1="110" y1="278" x2="407" y2="140" stroke="#0f766e" stroke-width="2.2" marker-end="url(#eigen-power-arrow)"></line>
    <line x1="110" y1="278" x2="512" y2="130" stroke="#d97706" stroke-width="2.2" marker-end="url(#eigen-power-arrow)"></line>
    <line x1="110" y1="278" x2="585" y2="118" stroke="#dc2626" stroke-width="2.2" marker-end="url(#eigen-power-arrow)"></line>
    <circle cx="110" cy="278" r="4" fill="#334155"></circle>
    <text x="296" y="119" font-size="13" fill="#475569">z⁽⁰⁾</text>
    <text x="412" y="132" font-size="13" fill="#0f766e">z⁽¹⁾</text>
    <text x="518" y="122" font-size="13" fill="#b45309">z⁽²⁾</text>
    <text x="590" y="110" font-size="13" fill="#b91c1c">z⁽³⁾</text>
    <text x="674" y="294" font-size="14" fill="#475569">方向</text>
    <text x="116" y="60" font-size="14" fill="#475569">另一个特征方向</text>
    <text x="92" y="299" font-size="13" fill="#64748b">0</text>
  </svg>
  <p class="eigenvalue-figure__note">图中画的是实二维情形；复数情形还要考虑整体相位。向量长度仅用于排版，归一化真正保留的是方向；这里按编号让各个方向逐步靠近蓝色的主导特征方向。</p>
</figure>

适当选择 $B$ 后，$z^{(k)}$ 可以作为某个特征值 $\lambda$ 对应的特征向量的近似。此时，可以用 **Rayleigh quotient（Rayleigh 商）**得到 $\lambda$ 的一个特征值近似：

$$
R(z^{(k)},B)=\frac{(z^{(k)})^H Bz^{(k)}}{(z^{(k)})^H z^{(k)}}.
$$

Rayleigh 商是“向量在 $B$ 作用下得到的分量比例”的复数版本。若 $z$ 恰好是特征向量，则

$$
R(z,B)=\frac{z^H(\lambda z)}{z^Hz}=\lambda.
$$

下面研究 $B$ 可对角化时的基本性质。设其特征值为 $\lambda_1,\ldots,\lambda_n$。如果向量 $x\in\mathbb{C}^n$ 的唯一分解

$$
x=u+v,
\qquad
u\in\operatorname{Eig}_B(\lambda_i),
\qquad
v\in\bigoplus_{\lambda_j\ne\lambda_i}\operatorname{Eig}_B(\lambda_j)
$$

中的 $u$ 不为零，则称 $x$ 在 $\operatorname{Eig}_B(\lambda_i)$ 中具有一个分量。向量 $u$ 就是 $x$ 在 $\operatorname{Eig}_B(\lambda_i)$ 中的分量。

**定理 6.2.2** 设 $B\in\mathbb{C}^{n\times n}$ 可对角化，特征值为 $\lambda_1,\ldots,\lambda_n$，并满足

$$
\lambda_1=\cdots=\lambda_r,
\qquad
|\lambda_r|>|\lambda_{r+1}|\ge\cdots\ge|\lambda_n|,
$$

其中 $r<n$。如果初始向量 $z^{(0)}$ 在 $\operatorname{Eig}_B(\lambda_1)$ 中具有非零分量，则对于向量迭代 (6.2)，有

$$
R(z^{(k)},B)
=\frac{(z^{(k)})^HBz^{(k)}}{(z^{(k)})^Hz^{(k)}}
=\lambda_1+O(q^k),
\qquad
k\to\infty,
\qquad
q:=\frac{|\lambda_{r+1}|}{|\lambda_1|}<1.
$$

此外，

$$
z^{(k)}=\frac{\lambda_1^k}{|\lambda_1|^k}\frac{x_1}{\|x_1\|}+O(q^k),
\qquad
k\ge 1,
$$

其中 $\|\cdot\|$ 可以是任意向量范数，$x_1$ 表示 $z^{(0)}$ 在 $\operatorname{Eig}_B(\lambda_1)$ 中的分量。

这个结论就是通常所说的**幂迭代**的收敛机制：绝对值最大的特征值对应的分量每次乘上最大的放大因子，其余分量相对变小。收敛速度由

$$
q=\frac{|\lambda_{r+1}|}{|\lambda_1|}
$$

决定；$q$ 越接近 $1$，主导方向与次主导方向越难区分，迭代就越慢。

**证明（供有兴趣的读者参考）** 同样可以考虑不归一化的序列

$$
\widetilde z^{(k+1)}=B\widetilde z^{(k)},
\qquad
\widetilde z^{(0)}=z^{(0)}.
$$

于是对 $k\ge 1$，有

$$
z^{(k)}=\frac{\widetilde z^{(k)}}{\|\widetilde z^{(k)}\|}.
$$

可以将初始向量表示为

$$
z^{(0)}=x_1+\sum_{j=r+1}^n x_j,
\qquad
x_j\in\operatorname{Eig}_B(\lambda_j),
\qquad
x_1\ne 0.
$$

代入 $\widetilde z^{(k+1)}=B\widetilde z^{(k)}$，得到

$$
\begin{aligned}
\widetilde z^{(k)}
&=B^kz^{(0)}
=\lambda_1^kx_1+\sum_{j=r+1}^n\lambda_j^kx_j\\
&=\lambda_1^k\left(x_1+\sum_{j=r+1}^n\left(\frac{\lambda_j}{\lambda_1}\right)^kx_j\right),
\qquad k\ge 0.
\end{aligned}
\tag{6.3}
$$

因为对 $j>r$ 有 $\lvert\lambda_j/\lambda_1\rvert\le q<1$，所以

$$
\widetilde z^{(k)}=\lambda_1^k\left(x_1+O(q^k)\right).
$$

从而

$$
\begin{aligned}
(\widetilde z^{(k)})^HB\widetilde z^{(k)}
&=(\widetilde z^{(k)})^H\widetilde z^{(k+1)}\\
&=\overline{\lambda_1^k}\lambda_1^{k+1}
\left(x_1+O(q^k)\right)^H\left(x_1+O(q^k)\right)\\
&=\lambda_1|\lambda_1|^{2k}\left(\|x_1\|_2^2+O(q^k)\right),
\end{aligned}
$$

以及

$$
(\widetilde z^{(k)})^H\widetilde z^{(k)}
=|\lambda_1|^{2k}\left(\|x_1\|_2^2+O(q^k)\right).
$$

于是

$$
R(z^{(k)},B)=R(\widetilde z^{(k)},B)
=\lambda_1\frac{\|x_1\|_2^2+O(q^k)}{\|x_1\|_2^2+O(q^k)}
=\lambda_1+O(q^k).
$$

同理，

$$
\begin{aligned}
z^{(k)}
&=\frac{\widetilde z^{(k)}}{\|\widetilde z^{(k)}\|}
=\frac{\lambda_1^k(x_1+O(q^k))}{|\lambda_1|^k(\|x_1\|+O(q^k))}\\
&=\frac{\lambda_1^k}{|\lambda_1|^k}\frac{x_1}{\|x_1\|}+O(q^k).
\end{aligned}
$$

前面的相位因子

$$
\frac{\lambda_1^k}{|\lambda_1|^k}
$$

在实数且 $\lambda_1>0$ 时就是 $1$；在一般复数情形，它说明迭代向量可能随着 $k$ 改变整体相位，但其特征方向仍然稳定。

**备注 6.2.3** 即使 $z^{(0)}$ 在 $\operatorname{Eig}_B(\lambda_1)$ 中没有分量，这种情况对于“足够一般”的初始向量选择而言并不常见；在实际计算中，舍入误差的影响通常会使该分量出现。不过，如果问题具有特殊对称性，某个分量可能在精确算术中始终为零，此时不能依赖舍入误差来修复初始向量。

对于 Hermitian 矩阵，Rayleigh 商趋于 $\lambda_1$ 的收敛阶为 $q^2$。

**定理 6.2.4** 设 $B\in\mathbb{C}^{n\times n}$ 是 Hermitian 矩阵。在定理 6.2.2 的假设下，Rayleigh 商满足

$$
R(z^{(k)},B)
=\frac{(z^{(k)})^HBz^{(k)}}{(z^{(k)})^Hz^{(k)}}
=\lambda_1+O(q^{2k}),
\qquad
k\to\infty,
\qquad
q=\frac{|\lambda_{r+1}|}{|\lambda_1|}<1.
$$

这里的“平方”来自 Hermitian 矩阵的正交特征向量结构：向量误差的一阶项在 Rayleigh 商中相互抵消，因此特征值近似通常比特征向量方向收敛得更快。

### 6.2.2 von Mises power iteration（von Mises 幂迭代）和 Wielandt inverse iteration（Wielandt 逆迭代）

设给定 $A\in\mathbb{C}^{n\times n}$。通过选择不同的迭代矩阵 $B$，可以得到不同的向量迭代方法。

**von Mises power iteration（von Mises 幂迭代）**

取 $B=A$，即可得到简单向量迭代。其收敛性质可以直接由定理 6.2.2 和定理 6.2.4 得到。它适合寻找绝对值最大的特征值及其特征向量；如果最大的两个特征值模很接近，收敛会很慢。

**Wielandt inverse iteration（Wielandt 逆迭代）**

向量迭代的明显缺点是：当特征值分离较差时收敛缓慢，并且只能求出模最大的特征值。Wielandt 逆向量迭代可以克服这些限制。为此，需要给定特征值 $\lambda_j$ 的一个较好近似 $\mu$，使得

$$
|\lambda_j-\mu|\ll|\lambda_i-\mu|,
\qquad
\lambda_i\ne\lambda_j.
$$

当 $\mu\ne\lambda_j$ 时，矩阵

$$
B=(A-\mu I)^{-1}
$$

的特征值为

$$
\mu_i=\frac{1}{\lambda_i-\mu}.
$$

其中，$\lvert\mu_j\rvert\gg\lvert\mu_i\rvert$（对所有 $\mu_i\ne\mu_j$）。此外，$x_j$ 是 $B$ 关于特征值 $\mu_j$ 的特征向量，当且仅当 $x_j$ 是 $A$ 关于特征值 $\lambda_j$ 的特征向量。

相应的 Wielandt 逆迭代为

$$
z^{(k+1)}=\frac{\widehat z^{(k+1)}}{\|\widehat z^{(k+1)}\|},
\qquad
\widehat z^{(k+1)}=(A-\mu I)^{-1}z^{(k)}.
$$

它的思想很简单：原来距离原点最远的特征值最突出；平移并取逆之后，距离 $\mu$ 最近的特征值被放大得最明显。因此只要 $\mu$ 已经接近目标特征值，就可以用逆迭代锁定内部特征值。

实际计算中并不显式求出 $(A-\mu I)^{-1}$，而是按如下形式实现迭代：

$$
\text{求解 }(A-\mu I)\widehat z^{(k+1)}=z^{(k)},
\qquad
\text{并令 }z^{(k+1)}=\frac{\widehat z^{(k+1)}}{\|\widehat z^{(k+1)}\|}.
$$

这一步很重要：显式构造逆矩阵通常成本更高、数值稳定性也更差；实际程序会对固定的 $A-\mu I$ 做一次分解，然后反复求解线性方程组。

若

$$
q:=\max_{\substack{1\le i\le n\\\lambda_i\ne\lambda_j}}
\frac{|\lambda_j-\mu|}{|\lambda_i-\mu|}<1,
$$

则由定理 6.2.2，Wielandt 逆迭代具有如下收敛性质：

$$
R\left(z^{(k)},(A-\mu I)^{-1}\right)
=\frac{(z^{(k)})^H\widehat z^{(k+1)}}{(z^{(k)})^Hz^{(k)}}
=\frac{1}{\lambda_j-\mu}+O(q^k),
$$

以及

$$
z^{(k)}=\frac{|\lambda_j-\mu|^k}{(\lambda_j-\mu)^k}\frac{x_j}{\|x_j\|}+O(q^k),
$$

其中 $x_j$ 是 $z^{(0)}$ 在

$$
\operatorname{Eig}_A(\lambda_j)
=\operatorname{Eig}_{(A-\mu I)^{-1}}\left(\frac{1}{\lambda_j-\mu}\right)
$$

中的分量。若 $A$ 还是 Hermitian 矩阵，则由定理 6.2.4，Rayleigh 商满足

$$
R\left(z^{(k)},(A-\mu I)^{-1}\right)
=\frac{(z^{(k)})^H\widehat z^{(k+1)}}{(z^{(k)})^Hz^{(k)}}
=\frac{1}{\lambda_j-\mu}+O(q^{2k}).
$$

需要注意，逆迭代要求 $A-\mu I$ 可逆；如果 $\mu$ 太接近某个特征值，线性方程组会变得病态，但这也正是目标特征向量被强烈放大的原因。实际算法通常结合 Rayleigh 商或 QR 方法产生并更新位移。


---

返回阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part I]({{ '/zh/eigenvalue-problems-part-i/' | relative_url }})。

继续阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part III]({{ '/zh/eigenvalue-problems-part-iii/' | relative_url }})。

**英文术语与记号说明**

- power iteration：幂迭代，反复用矩阵作用并归一化向量。
- inverse iteration：逆迭代，通过求解 $(A-\mu I)\widehat z=z$ 寻找靠近位移 $\mu$ 的特征值。
- Rayleigh quotient：Rayleigh 商，$R(z,A)=z^HAz/(z^Hz)$。
- Hermitian matrix：厄米特矩阵或自伴矩阵，满足 $A^H=A$。
- unitary matrix：酉矩阵，满足 $U^HU=I$。
- Euclidean norm：欧几里得范数，通常记为 $\|\cdot\|_2$。

**参考文献**

- [4] R. Plato. *Numerische Mathematik kompakt*（*Compact Numerical Mathematics*，中文意译：《数值数学概要》）. Vieweg Verlag, Braunschweig, 2000. 6.3.2.
- [8] J. Werner. *Numerische Mathematik 2*（*Numerical Mathematics 2*，中文意译：《数值数学 2》）. Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**来源、版权与使用说明**

本文主要参考 TU Darmstadt 信息学专业公开仓库中的数值分析基础课讲义：
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
原仓库包含 The Unlicense 授权说明。本文作为个人学习、翻译与知识整理用途发布，文中的中文表述、补充解释和图表重制不代表原作者或官方立场。
本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原文链接的前提下，用于非商业学习、交流和引用。由于本文部分内容基于 TU Darmstadt 公开讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议同时确认原始材料的授权状态。
如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系我指出，我会及时处理或删除。
