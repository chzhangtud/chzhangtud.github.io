---
title: "数值分析讲义（六）：特征值和特征向量计算方法 Part I"
lang: "zh"
date: 2026-09-12
permalink: /zh/eigenvalue-problems-part-i/
en_link: /en/eigenvalue-problems-part-i/
categories:
  - Math
tags:
  - Numerical Methods
  - Eigenvalue Problems
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

建议先阅读 [数值分析讲义（五）：非线性方程组]({{ '/zh/nonlinear-equations/' | relative_url }})。本篇是第六章第一篇，整理特征值问题的基本概念、典型应用和扰动理论。

---

## 6.1 特征值问题

在许多工程和物理问题中，例如研究机械系统或电气系统的振动行为，确定矩阵 $A\in\mathbb{C}^{n\times n}$ 的特征值和特征向量具有重要意义。它们分别描述系统中允许出现的“尺度/频率”和相应的“方向/形状”。后面会看到，PageRank 这样的离散过程也可以归结为特征值问题。

### 6.1.1 基础

**定义 6.1.1** 设 $A\in\mathbb{C}^{n\times n}$。若存在向量 $x\in\mathbb{C}^n$，且 $x\ne 0$，使得

$$
Ax=\lambda x,
$$

则称数 $\lambda\in\mathbb{C}$ 为矩阵 $A$ 的一个 eigenvalue（特征值）。满足该条件的向量 $x\in\mathbb{C}^n$ 称为特征值 $\lambda$ 对应的（右）eigenvector（特征向量）。矩阵 $A$ 的全部特征值构成的集合 $\sigma(A)$ 称为 $A$ 的 spectrum（谱）。

特征向量的长度没有特殊意义：如果 $x$ 是特征向量，那么任意非零倍数 $cx$ 仍然是同一个特征值对应的特征向量。真正重要的是它所确定的方向；在复数空间中，还要把整体复数相位的差别视为同一个方向。

子空间

$$
\operatorname{Eig}_A(\lambda):=\{x\in\mathbb{C}^n:(A-\lambda I)x=0\}
$$

称为 $A$ 关于特征值 $\lambda$ 的**特征子空间**。其维数

$$
\gamma(\lambda):=\dim\operatorname{Eig}_A(\lambda)=n-\operatorname{rank}(A-\lambda I)
$$

称为 $\lambda$ 的**几何重数**，表示与 $\lambda$ 对应的线性无关特征向量的最大数目。

显然，$\lambda$ 是 $A$ 的特征值，当且仅当

$$
\chi(\lambda):=\det(A-\lambda I)=0,
$$

也就是说，$\lambda$ 是特征多项式 $\chi(\mu)$ 的一个零点。$\chi$ 是一个 $n$ 次多项式，具有如下形式：

$$
\chi(\mu)=(-1)^n\mu^n+(-1)^{n-1}\mu^{n-1}\operatorname{tr}(A)+\cdots+\det(A).
$$

设 $\lambda_1,\ldots,\lambda_k$ 是 $\chi$ 在 $\mathbb{C}$ 上的不同零点，即 $A$ 的不同特征值；其重数分别为 $\nu_i$，$i=1,\ldots,k$。那么

$$
\nu_1+\cdots+\nu_k=n,
$$

且 $\chi$ 可以分解为

$$
\chi(\mu)=(-1)^n(\mu-\lambda_1)^{\nu_1}\cdots(\mu-\lambda_k)^{\nu_k}.
$$

称 $\nu(\lambda_i)=\nu_i$ 为 $\lambda_i$ 的**代数重数**。不难证明，总有

$$
\gamma(\lambda_i)\le \nu(\lambda_i).
$$

代数重数来自特征多项式中零点重复出现的次数；几何重数则来自特征子空间的维数。两者相等时，该特征值拥有足够多的线性无关特征向量；两者不等时，矩阵通常不能仅靠特征向量对角化。

下面总结特征值和特征向量的一些基本性质。

**命题 6.1.2** 设 $A\in\mathbb{C}^{n\times n}$ 为任意矩阵，则有：

a) 若 $\lambda$ 是 $A$ 的特征值，则 $\lambda$ 是 $A^T$ 的特征值，而 $\overline\lambda$ 是

$$
A^H:=\overline{A}^T
$$

的特征值。

b) 对任意非奇异矩阵 $T\in\mathbb{C}^{n\times n}$，与 $A$ 相似的矩阵

$$
B:=T^{-1}AT
$$

与 $A$ 具有相同的特征多项式和相同的特征值。若 $x$ 是 $A$ 的特征向量，则

$$
y:=T^{-1}x
$$

