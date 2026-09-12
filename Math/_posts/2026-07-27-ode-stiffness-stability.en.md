---
title: "Numerical Analysis Lecture (III): Initial Value Problems and Stiffness Part II"
lang: "en"
date: 2026-07-27
permalink: /en/ode-stiffness-stability/
zh_link: /zh/ode-stiffness-stability/
categories:
  - Math
tags:
  - Numerical Methods
  - Ordinary Differential Equations
  - Stability
toc: true
---

<style>
body {
  font-size: 14px;
}

.ode-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.ode-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.ode-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.ode-figure__note {
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

It is best to read [Numerical Analysis Lecture (III): Initial Value Problems and Stiffness Part I]({{ '/en/ode-initial-value-stability/' | relative_url }}) first. This second part continues with stiffness, stability regions, A-stability, and L-stability for ordinary differential equation (ODE) initial value problems (IVPs).

---

## 3.2 Stiff Differential Equations

Stiff systems occur in many applications, for instance in chemical reaction models and in semi-discretizations of partial differential equations. They are still initial value problems, but many numerical methods are forced to use an unacceptably small step size $h$ in order to compute a reliable approximation.

Start from an $n$-dimensional initial value problem. We write IVP$_n$ for an $n$-dimensional initial value problem:

$$
\text{(IVP}_n\text{)}\qquad
y'(t)=f(t,y(t)),\qquad t\in[a,b],
$$

$$
y(a)=y_0,
$$

where

$$
f:[a,b]\times\mathbb{R}^n\to\mathbb{R}^n,
\qquad
y_0\in\mathbb{R}^n.
$$

There is no single universally accepted definition of stiffness. Intuitively, a stiff problem contains two time scales at once: one component changes slowly, while another component decays very quickly.

For the linear case we write LIVP$_n$ for a linear initial value problem:

$$
\text{(LIVP}_n\text{)}\qquad
y'(t)=Ay(t)+c,\qquad t\in[a,b],
$$

$$
y(a)=y_0,
$$

where $A\in\mathbb{R}^{n\times n}$ and $c\in\mathbb{R}^n$.

Assume that $A$ is diagonalizable and has eigenvalues $\lambda_i$ with corresponding eigenvectors $v_i$. If $y_P$ is a particular solution, then the general solution has the form

$$
y(t)=y_H(t)+y_P(t),
\qquad
y_H(t)=\sum_{i=1}^{n}C_i e^{\lambda_i t}v_i.
$$

If

$$
\operatorname{Re}(\lambda_i)<0,\qquad i=1,\ldots,n,
$$

then

$$
\lim_{t\to\infty} y_H(t)\to 0,
$$

so all solutions approach $y_P$. Terms with $\operatorname{Re}(\lambda_i)\ll -1$ decay very quickly, while terms with $\operatorname{Re}(\lambda_i)\not\ll -1$ decay much more slowly. In words: if a system has eigenvalues whose real parts are far below $0$, and also eigenvalues whose real parts are close to $0$ but still negative, then fast and slow scales coexist. Such systems are called stiff systems; see Definition 3.2.2.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Property diagram: stiffness comes from simultaneous fast and slow scales</figcaption>
  <svg viewBox="0 0 760 340" role="img" aria-labelledby="ode-stiffness-en-title ode-stiffness-en-desc">
    <title id="ode-stiffness-en-title">Fast and slow decay modes in a stiff system</title>
    <desc id="ode-stiffness-en-desc">The diagram compares e^{-1000t}, which decays almost immediately, with e^{-t}, which decays slowly. Even after the fast mode has almost disappeared from the solution, it can still restrict the stable step size of an explicit method.</desc>
    <rect x="0" y="0" width="760" height="340" fill="#ffffff" />
    <line x1="82" y1="266" x2="690" y2="266" stroke="#334155" stroke-width="2" />
    <line x1="82" y1="55" x2="82" y2="266" stroke="#334155" stroke-width="2" />
    <text x="674" y="296" fill="#334155" font-size="16">t</text>
    <text x="34" y="65" fill="#334155" font-size="16">mode size</text>
    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="180" y1="266" x2="180" y2="62" />
      <line x1="300" y1="266" x2="300" y2="62" />
      <line x1="420" y1="266" x2="420" y2="62" />
      <line x1="540" y1="266" x2="540" y2="62" />
      <line x1="660" y1="266" x2="660" y2="62" />
    </g>
    <path d="M 98 70 C 145 88 190 122 245 150 C 335 198 460 232 660 252" fill="none" stroke="#1d6fb8" stroke-width="4" />
    <path d="M 98 70 C 112 142 132 224 185 258 C 250 268 460 267 660 266" fill="none" stroke="#c1121f" stroke-width="4" />
    <line x1="185" y1="58" x2="185" y2="276" stroke="#7c3aed" stroke-width="3" stroke-dasharray="8 7" />
    <text x="198" y="86" fill="#7c3aed" font-size="15">fast mode almost gone</text>
    <text x="416" y="214" fill="#1d6fb8" font-size="16">slow mode: e^{-t}</text>
    <text x="202" y="252" fill="#c1121f" font-size="16">fast mode: e^{-1000t}</text>
    <rect x="430" y="82" width="236" height="74" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <text x="448" y="108" fill="#334155" font-size="15">the solution now changes slowly</text>
    <text x="448" y="132" fill="#334155" font-size="15">but explicit stable steps stay small</text>
  </svg>
  <p class="ode-figure__note">In a stiff problem, the fast-decaying component quickly disappears from the visible solution. Its eigenvalue still has a real part far below $0$, however, and this can restrict the stable step size of explicit methods.</p>
</figure>

**Example 3.2.1:** Consider

$$
y'=Ay,
\qquad
y(0)=y_0:=
\begin{pmatrix}
C_1+C_2\\
C_1-C_2
\end{pmatrix},
$$

where $C_1,C_2\in\mathbb{R}$ and

$$
A=
\begin{pmatrix}
-\frac{1001}{2} & \frac{999}{2}\\
\frac{999}{2} & -\frac{1001}{2}
\end{pmatrix}.
$$

The matrix $A$ has eigenvalues

$$
\lambda_1=-1,\qquad \lambda_2=-1000
$$

with eigenvectors

$$
v_1=\begin{pmatrix}1\\1\end{pmatrix},
\qquad
v_2=\begin{pmatrix}1\\-1\end{pmatrix}.
$$

Hence the solution is

$$
y(t)=
C_1\begin{pmatrix}1\\1\end{pmatrix}e^{-t}
+C_2\begin{pmatrix}1\\-1\end{pmatrix}e^{-1000t}.
$$

The second term is practically irrelevant after a very short time. The first term dominates, and it also tends to $0$ as $t\to\infty$. For a suitable integration method, we would like the numerical values $u_j$ to satisfy

$$
\lim_{j\to\infty}u_j=0
$$

without forcing the step size to be extremely small.

For example, applying the explicit Euler method gives

$$
u_0=y_0
=C_1\begin{pmatrix}1\\1\end{pmatrix}
+C_2\begin{pmatrix}1\\-1\end{pmatrix}
$$

and then

$$
u_1=(I+hA)u_0
=C_1(1+h\lambda_1)\begin{pmatrix}1\\1\end{pmatrix}
+C_2(1+h\lambda_2)\begin{pmatrix}1\\-1\end{pmatrix}.
$$

Induction gives

$$
u_j
=C_1(1+h\lambda_1)^j\begin{pmatrix}1\\1\end{pmatrix}
+C_2(1+h\lambda_2)^j\begin{pmatrix}1\\-1\end{pmatrix}.
$$

If $C_2\ne0$, then we must choose

$$
|1+h\lambda_2|<1,
$$

that is,

$$
-h\lambda_2=1000h<2,
$$

to guarantee $\lim_{j\to\infty}u_j=0$. A good method should guarantee this, as far as possible, for all $h>0$.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Property diagram: explicit Euler is limited by the fastest mode</figcaption>
  <svg viewBox="0 0 860 380" role="img" aria-labelledby="ode-euler-step-en-title ode-euler-step-en-desc">
    <title id="ode-euler-step-en-title">The explicit Euler step-size restriction on the negative real axis</title>
    <desc id="ode-euler-step-en-desc">For explicit Euler, the stable interval on the negative real axis is from -2 to 0. With the same step size h, the slow mode lambda=-1 can stay inside the interval, while the fast mode lambda=-1000 can send q=lambda h outside the stable interval.</desc>
    <rect x="0" y="0" width="860" height="380" fill="#ffffff" />
    <line x1="100" y1="188" x2="635" y2="188" stroke="#334155" stroke-width="2" />
    <polygon points="635,188 622,181 622,195" fill="#334155" />
    <text x="610" y="222" fill="#334155" font-size="16">Re(q)</text>
    <rect x="180" y="148" width="360" height="80" rx="6" fill="#dbeafe" stroke="#1d6fb8" stroke-width="2" />
    <text x="282" y="138" fill="#1d6fb8" font-size="16">stable interval S: -2 <= q <= 0</text>
    <g stroke="#334155" stroke-width="2">
      <line x1="180" y1="176" x2="180" y2="200" />
      <line x1="360" y1="176" x2="360" y2="200" />
      <line x1="540" y1="176" x2="540" y2="200" />
    </g>
    <text x="168" y="246" fill="#64748b" font-size="15">-2</text>
    <text x="350" y="246" fill="#64748b" font-size="15">-1</text>
    <text x="536" y="246" fill="#64748b" font-size="15">0</text>
    <circle cx="538" cy="188" r="8" fill="#2a9d55" />
    <text x="418" y="120" fill="#2a9d55" font-size="15">slow mode q=-h≈0</text>
    <line x1="538" y1="181" x2="482" y2="124" stroke="#2a9d55" stroke-width="2" />
    <circle cx="74" cy="188" r="8" fill="#c1121f" />
    <text x="58" y="118" fill="#c1121f" font-size="15">fast mode q=-1000h</text>
    <text x="42" y="141" fill="#c1121f" font-size="15">past -2</text>
    <line x1="82" y1="181" x2="118" y2="146" stroke="#c1121f" stroke-width="2" />
    <path d="M 540 274 C 465 256 270 256 180 274" fill="none" stroke="#7c3aed" stroke-width="3" stroke-dasharray="8 7" />
    <text x="230" y="304" fill="#7c3aed" font-size="15">if λ=-1000, then h&lt;0.002 is needed</text>
    <rect x="650" y="86" width="170" height="184" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <text x="668" y="116" fill="#334155" font-size="15">q = λh</text>
    <text x="668" y="148" fill="#334155" font-size="15">λ₁=-1:</text>
    <text x="668" y="171" fill="#2a9d55" font-size="15">q₁=-h, mild limit</text>
    <text x="668" y="207" fill="#334155" font-size="15">λ₂=-1000:</text>
    <text x="668" y="230" fill="#c1121f" font-size="15">q₂=-1000h</text>
    <text x="668" y="253" fill="#c1121f" font-size="15">strictest limit</text>
  </svg>
  <p class="ode-figure__note">For a multimode system, the step size must place every $q_i=\lambda_i h$ inside the stability region. The fastest decaying mode often determines the largest explicit step size.</p>
</figure>

Thus, even though the exact solution itself changes only slowly after the initial transient, Euler's method still needs a very small step size. Such differential equations are called stiff differential equations. The precise definition is not unique; the following definition is one common version.

**Definition 3.2.2:** If all eigenvalues of $A$ have non-positive real parts, and $A$ has both eigenvalues satisfying $\operatorname{Re}(\lambda_i)\ll -1$ and eigenvalues whose real parts are close to $0$ but still negative, then the initial value problem (LIVP$_n$) is called stiff.

We now turn to numerical methods for stiff differential equations.

To derive a simple model problem, first consider the case $c=0$ in (LIVP$_n$):

$$
y'=Ay,
\qquad
y(0)=y_0.
\tag{3.9}
$$

Assume that $A$ is diagonalizable. Then there is an $M\in\mathbb{R}^{n\times n}$ such that

$$
MAM^{-1}=\operatorname{diag}(\lambda_1,\ldots,\lambda_n),
$$

where $\lambda_1,\ldots,\lambda_n$ are the eigenvalues of $A$. Let $z=My$. Then

$$
z'=MAy=MAM^{-1}z
=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)z,
\qquad
z(0)=My_0.
$$

