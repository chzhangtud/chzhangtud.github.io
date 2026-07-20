---
title: "Numerical Analysis Lecture (I): Interpolation Methods"
lang: "en"
date: 2026-07-20
permalink: /en/interpolation-lab/
zh_link: /zh/interpolation-lab/
categories:
  - Math
tags:
  - Numerical Methods
  - Interpolation
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

<link rel="stylesheet" href="{{ '/assets/css/interpolation-lab.css' | relative_url }}">

<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<a href="{{ page.zh_link }}" class="btn">中文版</a>

**Preface.** Recently, while reading research related to AI, graphics, and robotics, I have increasingly felt the need to review some foundational mathematics in a more systematic way. I therefore revisited part of numerical analysis, and used AI assistance to turn several figures into interactive web diagrams. This article is essentially an English organization and translation of the interpolation part of Chapter 1 of the course lecture notes, keeping the original meaning as much as possible. In the spirit of open sharing, I am publishing the organized material here.

The main source for this article is [mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3/blob/master/script/mathe3-script-2011-SoSe.pdf) from the open TU Darmstadt course repository. If there is any copyright concern, please contact me and I will remove the material. If there are omissions or inaccuracies, corrections are welcome.

---

**Interpolation**

In practical problems, we often know only finitely many values of a function relation

$$
y = f(x), \qquad f : [a,b] \to \mathbb{R}
$$

namely

$$
y_i = f(x_i), \qquad i = 0,\ldots,n,
$$

but still want to approximately compute, draw, or otherwise use $f(x)$ at arbitrary $x \in [a,b]$. This leads to the following problem.

**Interpolation problem:**  
Construct a simple substitute function $\Phi(x)$ such that

$$
\Phi(x_i) = y_i, \qquad i = 0,\ldots,n.
$$

The goal is to make the error $\lvert f(x)-\Phi(x)\rvert$ as small as possible on $[a,b]$.

**Examples:**

1. The function $f(x)$ is expensive to evaluate, for example $\sin(x)$, $\exp(x)$, $\ln(x)$, $\Gamma(x)$, and so on, while only finitely many values $y_i=f(x_i)$, $i=0,\ldots,n$, are known.  
   Goal: construct an accurate approximation $\Phi(x)$ to $f(x)$, or use $\Phi'(x)$ to approximate $f'(x)$.

2. An experiment, or a numerical computation, reflects an unknown function relation $y=f(x)$ and gives observed or computed values $y_i$ for input parameters $x_i$.  
   Goal: build a good model $\Phi(x)$ for the unknown function $f(x)$.

3. A digital audio signal, such as one from a CD, MP3 player, or DVD, gives amplitudes $y_i$ at times $t_i$, $i=0,\ldots,n$.  
   Question: what should the corresponding analog audio signal $y(t)$ look like?

4. A digital audio signal $(t_i,y_i)$ sampled at 44.1 kHz, as on a CD, must be resampled to 48 kHz, as in DAT or DVD-Video.  
   Goal: find $(\tilde t_j, y(\tilde t_j))$ at the 48 kHz sampling times $\tilde t_j$.

5. A two-dimensional example: given data points $(x_i,y_i,z_i)$, construct a smooth surface $(x,y,z(x,y))$ passing through them, as in CAD, computer graphics, or laser scanning.

**Formal task**

Given an ansatz

$$
\Phi(x; a_0,\ldots,a_n), \qquad x \in \mathbb{R},
$$

which depends on parameters $a_0,\ldots,a_n \in \mathbb{R}$, this chapter studies the following interpolation problem.

**Interpolation task:**  
Given data pairs

$$
(x_i,y_i), \qquad i=0,\ldots,n,
$$

where $x_i,y_i \in \mathbb{R}$ and $x_i \ne x_j$ whenever $i \ne j$, determine parameters $a_0,\ldots,a_n$ such that the interpolation conditions

$$
\Phi(x_i; a_0,\ldots,a_n)=y_i, \qquad i=0,\ldots,n
$$

hold. The data pairs $(x_i,y_i)$ are called interpolation points.

## 1.1 Polynomial Interpolation

Polynomial interpolation is a very commonly used class of methods. Here the ansatz is a polynomial of degree at most $n$:

