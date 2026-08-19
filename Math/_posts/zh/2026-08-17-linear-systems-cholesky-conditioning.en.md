---
title: "Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part II"
lang: "en"
date: 2026-08-17
permalink: /en/linear-systems-cholesky-conditioning/
zh_link: /zh/linear-systems-cholesky-conditioning/
categories:
  - Math
tags:
  - Numerical Methods
  - Linear Systems
  - Matrix Factorization
  - Error Analysis
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.linear-system-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.linear-system-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.linear-system-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.linear-system-figure__note {
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

<a href="{{ page.zh_link }}" class="btn">中文版</a>

It is best to read [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part I]({{ '/en/linear-systems-direct-methods/' | relative_url }}) first. This part continues with the second half of solving linear systems: the Cholesky factorization of symmetric positive definite matrices, and the effects of condition numbers, perturbations, and rounding errors on computed solutions.

---

## 4.3 The Cholesky Method

For a general invertible matrix, Gaussian elimination without pivoting may fail; and, for reasons of numerical stability, searching for pivots is usually a sensible choice. For the important class of positive definite matrices, however, Gaussian elimination without pivoting can always be carried out in a stable way.

**Definition 4.3.1**: A real matrix $A\in\mathbb{R}^{n\times n}$ is called positive definite if

$$
A=A^T,\qquad x^TAx>0\quad \forall x\in\mathbb{R}^n\setminus\{0\}.
$$

It is called positive semidefinite if

$$
A=A^T,\qquad x^TAx\ge 0\quad \forall x\in\mathbb{R}^n.
$$

More generally, a complex matrix $A\in\mathbb{C}^{n\times n}$ is called positive definite if

$$
A=A^H,\qquad x^HAx>0\quad \forall x\in\mathbb{C}^n\setminus\{0\}.
$$

It is called positive semidefinite if

$$
A=A^H,\qquad x^HAx\ge 0\quad \forall x\in\mathbb{C}^n.
$$

Here $A^H=(\overline a_{ji})_{1\le i\le n,1\le j\le n}$, where the bar denotes complex conjugation.

Positive definite matrices occur frequently in applications, for example in the numerical solution of elliptic partial differential equations such as Laplace's equation and parabolic partial differential equations such as the heat equation.

A positive definite matrix is necessarily invertible.

The Cholesky method provides an efficient variant of Gaussian elimination for linear systems with positive definite matrices. It is based on the following observation.

**Theorem 4.3.2**: Let $A\in\mathbb{R}^{n\times n}$ be positive definite. Then there exists a unique lower triangular matrix $L$ with positive diagonal entries, that is, $l_{ii}>0$, such that

$$
LL^T=A
$$

holds. This is called the Cholesky factorization.

In addition, $A$ has a unique triangular factorization

$$
\widetilde L\widetilde R=A,
$$

where

$$
\widetilde L=LD^{-1},\qquad
\widetilde R=DL^T,\qquad
D=\operatorname{diag}(l_{11},\ldots,l_{nn}).
$$

This factorization is produced by Gaussian elimination without pivoting.

The theorem can be proved by complete induction on $n$; the proof is omitted here.

The Cholesky factorization $LL^T=A$ can be obtained by solving the following $\frac{n(n+1)}2$ equations. By symmetry, it is enough to consider the lower triangular part, including the diagonal:

$$
a_{ij}=\sum_{k=1}^j l_{ik}l_{jk},
\qquad j\le i,\quad i=1,\ldots,n.
\tag{4.11}
$$

The entries of $L$ can therefore be computed column by column, in the order

$$
l_{11},\ldots,l_{n1},\ l_{22},\ldots,l_{n2},\ \ldots,\ l_{nn}.
$$

For the first column of $L$, setting $j=1$ gives

$$
a_{11}=l_{11}^2,\qquad \text{so } l_{11}=\sqrt{a_{11}},
$$

$$
a_{i1}=l_{i1}l_{11},\qquad \text{so } l_{i1}=a_{i1}/l_{11}.
$$

Solving successively for $l_{ij}$, $i=j,\ldots,n$, gives the following algorithm.

**Algorithm 4.3.3: Cholesky method for computing the factorization $LL^T=A$**

For $j=1,\ldots,n$:

$$
l_{jj}
=
\sqrt{
a_{jj}-\sum_{k=1}^{j-1}l_{jk}^2
}.
$$

For $i=j+1,\ldots,n$:

$$
l_{ij}
=
\frac{
a_{ij}-\sum_{k=1}^{j-1}l_{ik}l_{jk}
}{l_{jj}}.
$$

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">Figure 4-3: Cholesky factorization exploits the symmetric positive definite structure and constructs only a lower-triangular factor.</figcaption>
<svg role="img" aria-labelledby="kap4-cholesky-title-en kap4-cholesky-desc-en" viewBox="0 0 920 390" xmlns="http://www.w3.org/2000/svg">
  <title id="kap4-cholesky-title-en">Cholesky factorization constructs a lower triangular matrix column by column</title>
  <desc id="kap4-cholesky-desc-en">A symmetric positive definite matrix only requires the lower triangular factor L to be computed. Each column first computes its diagonal entry and then the entries below the diagonal.</desc>
  <rect width="920" height="390" fill="#f8fafc"/>
  <text x="460" y="38" text-anchor="middle" font-size="24" font-weight="700" fill="#111827">Cholesky: a specialized factorization for positive definite matrices</text>
  <g transform="translate(72 78)">
    <rect x="0" y="0" width="210" height="210" fill="#ffffff" stroke="#94a3b8"/>
    <line x1="0" y1="42" x2="210" y2="42" stroke="#cbd5e1"/>
    <line x1="0" y1="84" x2="210" y2="84" stroke="#cbd5e1"/>
    <line x1="0" y1="126" x2="210" y2="126" stroke="#cbd5e1"/>
    <line x1="0" y1="168" x2="210" y2="168" stroke="#cbd5e1"/>
    <line x1="42" y1="0" x2="42" y2="210" stroke="#cbd5e1"/>
    <line x1="84" y1="0" x2="84" y2="210" stroke="#cbd5e1"/>
    <line x1="126" y1="0" x2="126" y2="210" stroke="#cbd5e1"/>
    <line x1="168" y1="0" x2="168" y2="210" stroke="#cbd5e1"/>
    <rect x="0" y="0" width="210" height="210" fill="#dbeafe" opacity="0.55"/>
    <line x1="0" y1="0" x2="210" y2="210" stroke="#1d4ed8" stroke-width="3"/>
    <text x="105" y="244" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">A = Aᵀ, and xᵀAx &gt; 0</text>
  </g>
  <g transform="translate(356 78)">
    <rect x="0" y="0" width="210" height="210" fill="#ffffff" stroke="#94a3b8"/>
    <line x1="0" y1="42" x2="210" y2="42" stroke="#cbd5e1"/>
    <line x1="0" y1="84" x2="210" y2="84" stroke="#cbd5e1"/>
    <line x1="0" y1="126" x2="210" y2="126" stroke="#cbd5e1"/>
    <line x1="0" y1="168" x2="210" y2="168" stroke="#cbd5e1"/>
    <line x1="42" y1="0" x2="42" y2="210" stroke="#cbd5e1"/>
    <line x1="84" y1="0" x2="84" y2="210" stroke="#cbd5e1"/>
    <line x1="126" y1="0" x2="126" y2="210" stroke="#cbd5e1"/>
    <line x1="168" y1="0" x2="168" y2="210" stroke="#cbd5e1"/>
    <polygon points="0,0 0,210 210,210" fill="#dcfce7" stroke="#16a34a"/>
    <rect x="0" y="0" width="42" height="210" fill="#bbf7d0" stroke="#16a34a"/>
    <circle cx="21" cy="21" r="10" fill="#15803d"/>
    <text x="105" y="244" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">Construct L by columns</text>
  </g>
  <g transform="translate(640 78)">
    <rect x="0" y="0" width="210" height="210" fill="#ffffff" stroke="#94a3b8"/>
    <polygon points="0,0 0,210 210,210" fill="#dcfce7" stroke="#16a34a"/>
    <polygon points="0,0 210,0 210,210" fill="#fee2e2" stroke="#ef4444"/>
    <line x1="0" y1="0" x2="210" y2="210" stroke="#1e293b" stroke-width="2"/>
    <text x="70" y="154" text-anchor="middle" font-size="22" font-weight="700" fill="#166534">L</text>
    <text x="144" y="70" text-anchor="middle" font-size="22" font-weight="700" fill="#991b1b">Lᵀ</text>
    <text x="105" y="244" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">A = LLᵀ</text>
  </g>
  <g stroke="#475569" stroke-width="2" marker-end="url(#kap4-arrow-chol-en)">
    <defs>
      <marker id="kap4-arrow-chol-en" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6 Z" fill="#475569"/>
      </marker>
    </defs>
    <path d="M294 183 H344"/>
    <path d="M578 183 H628"/>
  </g>
  <text x="460" y="356" text-anchor="middle" font-size="15" fill="#475569">Column j: obtain l<tspan baseline-shift="sub" font-size="11">jj</tspan> from a square root, then compute l<tspan baseline-shift="sub" font-size="11">ij</tspan> below the diagonal; only the lower-triangular part needs to be stored and updated.</text>
</svg>
<p class="linear-system-figure__note">Positive definiteness keeps the quantity under the square root positive; if a nonpositive quantity appears, the algorithm also provides a valid test for positive definiteness.</p>
</figure>

**Remark 4.3.4** Cholesky's method has several useful properties:

- Because it exploits symmetry, it requires only $O(n^3/6)$ operations apart from $n$ square roots. This is approximately half the operation count of unstructured Gaussian elimination.

- Equation (4.11) gives

$$
|l_{ij}|\le \sqrt{a_{ii}},
\qquad j\le i,\quad i=1,\ldots,n.
$$

Thus, the entries of $L$ do not become excessively large. This is an important reason for the numerical stability of the Cholesky method.

- Cholesky's method is one of the most effective general tests for positive definiteness. Extend Algorithm 4.3.3 as follows:

$$
a=a_{jj}-\sum_{k=1}^{j-1}l_{jk}^2.
$$

If $a\le 0$, stop: $A$ is not positive definite. Otherwise, set

$$
l_{jj}=\sqrt a.
$$

## 4.4 Error Estimates and the Effect of Rounding Errors

When describing direct methods for solving linear systems, we have so far assumed that all input data are exact and that no rounding errors occur during the computation. This is unrealistic, because rounding errors can have a significant effect, especially for large systems.

### 4.4.1 Error Estimates for Perturbed Systems

We first ask how much the solution of a linear system can change when the matrix and right-hand side are perturbed. Consider

$$
Ax=b
$$

and the perturbed system

$$
(A+\Delta A)\widetilde x=b+\Delta b,
$$

where $\Delta A$ and $\Delta b$ are “small.”

How small is $x-\widetilde x$?

This question is important in practice:

- It estimates how sensitive the solution is to perturbations in the matrix and right-hand side.
- A computed approximate solution, for example one obtained from an implementation of Gaussian elimination, is the exact solution of a system such as

$$
A\widetilde x=b+\Delta b,
\qquad
\Delta b=A\widetilde x-b.
$$

Therefore, the easily computed residual $\Delta b=A\widetilde x-b$ can be used to derive a bound for the unknown error $\|x-\widetilde x\|$.

The matrix condition number describes this effect of perturbations.

To measure $x-\widetilde x$, $\Delta b$, and $\Delta A$, we need a notion of length for vectors and matrices.

**Definition 4.4.1**: A vector norm on $\mathbb{R}^n$ is a map

$$
x\in\mathbb{R}^n\mapsto \|x\|\in[0,\infty[
$$

that satisfies:

a) $\|x\|=0$ if and only if $x=0$;

b) for every $\alpha\in\mathbb{R}$ and every $x\in\mathbb{R}^n$,

$$
\|\alpha x\|=\lvert\alpha\rvert\,\|x\|;
$$

c) for all $x,y\in\mathbb{R}^n$, the triangle inequality