Thus the components $z_i$ of $z=My$ satisfy

$$
z_i'=\lambda_i z_i,
\qquad
z_i(0)=(My_0)_i.
\tag{3.10}
$$

For stiff differential equations we also have $\operatorname{Re}(\lambda_i)\le0$, with some eigenvalues whose real parts are far below $0$ and others whose real parts are close to $0$ but still negative.

**Observation**

If a numerical method behaves well for all scalar differential equations of the form (3.10), then it is usually suitable for the original system as well.

This leads to the model problem

$$
y'=\lambda y,
\qquad
\lambda\in\mathbb{C},\quad \operatorname{Re}(\lambda)<0,
\qquad
y(0)=1.
\tag{3.11}
$$

The exact solution is

$$
y(t)=e^{\lambda t},
$$

and it satisfies

$$
\lim_{t\to\infty}y(t)=0.
$$

Applying a numerical method with step size $h>0$ produces

$$
t_j=jh.
$$

We want the numerical sequence to satisfy

$$
\lim_{j\to\infty}u_j=0.
\tag{3.12}
$$

This leads to the following definition.

**Definition 3.2.3 (A-stability, absolute stability)**  
The term A-stability is also commonly called absolute stability.

If a method applied to the model problem (3.11) produces a sequence $\{u_j\}_{j\in\mathbb{N}_0}$ satisfying

