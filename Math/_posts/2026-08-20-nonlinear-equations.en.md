---
title: "Numerical Analysis Lecture (V): Nonlinear Systems of Equations"
lang: "en"
date: 2026-08-20
permalink: /en/nonlinear-equations/
zh_link: /zh/nonlinear-equations/
categories:
  - Math
tags:
  - Numerical Methods
  - Nonlinear Equations
  - Newton Method
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.newton-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.newton-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.newton-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.newton-figure__note {
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

It is best to read [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part II]({{ '/en/linear-systems-cholesky-conditioning/' | relative_url }}) first. This article introduces nonlinear systems of equations, the local convergence of Newton's method, and globalization strategies.

---

## 5.1 Introduction

This chapter discusses methods for solving nonlinear systems of equations.

**Nonlinear system of equations.** We seek $x\in D$ such that

$$
F(x)=0
$$

where a mapping

$$
F=
\begin{pmatrix}
F_1\\
\vdots\\
F_n
\end{pmatrix}
:D\to\mathbb{R}^n,
\qquad
D\subseteq\mathbb{R}^n
$$

is given. Here, $D$ is a nonempty closed set.

Many practically relevant problems, especially in engineering, are nonlinear and require the solution of nonlinear systems. For example, large nonlinear systems arise in circuit simulation and in the discretization of nonlinear partial differential equations, including weather and climate models, structural mechanics, and forming processes in manufacturing.

The solution set of a linear system can only be a singleton, empty, or an entire affine subspace. Nonlinear equations, by contrast, may have several isolated solutions or even infinitely many isolated solutions.

**Example 5.1.1**

1. $n=1$, $D=\mathbb{R}$, and $F(x)=x^2-a$ with $a>0$. There are two real solutions:

$$
x=\pm\sqrt a.
$$

2. $n=1$, $D=\mathbb{R}$, and $F(x)=x^2+a$ with $a>0$. There is no real solution.

3. $n=1$, $D=\mathbb{R}$, and $F(x)=x\sin(x)$. There are infinitely many solutions:

$$
x=k\pi,
\qquad k\in\mathbb{Z}.
$$

4. Consider the intersection of the unit circle with the line $G:x_2=ax_1+b$, where $a,b\in\mathbb{R}$. Let $n=2$, $D=\mathbb{R}^2$, and

$$
F(x)=
\begin{pmatrix}
x_1^2+x_2^2-1\\
x_2-ax_1-b
\end{pmatrix}.
$$

The number of solutions depends on $a$ and $b$: there may be two, one, or no real solutions.

In many applications, the function $F$ is continuously differentiable, meaning that its partial derivatives

$$
\frac{\partial F_i}{\partial x_j},
\qquad 1\le i,j\le n
$$

exist and are continuous. In this case, the first-order Taylor expansion gives

$$
F(x+s)=F(x)+F'(x)s+R(x;s),
$$

where the Jacobian matrix is

$$
F'(x)=
\begin{pmatrix}
\frac{\partial F_1}{\partial x_1}(x)&\cdots&\frac{\partial F_1}{\partial x_n}(x)\\
\vdots&\ddots&\vdots\\
\frac{\partial F_n}{\partial x_1}(x)&\cdots&\frac{\partial F_n}{\partial x_n}(x)
\end{pmatrix},
$$

and $R(x;s)$ is the remainder term satisfying

$$
\lim_{s\to 0}\frac{\|R(x;s)\|}{\|s\|}=0,
\qquad
\text{abbreviated as } R(x;s)=o(\|s\|).
$$

This provides the basis for constructing fast solution methods.

## 5.2 Newton's Method

Newton's method is one of the most important methods for solving nonlinear systems because it usually converges very rapidly near a solution. For ease of exposition, we assume below that $D=\mathbb{R}^n$.

Consider solving the system

$$
F(x)=0
\tag{5.1}
$$

with Newton's method, where $F:\mathbb{R}^n\to\mathbb{R}^n$ is continuously differentiable.

### 5.2.1 Derivation

**Intuition in one dimension**

First let $n=1$. Then $F(x):\mathbb{R}\to\mathbb{R}$ is a real-valued function. Let $x^{(k)}$ be an approximation to a solution $\overline x$ of (5.1). The idea of Newton's method is to approximate the graph $(x,F(x))$ by its tangent line at $x^{(k)}$, and to use the intersection of that tangent line with the $x$-axis as the next iterate $x^{(k+1)}$.

The tangent line is

$$
y=F(x^{(k)})+F'(x^{(k)})(x-x^{(k)}),
$$

and $x^{(k+1)}$ is the solution of

$$
F(x^{(k)})+F'(x^{(k)})(x-x^{(k)})=0.
$$

If $F'(x^{(k)})\ne 0$, then

$$
x^{(k+1)}
=x^{(k)}-F'(x^{(k)})^{-1}F(x^{(k)}).
$$

Thus,

$$
x^{(k+1)}=x^{(k)}+s^{(k)},
$$

where $s^{(k)}$ is obtained by solving

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)}).
$$