$$
p_n(x) = \Phi(x; a_0,\ldots,a_n) = a_0 + a_1x + \cdots + a_nx^n.
$$

The interpolation problem therefore becomes: find a polynomial $p_n(x)$ of degree at most $n$ satisfying

$$
p_n(x_i)=y_i, \qquad i=0,\ldots,n. \tag{1.1}
$$

**Naive approach**

A natural but practically unsuitable idea is the following. From (1.1), we obtain $n+1$ linear equations

$$
a_0 + x_i a_1 + x_i^2 a_2 + \cdots + x_i^n a_n = y_i,
\qquad i=0,\ldots,n,
$$

for the $n+1$ coefficients $a_0,\ldots,a_n$. In matrix form this is

$$
\begin{pmatrix}
1 & x_0 & x_0^2 & \cdots & x_0^n \\
1 & x_1 & x_1^2 & \cdots & x_1^n \\
\vdots & \vdots & \vdots & & \vdots \\
1 & x_n & x_n^2 & \cdots & x_n^n
\end{pmatrix}
\begin{pmatrix}
a_0\\
a_1\\
a_2\\
\vdots\\
a_n
\end{pmatrix}
=
\begin{pmatrix}
y_0\\
y_1\\
y_2\\
\vdots\\
y_n
\end{pmatrix}.
\tag{1.2}
$$

**Disadvantages of this approach**

- Solving the linear system (1.2) requires $O(n^3)$ basic operations. This is expensive compared with the $O(n^2)$ methods introduced below.
- The coefficient matrix in (1.2), the Vandermonde matrix, is invertible, but its condition number becomes extremely poor when $n$ is large. Thus it is difficult to solve (1.2) accurately on a computer, because a poor condition number strongly amplifies rounding errors.

We write $O(g(n))$ for the set of all functions whose asymptotic growth is no faster than $g$. That is, for a function $g:\mathbb{N}\to\mathbb{R}$,

$$
O(g(n)) :=
\{f:\mathbb{N}\to\mathbb{R}:\exists n_0\in\mathbb{N}, c\in\mathbb{R},
f(n)\le c\,g(n)\ \text{for all } n\ge n_0\}.
$$

Thus $O(n^3)$ denotes a computational cost that grows roughly like $n^3$ for large $n$, ignoring constant factors.

### 1.1.1 Lagrange Interpolation Formula

We now give an interpolation method that is numerically more stable and computationally more efficient.

**Figure 1.1:** The basis functions $L_{0,5}$ and $L_{3,5}$ for equidistant interpolation nodes on $[0,1]$.

<div data-interpolation-figure="basis" data-interpolation-lang="en"></div>

**Lagrange interpolation polynomial**

$$
p_n(x)=\sum_{k=0}^{n} y_k L_{k,n}(x),
\qquad
L_{k,n}(x)=\prod_{\substack{j=0\\ j\ne k}}^n
\frac{x-x_j}{x_k-x_j}. \tag{1.3}
$$

The Lagrange basis polynomials $L_{k,n}(x)$ are constructed so that

$$
L_{k,n}(x_i)=
\begin{cases}
1, & k=i,\\
0, & \text{otherwise},
\end{cases}
=: \delta_{ki},
$$

where $\delta_{ki}$ is the Kronecker symbol. Figure 1.1 gives an example.

The polynomial $p_n$ in (1.3) satisfies the interpolation condition (1.1), since

$$
p_n(x_i)=\sum_{k=0}^{n} y_k L_{k,n}(x_i)
=\sum_{k=0}^{n} y_k\delta_{ki}=y_i.
$$

In fact, this is the unique solution of the interpolation problem.

**Theorem 1.1.1**  
There exists exactly one polynomial $p(x)$ of degree at most $n$ satisfying the interpolation conditions (1.1), and it is $p_n(x)$.

**Proof:**  
The polynomial (1.3) has degree at most $n$ and satisfies (1.1). If another polynomial $\tilde p_n(x)$ of degree at most $n$ also satisfies (1.1), then $p_n(x)-\tilde p_n(x)$ is a polynomial of degree at most $n$ with $n+1$ distinct zeros $x_0,\ldots,x_n$. Hence it must be identically zero.

**Remark.**  
(1.3) shows that $p_n$ depends linearly on the values $y_k$.

