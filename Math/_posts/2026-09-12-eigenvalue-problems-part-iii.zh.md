---
title: "数值分析讲义（六）：特征值和特征向量计算方法 Part III"
lang: "zh"
date: 2026-09-12
permalink: /zh/eigenvalue-problems-part-iii/
en_link: /en/eigenvalue-problems-part-iii/
categories:
  - Math
tags:
  - Numerical Methods
  - Eigenvalue Problems
  - QR Method
  - Matrix Computations
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.qr-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.qr-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.qr-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.qr-figure__note {
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

建议先阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part II]({{ '/zh/eigenvalue-problems-part-ii/' | relative_url }})。本篇是第六章第三篇，介绍 QR 方法的基本性质、收敛性、位移技术，以及 Householder transformation（Householder 变换）。

---

## 6.3 QR 方法

前篇已经看到，特征值问题的一个思路是通过相似变换把矩阵化为更简单的形式。QR 方法正是沿着这个思路工作的：每一步先把当前矩阵分解成一个 unitary matrix（酉矩阵）和一个 upper-triangular matrix（上三角矩阵），再交换它们的顺序。

这里的 QR decomposition（QR 分解）写作

$$
A=QR,
$$

其中 $Q$ 是酉矩阵，$R$ 是上三角矩阵。酉矩阵不会改变 Euclidean norm（欧几里得范数），因此在数值计算中比一般的消元变换更稳定；上三角矩阵的特征值则直接位于对角线上。

下面介绍的 Francis QR iteration（Francis QR 迭代）是许多高效特征值和特征向量计算方法的基础。以矩阵 $A^{(1)}=A\in\mathbb{C}^{n\times n}$ 为起点，QR 方法进行如下形式的 unitary similarity transformation（酉相似变换）。

**算法 6.3.1：QR 方法** 设 $A\in\mathbb{C}^{n\times n}$ 为给定矩阵。

0. 令 $A^{(1)}:=A$。

1. 对 $l=1,2,\ldots$，计算

$$
A^{(l)}=:Q_lR_l,
\qquad
Q_l\in\mathbb{C}^{n\times n}\text{ 为酉矩阵},
\qquad
R_l\in\mathbb{C}^{n\times n}\text{ 为上三角矩阵},
$$

$$
A^{(l+1)}:=R_lQ_l.
\tag{6.4}
$$

因此，每一步都需要计算 QR 分解

$$
A^{(l)}=Q_lR_l,
\qquad
R_l\text{ 为上三角矩阵},
\qquad
Q_l\text{ 为酉矩阵},
\qquad
Q_l^H=Q_l^{-1}.
$$

这一步并不是简单地“把两个矩阵相乘换个顺序”：由于 $A^{(l)}=Q_lR_l$，有

$$
R_lQ_l=Q_l^{-1}A^{(l)}Q_l.
$$

因此 $A^{(l+1)}$ 与 $A^{(l)}$ 相似，特征值完全保持不变；变化的是非对角元素的分布。