**Example 5.2.1.** For $F(x)=x^2-a$ with $a>0$,

$$
x^{(k+1)}
=x^{(k)}-\frac1{2x^{(k)}}\left((x^{(k)})^2-a\right)
=\frac12\left(x^{(k)}+\frac{a}{x^{(k)}}\right).
$$

**General case**

In the general case, let $x^{(k)}\in\mathbb{R}^n$ be the current iterate. Then $\overline x$ is a solution of (5.1) if and only if $\overline x=x^{(k)}+s$ for some $s$ satisfying

$$
F(x^{(k)}+s)=0.
\tag{5.2}
$$

Newton's method approximates $F(x^{(k)}+s)$ by its first-order Taylor expansion:

$$
F(x^{(k)}+s)
=F(x^{(k)})+F'(x^{(k)})s+o(\|s\|),
$$

where $F'(x^{(k)})$ is the Jacobian matrix of $F$ at $x^{(k)}$; when $s$ is small, the remainder is small as well.

Therefore, at the $k$th Newton iteration, (5.2) is replaced by the linearized equation

$$
F(x^{(k)})+F'(x^{(k)})s=0.
$$

This gives the following algorithm.

**Algorithm 5.2.2: Local Newton method for systems of equations**

Choose an initial point $x^{(0)}\in\mathbb{R}^n$.

For $k=0,1,\ldots$:

1. If $F(x^{(k)})=0$, stop and return $x^{(k)}$.
2. Solve the Newton equation for the Newton step $s^{(k)}\in\mathbb{R}^n$:

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)}).
$$

3. Set

$$
x^{(k+1)}=x^{(k)}+s^{(k)}.
$$