是 $B$ 的特征向量。

c) 若 $A$ 是 Hermitian matrix（厄米特矩阵，也称自伴矩阵），即 $A^H=A$，其中 $A^H:=\overline{A}^T$，则 $A$ 的全部特征值都是实数。若 $A$ 是 unitary matrix（酉矩阵），即 $A^H=A^{-1}$，则对每个特征值 $\lambda$ 都有 $\lvert\lambda\rvert=1$。

这里有几个容易混淆的术语。Hermitian matrix（厄米特矩阵，也称自伴矩阵）指共轭转置后保持不变的复矩阵：

$$
A^H=A.
$$

对实矩阵来说，共轭不会改变元素，因此 Hermitian 矩阵就退化为实对称矩阵 $A^T=A$。符号 $A^H$ 中的上标 $H$ 表示 **共轭转置**：先把每个元素取复共轭，再转置。它和只转置一次的 $A^T$ 不是同一个运算。

**unitary matrix（酉矩阵）**满足

$$
U^HU=UU^H=I,
\qquad
U^{-1}=U^H.
$$

酉矩阵是复数空间中“保持内积和长度”的变换，因此可以看作复空间里的旋转与反射。正交矩阵是它的实数特例：对 $U\in\mathbb{R}^{n\times n}$，酉性变为

$$
U^T=U^{-1},
\qquad
U^TU=UU^T=I.
$$

正因为酉变换保持 Euclidean norm（欧几里得范数），所以数值计算中通常优先使用它们：变换不会人为放大向量长度，也不会显著恶化由长度衡量的误差。

若矩阵 $A\in\mathbb{C}^{n\times n}$ 具有 $n$ 个线性无关的特征向量 $x_1,\ldots,x_n$，则称 $A$ 是**可对角化的**。令

$$
T:=(x_1,\ldots,x_n),
$$

则 $T$ 可逆，并且若 $\lambda_i$ 是 $x_i$ 对应的特征值，则

$$
T^{-1}AT=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)=:D.
$$

事实上，

$$
AT=(\lambda_1x_1,\ldots,\lambda_nx_n)=TD.
$$

矩阵 $B=T^{-1}AT$ 称为 $A$ 的**相似变换**。它改变的是矩阵在坐标中的表示，不改变特征值；如果 $T$ 还是酉矩阵，那么这个坐标变化还保留内积和 Euclidean norm（欧几里得范数）。

Hermitian matrix（厄米特矩阵）$A\in\mathbb{C}^{n\times n}$（即 $A^H=A$），以及相应的实对称矩阵，在这里具有重要作用。可以证明，Hermitian matrix 总可以借助酉矩阵 $U$ 对角化，即

$$
U^{-1}AU=D,
\qquad
U^H=U^{-1}.
$$

如果 $A=A^T$ 是实矩阵，则还可以选择 $U\in\mathbb{R}^{n\times n}$ 为正交矩阵，从而

$$
U^{-1}AU=D,
\qquad
U^T=U^{-1}.
$$

这就是 Hermitian matrix 的 spectral theorem（谱定理）：它不仅保证特征值为实数，还保证可以找到一组正交归一的特征向量。这个额外结构是后面 Rayleigh quotient（Rayleigh 商）获得更快收敛速度的原因。

### 6.1.2 示例

**例 6.1.3（振动结构的基频与共振频率）** 考虑一个机械结构（例如车身、桥梁或建筑物），我们关心它能够以哪些频率振动，以及相应的振动形态是什么样的。电路中的情形与此类似。在振动与噪声控制，以及建筑物、飞机等结构的设计中，这类问题都非常重要。

设 $y_i(t)\in\mathbb{R}^3$ 表示结构上点 $x_i\in\mathbb{R}^3$ 在时刻 $t$ 的位移，其中 $1\le i\le n$。在由外力 $f(t)$ 激励的无阻尼振动情形下，令

$$
y(t)=(y_i(t))_{1\le i\le n},
$$

则其初值问题为

$$
My''(t)=-Ay(t)+f(t),
\qquad
y(0)=y^{(0)},
\qquad
y'(0)=y^{(1)},
$$

其中质量矩阵 $M\in\mathbb{R}^{3n\times 3n}$ 可逆，刚度矩阵 $A\in\mathbb{R}^{3n\times 3n}$。该问题的解是非齐次方程的一个特解与齐次方程的通解之和。齐次方程为

$$
My''(t)=-Ay(t),
$$

它等价于

$$
y''(t)=-M^{-1}Ay(t).
$$

可以证明，令 $B:=M^{-1}A$，则 $B$ 可对角化，具有实特征值