$$
\lim_{j\to\infty}u_j=0
$$

for every $h>0$, then the method is called A-stable, or absolutely stable.

In general, when a numerical method is applied to the model problem (3.11), one obtains

$$
u_{j+1}=R(q)u_j,
\qquad
q:=\lambda h,
$$

where $R:D\to\mathbb{C}$ and $0\in D\subseteq\mathbb{C}$.

Read this as follows. Once a one-step method is applied to the test equation $y'=\lambda y$, the whole update often reduces to “multiply the old value by one complex number.” That number is $R(q)$, the amplification factor. It depends on the combined variable $q=\lambda h$, not on $\lambda$ and $h$ separately. In other words, the decay rate of the differential equation and the chosen step size jointly determine whether one numerical step damps the current value, preserves its size, or amplifies it.

The set $D$ is the part of the complex plane where $R$ is defined. Writing $0\in D\subseteq\mathbb{C}$ only says that $R$ is meaningful at least near $q=0$; it need not be defined for every complex $q$. For example, implicit Euler has $R(q)=1/(1-q)$, so $q=1$ is excluded. The implicit trapezoidal rule has $R(q)=(1+q/2)/(1-q/2)$, so $q=2$ is excluded. Stability regions are discussed only where the corresponding $R$ is defined.

With this notation, the stability test is immediate:

$$
u_j=R(q)^j u_0.
$$

If $|R(q)|\le1$, one step does not enlarge the current value. If $|R(q)|<1$, repeated steps damp this mode. If $|R(q)|>1$, the numerical solution can grow even when the exact solution should decay. The stability region $S$ is therefore the set of all values $q=\lambda h$ for which $|R(q)|\le1$.

**Example 3.2.4:** Applying the explicit Euler method to (3.11) gives

$$
u_{j+1}=u_j+h\lambda u_j=(1+q)u_j.
$$

Thus

$$
R(q)=1+q,
$$

and condition (3.12) becomes

$$
|1+q|<1.
$$

This is exactly the open disk centered at $-1$ with radius $1$ in the complex plane.

The interval $[-2,0]$ on the negative real axis is contained in the stability region. For the explicit Euler method, stability on the negative real axis therefore requires

$$
\lambda h\in[-2,0],
$$

or equivalently

$$
h\le \frac{2}{|\lambda|}.
$$

For a stiff problem this can force $h$ to be very small.

**Theorem 3.2.5:** Let a numerical method be applied to (3.11), and let $R$ be its stability function. Then the method is A-stable if and only if

$$
S:=\{q\in\mathbb{C}: |R(q)|<1\}
$$

satisfies

$$
S\supset\{q\in\mathbb{C}:\operatorname{Re}(q)<0\}.
$$

**Definition 3.2.6 (L-stability)**  
L-stability is the conventional name used in the numerical ODE literature. Unlike the A in A-stability, the L is usually kept as part of the name rather than expanded into one universally used phrase. The condition to remember is that L-stability is stronger than A-stability: the stability function must also tend to $0$ far along the negative real axis. In other words, for large negative values of $q=\lambda h$, the method should not merely avoid amplification; it should strongly damp the rapidly decaying mode.

