---
title: "Numerical Analysis Lecture (III): Initial Value Problems and Stiffness Part I"
lang: "en"
date: 2026-07-27
permalink: /en/ode-initial-value-stability/
zh_link: /zh/ode-initial-value-stability/
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

It is best to read [Numerical Analysis Lecture (II): Numerical Integration]({{ '/en/numerical-integration-lab/' | relative_url }}) first. This Part I covers ordinary differential equation (ODE) initial value problems, basic one-step methods, consistency, stability, and convergence. 

Stiff differential equations and stability regions are continued in [Part II]({{ '/en/ode-stiffness-stability/' | relative_url }}).

---

## 3.1 Introduction

Many models in science, engineering, and economics lead to initial value problems for ordinary differential equations.

**Initial value problem**

Given a function

$$
f:[a,b]\times\mathbb{R}^n\to\mathbb{R}^n
$$

and an initial value $y_0\in\mathbb{R}^n$, find a function

$$
y:[a,b]\to\mathbb{R}^n
$$

whose derivative $y'$ satisfies the ordinary differential equation

$$
y'(t)=f(t,y(t)),\qquad t\in[a,b],
$$

and the initial condition $y(a)=y_0$. We use the English abbreviation IVP (initial value problem) and write

$$
\text{(IVP)}\qquad
y'(t)=f(t,y(t)),\qquad t\in[a,b],
\tag{3.1}
$$

$$
y(a)=y_0.
\tag{3.2}
$$

In many applications, $t$ represents time, so the name "initial value problem" is natural.

**Applications**

Equations of motion, reaction kinetics, circuit simulation, and many other models.

The following theorem gives a basic existence and uniqueness result for (IVP).

**Theorem 3.1.1 (existence and uniqueness)**  
Let $f:[a,b]\times\mathbb{R}^n\to\mathbb{R}^n$ be continuous. Suppose there is a constant $L>0$ such that

$$
\|f(t,y)-f(t,z)\|\le L\|y-z\|
$$

for all $t\in[a,b]$ and all $y,z\in\mathbb{R}^n$ (the Lipschitz condition). Then:

a) By the **Picard-Lindelof theorem**, for each $y_0\in\mathbb{R}^n$, the (IVP) has a unique solution

$$
y\in C^1([a,b];\mathbb{R}^n).
$$

b) If $y,z$ are solutions with initial values $y(a)=y_0$ and $z(a)=z_0$, then

$$
\|y(t)-z(t)\|
\le
e^{L(t-a)}\|y_0-z_0\|,
\qquad \forall t\in[a,b].
\tag{3.3}
$$

For proofs, see Heuser [3] or Walter [7]. Part b) is a consequence of Gronwall's lemma.

**Remark:** Part b) says that the solution depends continuously on the initial value $y_0$.

### 3.1.1 Basic Concepts of Numerical Methods

To solve (IVP) numerically, divide $[a,b]$ into subintervals:

$$
t_j=a+jh,\qquad j=0,1,\ldots,N,\qquad h=\frac{b-a}{N}.
$$

Integrating (IVP) and writing

$$
y_j=y(t_j),\qquad j=0,\ldots,N,
$$

gives

$$
y_{j+1}
=y_j+\int_{t_j}^{t_{j+1}}y'(t)\,dt
=y_j+\int_{t_j}^{t_{j+1}}f(t,y(t))\,dt.
\tag{3.4}
$$

The integral on the right cannot be evaluated exactly because $y(t)$ is unknown. We therefore approximate it by a quadrature rule and compute approximations

$$
u_j\approx y(t_j),\qquad j=1,\ldots,N,\qquad u_0=y_0.
$$

The error

$$
e_j=y(t_j)-u_j
$$

is called the discretization error.

### 3.1.2 Some Important Methods

**Explicit Euler method**

Using the left endpoint rectangle rule in (3.4),

$$
\int_{t_j}^{t_{j+1}}f(t,y(t))\,dt
\approx
h f(t_j,y_j),
$$

gives the explicit Euler method:

$$
u_0:=y_0,
$$

$$
u_{j+1}:=u_j+h f(t_j,u_j),
\qquad j=0,\ldots,N-1.
\tag{3.5}
$$

Equivalently, the difference quotient

$$
\frac{y(t_{j+1})-y(t_j)}{h}
$$