$$
0<\lambda_1\le\lambda_2\le\cdots\le\lambda_{3n}
$$

及相应的特征向量 $v_1,\ldots,v_{3n}$。由于 $Bv_i=\lambda_i v_i$，函数

$$
\phi_i(t):=\left(a_i\sin(\sqrt{\lambda_i}\,t)+b_i\cos(\sqrt{\lambda_i}\,t)\right)v_i
$$

都是齐次方程的解，因为

$$
\phi_i''(t)
=-\lambda_i\left(a_i\sin(\sqrt{\lambda_i}\,t)+b_i\cos(\sqrt{\lambda_i}\,t)\right)v_i
=-\lambda_i\phi_i(t)=-B\phi_i(t).
$$

因此，$\phi_i(t)$ 就是该结构的一种**模态振动**。第 $i$ 个模态的角频率为 $\sqrt{\lambda_i}$，普通频率为

$$
\frac{\sqrt{\lambda_i}}{2\pi},
$$

而结构相应的变形形态由特征向量 $v_i$ 给出。最小的特征值通常对应最低频率，也就是最容易被外力激发的基频。

**例 6.1.4（Google 的 PageRank 算法）** 考虑 $N$ 个网页。设网页 $i$ 含有指向其他网页的 $k_i$ 条链接。从网页 $i$ 转移到网页 $j$ 的概率可建模为

$$
p_{ij}=
\begin{cases}
\displaystyle\frac{\alpha}{k_i}+\frac{1-\alpha}{N}, & \text{若网页 $i$ 含有指向网页 $j$ 的链接},\\[6pt]
\displaystyle\frac{1-\alpha}{N}, & \text{若网页 $i$ 不含有指向网页 $j$ 的链接}.
\end{cases}
$$

通常取 $\alpha=0.85$。令

$$
P=(p_{ij})_{1\le i,j\le N}.
$$

网页权重由向量 $\pi\in\mathbb{R}^N$ 给出，称为 stationary distribution（平稳分布），满足

$$
\pi=P^T\pi,
\qquad
\sum_{i=1}^N\pi_i=1,
\qquad
\pi_i\ge 0.
$$

直观地说，若 $\pi_i$ 表示平均而言停留在网页 $i$ 上的互联网用户比例，那么按照转移概率 $p_{ij}$ 进行网页跳转后，这一比例保持不变。因此，达到平衡状态后，$\pi_i$ 就表示平均停留在网页 $i$ 上的互联网用户比例。

这里的关键仍然是特征值：平稳分布是 $P^T$ 关于特征值 $1$ 的特征向量，并通过总和为 $1$ 的条件进行归一化。随机矩阵的行和为 $1$，所以 $1$ 是其特征值；加入随机跳转项则有助于让平稳分布唯一且为正。

### 6.1.3 数值方法的基本概念

下面讨论的特征值和特征向量数值计算方法大致可以分为两类：一类基于**向量迭代**，另一类基于**相似变换**。

**向量迭代**

第一类方法是向量迭代，通常具有如下形式：

$$
x^{(k+1)}=\frac{Bx^{(k)}}{\|Bx^{(k)}\|},
\qquad
k=0,1,\ldots,
$$

其中 $x^{(0)}$ 是初始向量，$B$ 是迭代矩阵，$\|\cdot\|$ 是某个向量范数。每一步都把向量乘以 $B$，然后归一化，以避免长度不断变大或变小。

**通过相似变换化为更简单的形式**

根据命题 6.1.2，矩阵 $A$ 经过相似变换

$$
B=T^{-1}AT
$$

后特征值保持不变；并且，若 $y$ 是 $B$ 的特征向量，则通过 $x=Ty$ 可以得到原矩阵 $A$ 的一个特征向量。

因此，可以考虑通过相似变换

$$
A^{(0)}:=A\longrightarrow A^{(1)}\longrightarrow\cdots,
\qquad
A^{(k+1)}=T_k^{-1}A^{(k)}T_k
\tag{6.1}
$$

将 $A$ 化为更简单的形式，使特征值和特征向量更容易求得。本章只讨论 QR 方法，它是求解特征值问题最快的方法之一。

**QR 方法**

QR 方法通过应用酉矩阵 $T_i$，使 $A^{(k)}$ 左下半部分的元素逐渐趋于零；与此同时，$A^{(k)}$ 的对角元素逐渐趋于 $A$ 的特征值。换句话说，它试图把矩阵变成上三角矩阵，因为三角矩阵的特征值直接出现在对角线上。QR 方法将在第三篇详细介绍。

### 6.1.4 特征值问题的扰动理论