The Lagrange representation (1.3) is very useful in theoretical analysis and is also frequently used in computation.

**Advantages**

- Computing the coefficients, meaning the denominators in (1.3), costs $O(n^2)$; evaluating $p_n(x)$ costs $O(n)$.
- The representation is intuitive and convenient.

**Example 1.1.2:** Figure 1.2 shows the polynomial interpolation of $f(x)=\sin(\pi x)$ on $[0,2]$. For $n=5$, the equidistant interpolation nodes are

$$
x_i=\frac{2i}{5}, \qquad i=0,\ldots,n.
$$

**Figure 1.2:** $\sin(\pi x)$ and $p_5(x)$, together with the interpolation error $\sin(\pi x)-p_5(x)$. The number of interpolation nodes can be changed interactively.

<div data-interpolation-figure="sine-error" data-interpolation-lang="en"></div>

In practical applications, especially when we want to add new interpolation nodes efficiently, the Newton interpolation formula below is more convenient.

### 1.1.2 Newton Interpolation Formula

We use the Newton form

$$
p_n(x)
= \gamma_0
+\gamma_1(x-x_0)
+\gamma_2(x-x_0)(x-x_1)
+\cdots
+\gamma_n(x-x_0)(x-x_1)\cdots(x-x_{n-1}),
$$

with unknown parameters $\gamma_0,\ldots,\gamma_n$. Substituting into (1.1) gives

$$
p_n(x_0)=\gamma_0=y_0,
$$

$$
p_n(x_1)=\gamma_0+\gamma_1(x_1-x_0)=y_1
\quad\Longrightarrow\quad
\gamma_1=\frac{y_1-y_0}{x_1-x_0},
$$

and continuing in this way gives higher-order coefficients. For example,

$$
\gamma_2=
\frac{
\frac{y_2-y_1}{x_2-x_1}
-
\frac{y_1-y_0}{x_1-x_0}
}{x_2-x_0}.
$$

Write

$$
f_{[x_0,\ldots,x_i]} := \gamma_i
$$

for the divided difference of order $i$ on the nodes $x_0,\ldots,x_i$, where

$$
f_{[x_0]}=\gamma_0=y_0.
$$

In general, divided differences on the nodes $x_j,\ldots,x_{j+k}$ can be computed recursively:

$$
j=0,\ldots,n:\qquad f_{[x_j]}=y_j,
$$

$$
k=1,\ldots,n,\quad j=0,\ldots,n-k:\qquad
f_{[x_j,\ldots,x_{j+k}]}
=
\frac{
f_{[x_{j+1},\ldots,x_{j+k}]}
-
f_{[x_j,\ldots,x_{j+k-1}]}
}{x_{j+k}-x_j}. \tag{1.4}
$$

Thus we obtain:

**Newton interpolation polynomial**

$$
p_n(x)=\gamma_0+\sum_{i=1}^{n}
\gamma_i (x-x_0)\cdots(x-x_{i-1}),
\qquad
\gamma_i=f_{[x_0,\ldots,x_i]},
\tag{1.5}
$$

where the divided difference $f_{[x_0,\ldots,x_i]}$ is computed by (1.4).

**Explanation:**  
For $n=0$, the representation is obvious. Let $p_{1,\ldots,i+1}$ and $p_{0,\ldots,i}$ be the interpolation polynomials of degree at most $i$ on the nodes $x_1,\ldots,x_{i+1}$ and $x_0,\ldots,x_i$, respectively. Then

$$
p_{i+1}(x)=
\frac{(x-x_0)p_{1,\ldots,i+1}(x)
+(x_{i+1}-x)p_{0,\ldots,i}(x)}
{x_{i+1}-x_0}.
$$

Therefore,

$$
p_{i+1}(x)
=
\frac{f_{[x_1,\ldots,x_{i+1}]}-f_{[x_0,\ldots,x_i]}}
{x_{i+1}-x_0}
(x-x_0)\cdots(x-x_i)
+ q_i(x),
$$

where $q_i(x)$ is a polynomial of degree $i$. Since the first term vanishes at $x_0,\ldots,x_i$, (1.1) implies $q_i(x)=p_i(x)$. Comparing with (1.5) then gives (1.4).