<figure class="newton-figure">
  <figcaption class="newton-figure__caption">Figure 5.1: Geometric intuition for local Newton's method</figcaption>
  <svg viewBox="0 0 760 430" role="img" aria-labelledby="nonlinear-local-newton-en-title nonlinear-local-newton-en-desc">
    <title id="nonlinear-local-newton-en-title">Tangent iteration in local Newton's method</title>
    <desc id="nonlinear-local-newton-en-desc">Using F(x)=x²−2 as an example, the diagram starts from x^(0), repeatedly draws a tangent, and takes its intersection with the x-axis as the next iterate. The iterates approach the root x̄=√2.</desc>
    <defs>
      <marker id="nonlinear-local-newton-en-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#607d8b"></path>
      </marker>
      <marker id="nonlinear-local-newton-en-tangent-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#d97706"></path>
      </marker>
    </defs>
    <rect x="0" y="0" width="760" height="430" fill="#ffffff"></rect>

    <line x1="90" y1="275" x2="705" y2="275" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-local-newton-en-arrow)"></line>
    <line x1="90" y1="345" x2="90" y2="45" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-local-newton-en-arrow)"></line>

    <line x1="125.3" y1="270" x2="125.3" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="271.5" y1="270" x2="271.5" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="478.2" y1="270" x2="478.2" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="619.4" y1="270" x2="619.4" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="120" y="300" font-size="14" fill="#455461">1</text>
    <text x="249" y="300" font-size="14" fill="#455461">x̄=√2</text>
    <text x="473" y="300" font-size="14" fill="#455461">2</text>
    <text x="610" y="300" font-size="14" fill="#455461">2.4</text>
    <text x="705" y="294" font-size="16" fill="#263238">x</text>
    <text x="63" y="54" font-size="16" fill="#263238">F(x)</text>

    <line x1="84" y1="185" x2="96" y2="185" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="95" x2="96" y2="95" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="65" y="280" font-size="14" fill="#455461">0</text>
    <text x="58" y="190" font-size="14" fill="#455461">2</text>
    <text x="58" y="100" font-size="14" fill="#455461">4</text>

    <path d="M90 328.6 L125.3 320 L160.6 310.6 L195.9 300.2 L231.2 288.9 L266.5 276.8 L301.8 263.7 L337.1 249.8 L372.4 234.9 L407.6 219.2 L442.9 202.5 L478.2 185 L513.5 166.5 L548.8 147.2 L584.1 126.9 L619.4 105.8 L654.7 83.7 L690 60.8" fill="none" stroke="#1565c0" stroke-width="3"></path>
    <line x1="271.5" y1="275" x2="271.5" y2="335" stroke="#546e7a" stroke-width="1.4" stroke-dasharray="5 5"></line>

    <line x1="619.4" y1="105.8" x2="342.9" y2="275" stroke="#d97706" stroke-width="2.2" stroke-dasharray="8 5" marker-end="url(#nonlinear-local-newton-en-tangent-arrow)"></line>
    <line x1="342.9" y1="247.4" x2="276.0" y2="273.4" stroke="#2e7d32" stroke-width="2.2" stroke-dasharray="8 5" marker-end="url(#nonlinear-local-newton-en-arrow)"></line>

    <circle cx="619.4" cy="105.8" r="6" fill="#d97706"></circle>
    <circle cx="342.9" cy="247.4" r="6" fill="#2e7d32"></circle>
    <circle cx="276.0" cy="273.4" r="6" fill="#7b1fa2"></circle>
    <circle cx="271.5" cy="275" r="5" fill="#263238"></circle>

    <text x="625" y="92" font-size="15" fill="#9a5b00">x^(0)</text>
    <text x="348" y="239" font-size="15" fill="#246b29">x^(1)</text>
    <text x="282" y="292" font-size="15" fill="#6a187f">x^(2)</text>
    <text x="520" y="117" font-size="15" fill="#12529d">F(x)=x²−2</text>
    <text x="470" y="205" font-size="14" fill="#9a5b00">tangent at x^(0)</text>
    <text x="306" y="224" font-size="14" fill="#246b29">tangent at x^(1)</text>

    <line x1="490" y1="350" x2="520" y2="350" stroke="#1565c0" stroke-width="3"></line>
    <text x="528" y="355" font-size="13" fill="#455461">Function curve</text>
    <line x1="490" y1="375" x2="520" y2="375" stroke="#d97706" stroke-width="2.2" stroke-dasharray="8 5"></line>
    <text x="528" y="380" font-size="13" fill="#455461">Tangent and next iterate</text>
  </svg>
  <p class="newton-figure__note">The illustration uses $F(x)=x^2-2$. At each iterate, draw the tangent and take its intersection with the $x$-axis as the next iterate; when the initial point is sufficiently close to the root, the iterates quickly approach $\overline x=\sqrt{2}$.</p>
</figure>

### 5.2.2 Local Superlinear and Quadratic Convergence of Newton's Method

Under suitable conditions, Newton's method can be shown to converge locally at a very high rate.

For notational simplicity, we use the Euclidean norm $\|\cdot\|_2$ and its induced matrix norm throughout. Other norms could of course be used as well.

The following theorem gives the local superlinear and quadratic convergence of Newton's method.

**Theorem 5.2.3 (Fast local convergence of Newton's method).** Let $F:\mathbb{R}^n\to\mathbb{R}^n$ be continuously differentiable, and let $\overline x\in\mathbb{R}^n$ satisfy

$$
F(\overline x)=0
$$

with $F'(\overline x)$ nonsingular. Then there exists $\delta>0$ such that:

i) Within the ball

$$
B_\delta(\overline x)
:=
\{x\in\mathbb{R}^n:\|x-\overline x\|_2<\delta\},
$$

$\overline x$ is the unique zero of $F$.

ii) For every $x^{(0)}\in B_\delta(\overline x)$, Algorithm 5.2.2 either reaches $x^{(k)}=\overline x$ at some step and terminates, or generates a sequence satisfying

$$
(x^{(k)})\subset B_\delta(\overline x),
$$

which converges superlinearly to $\overline x$, that is,

$$
\lim_{k\to\infty}x^{(k)}=\overline x,
$$

and

$$
\|x^{(k+1)}-\overline x\|_2
\le
\nu_k\|x^{(k)}-\overline x\|_2,
$$

where $\nu_k\downarrow 0$, meaning that the convergence factor tends to zero.

iii) If $F'$ satisfies a Lipschitz condition on $B_\delta(\overline x)$, with Lipschitz constant $L$, namely

$$
\|F'(x)-F'(y)\|_2
\le
L\|x-y\|_2
\qquad
\forall x,y\in B_\delta(\overline x),
$$

then $(x^{(k)})$ converges to $\overline x$ quadratically, that is,

$$
\lim_{k\to\infty}x^{(k)}=\overline x,
$$

and

$$
\|x^{(k+1)}-\overline x\|_2
\le
C\|x^{(k)}-\overline x\|_2^2,
$$