$$
\lim_{\operatorname{Re}(q)\to -\infty}R(q)=0.
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Property diagram: the difference between A-stability and L-stability</figcaption>
  <svg viewBox="0 0 860 390" role="img" aria-labelledby="ode-l-stability-en-title ode-l-stability-en-desc">
    <title id="ode-l-stability-en-title">A-stability and L-stability far along the negative real axis</title>
    <desc id="ode-l-stability-en-desc">The horizontal axis is s=-q, so moving right corresponds to moving farther along the negative real axis. For implicit Euler, |R(-s)| tends to 0. For the trapezoidal rule, |R(-s)| tends to 1, so it is A-stable but not L-stable.</desc>
    <rect x="0" y="0" width="860" height="390" fill="#ffffff" />
    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="88" y1="280" x2="650" y2="280" />
      <line x1="88" y1="225" x2="650" y2="225" />
      <line x1="88" y1="170" x2="650" y2="170" />
      <line x1="88" y1="115" x2="650" y2="115" />
      <line x1="88" y1="60" x2="650" y2="60" />
    </g>
    <line x1="82" y1="280" x2="670" y2="280" stroke="#334155" stroke-width="2" />
    <line x1="88" y1="290" x2="88" y2="50" stroke="#334155" stroke-width="2" />
    <polygon points="670,280 657,273 657,287" fill="#334155" />
    <polygon points="88,50 81,63 95,63" fill="#334155" />
    <text x="646" y="313" fill="#334155" font-size="16">s=-q</text>
    <text x="30" y="62" fill="#334155" font-size="16">|R(-s)|</text>
    <text x="62" y="285" fill="#64748b" font-size="14">0</text>
    <text x="55" y="65" fill="#64748b" font-size="14">1</text>
    <line x1="88" y1="60" x2="650" y2="60" stroke="#64748b" stroke-width="2" stroke-dasharray="8 7" />
    <path d="M 88 60 C 130 116 166 180 202 207 C 300 242 455 255 650 260" fill="none" stroke="#1d6fb8" stroke-width="4" />
    <path d="M 88 60 C 122 130 160 234 202 280 C 292 196 438 150 650 133" fill="none" stroke="#c1121f" stroke-width="4" />
    <g fill="#64748b" font-size="14">
      <text x="82" y="307">0</text>
      <text x="192" y="307">2</text>
      <text x="359" y="307">5</text>
      <text x="636" y="307">10</text>
    </g>
    <rect x="690" y="86" width="134" height="112" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <line x1="704" y1="116" x2="746" y2="116" stroke="#1d6fb8" stroke-width="4" />
    <text x="756" y="121" fill="#334155" font-size="14">implicit Euler</text>
    <line x1="704" y1="154" x2="746" y2="154" stroke="#c1121f" stroke-width="4" />
    <text x="756" y="159" fill="#334155" font-size="14">trapezoidal</text>
    <text x="704" y="186" fill="#64748b" font-size="13">dashed line: 1</text>
    <text x="222" y="246" fill="#1d6fb8" font-size="15">goes to 0: strong damping</text>
    <text x="440" y="114" fill="#c1121f" font-size="15">goes to 1: no strong damping</text>
  </svg>
  <p class="ode-figure__note">A-stability prevents growth throughout the left half-plane. L-stability additionally damps very fast modes close to zero in the numerical solution.</p>
</figure>

### 3.2.1 Stability Regions of Some Methods

**Explicit Euler method**

Applying explicit Euler to the model problem (3.11) gives

$$
u_{j+1}=u_j+h\lambda u_j=(1+q)u_j.
$$

Thus the stability function is

$$
R(q)=1+q.
$$

The stability region is

$$
S=\{q\in\mathbb{C}: |1+q|<1\}.
$$

Therefore explicit Euler is not A-stable, for example at $q=-1+2i$.

**Remark 3.2.7:** In fact, one can prove that no explicit Runge-Kutta method is A-stable.

**Implicit Euler method**

Implicit Euler gives

$$
u_{j+1}=u_j+h\lambda u_{j+1},
$$

and therefore

$$
u_{j+1}=\frac{1}{1-q}u_j.
$$

Thus

$$
R(q)=\frac{1}{1-q}.
$$

The stability region is

$$
S=\{q\in\mathbb{C}: |1-q|>1\}.
$$

It contains the entire left half-plane. Also,

$$
\lim_{\operatorname{Re}(q)\to -\infty}\frac{1}{1-q}=0.
$$

Thus implicit Euler is A-stable and even L-stable.

**Implicit trapezoidal rule**

The implicit trapezoidal rule gives

$$
u_{j+1}
=u_j+\frac{h}{2}\left(\lambda u_j+\lambda u_{j+1}\right),
$$

so

$$
u_{j+1}
=
\frac{1+\frac{q}{2}}{1-\frac{q}{2}}u_j.
$$

The stability function is

$$
R(q)=\frac{1+\frac{q}{2}}{1-\frac{q}{2}}.
$$

The stability region contains the left half-plane, so the method is A-stable. However,

$$
\lim_{\operatorname{Re}(q)\to -\infty}
\frac{1+\frac{q}{2}}{1-\frac{q}{2}}
=-1,
$$