is used as an approximation to $y'(t)$ and therefore to $f(t_j,y_j)$.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: explicit Euler uses only the left endpoint slope</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-explicit-euler-en-title ode-explicit-euler-en-desc">
    <title id="ode-explicit-euler-en-title">One-step geometry of the explicit Euler method</title>
    <desc id="ode-explicit-euler-en-desc">The diagram shows the exact curve, the tangent at the left endpoint, and one explicit Euler step from u_j to u_{j+1}.</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="264" fill="#64748b" font-size="14">t_j</text>
    <text x="404" y="264" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 150 176 C 250 154 330 115 430 100 C 520 88 590 70 635 50" fill="none" stroke="#111827" stroke-width="4" />
    <line x1="150" y1="176" x2="430" y2="114" stroke="#c1121f" stroke-width="4" stroke-linecap="round" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="430" cy="114" r="7" fill="#c1121f" />
    <path d="M 150 176 L 430 114" fill="none" stroke="#c1121f" stroke-width="8" stroke-opacity="0.12" />
    <text x="184" y="152" fill="#c1121f" font-size="16">slope f(t_j,u_j)</text>
    <text x="438" y="118" fill="#c1121f" font-size="16">u_{j+1}</text>
    <text x="438" y="92" fill="#111827" font-size="16">exact solution</text>
  </svg>
  <p class="ode-figure__note">Explicit Euler is cheap, but it uses only one tangent at the left endpoint. For large step sizes, the error can accumulate quickly.</p>
</figure>

**Implicit Euler method**

Using the right endpoint as the rectangle support point gives the implicit Euler method:

$$
u_0:=y_0,
$$

$$
u_{j+1}:=u_j+h f(t_{j+1},u_{j+1}),
\qquad j=0,\ldots,N-1.
\tag{3.6}
$$

At every step, $u_{j+1}$ must first be determined from this equation.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: implicit Euler uses the right endpoint slope</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-implicit-euler-en-title ode-implicit-euler-en-desc">
    <title id="ode-implicit-euler-en-title">One-step geometry of the implicit Euler method</title>
    <desc id="ode-implicit-euler-en-desc">The diagram shows the unknown right endpoint slope and the implicit step equation.</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="264" fill="#64748b" font-size="14">t_j</text>
    <text x="404" y="264" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 525 88 590 72 635 54" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="184" r="7" fill="#111827" />
    <circle cx="430" cy="100" r="7" fill="#1d6fb8" />
    <line x1="150" y1="184" x2="430" y2="100" stroke="#1d6fb8" stroke-width="4" stroke-linecap="round" />
    <line x1="330" y1="130" x2="500" y2="79" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" />
    <text x="456" y="112" fill="#1d6fb8" font-size="16">unknown u_{j+1}</text>
    <text x="342" y="78" fill="#1d6fb8" font-size="16">right endpoint tangent</text>
  </svg>
  <p class="ode-figure__note">The slope is evaluated at the right endpoint, which usually improves stability. The price is that one often has to solve a nonlinear equation at each step.</p>
</figure>

The trapezoidal rule applied to (3.4) gives

$$
u_{j+1}
=u_j+\frac{h}{2}
\left(f(t_j,u_j)+f(t_{j+1},u_{j+1})\right).
$$

It is implicit because the right-hand side depends on $u_{j+1}$.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: the implicit trapezoidal rule averages endpoint slopes</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-trapezoid-en-title ode-trapezoid-en-desc">
    <title id="ode-trapezoid-en-title">One-step geometry of the implicit trapezoidal rule</title>
    <desc id="ode-trapezoid-en-desc">The diagram shows left and right endpoint tangents and their average direction.</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 520 88 590 70 635 50" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="430" cy="100" r="7" fill="#111827" />
    <line x1="108" y1="185" x2="250" y2="154" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="342" y1="126" x2="515" y2="75" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="150" y1="176" x2="430" y2="100" stroke="#2a9d55" stroke-width="4" />
    <text x="156" y="130" fill="#c1121f" font-size="15">left slope</text>
    <text x="444" y="80" fill="#1d6fb8" font-size="15">right slope</text>
    <text x="300" y="178" fill="#2a9d55" font-size="15">average</text>
  </svg>
  <p class="ode-figure__note">The trapezoidal rule averages the slopes at the two endpoints. It is more symmetric than a single Euler step, but it is still implicit.</p>
</figure>

**Heun method, the first second-order Runge-Kutta method**

Replacing the unknown right endpoint in the trapezoidal rule by an explicit Euler prediction gives Heun's method:

$$
u_0=y_0,
$$