<figure class="qr-figure">
  <figcaption class="qr-figure__caption">QR 迭代的核心流程：分解、交换、得到相似矩阵</figcaption>
  <svg viewBox="0 0 820 330" role="img" aria-labelledby="qr-flow-title qr-flow-desc">
    <title id="qr-flow-title">QR 迭代流程</title>
    <desc id="qr-flow-desc">当前矩阵 A 上标 l 先分解为酉矩阵 Q_l 和上三角矩阵 R_l，再计算 R_l Q_l 得到下一步矩阵。下一步矩阵与当前矩阵相似，因此特征值不变。</desc>
    <defs>
      <marker id="qr-flow-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#334155"></path>
      </marker>
    </defs>
    <rect x="42" y="112" width="132" height="72" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2"></rect>
    <text x="108" y="146" text-anchor="middle" font-size="23" fill="#1e3a8a">A⁽ˡ⁾</text>
    <text x="108" y="168" text-anchor="middle" font-size="13" fill="#1e3a8a">当前矩阵</text>
    <line x1="174" y1="148" x2="250" y2="148" stroke="#334155" stroke-width="2" marker-end="url(#qr-flow-arrow)"></line>
    <rect x="250" y="94" width="168" height="108" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"></rect>
    <text x="334" y="128" text-anchor="middle" font-size="19" fill="#92400e">A⁽ˡ⁾ = QₗRₗ</text>
    <text x="334" y="153" text-anchor="middle" font-size="13" fill="#92400e">Qₗ：酉矩阵</text>
    <text x="334" y="174" text-anchor="middle" font-size="13" fill="#92400e">Rₗ：上三角矩阵</text>
    <line x1="418" y1="148" x2="494" y2="148" stroke="#334155" stroke-width="2" marker-end="url(#qr-flow-arrow)"></line>
    <rect x="494" y="112" width="132" height="72" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"></rect>
    <text x="560" y="146" text-anchor="middle" font-size="21" fill="#166534">RₗQₗ</text>
    <text x="560" y="168" text-anchor="middle" font-size="13" fill="#166534">交换乘积</text>
    <line x1="626" y1="148" x2="700" y2="148" stroke="#334155" stroke-width="2" marker-end="url(#qr-flow-arrow)"></line>
    <rect x="700" y="112" width="78" height="72" rx="10" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"></rect>
    <text x="739" y="146" text-anchor="middle" font-size="20" fill="#5b21b6">A⁽ˡ⁺¹⁾</text>
    <text x="739" y="168" text-anchor="middle" font-size="12" fill="#5b21b6">相似</text>
    <path d="M739 190 C739 260 108 260 108 190" fill="none" stroke="#64748b" stroke-width="1.7" stroke-dasharray="7 5" marker-end="url(#qr-flow-arrow)"></path>
    <text x="410" y="286" text-anchor="middle" font-size="14" fill="#475569">A⁽ˡ⁺¹⁾ = Qₗ⁻¹ A⁽ˡ⁾ Qₗ，特征值不变</text>
  </svg>
  <p class="qr-figure__note">每一步都只做酉相似变换，所以不会改变谱；迭代的目标是让矩阵越来越接近上三角形式，从而能从对角线读出特征值。</p>
</figure>

这种分解可以用 Householder method（Householder 方法）计算，本章末尾将为有兴趣的读者简要介绍该方法。

### 6.3.1 QR 方法的基本性质

先注意到，(6.4) 确实生成了一列彼此酉相似的矩阵 $A^{(l)}$。

**引理 6.3.2** 设 $Q_l$ 和 $R_l$ 由算法 6.3.1 产生，并记

$$
Q_{1\ldots l}:=Q_1Q_2\cdots Q_l,
\qquad
R_{l\ldots 1}:=R_lR_{l-1}\cdots R_1.
$$

则

$$
A^{(l+1)}=Q_l^{-1}A^{(l)}Q_l
=Q_{1\ldots l}^{-1}AQ_{1\ldots l},
\qquad
l=1,2,\ldots.
$$

**证明** 由 (6.4) 可得 $R_l=Q_l^{-1}A^{(l)}$，因此

$$
A^{(l+1)}=R_lQ_l=Q_l^{-1}A^{(l)}Q_l.
$$

归纳可得

$$
A^{(l+1)}=Q_l^{-1}\cdots Q_1^{-1}A^{(1)}Q_1\cdots Q_l
=Q_{1\ldots l}^{-1}AQ_{1\ldots l}.
$$

所以 QR 迭代不会改变特征值。另一方面，如果矩阵的严格下三角部分逐渐变小，那么极限就接近上三角矩阵；这正是“对角元素趋于特征值”的来源。

### 6.3.2 QR 方法的收敛性

先给出一个关于特征值模彼此分离的矩阵的结果。在一定条件下，QR 方法生成的序列 $A^{(l)}$ 经过形如 $S_l^{-1}A^{(l)}S_l$ 的酉对角缩放后，收敛到一个上三角矩阵 $U$；其收敛速度取决于特征值模之间的分离程度。

**定理 6.3.3** 设矩阵 $A\in\mathbb{C}^{n\times n}$ 非奇异，其特征值按模严格分离：

$$
|\lambda_1|>|\lambda_2|>\cdots>|\lambda_n|.
$$