数值计算中的矩阵通常只知道近似值，或者在运算过程中会产生舍入误差。因此需要知道：矩阵元素发生小改变时，特征值会移动多少。

对于上三角矩阵或下三角矩阵，特征值就是对角元素。前面已经提到，QR 方法通过相似变换减小非对角部分，也就是严格下三角部分。特征值的扰动理论可以给出一些界，用来衡量对角元素与特征值之间的接近程度。

下面给出一个基本结果。

**定理 6.1.5** 设 $\lambda_i(A)$，$i=1,\ldots,n$，是矩阵 $A\in\mathbb{C}^{n\times n}$ 按某种规则排列的特征值，例如先按实部递增排列，实部相同时再按虚部递增排列。则映射

$$
A\in\mathbb{C}^{n\times n}\longmapsto \lambda_i(A),
\qquad
i=1,\ldots,n,
$$

是连续的。也就是说，特征值随矩阵连续变化。

**证明** 参见例如 Werner [8]。

利用 Gershgorin disk（Gershgorin 圆盘）可以得到一个重要的特征值包含判据。

**定理 6.1.6** 设 $A=(a_{ij})\in\mathbb{C}^{n\times n}$ 为任意矩阵。

a) 有

$$
\sigma(A)\subseteq\bigcup_{i=1}^n K_i,
$$

其中 Gershgorin disks（Gershgorin 圆盘）为

$$
K_i:=\left\{\mu\in\mathbb{C}:|\mu-a_{ii}|\le\sum_{\substack{j=1\\j\ne i}}^n|a_{ij}|\right\},
\qquad
i=1,\ldots,n.
$$

b) 若由 $k$ 个 Gershgorin disks（Gershgorin 圆盘）组成的并集 $G_1$ 与其余 $n-k$ 个 Gershgorin disks 组成的并集 $G_2$ 不相交，则 $G_1$ 恰好包含 $A$ 的 $k$ 个特征值，而 $G_2$ 恰好包含 $A$ 的 $n-k$ 个特征值。

**直观解释** 对第 $i$ 行来说，$a_{ii}$ 是圆心，其他元素的绝对值之和是半径。定理 a) 说明：矩阵的每个特征值都至少落在一个这样的圆盘中；这些圆盘只是特征值的候选区域，并不表示特征值一定位于圆心。如果若干个圆盘与其余圆盘完全分开，定理 b) 还可以确定每一组圆盘中包含的特征值数量（按代数重数计算）。

<figure class="eigenvalue-figure">
  <figcaption class="eigenvalue-figure__caption">Gershgorin 圆示意：对角元给出圆心，行中其余元素给出半径</figcaption>
  <svg viewBox="0 0 760 360" role="img" aria-labelledby="eigen-gershgorin-title eigen-gershgorin-desc">
    <title id="eigen-gershgorin-title">Gershgorin 圆与可能的特征值</title>
    <desc id="eigen-gershgorin-desc">复平面上画出三个以矩阵对角元为圆心的圆盘。蓝色点表示落在这些圆盘并集中的可能特征值，圆盘只是包含区域而不是特征值本身。</desc>
    <line x1="74" y1="240" x2="706" y2="240" stroke="#607d8b" stroke-width="1.8"></line>
    <line x1="370" y1="320" x2="370" y2="32" stroke="#607d8b" stroke-width="1.8"></line>
    <line x1="206" y1="235" x2="206" y2="245" stroke="#607d8b" stroke-width="1.4"></line>
    <line x1="534" y1="235" x2="534" y2="245" stroke="#607d8b" stroke-width="1.4"></line>
    <line x1="365" y1="130" x2="375" y2="130" stroke="#607d8b" stroke-width="1.4"></line>
    <line x1="365" y1="130" x2="375" y2="130" stroke="#607d8b" stroke-width="1.4"></line>
    <text x="712" y="246" font-size="15" fill="#334155">Re</text>
    <text x="378" y="42" font-size="15" fill="#334155">Im</text>
    <text x="196" y="263" font-size="13" fill="#64748b">−2</text>
    <text x="526" y="263" font-size="13" fill="#64748b">2</text>
    <text x="380" y="134" font-size="13" fill="#64748b">1</text>
    <circle cx="280" cy="182" r="108" fill="#dbeafe" fill-opacity="0.48" stroke="#2563eb" stroke-width="2"></circle>
    <circle cx="500" cy="232" r="78" fill="#dcfce7" fill-opacity="0.48" stroke="#16a34a" stroke-width="2"></circle>
    <circle cx="410" cy="116" r="62" fill="#fef3c7" fill-opacity="0.58" stroke="#d97706" stroke-width="2"></circle>
    <circle cx="280" cy="182" r="4.5" fill="#1e3a8a"></circle>
    <circle cx="500" cy="232" r="4.5" fill="#166534"></circle>
    <circle cx="410" cy="116" r="4.5" fill="#92400e"></circle>
    <text x="245" y="170" font-size="13" fill="#1e3a8a">a₁₁</text>
    <text x="507" y="222" font-size="13" fill="#166534">a₂₂</text>
    <text x="418" y="106" font-size="13" fill="#92400e">a₃₃</text>
    <circle cx="238" cy="146" r="5" fill="#111827"></circle>
    <circle cx="319" cy="214" r="5" fill="#111827"></circle>
    <circle cx="451" cy="133" r="5" fill="#111827"></circle>
    <circle cx="535" cy="231" r="5" fill="#111827"></circle>
    <text x="172" y="78" font-size="13" fill="#475569">圆盘并集是候选区域</text>
    <line x1="174" y1="84" x2="229" y2="135" stroke="#475569" stroke-width="1.2"></line>
    <text x="560" y="306" font-size="13" fill="#475569">黑点：示意性的特征值</text>
    <circle cx="545" cy="301" r="4.5" fill="#111827"></circle>
  </svg>
  <p class="eigenvalue-figure__note">圆心是 $a_{ii}$，半径是第 $i$ 行中非对角元素绝对值之和。黑点只表示“可能的特征值”，并不意味着每个圆心都恰好是一个特征值。</p>