$$
u_{j+1}
=u_j+\frac{h}{2}
\left(
f(t_j,u_j)
+f(t_{j+1},u_j+h f(t_j,u_j))
\right),
\qquad j=0,\ldots,N-1.
$$

Equivalently,

$$
u_{j+1}=u_j+\frac{h}{2}(k_1+k_2),
$$

where

$$
k_1=f(t_j,u_j),
\qquad
k_2=f(t_{j+1},u_j+hk_1).
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: Heun first predicts, then corrects with endpoint slopes</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-heun-en-title ode-heun-en-desc">
    <title id="ode-heun-en-title">Predictor-corrector geometry of Heun's method</title>
    <desc id="ode-heun-en-desc">The diagram shows k1 as the tangent at the exact starting point, k2 as a vector-field sample at the predicted endpoint, and the corrected average step.</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 525 88 590 70 635 52" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="430" cy="100" r="7" fill="#2a9d55" />
    <circle cx="430" cy="114" r="6" fill="#c1121f" />
    <line x1="150" y1="176" x2="430" y2="114" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="340" y1="141" x2="510" y2="90" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="150" y1="176" x2="430" y2="100" stroke="#2a9d55" stroke-width="4" />
    <text x="248" y="142" fill="#c1121f" font-size="15">prediction k1</text>
    <text x="462" y="104" fill="#1d6fb8" font-size="15">k2 at predicted point</text>
    <text x="450" y="126" fill="#2a9d55" font-size="15">average correction</text>
  </svg>
  <p class="ode-figure__note">The red line starts at the exact point and is drawn as the starting tangent. The blue line is a vector-field sample at the red predicted point; it is not a tangent to the black exact curve.</p>
</figure>

**Improved Euler method (second-order Runge-Kutta method)**

Using a midpoint rectangle rule and an Euler half-step prediction gives

$$
u_{j+1}
=u_j+h f\left(t_j+\frac{h}{2},\,
u_j+\frac{h}{2}f(t_j,u_j)\right),
\qquad j=0,\ldots,N-1.
$$

Equivalently,

$$
u_{j+1}=u_j+hk_2,
$$

where

$$
k_1=f(t_j,u_j),
\qquad
k_2=f\left(t_j+\frac{h}{2},u_j+\frac{h}{2}k_1\right).
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: improved Euler uses a midpoint slope</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-midpoint-en-title ode-midpoint-en-desc">
    <title id="ode-midpoint-en-title">Midpoint slope geometry of the improved Euler method</title>
    <desc id="ode-midpoint-en-desc">The diagram shows a half-step Euler prediction followed by a vector-field sample at the predicted midpoint.</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="290" y1="238" x2="290" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="264" fill="#64748b" font-size="14">t_j</text>
    <text x="266" y="264" fill="#64748b" font-size="14">t_j+h/2</text>
    <text x="404" y="264" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 520 88 590 70 635 50" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="290" cy="145" r="7" fill="#c1121f" />
    <circle cx="430" cy="108" r="7" fill="#2a9d55" />
    <line x1="150" y1="176" x2="290" y2="145" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="150" y1="176" x2="430" y2="108" stroke="#2a9d55" stroke-width="4" />
    <text x="196" y="134" fill="#c1121f" font-size="15">half-step prediction</text>
    <text x="344" y="98" fill="#2a9d55" font-size="15">predicted midpoint slope</text>
  </svg>
  <p class="ode-figure__note">The green line represents the vector-field direction sampled at the predicted midpoint. It should not be read as a tangent to the black exact curve.</p>
</figure>

**Classical fourth-order Runge-Kutta method (RK4, fourth-order Runge-Kutta method)**

Applying Simpson's rule and replacing the midpoint and endpoint values by suitable Taylor expansions leads to the widely used classical fourth-order Runge-Kutta method, abbreviated below as RK4:

$$
u_{j+1}
=u_j+\frac{h}{6}(k_1+2k_2+2k_3+k_4),
\qquad j=0,\ldots,N-1,
$$

where

$$
k_1=f(t_j,u_j),
$$

$$
k_2=f\left(t_j+\frac{h}{2},u_j+\frac{h}{2}k_1\right),
$$

$$
k_3=f\left(t_j+\frac{h}{2},u_j+\frac{h}{2}k_2\right),
$$