设 $v_1,\ldots,v_n$ 是相应的特征向量，并且矩阵

$$
T=(v_1,\ldots,v_n)
$$

的逆矩阵可以在不交换行的情况下进行 LR decomposition（LR 分解）。则对于算法 6.3.1 中的 QR 方法，有

$$
A^{(l)}=S_lUS_l^{-1}+O(q^{l-1}),
\qquad
l\to\infty,
\qquad
q:=\max_{j=1,\ldots,n-1}\left|\frac{\lambda_{j+1}}{\lambda_j}\right|,
$$

其中 $U$ 是上三角矩阵

$$
U=
\begin{pmatrix}
\lambda_1&*&\cdots&*\\
&\ddots&\ddots&\vdots\\
&&\ddots&*\\
&&&\lambda_n
\end{pmatrix},
$$

而 $S_l=\operatorname{diag}(\sigma_1^{(l)},\ldots,\sigma_n^{(l)})$ 是酉相位矩阵，满足 $\lvert\sigma_i^{(l)}\rvert=1$。特别地，若 $a_{11}^{(l)},\ldots,a_{nn}^{(l)}$ 是 $A^{(l)}$ 的对角元素，则

$$
|a_{ii}^{(l)}-\lambda_i|=O(q^{l-1}).
$$

**证明** 参见例如 Plato [4]。

这里的 $S_l$ 只是对各坐标分量乘上模为 $1$ 的复数，相当于调整相位，不会改变长度。定理的核心信息是：特征值模分离得越明显，$q$ 越小，QR 迭代的非对角元素衰减得越快。

**备注 6.3.4**

- 相应的特征向量可以通过逆向量迭代求得，其中每次取 $A^{(l)}$ 的对角元素作为位移 $\mu$。

- 如果 $T^{-1}$ 只能在进行行交换的情况下进行 LR 分解，那么 QR 方法仍然收敛，但极限矩阵 $U$ 的对角线上出现的特征值可能顺序不同。

- 如果并非所有特征值都按模分离，例如

  $$
  |\lambda_1|>\cdots>|\lambda_r|=|\lambda_{r+1}|>\cdots>|\lambda_n|,
  $$

  这在实矩阵 $A$ 具有共轭复特征值时可能发生，则 $S_l^{-1}A^{(l)}S_l$ 在由 $\times$ 标出的区域之外收敛到如下形式的矩阵：

  $$
  \begin{pmatrix}
  \lambda_1&\cdots&*&\times&\times&* &\cdots\\
  &\ddots&\vdots&\vdots&\vdots&\vdots&\\
  &&\lambda_{r-1}&\times&\times&*&\cdots\\
  &&&\times&\times&*&\cdots\\
  &&&\times&\times&*&\cdots\\
  &&&&&\lambda_{r+2}&\\
  &&&&&&\ddots\\
  &&&&&&&\lambda_n
  \end{pmatrix}.
  $$

  矩阵块

  $$
  \begin{pmatrix}
  a_{r,r}^{(l)}&a_{r,r+1}^{(l)}\\
  a_{r+1,r}^{(l)}&a_{r+1,r+1}^{(l)}
  \end{pmatrix}
  $$

  的两个特征值收敛到 $\lambda_r$ 和 $\lambda_{r+1}$。这说明在复特征值成共轭对出现时，算法可能自然地保留一个 $2\times2$ 实矩阵块，而不是把两个复特征值分别放在实对角线上。

- 当特征值的分离程度较差时，QR 方法的收敛速度非常慢。通过位移技术，可以显著加快最后一行向 $(0,\ldots,0,\lambda_n)$ 的收敛，下面将简要介绍这种技术。

### 6.3.3 shift（位移）技术

更精确的分析表明，$A^{(l)}$ 的最后一行具有如下形式：

$$
\left(O\left(\left|\frac{\lambda_n}{\lambda_{n-1}}\right|^{l-1}\right),a_{nn}^{(l)}\right).
$$