</figure>

下面的结果适用于可对角化矩阵。

**定理 6.1.7（Bauer–Fike）** 设 $A\in\mathbb{C}^{n\times n}$ 可对角化，即

$$
T^{-1}AT=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)=:D.
$$

则对任意矩阵 $\Delta A\in\mathbb{C}^{n\times n}$，有

$$
\forall\mu\in\sigma(A+\Delta A):
\quad
\min_{i=1,\ldots,n}|\mu-\lambda_i|
\le \operatorname{cond}_2(T)\|\Delta A\|_2.
$$

这里，$\|\cdot\|_2$ 是由 Euclidean norm（欧几里得范数）诱导的矩阵范数，并且

$$
\operatorname{cond}_2(T):=\|T\|_2\|T^{-1}\|_2
$$

是相应的矩阵 $T$ 的 condition number（条件数）。条件数衡量的是坐标变换对误差的放大能力：若 $T$ 的列向量几乎线性相关，$T^{-1}$ 可能很大，特征值对扰动就可能非常敏感。

**备注 6.1.8** 若 $A$ 是 Hermitian 矩阵，则 $T$ 可以选为酉矩阵，此时

$$
\operatorname{cond}_2(T)=1.
$$

所以 Hermitian 矩阵的特征值问题在这种意义下是良态的：矩阵的小扰动不会被特征向量基底额外放大。


---

返回阅读 [数值分析讲义（五）：非线性方程组]({{ '/zh/nonlinear-equations/' | relative_url }})。

继续阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part II]({{ '/zh/eigenvalue-problems-part-ii/' | relative_url }})。

**英文术语与记号说明**

- eigenvalue：特征值；eigenvector：特征向量；spectrum：谱。
- Hermitian matrix：厄米特矩阵或自伴矩阵，满足 $A^H=A$。
- unitary matrix：酉矩阵，满足 $U^HU=I$；实数特例是正交矩阵。
- Euclidean norm：欧几里得范数，通常记为 $\|\cdot\|_2$。
- $A^H$：共轭转置，$A^H=\overline A^T$。
- stationary distribution：平稳分布。
- Gershgorin disk：Gershgorin 圆盘，以 $a_{ii}$ 为圆心、以第 $i$ 行非对角元素绝对值之和为半径。
- condition number：条件数，用来描述误差或扰动的放大程度。

**参考文献**

- [4] R. Plato. *Numerische Mathematik kompakt*（*Compact Numerical Mathematics*，中文意译：《数值数学概要》）. Vieweg Verlag, Braunschweig, 2000. 6.3.2.
- [8] J. Werner. *Numerische Mathematik 2*（*Numerical Mathematics 2*，中文意译：《数值数学 2》）. Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**来源、版权与使用说明**

本文主要参考 TU Darmstadt 信息学专业公开仓库中的数值分析基础课讲义：
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
原仓库包含 The Unlicense 授权说明。本文作为个人学习、翻译与知识整理用途发布，文中的中文表述、补充解释和图表重制不代表原作者或官方立场。
本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原文链接的前提下，用于非商业学习、交流和引用。由于本文部分内容基于 TU Darmstadt 公开讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议同时确认原始材料的授权状态。
如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系我指出，我会及时处理或删除。