$$
k_4=f(t_{j+1},u_j+hk_3).
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Method diagram: RK4 combines four sampled slopes</figcaption>
  <svg viewBox="0 0 720 320" role="img" aria-labelledby="ode-rk4-en-title ode-rk4-en-desc">
    <title id="ode-rk4-en-title">Four-stage slope diagram for classical RK4</title>
    <desc id="ode-rk4-en-desc">The diagram marks the vector-field sample positions k1, k2, k3, and k4, and shows that RK4 combines them with weights 1:2:2:1.</desc>
    <rect x="0" y="0" width="720" height="320" fill="#ffffff" />
    <line x1="70" y1="250" x2="650" y2="250" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="250" stroke="#334155" stroke-width="2" />
    <text x="636" y="278" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 524 88 590 72 635 52" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#c1121f" />
    <circle cx="290" cy="145" r="7" fill="#1d6fb8" />
    <circle cx="290" cy="132" r="7" fill="#2a9d55" />
    <circle cx="430" cy="104" r="7" fill="#7c3aed" />
    <line x1="150" y1="176" x2="245" y2="155" stroke="#c1121f" stroke-width="3" />
    <line x1="290" y1="145" x2="382" y2="118" stroke="#1d6fb8" stroke-width="3" />
    <line x1="290" y1="132" x2="382" y2="106" stroke="#2a9d55" stroke-width="3" />
    <line x1="430" y1="104" x2="530" y2="76" stroke="#7c3aed" stroke-width="3" />
    <text x="118" y="166" fill="#c1121f" font-size="15">k1</text>
    <text x="258" y="162" fill="#1d6fb8" font-size="15">k2</text>
    <text x="258" y="122" fill="#2a9d55" font-size="15">k3</text>
    <text x="436" y="96" fill="#7c3aed" font-size="15">k4</text>
    <rect x="458" y="178" width="176" height="58" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <text x="474" y="203" fill="#334155" font-size="15">weights: 1 : 2 : 2 : 1</text>
    <text x="474" y="226" fill="#334155" font-size="15">then multiply by h/6</text>
  </svg>
  <p class="ode-figure__note">RK4 gets its accuracy from several vector-field samples. $k_1$ starts from the tangent at the initial point; $k_2,k_3,k_4$ are sampled at predicted points.</p>
</figure>

**Example:** Consider a series circuit with inductance $L$, resistance $R$, and capacitance $C$. The current satisfies

$$
LC\,I''(t)+RC\,I'(t)+I(t)=0.
$$

To apply one-step methods, convert this second-order equation into a first-order system by setting

$$
y_1(t)=I(t),
\qquad
y_2(t)=I'(t).
$$

Then

$$
y'(t)
=
\begin{pmatrix}
y_1'(t)\\
y_2'(t)
\end{pmatrix}
=
\begin{pmatrix}
y_2(t)\\
-\frac{R}{L}y_2(t)-\frac{1}{LC}y_1(t)
\end{pmatrix}.
$$

Now take

$$
L=C=1,\qquad R=\frac14,
$$

with initial values

$$
y_1(0)=I(0)=1,\qquad y_2(0)=I'(0)=1.
$$

**Figure 3.1:** Solution and approximation of the oscillator equation

$$
I''(t)+\frac14 I'(t)+I(t)=0
$$