so it is not L-stable.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Stability-region diagram: three stability regions for the model equation $y'=\lambda y$</figcaption>
  <svg viewBox="0 0 920 430" role="img" aria-labelledby="ode-stab-en-title ode-stab-en-desc">
    <title id="ode-stab-en-title">Stability regions of explicit Euler, implicit Euler, and the implicit trapezoidal rule</title>
    <desc id="ode-stab-en-desc">In the complex plane, the explicit Euler stability region is the disk centered at -1 with radius 1. The implicit Euler stability region is the exterior of the disk centered at 1 with radius 1. The implicit trapezoidal rule has the left half-plane as its stability region.</desc>
    <rect x="0" y="0" width="920" height="430" fill="#ffffff" />
    <g transform="translate(55,54)">
      <rect x="0" y="0" width="240" height="250" fill="#ffffff" stroke="#d7dee2" />
      <circle cx="90" cy="125" r="46" fill="#c1121f" fill-opacity="0.18" stroke="#c1121f" stroke-width="3" />
      <line x1="26" y1="125" x2="224" y2="125" stroke="#334155" stroke-width="2" />
      <line x1="136" y1="33" x2="136" y2="220" stroke="#334155" stroke-width="2" />
      <polygon points="224,125 213,119 213,131" fill="#334155" />
      <polygon points="136,33 130,44 142,44" fill="#334155" />
      <text x="174" y="114" fill="#334155" font-size="13">Re(q)</text>
      <text x="144" y="47" fill="#334155" font-size="13">Im(q)</text>
      <g stroke="#334155" stroke-width="2">
        <line x1="44" y1="119" x2="44" y2="131" />
        <line x1="90" y1="119" x2="90" y2="131" />
        <line x1="136" y1="119" x2="136" y2="131" />
        <line x1="130" y1="79" x2="142" y2="79" />
        <line x1="130" y1="171" x2="142" y2="171" />
      </g>
      <text x="34" y="148" fill="#64748b" font-size="13">-2</text>
      <text x="82" y="148" fill="#64748b" font-size="13">-1</text>
      <text x="132" y="148" fill="#64748b" font-size="13">0</text>
      <text x="147" y="84" fill="#64748b" font-size="13">i</text>
      <text x="147" y="176" fill="#64748b" font-size="13">-i</text>
      <text x="34" y="266" fill="#334155" font-size="17">explicit Euler</text>
      <text x="34" y="291" fill="#64748b" font-size="14">|1+q| <= 1</text>
    </g>
    <g transform="translate(340,54)">
      <rect x="0" y="0" width="240" height="250" fill="#ffffff" stroke="#d7dee2" />
      <rect x="0" y="0" width="240" height="250" fill="#dbeafe" fill-opacity="0.72" />
      <circle cx="182" cy="125" r="46" fill="#ffffff" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
      <line x1="26" y1="125" x2="224" y2="125" stroke="#334155" stroke-width="2" />
      <line x1="136" y1="33" x2="136" y2="220" stroke="#334155" stroke-width="2" />
      <polygon points="224,125 213,119 213,131" fill="#334155" />
      <polygon points="136,33 130,44 142,44" fill="#334155" />
      <text x="174" y="114" fill="#334155" font-size="13">Re(q)</text>
      <text x="144" y="47" fill="#334155" font-size="13">Im(q)</text>
      <g stroke="#334155" stroke-width="2">
        <line x1="90" y1="119" x2="90" y2="131" />
        <line x1="136" y1="119" x2="136" y2="131" />
        <line x1="182" y1="119" x2="182" y2="131" />
        <line x1="130" y1="79" x2="142" y2="79" />
        <line x1="130" y1="171" x2="142" y2="171" />
      </g>
      <text x="82" y="148" fill="#64748b" font-size="13">-1</text>
      <text x="132" y="148" fill="#64748b" font-size="13">0</text>
      <text x="178" y="148" fill="#64748b" font-size="13">1</text>
      <text x="147" y="84" fill="#64748b" font-size="13">i</text>
      <text x="147" y="176" fill="#64748b" font-size="13">-i</text>
      <text x="18" y="42" fill="#1d6fb8" font-size="13">stable: |1-q| >= 1</text>
      <text x="143" y="76" fill="#c1121f" font-size="13">unstable disk</text>
      <text x="34" y="266" fill="#334155" font-size="17">implicit Euler</text>
      <text x="16" y="291" fill="#64748b" font-size="14">outside the disk |1-q| &lt; 1</text>
    </g>
    <g transform="translate(625,54)">
      <rect x="0" y="0" width="240" height="250" fill="#ffffff" stroke="#d7dee2" />
      <rect x="0" y="0" width="136" height="250" fill="#dcfce7" fill-opacity="0.78" />
      <line x1="26" y1="125" x2="224" y2="125" stroke="#334155" stroke-width="2" />
      <line x1="136" y1="33" x2="136" y2="220" stroke="#334155" stroke-width="3" />
      <polygon points="224,125 213,119 213,131" fill="#334155" />
      <polygon points="136,33 130,44 142,44" fill="#334155" />
      <text x="174" y="114" fill="#334155" font-size="13">Re(q)</text>
      <text x="144" y="47" fill="#334155" font-size="13">Im(q)</text>
      <g stroke="#334155" stroke-width="2">
        <line x1="44" y1="119" x2="44" y2="131" />
        <line x1="90" y1="119" x2="90" y2="131" />
        <line x1="136" y1="119" x2="136" y2="131" />
        <line x1="130" y1="79" x2="142" y2="79" />
        <line x1="130" y1="171" x2="142" y2="171" />
      </g>
      <text x="34" y="148" fill="#64748b" font-size="13">-2</text>
      <text x="82" y="148" fill="#64748b" font-size="13">-1</text>
      <text x="132" y="148" fill="#64748b" font-size="13">0</text>
      <text x="147" y="84" fill="#64748b" font-size="13">i</text>
      <text x="147" y="176" fill="#64748b" font-size="13">-i</text>
      <text x="28" y="42" fill="#2a9d55" font-size="13">stable: Re(q) <= 0</text>
      <text x="22" y="266" fill="#334155" font-size="17">trapezoidal rule</text>
      <text x="18" y="291" fill="#64748b" font-size="14">left half-plane, boundary included</text>
    </g>
    <text x="312" y="381" fill="#334155" font-size="18">The location of q = λh determines whether the numerical step decays.</text>
  </svg>
  <p class="ode-figure__note">Each panel is drawn in the complex plane for $q=\lambda h$: the horizontal axis is $\operatorname{Re}(q)$ and the vertical axis is $\operatorname{Im}(q)$. The implicit Euler stability region is not just the left half-plane; it is the exterior of the disk $|1-q|<1$. The trapezoidal rule has the left half-plane $\operatorname{Re}(q)\le0$ as its stability region.</p>