Equation (1.4) gives the following rule for computing the coefficients $\gamma_i=f_{[x_0,\ldots,x_i]}$.

**Computing divided differences:**  
Set

$$
f_{[x_j]}=y_j,\qquad j=0,\ldots,n.
$$

For $k=1,\ldots,n$ and $j=0,\ldots,n-k$, compute

$$
f_{[x_j,\ldots,x_{j+k}]}
=
\frac{
f_{[x_{j+1},\ldots,x_{j+k}]}
-
f_{[x_j,\ldots,x_{j+k-1}]}
}{x_{j+k}-x_j}.
$$

This yields the divided-difference table

$$
\begin{array}{c|cccc}
x_0 & f_{[x_0]}=y_0 & & & \\
    & & \searrow & \\
    & & & f_{[x_0,x_1]} & \\
x_1 & f_{[x_1]}=y_1 & \nearrow & & \searrow \\
    & & \searrow & & & f_{[x_0,x_1,x_2]} \\
    & & & f_{[x_1,x_2]} & \nearrow & \\
x_2 & f_{[x_2]}=y_2 & \nearrow & & \\
\vdots & \vdots & & & 
\end{array}
$$

**Advantages:**

- Computing divided differences costs $O(n^2)$, and evaluating $p_n(x)$ costs $O(n)$.
- Adding a new interpolation node requires only $n$ additional divided differences.

### 1.1.3 Error Estimate

Assume that the interpolation data come from a function $f:[a,b]\to\mathbb{R}$, namely

$$
y_i=f(x_i),\qquad i=0,\ldots,n,
$$

It is natural to ask how well the interpolation polynomial $p_n$ approximates $f$ on $[a,b]$. The following theorem answers this question.

**Theorem 1.1.3**  
Let $f$ have $n+1$ continuous derivatives, written as

$$
f\in C^{n+1}([a,b]).
$$

Let $x_0,\ldots,x_n\in[a,b]$ be distinct points, and let $p_n$ be the unique interpolation polynomial of degree at most $n$ determined by the data $(x_i,f(x_i))$, $i=0,\ldots,n$. Then for every $x\in[a,b]$, there exists $\xi_x\in[a,b]$ such that

$$
f(x)-p_n(x)
=
\frac{f^{(n+1)}(\xi_x)}{(n+1)!}
(x-x_0)\cdots(x-x_n).
$$

Thus the interpolation remainder consists of two factors: the node polynomial

$$
\omega(x)=\prod_{i=0}^{n}(x-x_i)
$$

and the factor

$$
\frac{f^{(n+1)}(\xi_x)}{(n+1)!}.
$$

Estimating these two terms separately gives, for example, the following error bound.

**Corollary 1.1.4**  
Under the assumptions of Theorem 1.1.3,

$$
\max_{x\in[a,b]} |f(x)-p_n(x)|
\le
\max_{x\in[a,b]}
\frac{|f^{(n+1)}(x)|}{(n+1)!}
\max_{x\in[a,b]}|\omega(x)|
\le
\max_{x\in[a,b]}
\frac{|f^{(n+1)}(x)|}{(n+1)!}
(b-a)^{n+1}.
$$

**Caution**  
If interpolation nodes are chosen equidistantly, that is,

$$
x_i=a+ih,\qquad h=\frac{b-a}{n},
$$

it is not always guaranteed that

$$
\lim_{n\to\infty} \left(f(x)-p_n(x)\right)=0
\qquad\text{for all } x\in[a,b].
$$

**Example.**  
Consider

$$
f(x)=\frac{1}{1+x^2}
\qquad\text{on } [a,b]=[-5,5].
$$

When the interpolation nodes are equidistant, the error $\lvert f(x)-p_n(x)\rvert$ does not converge to 0 for all $x\in[a,b]$ as $n\to\infty$. See Figure 1.3.

**Figure 1.3:** Interpolation polynomials $p_{10}$ and $p_{20}$ for $f(x)=1/(1+x^2)$ on $[a,b]=[-5,5]$ with equidistant interpolation nodes. The value of $n$ can be selected interactively in the figure.

<div data-interpolation-figure="runge-equal" data-interpolation-lang="en"></div>

One remedy is to choose the $x_i$ as Chebyshev nodes, which make