$$
\|x+y\|\le \|x\|+\|y\|
$$

holds.

We now introduce matrix norms. Let $\|\cdot\|$ be any norm on $\mathbb{R}^n$. The corresponding matrix norm on $\mathbb{R}^{n\times n}$ is defined by

$$
\|A\|:=\sup_{\|x\|=1}\|Ax\|
=\sup_{x\ne 0}\frac{\|Ax\|}{\|x\|},
\qquad A\in\mathbb{R}^{n\times n}.
\tag{4.12}
$$

It is called the matrix norm induced by the vector norm $\|\cdot\|$.

It satisfies the following properties as well:

a) $\|A\|=0$ if and only if $A=0$;

b) for every $\alpha\in\mathbb{R}$ and every $A\in\mathbb{R}^{n\times n}$,

$$
\|\alpha A\|=\lvert\alpha\rvert\,\|A\|;
$$

c) for all $A,B\in\mathbb{R}^{n\times n}$, the triangle inequality

$$
\|A+B\|\le \|A\|+\|B\|.
$$

In addition, (4.12) gives the useful inequality

d) for all $x\in\mathbb{R}^n$ and all $A\in\mathbb{R}^{n\times n}$,

$$
\|Ax\|\le \|A\|\,\|x\|
$$

which is called the compatibility condition.