</figure>

**Implicit Runge-Kutta methods**

Implicit Runge-Kutta methods are especially useful for stiff differential equations. If the matrix of Butcher coefficients $\alpha_{ij}$ is not strictly lower triangular, then the method is implicit. Its stage equations are

$$
k_i
=
f\left(
t+\gamma_i h,\,
u+h\sum_{j=1}^{r}\alpha_{ij}k_j
\right),
\qquad i=1,\ldots,r.
$$

The step is then

$$
u_{j+1}=u_j+h\sum_{i=1}^{r}\beta_i k_i.
$$

These equations usually have to be solved as a nonlinear system at each step. In return, one can choose the coefficients so that the method is L-stable and has order $p=2r$.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: implicit Runge-Kutta stages are solved together</figcaption>
  <svg viewBox="0 0 860 420" role="img" aria-labelledby="ode-irk-en-title ode-irk-en-desc">
    <title id="ode-irk-en-title">Coupled stage variables in an implicit Runge-Kutta method</title>
    <desc id="ode-irk-en-desc">The three stage variables k1, k2, and k3 are coupled. Nonzero entries of the alpha matrix may appear on the diagonal and above it, so the stages cannot be computed one by one in explicit order. A system must be solved at each step.</desc>
    <rect x="0" y="0" width="860" height="420" fill="#ffffff" />
    <rect x="46" y="62" width="278" height="260" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <text x="74" y="96" fill="#334155" font-size="17">stage variables are coupled</text>
    <circle cx="126" cy="178" r="42" fill="#dbeafe" stroke="#1d6fb8" stroke-width="3" />
    <circle cx="246" cy="136" r="42" fill="#dcfce7" stroke="#2a9d55" stroke-width="3" />
    <circle cx="246" cy="244" r="42" fill="#fee2e2" stroke="#c1121f" stroke-width="3" />
    <text x="111" y="184" fill="#334155" font-size="18">k₁</text>
    <text x="231" y="142" fill="#334155" font-size="18">k₂</text>
    <text x="231" y="250" fill="#334155" font-size="18">k₃</text>
    <path d="M 166 165 C 188 148 204 141 206 140" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-en-arrow)" />
    <path d="M 208 163 C 181 183 166 193 165 194" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-en-arrow)" />
    <path d="M 246 178 L 246 202" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-en-arrow)" />
    <path d="M 213 226 C 178 212 156 199 154 198" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-en-arrow)" />
    <defs>
      <marker id="ode-irk-en-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 Z" fill="#334155" />
      </marker>
    </defs>
    <rect x="368" y="62" width="220" height="260" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <text x="404" y="96" fill="#334155" font-size="17">alpha matrix</text>
    <g stroke="#d7dee2" stroke-width="2">
      <rect x="420" y="124" width="120" height="120" fill="#ffffff" />
      <line x1="460" y1="124" x2="460" y2="244" />
      <line x1="500" y1="124" x2="500" y2="244" />
      <line x1="420" y1="164" x2="540" y2="164" />
      <line x1="420" y1="204" x2="540" y2="204" />
    </g>
    <rect x="420" y="124" width="40" height="40" fill="#dbeafe" opacity="0.9" />
    <rect x="460" y="124" width="40" height="40" fill="#dcfce7" opacity="0.9" />
    <rect x="500" y="124" width="40" height="40" fill="#fee2e2" opacity="0.9" />
    <rect x="460" y="164" width="40" height="40" fill="#dcfce7" opacity="0.9" />
    <rect x="500" y="164" width="40" height="40" fill="#fee2e2" opacity="0.9" />
    <rect x="500" y="204" width="40" height="40" fill="#fee2e2" opacity="0.9" />
    <text x="429" y="149" fill="#334155" font-size="14">α₁₁</text>
    <text x="469" y="149" fill="#334155" font-size="14">α₁₂</text>
    <text x="509" y="149" fill="#334155" font-size="14">α₁₃</text>
    <text x="469" y="189" fill="#334155" font-size="14">α₂₂</text>
    <text x="509" y="189" fill="#334155" font-size="14">α₂₃</text>
    <text x="509" y="229" fill="#334155" font-size="14">α₃₃</text>
    <text x="394" y="278" fill="#64748b" font-size="14">not strictly lower triangular: simultaneous coupling</text>
    <rect x="628" y="94" width="190" height="196" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <text x="650" y="126" fill="#334155" font-size="16">solve each step</text>
    <text x="650" y="158" fill="#334155" font-size="15">(I-qA)k = λuⱼ1</text>
    <text x="650" y="190" fill="#334155" font-size="15">then compute</text>
    <text x="650" y="222" fill="#334155" font-size="15">uⱼ₊₁ = uⱼ + hβᵀk</text>
    <text x="650" y="258" fill="#64748b" font-size="14">more work, stronger stability</text>
  </svg>
  <p class="ode-figure__note">Explicit Runge-Kutta stages can be computed in order. In an implicit Runge-Kutta method, the $k_i$ usually depend on one another, so the full set of stages is solved first.</p>