因此，当 $\lvert\lambda_n\rvert\ll\lvert\lambda_{n-1}\rvert$ 时，$a_{n,j}^{(l)}$（$1\le j<n$）会非常快地趋于 $0$，而 $a_{nn}^{(l)}$ 会非常快地趋于 $\lambda_n$。精确确定 $\lambda_n$ 后，就可以转而使用 $A^{(l)}$ 的 $(n-1)\times(n-1)$ 子块来计算 $\lambda_{n-1}$。

为了增大 $\lambda_n$ 与 $\lambda_{n-1}$ 之间的分离程度，每一步对 $A^{(l)}-\mu_lI$ 应用 QR 方法，其中 $\mu_l\approx\lambda_n$，之后再对位移进行修正。也就是说，不再计算 (6.4)，而是使用位移 $\mu_l\approx\lambda_n$ 计算

$$
A^{(l)}-\mu_lI=:Q_lR_l,
\qquad
Q_l\in\mathbb{C}^{n\times n}\text{ 为酉矩阵},
\qquad
R_l\in\mathbb{C}^{n\times n}\text{ 为上三角矩阵},
$$

$$
A^{(l+1)}:=R_lQ_l+\mu_lI.
$$

容易验证，此时仍然有

$$
A^{(l+1)}=Q_l^{-1}A^{(l)}Q_l.
$$

位移的作用可以理解为先把谱整体平移，使目标特征值靠近原点，再通过 QR 分解和交换乘积把它更快地“隔离”出来。位移不改变最终的特征值，因为最后又加回了 $\mu_lI$。

<figure class="qr-figure">
  <figcaption class="qr-figure__caption">位移 QR 的一步：先平移谱，再进行 QR 迭代</figcaption>
  <svg viewBox="0 0 820 300" role="img" aria-labelledby="qr-shift-title qr-shift-desc">
    <title id="qr-shift-title">位移 QR 迭代流程</title>
    <desc id="qr-shift-desc">矩阵减去位移乘单位矩阵后进行 QR 分解，计算 RQ，再加回位移乘单位矩阵，得到与原矩阵酉相似的下一步矩阵。</desc>
    <defs>
      <marker id="qr-shift-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#334155"></path>
      </marker>
    </defs>
    <rect x="26" y="98" width="168" height="76" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2"></rect>
    <text x="110" y="130" text-anchor="middle" font-size="18" fill="#1e3a8a">A⁽ˡ⁾ − μₗI</text>
    <text x="110" y="153" text-anchor="middle" font-size="13" fill="#1e3a8a">把目标特征值移到 0 附近</text>
    <line x1="194" y1="136" x2="267" y2="136" stroke="#334155" stroke-width="2" marker-end="url(#qr-shift-arrow)"></line>
    <rect x="267" y="98" width="145" height="76" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"></rect>
    <text x="339" y="130" text-anchor="middle" font-size="19" fill="#92400e">QₗRₗ</text>
    <text x="339" y="153" text-anchor="middle" font-size="13" fill="#92400e">QR 分解</text>
    <line x1="412" y1="136" x2="485" y2="136" stroke="#334155" stroke-width="2" marker-end="url(#qr-shift-arrow)"></line>
    <rect x="485" y="98" width="145" height="76" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"></rect>
    <text x="557" y="130" text-anchor="middle" font-size="19" fill="#166534">RₗQₗ + μₗI</text>
    <text x="557" y="153" text-anchor="middle" font-size="13" fill="#166534">交换并移回</text>
    <line x1="630" y1="136" x2="703" y2="136" stroke="#334155" stroke-width="2" marker-end="url(#qr-shift-arrow)"></line>
    <rect x="703" y="98" width="91" height="76" rx="10" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"></rect>
    <text x="748" y="130" text-anchor="middle" font-size="18" fill="#5b21b6">A⁽ˡ⁺¹⁾</text>
    <text x="748" y="153" text-anchor="middle" font-size="12" fill="#5b21b6">更快分离</text>
    <text x="410" y="238" text-anchor="middle" font-size="14" fill="#475569">A⁽ˡ⁺¹⁾ = Qₗ⁻¹ A⁽ˡ⁾ Qₗ，位移只改变迭代速度，不改变谱</text>
  </svg>
  <p class="qr-figure__note">如果 $\mu_l$ 已经接近目标特征值，那么它在 $A^{(l)}-\mu_lI$ 中对应的特征值接近 $0$；取逆或进行 QR 迭代时，这一特征方向会更容易被分离出来。</p>