e) for all $A,B\in\mathbb{R}^{n\times n}$,

$$
\|AB\|\le \|A\|\,\|B\|
$$

which is called submultiplicativity.

**Example 4.4.2**

$$
\|x\|_2=\sqrt{x^Tx}
\quad\text{induces}\quad
\|A\|_2=\sqrt{\lambda_{\max}(A^TA)}.
$$

$$
\|x\|_1=\sum_{i=1}^n |x_i|
\quad\text{induces}\quad
\|A\|_1=\max_{j=1,\ldots,n}\sum_{i=1}^n |a_{ij}|
$$

This is called the column-sum norm.

$$
\|x\|_\infty=\max_{i=1,\ldots,n}|x_i|
\quad\text{induces}\quad
\|A\|_\infty=\max_{i=1,\ldots,n}\sum_{j=1}^n |a_{ij}|
$$

This is called the row-sum norm.

We can now introduce the matrix condition number mentioned above.

**Definition 4.4.3**: Let $A\in\mathbb{R}^{n\times n}$ be invertible, and let $\|\cdot\|$ be an induced matrix norm. Then

$$
\operatorname{cond}(A)=\|A\|\,\|A^{-1}\|
$$

is called the condition number of $A$ with respect to this matrix norm.

The following result can be proved.

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">Figure 4-4: The condition number is not the algorithmic error itself; it measures the problem's sensitivity to perturbations.</figcaption>
<svg role="img" aria-labelledby="kap4-condition-title-en kap4-condition-desc-en" viewBox="0 0 940 330" xmlns="http://www.w3.org/2000/svg">
  <title id="kap4-condition-title-en">The condition number amplifies perturbations</title>
  <desc id="kap4-condition-desc-en">Relative perturbations in the matrix and right-hand side are amplified by the condition number, producing a bound on the relative solution error. The residual can be viewed as a perturbation in the right-hand side.</desc>
  <rect width="940" height="330" fill="#f8fafc"/>
  <text x="470" y="38" text-anchor="middle" font-size="24" font-weight="700" fill="#111827">The core idea of error estimation: cond(A) amplifies input perturbations</text>
  <rect x="54" y="92" width="210" height="104" rx="8" fill="#ffffff" stroke="#94a3b8"/>
  <text x="159" y="125" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">Data perturbation</text>
  <text x="159" y="154" text-anchor="middle" font-size="15" fill="#475569">ΔA / A and Δb / b</text>
  <text x="159" y="179" text-anchor="middle" font-size="14" fill="#64748b">model, input, and rounding errors</text>
  <rect x="364" y="82" width="212" height="124" rx="8" fill="#fffbeb" stroke="#d97706"/>
  <text x="470" y="121" text-anchor="middle" font-size="20" font-weight="700" fill="#92400e">cond(A)</text>
  <text x="470" y="151" text-anchor="middle" font-size="15" fill="#92400e">= ||A|| · ||A⁻¹||</text>
  <text x="470" y="178" text-anchor="middle" font-size="14" fill="#92400e">larger means more sensitivity</text>
  <rect x="676" y="92" width="210" height="104" rx="8" fill="#ffffff" stroke="#94a3b8"/>
  <text x="781" y="125" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">Relative solution error</text>
  <text x="781" y="154" text-anchor="middle" font-size="15" fill="#475569">||x̃ - x|| / ||x||</text>
  <text x="781" y="179" text-anchor="middle" font-size="14" fill="#64748b">bounded by Theorem 4.4.4</text>
  <rect x="260" y="236" width="420" height="54" rx="8" fill="#ecfdf5" stroke="#16a34a"/>
  <text x="470" y="269" text-anchor="middle" font-size="16" font-weight="700" fill="#166534">Residual r = A x̃ - b can be viewed as Δb for a posteriori error estimation</text>
  <g stroke="#475569" stroke-width="2" marker-end="url(#kap4-arrow-cond-en)">
    <defs>
      <marker id="kap4-arrow-cond-en" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6 Z" fill="#475569"/>
      </marker>
    </defs>
    <path d="M274 144 H352"/>
    <path d="M588 144 H666"/>
    <path d="M470 208 V226"/>
  </g>