$$
\max_{x\in[a,b]}|\omega(x)|
$$

minimal.

**Chebyshev nodes**

Choose the nodes

$$
x_i =
\frac{b-a}{2}
\cos\left(\frac{2i+1}{n+1}\frac{\pi}{2}\right)
+\frac{b+a}{2},
\qquad i=0,\ldots,n
\tag{1.6}
$$

Then $\max_{x\in[a,b]}|\omega(x)|$ attains its minimum value:

$$
\max_{x\in[a,b]}|\omega(x)|
=
\left(\frac{b-a}{2}\right)^{n+1}2^{-n}.
$$

**Example.** Figure 1.4 shows the interpolation polynomial for $f(x)=1/(1+x^2)$ using Chebyshev nodes.

**Figure 1.4:** Interpolation polynomials $p_{10}$ and $p_{20}$ for $f(x)=1/(1+x^2)$ on $[a,b]=[-5,5]$ with Chebyshev nodes.

<div data-interpolation-figure="runge-chebyshev" data-interpolation-lang="en"></div>

In general, one should not choose $n$ too large in practical computation. A better approach is to work piecewise on smaller intervals, as in Section 1.2.

### 1.1.4 Applications of Polynomial Interpolation

Some applications of polynomial interpolation are:

1. **Approximation of functions on an interval:** as seen above, equidistant interpolation nodes should be avoided; Chebyshev nodes should be used instead.

2. **Inverse interpolation:** let $f:[a,b]\to\mathbb{R}$ be bijective, for example with $f'(x)\ne 0$ on $[a,b]$. If $(x_i,y_i)$ with $y_i=f(x_i)$ are interpolation points for $f$, then because $x_i=f^{-1}(y_i)$, the pairs $(y_i,x_i)$ are interpolation points for $f^{-1}$. Interpolating these pairs gives an approximation of $f^{-1}$.

3. **Numerical integration:** this will be discussed later.  
   To approximate an integral, first construct an interpolation polynomial and then integrate that polynomial:

   $$
   \int_a^b f(x)\,dx \approx \int_a^b p_n(x)\,dx.
   $$

4. **Numerical differentiation:** if $p_n$ is the interpolation polynomial of $f$, then $p_n'$ is an approximation of $f'$.

**Remark.**  
Polynomial interpolation can be extended in different directions:

- One may use trigonometric polynomials:

  $$
  \frac{a_0}{2}+\sum_{k=1}^{n}\left(a_k\cos(kx)+b_k\sin(kx)\right).
  $$

  This leads to Fourier analysis.

- Instead of prescribing values of a polynomial at $n$ positions, one may prescribe derivatives of different orders at a particular point $x_0$. This yields the Taylor polynomial:

  $$
  f(x_0)+f'(x_0)(x-x_0)
  +\frac{f''(x_0)}{2}(x-x_0)^2
  +\cdots
  +\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n.
  $$

Both variants are useful in many contexts.

## 1.2 Spline Interpolation

In polynomial interpolation, we used one polynomial of degree $n$ to interpolate a function $f$ on $[a,b]$. We have already seen that simply adding many interpolation nodes does not necessarily guarantee high accuracy.

One remedy is piecewise interpolation: split the original interval $[a,b]$ into smaller subintervals and use interpolation polynomials of fixed degree on each subinterval. At the interfaces between subintervals, these polynomials should join with $k$ continuous derivatives, where $k$ is fixed; at the same time, we want the interpolation function to oscillate as little as possible. This idea leads to spline interpolation.

### 1.2.1 Basics

Let

$$
\Delta = \{x_i : a=x_0 < x_1 < \cdots < x_n=b\}
$$

be a partition of the interval $[a,b]$. Traditionally, the points $x_i$ are called nodes.

**Definition 1.2.1**  
A spline function of degree $l$ with respect to the partition $\Delta$ is a function $s:[a,b]\to\mathbb{R}$ satisfying:

- $s\in C^{l-1}([a,b])$, that is, $s$ is continuous and has $l-1$ continuous derivatives.
- On each interval $[x_i,x_{i+1}]$, $s$ agrees with a polynomial $s_i$ of degree at most $l$.

The set of such spline functions is denoted by $S_{\Delta,l}$.