</figure>

**常用的位移策略** 一种高效的位移策略是：将 $\mu_l$ 取为矩阵

$$
\begin{pmatrix}
a_{n-1,n-1}^{(l)}&a_{n-1,n}^{(l)}\\
a_{n,n-1}^{(l)}&a_{n,n}^{(l)}
\end{pmatrix}
$$

中距离 $a_{n,n}^{(l)}$ 最近的那个特征值。如果出现相同距离，则取虚部为正的特征值。

带位移的 QR 方法可以很快地产生一个矩阵 $A^{(l)}$，使其最后一行以很高精度接近 $(0,\ldots,0,\lambda_n)$。随后，对 $A^{(l)}$ 的左上角 $(n-1)\times(n-1)$ 子块应用带位移的 QR 方法，以计算 $\lambda_{n-1}$，依此类推。这个逐步缩小问题规模的过程通常称为 deflation（降阶）。

**备注 6.3.5** 目前，带位移的 QR 方法被认为是求解完整特征值问题的最佳迭代方法之一。实际高效实现通常先把矩阵化为 Hessenberg form（Hessenberg 形式），并采用 Francis 的 implicit shift（隐式位移）策略，以减少每一步的运算量；这里的基本公式已经足以说明其收敛思想。

**特征向量的计算** 现在仍然可以通过逆向量迭代计算特征向量，其中使用 QR 方法计算出的特征值作为位移 $\mu$。

### 6.3.4 QR 分解的计算（供有兴趣的读者参考）

最后介绍一种计算 QR decomposition（QR 分解）的数值方法：对于 $B\in\mathbb{C}^{n\times n}$，求酉矩阵 $Q\in\mathbb{C}^{n\times n}$ 和上三角矩阵 $R\in\mathbb{C}^{n\times n}$，使得

$$
B=QR.
\tag{6.5}
$$

**利用 Householder transformation（Householder 变换）计算 QR decomposition（QR 分解）**

Householder transformation 分 $n-1$ 步计算 (6.5)。每一步只处理当前主对角线以下的一列，用一个酉变换把这一列的剩余元素同时变成 $0$。

**初始化**

$$
B^{(0)}:=B=
\begin{pmatrix}
*&\cdots\\
b^{(0)}&\ddots\\
*&\cdots
\end{pmatrix}.
$$

**步骤 0** 确定酉矩阵 $T_0$（见 (6.7)、(6.8)），使得

$$
B^{(1)}:=T_0B^{(0)}=
\begin{pmatrix}
*&*&*&\cdots\\
0&*&*&\cdots\\
\vdots&\vdots&\vdots&\\
0&*&*&\cdots
\end{pmatrix}
:=
\begin{pmatrix}
B_1^{(1)}&B_2^{(1)}\\
0&b^{(1)}&B_3^{(1)}\\
0&&
\end{pmatrix}.
$$

**步骤 1** 确定酉矩阵 $T_1$（见 (6.7)、(6.8)），使得

$$
B^{(2)}:=T_1B^{(1)}=
\begin{pmatrix}
*&*&*&*&\\
0&*&*&*&\\
0&0&*&*&\\
\vdots&\vdots&\vdots&\\
0&0&*&*&\\
\end{pmatrix}
:=
\begin{pmatrix}
B_1^{(2)}&B_2^{(2)}\\
0&0&b^{(2)}&B_3^{(2)}\\
0&0&&
\end{pmatrix}.
$$

**步骤 $k$，$k=2,\ldots,n-2$** 确定酉矩阵 $T_k$（见 (6.7)、(6.8)），使得

$$
B^{(k+1)}:=T_kB^{(k)}
=
\begin{pmatrix}
*&\cdots&*&*&\cdots\\
&\ddots&\vdots&\vdots&\\
0&*&*&*&\cdots\\
0&\cdots&0&*&\cdots\\
\vdots&&\vdots&\vdots&\\
0&\cdots&0&*&\cdots
\end{pmatrix}
\tag{6.6}
$$