</svg>
<p class="linear-system-figure__note">The Hilbert matrix example shows that even a residual caused by tiny rounding errors can be amplified by the condition number into a noticeable solution error.</p>
</figure>

**Theorem 4.4.4 (Effect of perturbations in the matrix and right-hand side)**  
Let $A\in\mathbb{R}^{n\times n}$ be invertible, let $b,\Delta b\in\mathbb{R}^n$ with $b\ne 0$, and let $\Delta A\in\mathbb{R}^{n\times n}$ satisfy

$$
\|\Delta A\|<\frac1{\|A^{-1}\|},
$$

where $\|\cdot\|$ is a matrix norm induced by an arbitrary norm on $\mathbb{R}^n$. If $x$ solves

$$
Ax=b
$$

and $\widetilde x$ solves

$$
(A+\Delta A)\widetilde x=b+\Delta b,
$$

then

$$
\frac{\|\widetilde x-x\|}{\|x\|}
\le
\frac{\operatorname{cond}(A)}
{1-\operatorname{cond}(A)\|\Delta A\|/\|A\|}
\left(
\frac{\|\Delta A\|}{\|A\|}
+\frac{\|\Delta b\|}{\|b\|}
\right).
$$

**Proof**  
For simplicity, consider only the case $\Delta A=0$. Subtracting the unperturbed system from the perturbed system gives