with initial values $I(0)=I'(0)=1$; the left plot uses $n=50$, and the right plot uses $n=100$.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Figure 3.1: Solution and approximation of the oscillator equation (left: $n=50$; right: $n=100$)</figcaption>
  <svg viewBox="0 0 920 420" role="img" aria-labelledby="ode-osc-en-title ode-osc-en-desc">
    <title id="ode-osc-en-title">Numerical approximations for the oscillator equation with n=50 and n=100</title>
    <desc id="ode-osc-en-desc">The two panels compare the exact solution, explicit Euler, Heun, and RK4 for the oscillator equation I''(t)+1/4 I'(t)+I(t)=0 with I(0)=I'(0)=1.</desc>
    <rect x="0" y="0" width="920" height="420" fill="#ffffff" />
    <text x="250" y="44" fill="#111827" font-size="18" text-anchor="middle">left: n=50</text>
    <text x="672" y="44" fill="#111827" font-size="18" text-anchor="middle">right: n=100</text>
    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="84" y1="88" x2="84" y2="318" />
      <line x1="249" y1="88" x2="249" y2="318" />
      <line x1="414" y1="88" x2="414" y2="318" />
      <line x1="84" y1="124" x2="414" y2="124" />
      <line x1="84" y1="203" x2="414" y2="203" />
      <line x1="84" y1="283" x2="414" y2="283" />
      <line x1="506" y1="88" x2="506" y2="318" />
      <line x1="671" y1="88" x2="671" y2="318" />
      <line x1="836" y1="88" x2="836" y2="318" />
      <line x1="506" y1="124" x2="836" y2="124" />
      <line x1="506" y1="203" x2="836" y2="203" />
      <line x1="506" y1="283" x2="836" y2="283" />
    </g>
    <g stroke="#334155" stroke-width="2">
      <line x1="84" y1="318" x2="414" y2="318" />
      <line x1="84" y1="88" x2="84" y2="318" />
      <line x1="506" y1="318" x2="836" y2="318" />
      <line x1="506" y1="88" x2="506" y2="318" />
    </g>
    <g fill="#64748b" font-size="13">
      <text x="78" y="340">0</text><text x="241" y="340">10</text><text x="405" y="340">20</text>
      <text x="498" y="340">0</text><text x="663" y="340">10</text><text x="827" y="340">20</text>
      <text x="55" y="128">1</text><text x="48" y="207">0</text><text x="43" y="287">-1</text>
      <text x="477" y="128">1</text><text x="470" y="207">0</text><text x="465" y="287">-1</text>
      <text x="395" y="364">t</text><text x="817" y="364">t</text>
      <text x="36" y="98">I(t)</text><text x="458" y="98">I(t)</text>
    </g>
    <g fill="none" stroke-linejoin="round" stroke-linecap="round">
      <path d="M 84 124 C 118 88 145 98 176 150 C 210 208 230 270 264 275 C 300 281 320 220 350 194 C 380 170 400 188 414 193" stroke="#111827" stroke-width="4" />
      <path d="M 84 124 L 110 103 L 137 306 L 163 326 L 190 70 L 216 51 L 242 375 L 269 391 L 295 -20 L 322 -28 L 348 490 L 374 486 L 401 -167 L 414 -310" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 7" />
      <path d="M 84 124 C 116 96 144 99 176 194 C 206 156 236 226 266 227 C 300 183 330 204 360 218 C 386 197 404 192 414 196" stroke="#1d6fb8" stroke-width="3" />
      <path d="M 84 124 C 116 96 144 100 176 203 C 206 154 236 219 266 231 C 300 181 330 205 360 218 C 386 202 404 193 414 193" stroke="#2a9d55" stroke-width="3" />
      <path d="M 506 124 C 540 88 567 98 598 150 C 632 208 652 270 686 275 C 722 281 742 220 772 194 C 802 170 822 188 836 193" stroke="#111827" stroke-width="4" />
      <path d="M 506 124 C 535 86 565 105 591 238 C 625 103 654 206 684 230 C 714 130 747 199 776 218 C 805 200 825 130 836 136" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 7" />
      <path d="M 506 124 C 535 95 566 106 598 201 C 628 162 658 221 688 230 C 720 181 750 199 780 217 C 808 200 828 193 836 194" stroke="#1d6fb8" stroke-width="3" />
      <path d="M 506 124 C 535 95 566 106 598 203 C 628 161 658 219 688 223 C 720 181 750 197 780 218 C 808 202 828 193 836 193" stroke="#2a9d55" stroke-width="3" />
    </g>
    <rect x="286" y="366" width="356" height="42" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="306" y1="384" x2="354" y2="384" stroke="#111827" stroke-width="4" />
    <text x="366" y="390" fill="#334155" font-size="15">exact</text>
    <line x1="430" y1="384" x2="478" y2="384" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 7" />
    <text x="490" y="390" fill="#334155" font-size="15">explicit Euler</text>
    <line x1="306" y1="404" x2="354" y2="404" stroke="#1d6fb8" stroke-width="3" />
    <text x="366" y="410" fill="#334155" font-size="15">Heun</text>
    <line x1="430" y1="404" x2="478" y2="404" stroke="#2a9d55" stroke-width="3" />
    <text x="490" y="410" fill="#334155" font-size="15">RK4</text>
  </svg>
  <p class="ode-figure__note">The organization follows Figure 3.1 in the source notes: $n=50$ on the left and $n=100$ on the right. Heun and RK4 follow the exact oscillation much better than explicit Euler.</p>
</figure>

The exact solution has the form

$$
I(t)
=e^{-\frac18 t}
\left(
\cos(\omega t)+\frac{3\sqrt{7}}{7}\sin(\omega t)
\right),
\qquad
\omega=\frac{3\sqrt{7}}{8}.
$$

Figure 3.1 shows that Heun's method and RK4 give good approximations, while explicit Euler has a visibly larger error.

### 3.1.3 Convergence and Consistency