并将其写成分块形式

$$
B^{(k+1)}=
\begin{pmatrix}
B_1^{(k+1)}&B_2^{(k+1)}\\
0&0&b^{(k+1)}&B_3^{(k+1)}\\
0&0&&
\end{pmatrix}.
$$

上述分块记号的目的只是标出“已经处理的左上角”和“当前还要处理的尾部”。每一步把一列的对角线下方清零，同时不会破坏之前已经清零的位置。

<figure class="qr-figure">
  <figcaption class="qr-figure__caption">Householder transformation（Householder 变换）示意：把一个列向量反射到坐标轴上</figcaption>
  <svg viewBox="0 0 820 340" role="img" aria-labelledby="qr-householder-title qr-householder-desc">
    <title id="qr-householder-title">Householder 反射将向量变为坐标轴方向</title>
    <desc id="qr-householder-desc">二维实数示意中，向量 b 指向右上方，Householder 反射后变成负的第一坐标轴方向。变换保持向量长度，只改变方向，并可用于把矩阵一列中主对角线下方的元素消成零。</desc>
    <defs>
      <marker id="qr-householder-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#334155"></path>
      </marker>
    </defs>
    <line x1="94" y1="252" x2="360" y2="252" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-arrow)"></line>
    <line x1="94" y1="286" x2="94" y2="48" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-arrow)"></line>
    <line x1="94" y1="252" x2="283" y2="126" stroke="#2563eb" stroke-width="3" marker-end="url(#qr-householder-arrow)"></line>
    <text x="288" y="120" font-size="16" fill="#1d4ed8">b</text>
    <path d="M185 252 A91 91 0 0 0 163 204" fill="none" stroke="#2563eb" stroke-width="1.5"></path>
    <text x="163" y="226" font-size="13" fill="#1d4ed8">方向</text>
    <line x1="94" y1="252" x2="340" y2="252" stroke="#dc2626" stroke-width="3" stroke-dasharray="8 5" marker-end="url(#qr-householder-arrow)"></line>
    <text x="282" y="275" font-size="16" fill="#b91c1c">H b = −‖b‖₂ e₁</text>
    <line x1="428" y1="252" x2="758" y2="252" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-arrow)"></line>
    <line x1="470" y1="286" x2="470" y2="48" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-arrow)"></line>
    <line x1="470" y1="252" x2="702" y2="252" stroke="#dc2626" stroke-width="3" stroke-dasharray="8 5" marker-end="url(#qr-householder-arrow)"></line>
    <text x="566" y="226" font-size="15" fill="#b91c1c">只保留首个分量</text>
    <text x="520" y="310" font-size="14" fill="#475569">列向量其余分量变为 0</text>
    <text x="50" y="67" font-size="14" fill="#475569">反射前</text>
    <text x="431" y="67" font-size="14" fill="#475569">反射后</text>
    <text x="105" y="274" font-size="13" fill="#64748b">0</text>
    <text x="481" y="274" font-size="13" fill="#64748b">0</text>
  </svg>
  <p class="qr-figure__note">二维图只用于说明几何思想。实际的 $H_k$ 作用在矩阵的尾部子空间上，并把当前列向量变成坐标轴方向，从而一次消去多个元素。</p>
</figure>

**结果**

$$
R:=B^{(n-1)},
\qquad
Q:=(T_{n-2}\cdots T_0)^H=T_0^H\cdots T_{n-2}^H.
$$

**方法说明** 确实有 $R=B^{(n-1)}$，它是上三角矩阵；而

$$
Q=T_0^H\cdots T_{n-2}^H
$$

是酉矩阵的乘积，因而也是酉矩阵。进一步，

$$
R=B^{(n-1)}=T_{n-2}\cdots T_0B=Q^HB,
$$

所以

$$
QR=B.
$$

**变换 $T_k$ 的计算**

还需要说明如何计算 $T_k$。在 Householder method（Householder 方法）中，每个 $T_k$ 取为

$$
T_k=
\begin{pmatrix}
I_k&0\\
0&H_k
\end{pmatrix},
\tag{6.7}
$$