$$
A(\widetilde x-x)=\Delta b,
$$

and therefore

$$
\|\widetilde x-x\|
=\|A^{-1}\Delta b\|
\le \|A^{-1}\|\,\|\Delta b\|.
$$

Since

$$
\|b\|=\|Ax\|\le \|A\|\,\|x\|,
$$

we have

$$
\frac1{\|x\|}\le \frac{\|A\|}{\|b\|}.
$$

Consequently,

$$
\frac{\|\widetilde x-x\|}{\|x\|}
\le
\|A\|\,\|A^{-1}\|\frac{\|\Delta b\|}{\|b\|}.
$$

Thus, the condition number determines how sensitive the solution is to perturbations in the matrix and right-hand side.

### 4.4.2 Rounding Error Analysis for Gaussian Elimination

A basic, though lengthy, estimate of the amplification of rounding errors in Gaussian elimination gives the following result.

**Theorem 4.4.5**: Let $A\in\mathbb{R}^{n\times n}$ be invertible. On a computer with machine precision $\mathrm{eps}$, apply Gaussian elimination to $A$ using a pivoting strategy that guarantees $\lvert l_{ij}\rvert\le 1$, such as partial or complete pivoting. Then the computed $\overline L,\overline R$ satisfy

$$
\overline L\,\overline R=PAQ+F,
\qquad
|f_{ij}|\le \frac{2j\,\overline a\,\mathrm{eps}}{1-\mathrm{eps}}.
$$

Here $P,Q$ are the permutations generated by the pivoting strategy, and

$$
\overline a=\max_k \overline a_k,
\qquad
\overline a_k=\max_{i,j}|a^{(k)}_{ij}|.
\tag{4.13}
$$

If an approximate solution $\overline x$ of $Ax=b$ is computed from $\overline L,\overline R$ by forward and backward substitution, then there exists a matrix $E$ such that

$$
(A+E)\overline x=b,
\qquad
|e_{ij}|
\le
\frac{2(n+1)\mathrm{eps}}{1-n\mathrm{eps}}
(|\overline L|\,|\overline R|)_{ij}
\le
\frac{2(n+1)\mathrm{eps}}{1-n\cdot\mathrm{eps}}\,n\overline a.
$$

Here

$$
|\overline L|=(|\overline l_{ij}|),
\qquad
|\overline R|=(|\overline r_{ij}|).
$$

**Proof**  
See Stoer [5].

**Remark 4.4.6**  
Theorem 4.4.4 can now also be used to estimate the relative error of the approximate solution $\overline x$.

**Effect of Pivoting Strategies**

The size of $\overline a$ in (4.13) depends on the pivoting strategy. One can prove:

- Partial pivoting:

$$
\overline a_k\le 2^k\max_{i,j}|a_{ij}|.
$$

This bound can be attained, but it is usually too pessimistic. In practice, one almost always observes

$$
\overline a_k\le 10\max_{i,j}|a_{ij}|.
$$

