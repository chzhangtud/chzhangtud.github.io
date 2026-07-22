---
title: "Numerical Analysis Lecture (II): Numerical Integration"
lang: "en"
date: 2026-07-22
permalink: /en/numerical-integration-lab/
zh_link: /zh/numerical-integration-lab/
categories:
  - Math
tags:
  - Numerical Methods
  - Numerical Integration
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.quadrature-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.quadrature-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.quadrature-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.quadrature-figure__note {
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

You may want to read [Numerical Analysis Lecture (I): Interpolation Methods]({{ '/en/interpolation-lab/' | relative_url }}) first, because Newton-Cotes quadrature directly uses interpolation polynomials and Lagrange basis functions. This chapter then studies numerical integration: approximating definite integrals from finitely many function values.

---

**Numerical Integration**

This chapter discusses common methods for approximating definite integrals of the form

$$
\int_a^b f(x)\,dx.
$$

**Integration task**  
Given an integrable function $f:[a,b]\to\mathbb{R}$, compute

$$
I(f)=\int_a^b f(x)\,dx.
$$

Even for functions that look relatively simple, an antiderivative may not be available in closed form, for example

$$
\frac{\sin x}{x}
\qquad\text{and}\qquad
e^{-x^2}.
$$

In such cases we need numerical integration. Many important quadrature methods are based on the same idea: choose several support points

$$
(x_i,f(x_i)),\qquad x_i\in[a,b],
$$

interpolate $f$ by a polynomial $p_n$, and then integrate that polynomial. This gives the approximation

$$
I_n(f)=\int_a^b p_n(x)\,dx,
$$

and methods of this type are called **interpolatory quadrature**.

## 2.1 Newton-Cotes Quadrature

### 2.1.1 Closed Newton-Cotes Quadrature

For $n\in\mathbb{N}$, choose equally spaced support points

$$
x_i=a+ih,\qquad i=0,\ldots,n,\qquad h=\frac{b-a}{n}.
$$

The Lagrange representation of the interpolation polynomial $p_n$ is

$$
p_n(x)=\sum_{i=0}^{n} f(x_i)L_{i,n}(x),
\qquad
L_{i,n}(x)=
\prod_{\substack{j=0\\ j\ne i}}^{n}
\frac{x-x_j}{x_i-x_j}.
$$

This gives the numerical quadrature formula

$$
I_n(f)
=\int_a^b p_n(x)\,dx
=\sum_{i=0}^{n} f(x_i)\int_a^b L_{i,n}(x)\,dx.
$$

With the substitution $x=a+sh$, where $s\in[0,n]$, we obtain:

**Closed Newton-Cotes formula**

$$
I_n(f)
=h\sum_{i=0}^{n}\alpha_{i,n}f(x_i),
\qquad
\alpha_{i,n}
=\int_0^n
\prod_{\substack{j=0\\ j\ne i}}^{n}
\frac{s-j}{i-j}\,ds.
\tag{2.1}
$$

The numbers $\alpha_{0,n},\ldots,\alpha_{n,n}$ are called weights. They do not depend on $f$ or on the interval $[a,b]$, so they can be tabulated in advance. We always have

$$
\sum_{i=0}^{n}h\alpha_{i,n}=b-a.
$$

**Definition 2.1.1**  
The integration formula

$$
J(f)=\sum_{i=0}^{n}\beta_i f(x_i)
$$

is said to have degree of precision $n$ if it integrates every polynomial of degree at most $n$ exactly.

By construction, the closed Newton-Cotes formula $I_n(f)$ has degree of precision $n$.

The next important question is how to estimate the error

$$
E_n(f):=I(f)-I_n(f).
$$

By Corollary 1.1.4,

$$
|f(x)-p_n(x)|
\le
\frac{|f^{(n+1)}(\xi)|}{(n+1)!}(b-a)^{n+1},
$$

where $\xi\in[a,b]$. Therefore, for some possibly different $\xi\in[a,b]$,

$$
\left|
\int_a^b f(x)\,dx-\int_a^b p_n(x)\,dx
\right|
\le
\int_a^b |f(x)-p_n(x)|\,dx
\le
\frac{|f^{(n+1)}(\xi)|}{(n+1)!}(b-a)^{n+2}.
$$

A Taylor expansion gives sharper remainder estimates. The results are listed below.

| $n$ | $\alpha_{i,n}$ | Maximum error $E_n(f)$ | Name |
|---:|---|---|---|
| 1 | $\frac12,\frac12$ | $-\frac{f^{(2)}(\xi)}{12}h^3$ | Trapezoidal rule |
| 2 | $\frac13,\frac43,\frac13$ | $-\frac{f^{(4)}(\xi)}{90}h^5$ | Simpson's rule |
| 3 | $\frac38,\frac98,\frac98,\frac38$ | $-\frac{3f^{(4)}(\xi)}{80}h^5$ | 3/8 rule |
| 4 | $\frac{14}{45},\frac{64}{45},\frac{24}{45},\frac{64}{45},\frac{14}{45}$ | $-\frac{8f^{(6)}(\xi)}{945}h^7$ | Milne's rule |

One caveat is that for $n\ge 7$, Newton-Cotes weights can become negative. Negative weights introduce cancellation, which makes the formula increasingly unstable numerically. In practice, one usually does not try to improve accuracy simply by increasing $n$.

**Diagram 2.1:** Closed Newton-Cotes formulas include the endpoints. The trapezoidal rule connects the endpoint values by a line, while Simpson's rule uses the quadratic curve through three nodes.

<figure class="quadrature-figure">
  <figcaption class="quadrature-figure__caption">Closed Newton-Cotes: Trapezoidal Rule and Simpson's Rule</figcaption>
  <svg viewBox="0 0 920 430" role="img" aria-labelledby="closed-quadrature-title closed-quadrature-desc">
    <title id="closed-quadrature-title">Closed Newton-Cotes area approximation diagram</title>
    <desc id="closed-quadrature-desc">The diagram shows the original function curve, endpoint nodes, the trapezoidal area approximation, and a Simpson quadratic approximation.</desc>
    <defs>
      <linearGradient id="closed-fill-en" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#a7d8c9" stop-opacity="0.65" />
        <stop offset="100%" stop-color="#a7d8c9" stop-opacity="0.2" />
      </linearGradient>
      <linearGradient id="simpson-fill-en" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#f4b860" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#f4b860" stop-opacity="0.18" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="920" height="430" fill="#fff" />
    <line x1="70" y1="350" x2="860" y2="350" stroke="#64748b" stroke-width="2" />
    <line x1="90" y1="360" x2="90" y2="70" stroke="#64748b" stroke-width="2" />
    <text x="845" y="382" fill="#334155" font-size="20">x</text>
    <text x="54" y="84" fill="#334155" font-size="20">f(x)</text>
    <path d="M 120 350 L 120 255 L 450 142 L 780 235 L 780 350 Z" fill="url(#closed-fill-en)" stroke="#18745f" stroke-width="2" />
    <path d="M 120 350 L 120 255 Q 450 40 780 235 L 780 350 Z" fill="url(#simpson-fill-en)" stroke="#d27d00" stroke-width="3" />
    <path d="M 120 255 C 210 188 310 122 450 118 C 590 116 690 181 780 235" fill="none" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <line x1="120" y1="255" x2="780" y2="235" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="9 8" />
    <circle cx="120" cy="255" r="8" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <circle cx="450" cy="118" r="8" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <circle cx="780" cy="235" r="8" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <line x1="120" y1="350" x2="120" y2="365" stroke="#64748b" stroke-width="2" />
    <line x1="450" y1="350" x2="450" y2="365" stroke="#64748b" stroke-width="2" />
    <line x1="780" y1="350" x2="780" y2="365" stroke="#64748b" stroke-width="2" />
    <text x="112" y="392" fill="#334155" font-size="20">a</text>
    <text x="423" y="392" fill="#334155" font-size="20">midpoint</text>
    <text x="772" y="392" fill="#334155" font-size="20">b</text>
    <rect x="578" y="74" width="250" height="96" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="602" y1="100" x2="660" y2="100" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <text x="678" y="107" fill="#334155" font-size="19">original function</text>
    <line x1="602" y1="130" x2="660" y2="130" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="9 8" />
    <text x="678" y="137" fill="#334155" font-size="19">trapezoidal rule</text>
    <line x1="602" y1="160" x2="660" y2="160" stroke="#d27d00" stroke-width="3" />
    <text x="678" y="167" fill="#334155" font-size="19">Simpson's rule</text>
  </svg>
  <p class="quadrature-figure__note">Closed formulas include $a$ and $b$ as nodes. A quadratic approximation often follows curvature better, but high-order Newton-Cotes formulas are not automatically more stable.</p>
</figure>

**Example:** Consider $f(x)=\log_2(x)$ on the interval $[a,b]=[2,4]$. The exact integral is

$$
I(f)
=\int_2^4 f(x)\,dx
=\int_2^4 \log_2(x)\,dx
=\left.\frac{1}{\ln(2)}(x\ln(x)-x)\right|_2^4
$$

$$
=\frac{4\ln(4)-4-2\ln(2)+2}{\ln(2)}
\approx 3.11461.
$$

The trapezoidal rule gives $h=\frac{2}{1}=2$, hence

$$
I_1(f)
=2\left(\frac12 f(2)+\frac12 f(4)\right)
=2\left(\frac12\log_2(2)+\frac12\log_2(4)\right)
=2\left(\frac12+1\right)=3.
$$

For Simpson's rule, $h=\frac{2}{2}=1$, and

$$
I_2(f)
=1\left(\frac13 f(2)+\frac43 f(3)+\frac13 f(4)\right)
\approx 3.11328.
$$

For $\xi\in[2,4]$, the trapezoidal rule error estimate is

$$
E_1(f)
=-\frac{f''(\xi)h^3}{12}
=\frac{1}{\xi^2\ln(2)}\frac{8}{12}
\le
\frac{1}{2^2\ln(2)}\frac{2}{3}
\approx 0.24045.
$$

This agrees reasonably well with the actual error $0.11461$. The Simpson error is

$$
E_2(f)
=-\frac{f^{(4)}(\xi)h^5}{90}
=\frac{6}{\xi^4\ln(2)}\frac{1}{90}
\le
\frac{6}{2^4\ln(2)}\frac{1}{90}
\approx 0.00601,
$$

which agrees very well with the actual error $0.00133$.

### 2.1.2 Open Newton-Cotes Quadrature

For $n\in\mathbb{N}\cup\{0\}$, choose equally spaced support points inside the open interval $(a,b)$:

$$
x_i=a+ih,\qquad i=1,\ldots,n+1,\qquad h=\frac{b-a}{n+2}.
$$

Proceeding in the same way gives another interpolatory integration formula:

**Open Newton-Cotes formula**

$$
\tilde I_n(f)
=h\sum_{i=1}^{n+1}\tilde\alpha_{i,n}f(x_i),
\qquad
\tilde\alpha_{i,n}
=
\int_0^{n+2}
\prod_{\substack{j=1\\ j\ne i}}^{n+1}
\frac{s-j}{i-j}\,ds.
$$

The quadrature error has a formula similar to the closed case:

| $n$ | $\tilde\alpha_{i,n}$ | Maximum error $\tilde E_n(f)$ | Name |
|---:|---|---|---|
| 0 | $2$ | $\frac{f^{(2)}(\xi)}{3}h^3$ | Midpoint rectangle rule |
| 1 | $\frac32,\frac32$ | $\frac{3f^{(2)}(\xi)}{4}h^3$ |  |
| 2 | $\frac83,-\frac43,\frac83$ | $\frac{28f^{(4)}(\xi)}{90}h^5$ |  |

**Diagram 2.2:** Open Newton-Cotes formulas do not use the endpoints. The midpoint rectangle rule samples only one interior point and multiplies its function value by the interval length.

<figure class="quadrature-figure">
  <figcaption class="quadrature-figure__caption">Open Newton-Cotes: Midpoint Rectangle Rule</figcaption>
  <svg viewBox="0 0 920 400" role="img" aria-labelledby="open-quadrature-title open-quadrature-desc">
    <title id="open-quadrature-title">Open Newton-Cotes node diagram</title>
    <desc id="open-quadrature-desc">The endpoints are shown as hollow points, the midpoint is the actual sample node, and a rectangle approximates the area under the curve.</desc>
    <rect x="0" y="0" width="920" height="400" fill="#fff" />
    <line x1="70" y1="320" x2="860" y2="320" stroke="#64748b" stroke-width="2" />
    <line x1="90" y1="335" x2="90" y2="70" stroke="#64748b" stroke-width="2" />
    <text x="845" y="354" fill="#334155" font-size="20">x</text>
    <text x="54" y="84" fill="#334155" font-size="20">f(x)</text>
    <rect x="190" y="130" width="520" height="190" fill="#cfe8f3" stroke="#1d6fb8" stroke-width="3" />
    <path d="M 190 260 C 280 220 360 145 450 130 C 550 114 642 142 710 190" fill="none" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <line x1="190" y1="320" x2="190" y2="335" stroke="#64748b" stroke-width="2" />
    <line x1="450" y1="320" x2="450" y2="335" stroke="#64748b" stroke-width="2" />
    <line x1="710" y1="320" x2="710" y2="335" stroke="#64748b" stroke-width="2" />
    <circle cx="190" cy="260" r="8" fill="#fff" stroke="#64748b" stroke-width="3" />
    <circle cx="710" cy="190" r="8" fill="#fff" stroke="#64748b" stroke-width="3" />
    <circle cx="450" cy="130" r="9" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <text x="184" y="360" fill="#334155" font-size="20">a</text>
    <text x="412" y="360" fill="#334155" font-size="20">interior node</text>
    <text x="704" y="360" fill="#334155" font-size="20">b</text>
    <text x="330" y="217" fill="#1d4f6f" font-size="22">2h * f(x1)</text>
    <rect x="610" y="70" width="220" height="78" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <circle cx="632" cy="96" r="7" fill="#fff" stroke="#64748b" stroke-width="3" />
    <text x="654" y="103" fill="#334155" font-size="18">endpoints skipped</text>
    <circle cx="632" cy="126" r="7" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <text x="654" y="133" fill="#334155" font-size="18">interior sample</text>
  </svg>
  <p class="quadrature-figure__note">Open formulas are natural when endpoint values are unavailable, unreliable, or intentionally avoided by the algorithm.</p>
</figure>

**Example:** Again consider $f(x)=\log_2(x)$ on $[2,4]$, with exact value $I(f)\approx 3.11461$. The rectangle rule gives $h=\frac22=1$, hence

$$
\tilde I_0(f)=2f(3)\approx 3.16992.
$$

The error estimate is

$$
\tilde E_0(f)
=\frac{f^{(2)}(\xi)h^3}{3}
=-\frac{1}{\xi^2\ln(2)}\frac13
\ge
-\frac{1}{2^2\ln(2)}\frac13
\approx -0.12022,
$$

while the exact error is $-0.05529$.

## 2.2 Composite Newton-Cotes Formulas

Newton-Cotes formulas are reliable mainly when the integration interval is small and the number of nodes is not too large. A more common strategy is therefore to split $[a,b]$ into smaller subintervals, apply a Newton-Cotes formula on each subinterval, and add up the resulting subintegrals.

Divide $[a,b]$ into $m$ subintervals of length

$$
H=\frac{b-a}{m}.
$$

Apply an $n$-degree Newton-Cotes formula on each subinterval and sum the results. Let

$$
N=m\cdot n,\qquad
H=\frac{b-a}{m},\qquad
h=\frac{H}{n}=\frac{b-a}{N},
$$

$$
x_i=a+ih,\qquad i=0,\ldots,N,
$$

$$
y_j=a+jH,\qquad j=0,\ldots,m.
$$

Since

$$
I(f)=\sum_{j=0}^{m-1}\int_{y_j}^{y_{j+1}}f(x)\,dx,
$$

we obtain:

**Composite closed Newton-Cotes formula**

$$
S_N^{(n)}(f)
=h\sum_{j=0}^{m-1}\sum_{i=0}^{n}
\alpha_{i,n}f(x_{jn+i}).
$$

The weights $\alpha_{i,n}$ are still given by (2.1). The quadrature error

$$
R_N^{(n)}(f)=I(f)-S_N^{(n)}(f)
$$

is obtained by adding the errors over all subintervals.

**Theorem 2.2.1**  
Let $f\in C^{n+2}([a,b])$. Then there exists an intermediate point $\xi\in(a,b)$ such that

$$
R_N^{(n)}(f)=
\begin{cases}
C(n)f^{(n+2)}(\xi)(b-a)h^{n+2}, & n \text{ is even},\\
C(n)f^{(n+1)}(\xi)(b-a)h^{n+1}, & n \text{ is odd}.
\end{cases}
$$

Here $C(n)$ is a constant depending only on $n$.

The most common composite formulas and their quadrature errors are listed below.

**Composite trapezoidal rule**

Closed, $n=1$, $h=\frac{b-a}{m}$:

$$
S_N^{(1)}(f)
=\frac{h}{2}
\sum_{j=0}^{m-1}
\left(f(x_j)+f(x_{j+1})\right),
\qquad
x_j=a+jh.
$$

Error:

$$
R_N^{(1)}(f)
=-\frac{f''(\xi)}{12}(b-a)h^2.
$$

**Composite Simpson's rule**

Closed, $n=2$, $h=\frac{b-a}{2m}$:

$$
S_N^{(2)}(f)
=\frac{h}{3}
\sum_{j=0}^{m-1}
\left(f(x_{2j})+4f(x_{2j+1})+f(x_{2j+2})\right),
\qquad
x_j=a+jh.
$$

Error:

$$
R_N^{(2)}(f)
=-\frac{f^{(4)}(\xi)}{180}(b-a)h^4.
$$

**Composite rectangle rule**

Open, $n=0$, $2m=N$, $h=\frac{b-a}{N}$:

$$
\tilde S_N^{(0)}(f)
=2h\sum_{j=1}^{m} f(x_{2j-1}),
\qquad
x_j=a+jh.
$$

Error:

$$
\tilde R_N^{(0)}(f)
=\frac{f''(\xi)}{6}(b-a)h^2.
$$

**Diagram 2.3:** Composite formulas reduce the error by reducing the step size $h$. The leading error term of the trapezoidal rule usually scales like $h^2$, while Simpson's rule scales like $h^4$.

<figure class="quadrature-figure">
  <figcaption class="quadrature-figure__caption">Composite Formulas: Split the Interval and Sum Subintegrals</figcaption>
  <svg viewBox="0 0 920 430" role="img" aria-labelledby="composite-quadrature-title composite-quadrature-desc">
    <title id="composite-quadrature-title">Composite Newton-Cotes and error convergence diagram</title>
    <desc id="composite-quadrature-desc">The left side shows the interval split into several small trapezoids, and the right side shows decreasing error curves for the trapezoidal and Simpson rules as the step size decreases.</desc>
    <rect x="0" y="0" width="920" height="430" fill="#fff" />
    <line x1="70" y1="330" x2="430" y2="330" stroke="#64748b" stroke-width="2" />
    <line x1="90" y1="340" x2="90" y2="70" stroke="#64748b" stroke-width="2" />
    <path d="M 110 270 C 155 220 190 165 240 150 C 310 130 365 185 410 232" fill="none" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <path d="M 110 330 L 110 270 L 170 202 L 230 152 L 290 144 L 350 176 L 410 232 L 410 330 Z" fill="#a7d8c9" fill-opacity="0.45" stroke="#18745f" stroke-width="2" />
    <g stroke="#18745f" stroke-width="2">
      <line x1="170" y1="202" x2="170" y2="330" />
      <line x1="230" y1="152" x2="230" y2="330" />
      <line x1="290" y1="144" x2="290" y2="330" />
      <line x1="350" y1="176" x2="350" y2="330" />
    </g>
    <text x="170" y="374" fill="#334155" font-size="20">many subintervals</text>
    <text x="84" y="58" fill="#334155" font-size="18">f(x)</text>
    <text x="410" y="360" fill="#334155" font-size="18">x</text>
    <line x1="520" y1="330" x2="850" y2="330" stroke="#64748b" stroke-width="2" />
    <line x1="540" y1="340" x2="540" y2="70" stroke="#64748b" stroke-width="2" />
    <text x="782" y="360" fill="#334155" font-size="18">smaller h</text>
    <text x="492" y="84" fill="#334155" font-size="18">error</text>
    <path d="M 570 110 C 650 158 730 218 820 295" fill="none" stroke="#1d6fb8" stroke-width="4" stroke-linecap="round" />
    <path d="M 570 86 C 630 154 700 250 820 316" fill="none" stroke="#c1121f" stroke-width="4" stroke-linecap="round" />
    <circle cx="570" cy="110" r="6" fill="#1d6fb8" />
    <circle cx="820" cy="295" r="6" fill="#1d6fb8" />
    <circle cx="570" cy="86" r="6" fill="#c1121f" />
    <circle cx="820" cy="316" r="6" fill="#c1121f" />
    <rect x="596" y="98" width="224" height="76" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="618" y1="124" x2="676" y2="124" stroke="#1d6fb8" stroke-width="4" />
    <text x="690" y="131" fill="#334155" font-size="18">trapezoid: O(h^2)</text>
    <line x1="618" y1="154" x2="676" y2="154" stroke="#c1121f" stroke-width="4" />
    <text x="690" y="161" fill="#334155" font-size="18">Simpson: O(h^4)</text>
  </svg>
  <p class="quadrature-figure__note">The composite idea is not to raise the interpolation degree without limit on one large interval, but to split the interval so that low-order formulas remain reliable on each small piece.</p>
</figure>

**Example:** Again consider $f(x)=\log_2(x)$ on $[2,4]$, where the exact value is $I(f)\approx 3.11461$, and take $m=2$.

- For the composite trapezoidal rule, $n=1$, $N=m=2$, and $h=\frac22=1$. Thus

  $$
  S_N^{(1)}(f)
  =\frac12\left(f(2)+f(3)+f(3)+f(4)\right)
  \approx
  \frac12(1+1.5849+1.5849+2)
  =3.08496.
  $$

  The error estimate gives

  $$
  R_N^{(1)}(f)
  =-\frac{f''(\xi)}{12}(b-a)h^2
  =
  \frac{1}{\xi^2\ln(2)}\frac{2}{12}
  \le
  \frac{1}{2^2\ln(2)}\frac{2}{12}
  \approx 0.06011.
  $$

  This clearly reduces the error of the simple trapezoidal rule; the true error is $0.02965$.

- For the composite Simpson rule, $n=2$, $N=4$, and $h=\frac24=\frac12$. We get

  $$
  S_N^{(2)}(f)
  =
  \frac{1}{2\cdot 3}
  \left(
  (f(2)+4f(2.5)+f(3))
  +(f(3)+4f(3.5)+f(4))
  \right)
  \approx 3.11450.
  $$

  The error estimate is $R_N^{(2)}(f)\le 0.00037$, and the true error is $0.00011$.

- For the composite rectangle rule, $h=\frac24=\frac12$, and

  $$
  \tilde S_N^{(0)}(f)
  =
  \frac22\bigl(f(2.5)+f(3.5)\bigr)
  \approx 3.12928.
  $$

  The error estimate is

  $$
  \tilde R_N^{(0)}(f)
  =
  \frac{f''(\xi)}{6}(b-a)h^2
  =
  -\frac{1}{\xi^2\ln(2)}\frac16\frac24
  \ge
  -\frac{1}{2^2\ln(2)}\frac16\frac12
  \approx -0.03005,
  $$

  and the true error is $-0.01467$.

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
mathe3-script-2011-SoSe.pdf
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.