其中 $I_k$ 是 $\mathbb{R}^{k\times k}$ 中的单位矩阵，$H_k\in\mathbb{R}^{(n-k)\times(n-k)}$ 是形如

$$
H_k=I-2\frac{w_kw_k^H}{w_k^Hw_k},
\qquad
w_k=b^{(k)}+\sigma_k\|b^{(k)}\|_2
\begin{pmatrix}
1\\0\\\vdots
\end{pmatrix},
\qquad
\sigma_k=
\begin{cases}
1, & \text{若 }b_1^{(k)}=0,\\[2pt]
\displaystyle\frac{b_1^{(k)}}{|b_1^{(k)}|}, & \text{否则}
\end{cases}
\tag{6.8}
$$

的 Householder transformation（Householder 变换）。

虽然上面的分块写法使用了实数单位矩阵，公式本身也适用于复数向量；此时 $w_k^H$ 必须使用共轭转置。参数 $\sigma_k$ 选择为首元素的相位，目的是避免相减时发生严重消去。

Householder matrix（Householder 矩阵）可以看作关于某个超平面的反射。它满足

$$
H_k^H=H_k,
\qquad
H_k^HH_k=I,
$$

所以既是 Hermitian matrix（厄米特矩阵），又是 unitary matrix（酉矩阵）。可以证明，在这种选择下，有

$$
H_kb^{(k)}=
\begin{pmatrix}
\omega_k\|b^{(k)}\|_2\\
0\\
\vdots
\end{pmatrix},
\qquad
\omega_k\in\mathbb{C},\quad |\omega_k|=1.
$$

由此容易看出，每一步得到的 $B^{(k+1)}$ 确实具有 (6.6) 所示的形式。因为每次使用的是酉变换，理想算术下不会放大 Euclidean norm（欧几里得范数）；这也是 Householder QR 比直接用 Gram–Schmidt orthogonalization（Gram–Schmidt 正交化）更稳健的主要原因之一。


---

返回阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part II]({{ '/zh/eigenvalue-problems-part-ii/' | relative_url }})。

**英文缩写与记号说明**

- QR decomposition：QR 分解，$A=QR$，其中 $Q$ 酉、$R$ 上三角。
- shift：位移，在 $A-\mu I$ 上执行 QR 迭代，再把 $\mu I$ 加回去。
- Hessenberg form：Hessenberg 形式，主对角线下方第二条对角线以下全为零的矩阵形式，常用于降低 QR 迭代成本。
- deflation：降阶，确定一个特征值后转而处理剩余的主子矩阵。
- Householder transformation：Householder 变换，用一个酉反射把列向量的多个分量同时消为零。
- Francis QR iteration：Francis QR 迭代，带位移和隐式实现的 QR 迭代框架，是实际特征值软件中的经典方法。
- LR decomposition：LR 分解，把矩阵分解为下三角矩阵和上三角矩阵。
- Euclidean norm：欧几里得范数，通常记为 $\|\cdot\|_2$。
- $A^H$：共轭转置，$A^H=\overline A^T$；对实矩阵就是 $A^T$。

**参考文献**

- [4] R. Plato. *Numerische Mathematik kompakt*（*Compact Numerical Mathematics*，中文意译：《数值数学概要》）. Vieweg Verlag, Braunschweig, 2000. 6.3.2.
- [8] J. Werner. *Numerische Mathematik 2*（*Numerical Mathematics 2*，中文意译：《数值数学 2》）. Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**来源、版权与使用说明**

本文整理自本地保存的 TU Darmstadt 2016 年 Mathematik 4 ET/3Inf 讲义文件 *Skript-Mathe4ET-3Inf-2016-Kap6.pdf* 中的第 6 章，并参考同目录下的中文翻译草稿 *Skript-Mathe4ET-3Inf-2016-Kap6.zh.md*。正文为个人学习、翻译与知识整理用途发布，文中的中文表述、补充说明和重新制作的图表不代表原作者或官方立场。

本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原始材料来源的前提下，用于非商业学习、交流和引用。由于本文部分内容基于课程讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、课程页面及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议先确认原始材料的授权状态。

如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系指出，我会及时处理或删除。