The methods above can be written in the general one-step form

$$
u_0=y_0,
$$

$$
u_{j+1}
=u_j+h\varphi(t_j,h;u_j,u_{j+1}),
\qquad j=0,\ldots,N-1.
\tag{3.7}
$$

**Definition 3.1.2**  
The function $\varphi(t,h;u,v)$ is called the **method function** in (3.7). If $\varphi$ does not depend on $v$, the method is explicit; otherwise it is implicit.

The German original writes this notation as *Die Funktion* $\varphi(t,h;u,v)$.

Here $u$ represents the state at the left endpoint of the current step, corresponding to $u_j$ in (3.7); $v$ represents the state at the right endpoint, corresponding to $u_{j+1}$. Explicit methods do not really use $v$, while implicit methods do, so $u_{j+1}$ must be solved from an equation.

The quantity

$$
\tau(t,h)
=
\frac{1}{h}
\left(
y(t+h)-y(t)
-h\varphi(t,h;y(t),y(t+h))
\right)
$$

is called the **local truncation error** or **consistency error** of method (3.7) at position $t$.

**Definition 3.1.3**  
If there are constants $C>0$ and $\bar h>0$ such that

$$
\|\tau(t,h)\|\le Ch^p
$$

for all $0<h\le\bar h$ and all $t\in[a,b-h]$, then method (3.7) is said to have consistency order $p$ for (IVP).

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Property diagram: consistency looks at one local defect</figcaption>
  <svg viewBox="0 0 760 330" role="img" aria-labelledby="ode-consistency-en-title ode-consistency-en-desc">
    <title id="ode-consistency-en-title">Consistency and local truncation error</title>
    <desc id="ode-consistency-en-desc">Starting from the exact point, the diagram compares the exact value at t+h with the value produced by one numerical step.</desc>
    <rect x="0" y="0" width="760" height="330" fill="#ffffff" />
    <line x1="78" y1="258" x2="690" y2="258" stroke="#334155" stroke-width="2" />
    <line x1="78" y1="48" x2="78" y2="258" stroke="#334155" stroke-width="2" />
    <text x="674" y="286" fill="#334155" font-size="16">t</text>
    <text x="38" y="58" fill="#334155" font-size="16">y</text>
    <line x1="170" y1="258" x2="170" y2="62" stroke="#d7dee2" stroke-width="1" />
    <line x1="500" y1="258" x2="500" y2="62" stroke="#d7dee2" stroke-width="1" />
    <text x="156" y="286" fill="#64748b" font-size="14">t</text>
    <text x="482" y="286" fill="#64748b" font-size="14">t+h</text>
    <path d="M 110 228 C 205 184 330 118 500 96 C 585 86 642 70 682 54" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="170" cy="198" r="7" fill="#111827" />
    <circle cx="500" cy="96" r="7" fill="#111827" />
    <circle cx="500" cy="128" r="7" fill="#c1121f" />
    <line x1="170" y1="198" x2="500" y2="128" stroke="#c1121f" stroke-width="4" stroke-dasharray="9 7" />
    <line x1="500" y1="96" x2="500" y2="128" stroke="#7c3aed" stroke-width="4" />
    <text x="512" y="88" fill="#111827" font-size="15">exact y(t+h)</text>
    <text x="512" y="144" fill="#c1121f" font-size="15">one numerical step</text>
    <text x="542" y="116" fill="#7c3aed" font-size="15">local defect</text>
  </svg>
  <p class="ode-figure__note">Consistency asks what happens in one step if the method starts from the exact solution.</p>
</figure>

The method is called stable if there exists a constant $K>0$ such that

$$
\|\varphi(t,h;u,v)-\varphi(t,h;\tilde u,\tilde v)\|
\le
K\bigl(\|u-\tilde u\|+\|v-\tilde v\|\bigr)
$$