where, for sufficiently small $\delta>0$, one may choose

$$
C=L\cdot\|F'(\overline x)^{-1}\|_2.
$$

Note: If $F$ has continuous second derivatives on the closed ball $B_\delta(\overline x)$, then $F'$ automatically satisfies a Lipschitz condition.

However, Algorithm 5.2.2 usually converges only when the initial point is sufficiently close to a solution $\overline x$.

**Example 5.2.4.** Consider

$$
F(x)=\frac{x}{\sqrt{1+x^2}}.
$$

The function $F$ has exactly one zero, $\overline x=0$, is continuously differentiable, and satisfies $F'(x)>0$. Nevertheless, when $\lvert x^{(0)}\rvert>1$, Newton's method does not converge from any such initial point (see the exercises).

To make Newton's method converge from every initial point, it must be suitably globalized.

### 5.2.3 Globalization of Newton's Method

This section presents one improvement to Newton's method. For a broad class of functions $F$, the improvement guarantees global convergence from any initial point.

The method is based on the following observation: every solution $\overline x$ of (5.1) is a global minimizer of

$$
\min_{x\in\mathbb{R}^n}\|F(x)\|_2^2.
$$

The strategy is as follows:

- Use the Newton step $s^{(k)}$, but scale it by a step size $\sigma_k\in(0,1]$, setting

$$
x^{(k+1)}=x^{(k)}+\sigma_k s^{(k)}.
$$

- Choose $\sigma_k$ so that

$$
\|F(x^{(k+1)})\|_2<\|F(x^{(k)})\|_2
\tag{5.3}
$$

holds, with a sufficiently large decrease.

For the function

$$
\phi(\sigma)
:=
\|F(x^{(k)}+\sigma s^{(k)})\|_2^2,
$$

<figure class="newton-figure">
  <figcaption class="newton-figure__caption">Figure 5.2: Armijo step-size selection in globalized Newton's method</figcaption>
  <svg viewBox="0 0 760 420" role="img" aria-labelledby="nonlinear-global-newton-en-title nonlinear-global-newton-en-desc">
    <title id="nonlinear-global-newton-en-title">Step-size search in globalized Newton's method</title>
    <desc id="nonlinear-global-newton-en-desc">The squared residual function φ(σ) is shown. The full step σ=1 fails the Armijo decrease condition and is rejected; the largest accepted step is σ=1/2.</desc>
    <defs>
      <marker id="nonlinear-global-newton-en-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#607d8b"></path>
      </marker>
    </defs>
    <rect x="0" y="0" width="760" height="420" fill="#ffffff"></rect>

    <line x1="90" y1="320" x2="705" y2="320" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-global-newton-en-arrow)"></line>
    <line x1="90" y1="350" x2="90" y2="55" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-global-newton-en-arrow)"></line>

    <line x1="90" y1="315" x2="90" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="240" y1="315" x2="240" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="390" y1="315" x2="390" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="690" y1="315" x2="690" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="84" y="345" font-size="14" fill="#455461">0</text>
    <text x="224" y="345" font-size="14" fill="#455461">1/4</text>
    <text x="374" y="345" font-size="14" fill="#455461">1/2</text>
    <text x="685" y="345" font-size="14" fill="#455461">1</text>
    <text x="708" y="338" font-size="16" fill="#263238">step size σ</text>
    <text x="40" y="55" font-size="15" fill="#263238">φ(σ)</text>

    <line x1="84" y1="320" x2="96" y2="320" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="230" x2="96" y2="230" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="140" x2="96" y2="140" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="95" x2="96" y2="95" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="63" y="325" font-size="14" fill="#455461">0</text>
    <text x="57" y="235" font-size="14" fill="#455461">2</text>
    <text x="57" y="145" font-size="14" fill="#455461">4</text>
    <text x="57" y="100" font-size="14" fill="#455461">5</text>

    <line x1="90" y1="140" x2="690" y2="176" stroke="#78909c" stroke-width="2" stroke-dasharray="8 6"></line>
    <text x="505" y="165" font-size="14" fill="#546e7a">Armijo decrease bound</text>

    <path d="M90 140 C135 150 185 173 240 180.5 C290 188 340 210 390 212 C485 220 580 153 690 95" fill="none" stroke="#1565c0" stroke-width="3"></path>
    <circle cx="90" cy="140" r="5" fill="#1565c0"></circle>
    <circle cx="240" cy="180.5" r="6" fill="#2e7d32"></circle>
    <circle cx="390" cy="212" r="7" fill="#2e7d32"></circle>
    <circle cx="690" cy="95" r="7" fill="#c62828"></circle>

    <text x="104" y="130" font-size="14" fill="#12529d">φ(0)</text>
    <text x="185" y="169" font-size="14" fill="#246b29">accepted</text>
    <text x="400" y="231" font-size="14" fill="#246b29">largest accepted step</text>
    <text x="575" y="87" font-size="14" fill="#a21f1f">σ=1: rejected</text>

    <circle cx="490" cy="275" r="6" fill="#2e7d32"></circle>
    <text x="505" y="280" font-size="13" fill="#455461">Armijo condition satisfied</text>
    <circle cx="490" cy="300" r="6" fill="#c62828"></circle>
    <text x="505" y="305" font-size="13" fill="#455461">Full Newton step rejected</text>
  </svg>
  <p class="newton-figure__note">The globalization strategy backtracks over the discrete candidate step sizes $1,1/2,1/4,\ldots$ and chooses the largest one satisfying the Armijo condition. In the figure, the full step $\sigma=1$ increases the squared residual, so $\sigma=1/2$ is used instead.</p>