Below we discuss only the cases $l=1$, linear splines, and $l=3$, cubic splines.

Now consider how splines are used for interpolation.

**Spline interpolation**

Given the partition

$$
\Delta = \{x_i : a=x_0<x_1<\cdots<x_n=b\}
$$

and values $y_i\in\mathbb{R}$, $i=0,\ldots,n$, find $s\in S_{\Delta,l}$ such that

$$
s(x_i)=y_i,\qquad i=0,\ldots,n. \tag{1.7}
$$

### 1.2.2 Linear Spline Interpolation

A linear spline $s\in S_{\Delta,1}$ is continuous and, on each interval $[x_i,x_{i+1}]$, is a polynomial $s_i$ of degree at most 1. Therefore the interpolation conditions (1.7) require

$$
s_i(x_i)=y_i,\qquad s_i(x_{i+1})=y_{i+1},
$$

which uniquely determines $s_i$:

$$
s(x)=s_i(x)
=
\frac{x_{i+1}-x}{x_{i+1}-x_i}y_i
+
\frac{x-x_i}{x_{i+1}-x_i}y_{i+1},
\qquad
\forall x\in[x_i,x_{i+1}].
\tag{1.8}
$$

Define the hat functions

$$
\varphi_i(x)=
\begin{cases}
0, & x<x_{i-1},\\
\dfrac{x-x_{i-1}}{x_i-x_{i-1}}, & x\in[x_{i-1},x_i],\\
\dfrac{x_{i+1}-x}{x_{i+1}-x_i}, & x\in[x_i,x_{i+1}],\\
0, & x>x_{i+1},
\end{cases}
$$

where the auxiliary nodes $x_{-1}<a$ and $x_{n+1}>b$ may be chosen arbitrarily. Then $s(x)$ can be written conveniently on $[a,b]$ as

$$
s(x)=\sum_{i=0}^{n}y_i\varphi_i(x),
\qquad x\in[a,b].
$$

**Theorem 1.2.2**  
Given a partition of $[a,b]$,

$$
\Delta=\{x_i:a=x_0<x_1<\cdots<x_n=b\}
$$

and values $y_i$, $i=0,\ldots,n$, there exists a unique linear interpolation spline.

There is also the following error estimate.

**Theorem 1.2.3**  
Let $f\in C^2([a,b])$. For any partition

$$
\Delta=\{x_i:a=x_0<x_1<\cdots<x_n=b\},
$$

and the corresponding linear interpolation spline $s\in S_{\Delta,1}$ obtained from $f$,

$$
\max_{x\in[a,b]} |f(x)-s(x)|
\le
\frac{1}{8}
\max_{x\in[a,b]} |f''(x)|\,h_{\max}^2,
\qquad
h_{\max}:=\max_{i=0,\ldots,n-1}(x_{i+1}-x_i).
$$

**Proof:**  
On each interval $[x_i,x_{i+1}]$, $s$ is an interpolation polynomial of degree at most 1. Hence Theorem 1.1.3 gives

$$
|f(x)-s(x)|
=
\frac{|f''(\xi_x)|}{2!}|(x-x_i)(x-x_{i+1})|
\le
\frac{|f''(\xi_x)|}{2!}\frac{h_{\max}^2}{4},
\qquad
\forall x\in[x_i,x_{i+1}],
$$

where $\xi_x\in[x_i,x_{i+1}]$ depends on $x$. The result follows immediately.

### 1.2.3 Cubic Spline Interpolation

Cubic splines are assembled from cubic polynomial pieces and have two continuous derivatives. We will see that cubic spline interpolation can pass through the given points with a curve of minimal curvature.

**Computing the cubic spline interpolation function**

If $s\in S_{\Delta,3}$ is a cubic spline, then $s''$ is clearly continuous and piecewise linear, so $s''\in S_{\Delta,1}$. We can therefore first determine $s_i''$ and then integrate to obtain $s_i$.

Let

$$
M_i=s''(x_i)
$$

be called the moments. From (1.8),

$$
s_i''(x)
=
\frac{x_{i+1}-x}{x_{i+1}-x_i}M_i
+
\frac{x-x_i}{x_{i+1}-x_i}M_{i+1}.
$$

Integrating twice gives the following form:

$$
s_i(x)
=
\frac{1}{6}
\left(
\frac{(x_{i+1}-x)^3}{x_{i+1}-x_i}M_i
+
\frac{(x-x_i)^3}{x_{i+1}-x_i}M_{i+1}
\right)
+c_i(x-x_i)+d_i,
$$

where $c_i,d_i\in\mathbb{R}$. Using the conditions

$$
s_i(x_i)=y_i,\qquad s_i(x_{i+1})=y_{i+1}
$$

determines $c_i$ and $d_i$. With $h_i=x_{i+1}-x_i$,

$$
d_i=y_i-\frac{h_i^2}{6}M_i,
\qquad
c_i=\frac{y_{i+1}-y_i}{h_i}
-\frac{h_i}{6}(M_{i+1}-M_i).
$$

The remaining unknowns $M_i$ are determined from the first derivative

$$
s_i'(x)
=
-\frac{1}{2}
\left(
\frac{(x_{i+1}-x)^2}{x_{i+1}-x_i}M_i
-
\frac{(x-x_i)^2}{x_{i+1}-x_i}M_{i+1}
\right)
+c_i
$$

and the equations

$$
s_i'(x_i)=s_{i-1}'(x_i).
$$

This gives the equations for the moments $M_i$:

$$
\frac{h_{i-1}}{6}M_{i-1}
+
\frac{h_{i-1}+h_i}{3}M_i
+
\frac{h_i}{6}M_{i+1}
=
\frac{y_{i+1}-y_i}{h_i}
-
\frac{y_i-y_{i-1}}{h_{i-1}},
\qquad
i=1,\ldots,n-1.
\tag{1.9}
$$

There are $n-1$ equations but $n+1$ unknowns. Therefore two additional boundary conditions are needed to determine the spline interpolation function uniquely.

**Common boundary conditions for cubic splines:**

a) **Natural boundary conditions:**

$$
s''(a)=s''(b)=0,
\qquad\text{that is } M_0=M_n=0.
$$

b) **Hermite boundary conditions:**

$$
s'(a)=f'(a),\qquad s'(b)=f'(b),
$$

that is,

$$
\frac{h_0}{3}M_0+\frac{h_0}{6}M_1
=
\frac{y_1-y_0}{h_0}-f'(a),
$$

$$
\frac{h_{n-1}}{3}M_n+\frac{h_{n-1}}{6}M_{n-1}
=
f'(b)-\frac{y_n-y_{n-1}}{h_{n-1}}.
$$

With either a) or b), combining these boundary conditions with (1.9) uniquely determines $M_0,\ldots,M_n$. This leads to the following strictly diagonally dominant tridiagonal linear system:

$$
\begin{pmatrix}
\mu_0 & \lambda_0 & & & \\
\frac{h_0}{6} & \frac{h_0+h_1}{3} & \frac{h_1}{6} & & \\
& \ddots & \ddots & \ddots & \\
& & \frac{h_{i-1}}{6} & \frac{h_{i-1}+h_i}{3} & \frac{h_i}{6} \\
& & & \ddots & \ddots \\
& & & \lambda_n & \mu_n
\end{pmatrix}
\begin{pmatrix}
M_0\\
M_1\\
\vdots\\
M_n
\end{pmatrix}
=
\begin{pmatrix}
b_0\\
\frac{y_2-y_1}{h_1}-\frac{y_1-y_0}{h_0}\\
\vdots\\
\frac{y_{i+1}-y_i}{h_i}-\frac{y_i-y_{i-1}}{h_{i-1}}\\
\vdots\\
b_n
\end{pmatrix}.
\tag{1.10}
$$

For case a), for example, one may take

$$
b_0=b_n=\lambda_0=\lambda_n=0,
\qquad
\mu_0=\mu_n=1.
$$

For case b),

$$
\mu_0=\frac{h_0}{3},\quad
\lambda_0=\frac{h_0}{6},\quad
b_0=\frac{y_1-y_0}{h_0}-f'(a),
$$

and

$$
\mu_n=\frac{h_{n-1}}{3},\quad
\lambda_n=\frac{h_{n-1}}{6},\quad
b_n=f'(b)-\frac{y_n-y_{n-1}}{h_{n-1}}.
$$