</figure>

Let

$$
A=(\alpha_{ij})_{i,j=1}^{r},\qquad
\beta=(\beta_1,\ldots,\beta_r)^T,
\qquad
\mathbf{1}=(1,\ldots,1)^T.
$$

For the model equation (3.11), the stage equations can be written as

$$
k=\lambda u_j\mathbf{1}+qAk,
$$

or

$$
(I-qA)k=\lambda u_j\mathbf{1}.
$$

Thus

$$
k=\lambda u_j(I-qA)^{-1}\mathbf{1}.
$$

The next value is

$$
u_{j+1}
=
u_j+h\beta^T k
=
\left(1+q\beta^T(I-qA)^{-1}\mathbf{1}\right)u_j.
$$

Hence

$$
R(q)
=1+q\,\beta^T(I-qA)^{-1}\mathbf{1}
=
\frac{\det(I-qA+q\mathbf{1}\beta^T)}
{\det(I-qA)}.
$$

Therefore $R(q)$ is a rational function.

---

Return to [Numerical Analysis Lecture (III): Initial Value Problems and Stiffness Part I]({{ '/en/ode-initial-value-stability/' | relative_url }}).

**References**

- [1] P. Deuflhard and F. Bornemann. *Numerische Mathematik II*. de Gruyter, Berlin, 2002. 3.1.5.
- [2] P. Deuflhard and F. Hohmann. *Numerische Mathematik I*. de Gruyter, Berlin, 2008. 1.2.3.
- [3] H. Heuser. *Gewöhnliche Differentialgleichungen*. Teubner, Stuttgart, 1989. 3.1.
- [4] R. Plato. *Numerische Mathematik kompakt*. Vieweg Verlag, Braunschweig, 2000. 1.2.3, 6.3.2.
- [5] J. Stoer. *Numerische Mathematik 1*. Springer Verlag, Berlin, 1994. 1.2.3, 4.4.2.
- [6] W. Törnig and P. Spellucci. *Numerische Mathematik für Ingenieure und Physiker 2*. Springer Verlag, Berlin, 1990. 1.2.3.
- [7] W. Walter. *Gewöhnliche Differentialgleichungen*. Springer, Berlin, 1986. 3.1.
- [8] J. Werner. *Numerische Mathematik 2*. Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**Abbreviations and Terms**

- ODE: ordinary differential equation.
- IVP: initial value problem.
- LIVP: linear initial value problem.
- RK4: fourth-order Runge-Kutta method.
- A-stability: A-stability, also called absolute stability.
- L-stability: L-stability; in addition to A-stability, the stability function tends to $0$ far along the negative real axis.

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.