- Partial pivoting for tridiagonal matrices:

$$
\overline a_k\le 2\max_{i,j}|a_{ij}|.
$$

- Complete pivoting:

$$
\overline a_k\le f(k)\max_{i,j}|a_{ij}|,
\qquad
f(k)=k^{1/2}\left(2\,3^{1/2}\cdots k^{1/(k-1)}\right)^{1/2}.
$$

The function $f(n)$ grows very slowly. So far, no example has been found satisfying

$$
\overline a_k\ge (k+1)\max_{i,j}|a_{ij}|.
$$

**Example 4.4.7**  
Consider the Hilbert matrix $H^n=(h^n_{ij})\in\mathbb{R}^{n\times n}$, where

$$
h^n_{ij}=\frac1{i+j-1},
\qquad i,j\in\{1,\ldots,n\}.
$$

This matrix is well known to be badly conditioned. For example,

$$
\operatorname{cond}(H^5)\approx 9.4\cdot 10^5
$$

with respect to $\|\cdot\|_\infty$, and

$$
\|H^5\|_\infty\approx 2.3,
\qquad
\|(H^5)^{-1}\|_\infty\approx 4.1\cdot 10^5.
$$

When Gaussian elimination with partial pivoting is applied to it, $\overline a=1$.

For $n=5$ and $\mathrm{eps}=10^{-16}$, Theorem 4.4.5 gives

$$
|e_{ij}|
\le
\frac{2(n+1)\mathrm{eps}}{1-n\cdot\mathrm{eps}}\,n\overline a
=
\frac{6\cdot 10^{-15}}{1-5\cdot 10^{-16}}
\approx 6\cdot 10^{-15}.
$$

Therefore,

$$
\|E\|_\infty\le 3\cdot 10^{-14}.
$$

Theorem 4.4.4 gives

$$
\frac{\|\widetilde x-x\|_\infty}{\|x\|_\infty}
\le
\frac{\operatorname{cond}(A)}
{1-\operatorname{cond}(A)\|E\|_\infty/\|A\|_\infty}
\frac{\|E\|_\infty}{\|A\|_\infty}
=
\frac{\|A^{-1}\|_\infty\|E\|_\infty}
{1-\|A^{-1}\|_\infty\|E\|_\infty}
$$

$$
\approx
\frac{4.1\cdot 10^5\cdot 3\cdot 10^{-14}}
{1-4.1\cdot 10^5\cdot 3\cdot 10^{-14}}
\approx 1.23\cdot 10^{-8}.
$$

Thus, rounding errors alone “lose” about half of the significant digits. For larger $n$, the rounding error grows rapidly and soon makes the result unusable.

For larger $n$, Theorem 4.4.4 is no longer applicable because

$$
\|\Delta A\|>\frac1{\|A^{-1}\|}
$$

holds.

---

Return to [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part I]({{ '/en/linear-systems-direct-methods/' | relative_url }}).

**Abbreviations and Notation**

- SPD: symmetric positive definite, meaning $A=A^T$ and $x^TAx>0$.
- Cholesky factorization: the factorization $A=LL^T$ of a symmetric positive definite matrix.
- $\operatorname{cond}(A)$: the condition number, which describes how sensitive a linear system is to perturbations in its input.
- pivot: a pivot element; partial pivoting searches rows, while complete pivoting searches both rows and columns.

**Source, Copyright, and Usage Notes**

This article is organized from Chapter 4 of the locally saved TU Darmstadt 2016 Mathematik 4 ET/3Inf lecture file `Skript-Mathe4ET-3Inf-2016-Kap4-5.pdf`, with reference to the Chinese translation draft `Skript-Mathe4ET-3Inf-2016-Kap4.zh.md` in the same local directory. It is published for personal study, translation, and knowledge organization. The English wording, supplementary explanations, and remade figures in this article do not represent the original authors or an official position.

My organization, English wording, supplementary explanations, and remade figures in this article may be used for non-commercial study, discussion, and citation, provided that the author and original material source are credited. Because parts of this article are based on translation and organization of course lecture notes, the original lecture notes and any materials they may contain should still be governed by their original authors, course pages, and relevant authorization statements. For commercial use, systematic republication, publication, or large-scale adaptation, please confirm the authorization status of the original materials first.

If there are omissions or errors in translation, formulas, terminology, or interpretation, or if a relevant rights holder considers the use of any content inappropriate, please contact me and I will handle or remove it promptly.