Since the matrix is strictly diagonally dominant, Gershgorin's theorem implies that 0 is not an eigenvalue, so the coefficient matrix is invertible.

**Example 1.2.4:** Figure 1.5 gives an example of linear and cubic spline interpolation.

**Figure 1.5:** Interpolation of $\sin(4\pi x)$ on $[a,b]=[0,2]$ using a linear spline and a cubic spline with natural boundary conditions. The reader can interactively choose $n=10$ or $n=20$.

<div data-interpolation-figure="spline" data-interpolation-lang="en"></div>

**Minimal property of cubic splines**

It can be shown that cubic spline interpolation functions with boundary conditions a) or b) have minimal curvature among all twice continuously differentiable functions, in the following sense.

**Theorem 1.2.5**  
Given any function $f\in C^2([a,b])$ and a partition $\Delta$ of $[a,b]$, with $y_i=f(x_i)$, let $s\in S_{\Delta,3}$ be the cubic spline interpolation function satisfying boundary condition a) or b). Then

$$
\int_a^b f''(x)^2\,dx
=
\int_a^b s''(x)^2\,dx
+
\int_a^b (f''(x)-s''(x))^2\,dx
\ge
\int_a^b s''(x)^2\,dx.
$$

**Proof:** See references [4,5].

**Error estimates for cubic spline interpolation**

The following fact is used to prove the subsequent results: the moments

$$
\hat M_i=f''(x_i)
$$

satisfy the linear system (1.10) with accuracy $O(h_{\max}^3)$, where

$$
h_{\max}=\max_{0\le i<n} h_i,
$$

and the inverse matrix norm of the coefficient matrix in (1.10) is of order $O(1/h_{\min})$, where

$$
h_{\min}=\min_{0\le i<n} h_i.
$$

**Theorem 1.2.6**  
Let $f\in C^4([a,b])$ and

$$
f''(a)=f''(b)=0.
$$

For any partition $\Delta$, set $y_i=f(x_i)$ and let $s\in S_{\Delta,3}$ be the cubic spline interpolation function satisfying boundary condition a). Then

$$
|f(x)-s(x)|
\le
\frac{h_{\max}}{h_{\min}}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^4,
$$

$$
|f^{(k)}(x)-s^{(k)}(x)|
\le
\frac{2h_{\max}}{h_{\min}}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^{4-k},
\qquad k=1,2.
$$

**Proof:** See reference [4].

For Hermite boundary conditions, the conclusion can be strengthened.

**Theorem 1.2.7**  
Let $f\in C^4([a,b])$. For any partition $\Delta$, set $y_i=f(x_i)$ and let $s\in S_{\Delta,3}$ be the cubic spline interpolation function satisfying boundary condition b). Then

$$
|f(x)-s(x)|
\le
\frac{5}{384}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^4,
$$

$$
|f^{(k)}(x)-s^{(k)}(x)|
\le
\frac{2h_{\max}}{h_{\min}}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^{4-k},
\qquad k=1,2.
$$

**Proof:** See references [2,4,6].

**References**

- [1] P. Deuflhard and F. Bornemann. *Numerische Mathematik II*. de Gruyter, Berlin, 2002. 3.1.5.
- [2] P. Deuflhard and F. Hohmann. *Numerische Mathematik I*. de Gruyter, Berlin, 2008. 1.2.3.
- [3] H. Heuser. *Gewöhnliche Differentialgleichungen*. Teubner, Stuttgart, 1989. 3.1.
- [4] R. Plato. *Numerische Mathematik kompakt*. Vieweg Verlag, Braunschweig, 2000. 1.2.3, 6.3.2.
- [5] J. Stoer. *Numerische Mathematik 1*. Springer Verlag, Berlin, 1994. 1.2.3, 4.4.2.
- [6] W. Törnig and P. Spellucci. *Numerische Mathematik für Ingenieure und Physiker 2*. Springer Verlag, Berlin, 1990. 1.2.3.
- [7] W. Walter. *Gewöhnliche Differentialgleichungen*. Springer, Berlin, 1986. 3.1.
- [8] J. Werner. *Numerische Mathematik 2*. Vieweg Verlag, Braunschweig, 1992. 6.1.4.


<script type="module" src="{{ '/assets/js/interpolation-lab.mjs' | relative_url }}"></script>