for all $t\in[a,b]$ and all $u,v,\tilde u,\tilde v\in\mathbb{R}^n$.

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Property diagram: stability controls how perturbations propagate</figcaption>
  <svg viewBox="0 0 760 340" role="img" aria-labelledby="ode-stability-en-title ode-stability-en-desc">
    <title id="ode-stability-en-title">Perturbation propagation in a stable one-step method</title>
    <desc id="ode-stability-en-desc">The diagram compares two nearby input states after one step of the same method. Stability means the output difference is controlled by the input difference.</desc>
    <rect x="0" y="0" width="760" height="340" fill="#ffffff" />
    <line x1="82" y1="262" x2="690" y2="262" stroke="#334155" stroke-width="2" />
    <line x1="82" y1="55" x2="82" y2="262" stroke="#334155" stroke-width="2" />
    <text x="674" y="292" fill="#334155" font-size="16">t</text>
    <text x="42" y="65" fill="#334155" font-size="16">y</text>
    <path d="M 170 196 C 250 160 340 124 500 98" fill="none" stroke="#111827" stroke-width="4" />
    <path d="M 170 218 C 250 182 340 148 500 126" fill="none" stroke="#c1121f" stroke-width="4" stroke-dasharray="10 7" />
    <circle cx="170" cy="196" r="7" fill="#111827" />
    <circle cx="500" cy="98" r="7" fill="#111827" />
    <circle cx="170" cy="218" r="7" fill="#c1121f" />
    <circle cx="500" cy="126" r="7" fill="#c1121f" />
    <line x1="145" y1="196" x2="145" y2="218" stroke="#7c3aed" stroke-width="4" />
    <line x1="528" y1="98" x2="528" y2="126" stroke="#7c3aed" stroke-width="4" />
    <text x="84" y="232" fill="#c1121f" font-size="15">perturbed input</text>
    <text x="544" y="108" fill="#111827" font-size="15">one step</text>
    <text x="544" y="134" fill="#c1121f" font-size="15">perturbed step</text>
    <text x="96" y="162" fill="#7c3aed" font-size="15">input gap</text>
    <text x="544" y="166" fill="#7c3aed" font-size="15">controlled output gap</text>
    <text x="250" y="72" fill="#334155" font-size="16">φ satisfies a Lipschitz bound in u and v</text>
  </svg>
  <p class="ode-figure__note">Stability here does not mean zero one-step error. It means that small changes in $u$ and $v$ do not cause uncontrolled changes in the method function.</p>
</figure>

The method has convergence order $p$ if there are constants $M>0$ and $H>0$ such that

$$
\|e_j\|
=\|y(t_j)-u_j\|
\le
Mh^p
$$

for $j=0,\ldots,N$ and all

$$
h=\frac{b-a}{N}\le H.
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">Property diagram: convergence looks at the global grid error</figcaption>
  <svg viewBox="0 0 760 340" role="img" aria-labelledby="ode-convergence-en-title ode-convergence-en-desc">
    <title id="ode-convergence-en-title">Convergence and global discretization error</title>
    <desc id="ode-convergence-en-desc">The diagram shows coarse and fine numerical grids; the finer grid follows the exact curve more closely.</desc>
    <rect x="0" y="0" width="760" height="340" fill="#ffffff" />
    <line x1="82" y1="262" x2="690" y2="262" stroke="#334155" stroke-width="2" />
    <line x1="82" y1="55" x2="82" y2="262" stroke="#334155" stroke-width="2" />
    <text x="674" y="292" fill="#334155" font-size="16">t</text>
    <text x="42" y="65" fill="#334155" font-size="16">y</text>
    <path d="M 110 232 C 190 195 282 135 410 116 C 520 100 595 82 668 60" fill="none" stroke="#111827" stroke-width="4" />
    <polyline points="110,232 240,184 370,142 500,115 630,90" fill="none" stroke="#c1121f" stroke-width="4" stroke-dasharray="10 7" />
    <polyline points="110,232 175,204 240,173 305,149 370,132 435,119 500,108 565,96 630,82" fill="none" stroke="#1d6fb8" stroke-width="4" />
    <line x1="500" y1="100" x2="500" y2="115" stroke="#7c3aed" stroke-width="4" />
    <text x="512" y="108" fill="#7c3aed" font-size="15">e_j</text>
    <rect x="454" y="185" width="184" height="58" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="472" y1="204" x2="522" y2="204" stroke="#c1121f" stroke-width="4" stroke-dasharray="10 7" />
    <text x="536" y="210" fill="#334155" font-size="15">coarse step h</text>
    <line x1="472" y1="226" x2="522" y2="226" stroke="#1d6fb8" stroke-width="4" />
    <text x="536" y="232" fill="#334155" font-size="15">fine step h/2</text>
  </svg>
  <p class="ode-figure__note">Convergence concerns the global discretization error at all grid points. If a method converges, reducing $h$ makes the whole numerical trajectory approach the exact one.</p>
</figure>

**Example 3.1.4 (explicit Euler method):** Euler's method has consistency order $1$.