</figure>

Expanding at $\sigma=0$ gives

$$
\phi(\sigma)
=\phi(0)+\phi'(0)\sigma+o(\sigma)
=
\|F(x^{(k)})\|_2^2
+2\sigma F(x^{(k)})^T F'(x^{(k)})s^{(k)}
+o(\sigma).
$$

Substituting the Newton equation

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)})
$$

into this expression yields

$$
\|F(x^{(k)}+\sigma s^{(k)})\|_2^2
=
\|F(x^{(k)})\|_2^2
-2\sigma\|F(x^{(k)})\|_2^2
+o(\sigma).
$$

Fix $\delta\in(0,1)$. If $F(x^{(k)})\ne 0$ and $\sigma$ is sufficiently small, then

$$
\|F(x^{(k)}+\sigma s^{(k)})\|_2^2
\le
\|F(x^{(k)})\|_2^2
-2\delta\sigma\|F(x^{(k)})\|_2^2.
$$

This motivates the following Armijo step-size rule.

**Armijo step-size selection.** Choose

$$
\delta\in(0,\tfrac12)
$$

(for example, $\delta=10^{-3}$ usually works well). From the set

$$
\sigma_k\in\left\{1,\frac12,\frac14,\ldots\right\}
$$

select the largest step size satisfying

$$
\|F(x^{(k)}+\sigma_k s^{(k)})\|_2^2
\le
\|F(x^{(k)})\|_2^2
-2\delta\sigma_k\|F(x^{(k)})\|_2^2.
\tag{5.4}
$$

This gives the following algorithm.

**Algorithm 5.2.5: Globalized Newton method for systems of equations**

Choose an initial point $x^{(0)}\in\mathbb{R}^n$.

For $k=0,1,\ldots$:

1. If $F(x^{(k)})=0$, stop and return $x^{(k)}$.
2. Solve the Newton equation for the Newton step $s^{(k)}\in\mathbb{R}^n$:

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)}).
$$

3. Determine $\sigma_k$ using the Armijo rule (5.4).
4. Set

$$
x^{(k+1)}=x^{(k)}+\sigma_k s^{(k)}.
$$

The following theorem guarantees the corresponding convergence.

**Theorem 5.2.6.** Let $F:\mathbb{R}^n\to\mathbb{R}^n$ be continuously differentiable, and choose any initial point $x^{(0)}\in\mathbb{R}^n$. Define

$$
f(x)=\|F(x)\|_2^2,
$$

and the level set

$$
N_f(x^{(0)})
:=
\{\,y:f(y)\le f(x^{(0)})\,\}.
$$

If the Jacobian matrix $F'(x)$ is invertible at every point $x$ in this level set, and $N_f(x^{(0)})$ is compact (equivalently, bounded and closed in $\mathbb{R}^n$), then starting from $x^{(0)}$ and running Algorithm 5.2.5 either terminates in finitely many steps or generates a sequence

$$
(x^{(k)})\subset N_f(x^{(0)}),
$$

such that:

i) $(x^{(k)})$ converges to a solution $\overline x$ of (5.1).

ii) There exists $l\ge 0$ such that $\sigma_k=1$ for every $k\ge l$. Thus, the algorithm eventually becomes the local method that takes a full Newton step at every iteration, and converges to $\overline x$ at a superlinear or quadratic rate.

---

Return to [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part II]({{ '/en/linear-systems-cholesky-conditioning/' | relative_url }}).

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.