Indeed, if $f\in C^1([a,b]\times\mathbb{R}^n;\mathbb{R}^n)$ and $y$ solves $y'=f(t,y)$, then $y\in C^2([a,b];\mathbb{R}^n)$. Taylor expansion gives

$$
y(t+h)
=y(t)+f(t,y(t))h
+\frac12\bigl(y_i''(t+\xi_i h)\bigr)_{1\le i\le n}h^2.
$$

Therefore

$$
\|\tau(t,h)\|
=
\left\|
\frac1h\bigl(y(t+h)-y(t)-h f(t,y(t))\bigr)
\right\|
\le Ch.
$$

### 3.1.4 A Convergence Theorem

We now state a basic convergence theorem for one-step methods.

**Theorem 3.1.5**  
Let

$$
y\in C^1([a,b];\mathbb{R}^n)
$$

be the solution of (IVP). Suppose method (3.7) has consistency order $p$ and is stable. Then the method has convergence order $p$. More precisely, there exists $H>0$ such that

$$
\|e_j\|
=\|y(t_j)-u_j\|
\le
\frac{e^{4K|t_j-a|}-1}{4K}\,2C h^p
$$

for $j=0,\ldots,N$ and all

$$
h=\frac{b-a}{N}\le H.
$$

**Proof (for interested readers):** Let

$$
y_j=y(t_j),\qquad e_j=y_j-u_j.
$$

Consistency gives

$$
y_{j+1}
=y_j+h\varphi(t_j,h;y_j,y_{j+1})+h\tau(t_j,h).
$$

Subtracting the numerical method and using stability yields

$$
\|e_{j+1}\|
\le
(1+hK)\|e_j\|+hK\|e_{j+1}\|+hCh^p.
$$

For sufficiently small $H$, this implies

$$
\|e_{j+1}\|
\le
(1+4hK)\|e_j\|+2Ch^{p+1}.
$$

The discrete Gronwall lemma below, together with $e_0=0$, gives the stated estimate.

**Lemma 3.1.6:** For $L>0$, $a_j\ge0$, $h_j>0$, and $b\ge0$, if

$$
a_{j+1}\le(1+h_jL)a_j+h_jb,
\qquad j=0,1,\ldots,n-1,
$$

then

$$
a_j
\le
\frac{e^{Lt_j}-1}{L}b
+e^{Lt_j}a_0,
\qquad
t_j:=\sum_{i=0}^{j-1}h_i.
$$

The induction step is

$$
\begin{aligned}
a_{j+1}
&\le
(1+h_jL)
\left(
\frac{e^{Lt_j}-1}{L}b
+e^{Lt_j}a_0
\right)
+h_jb\\
&\le
\left(
\frac{e^{L(t_j+h_j)}-1-h_jL}{L}
+h_j
\right)b
+e^{L(t_j+h_j)}a_0\\
&=
\frac{e^{Lt_{j+1}}-1}{L}b
+e^{Lt_{j+1}}a_0.
\end{aligned}
$$

### 3.1.5 Explicit Runge-Kutta Methods

The ideas behind RK4 can be generalized to construct methods with high consistency order.

An $r$-stage explicit Runge-Kutta method has the form

$$
u_{j+1}
=u_j+h\sum_{i=1}^{r}\beta_i k_i,
\qquad
k_i=f\left(t_j+\gamma_i h,\,
u_j+h\sum_{\ell=1}^{i-1}\alpha_{i\ell}k_\ell
\right).
\tag{3.7}
$$

The coefficients are often written in a Butcher tableau:

$$
\begin{array}{c|cccc}
\gamma_1 & 0 & 0 & \cdots & 0\\
\gamma_2 & \alpha_{21} & 0 & \cdots & 0\\
\vdots & \vdots & \vdots & \ddots & \vdots\\
\gamma_r & \alpha_{r1} & \alpha_{r2} & \cdots & 0\\
\hline
& \beta_1 & \beta_2 & \cdots & \beta_r
\end{array}
$$

Explicit Euler, improved Euler, Heun's method, and RK4 are all examples of this framework. By choosing the number of stages $r$ and the coefficients appropriately, one can construct explicit Runge-Kutta methods of higher consistency order. The order conditions for $p=1,2,3,4$ are systems of algebraic equations in the coefficients; detailed derivations can be found in Deuflhard and Bornemann [1].

---

Continue with [Numerical Analysis Lecture (III): Initial Value Problems and Stiffness Part II]({{ '/en/ode-stiffness-stability/' | relative_url }}).

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
- RK4: fourth-order Runge-Kutta method.

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.
