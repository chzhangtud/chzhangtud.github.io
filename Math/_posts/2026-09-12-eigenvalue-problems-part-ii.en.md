---
title: "Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part II"
lang: "en"
date: 2026-09-12
permalink: /en/eigenvalue-problems-part-ii/
zh_link: /zh/eigenvalue-problems-part-ii/
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

<a href="{{ page.zh_link }}" class="btn">中文版</a>

It is best to read [Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part I]({{ '/en/eigenvalue-problems-part-i/' | relative_url }}) first. This is the second article of Chapter 6 and focuses on vector iteration, the Rayleigh quotient, and Wielandt inverse iteration.

---

## 6.2 Vector Iteration

### 6.2.1 Definition and Properties of Vector Iteration

**Definition 6.2.1.** For a matrix $B\in\mathbb{C}^{n\times n}$, the associated vector iteration is defined by

$$
z^{(k+1)}=\frac{1}{\|Bz^{(k)}\|}Bz^{(k)},
\qquad
k=0,1,\ldots
\tag{6.2}
$$

where the initial vector satisfies $z^{(0)}\in\mathbb{C}^n\setminus\{0\}$.

At each step, the matrix $B$ is first applied to the current vector, and the result is then normalized by its norm. The iteration therefore primarily changes the vector's direction without allowing its length to grow or shrink indefinitely. If $B$ is chosen appropriately, the direction of the iterates gradually approaches an eigenvector, while the Rayleigh quotient provides an approximation to the corresponding eigenvalue. In an actual computation, one must also ensure that $Bz^{(k)}\ne0$; otherwise the normalization is not defined.

<figure class="eigenvalue-figure">
  <figcaption class="eigenvalue-figure__caption">Vector iteration: the dominant eigendirection is gradually retained</figcaption>
  <svg viewBox="0 0 760 360" role="img" aria-labelledby="eigen-power-en-title eigen-power-en-desc">
    <title id="eigen-power-en-title">Vector iteration approaching the dominant eigenvector</title>
    <desc id="eigen-power-en-desc">In this two-dimensional schematic, successive iterates start from an initial direction and approach the dominant eigendirection x1 after repeated matrix multiplication and normalization. The vector lengths are arranged for readability; the actual iteration normalizes the vector at every step.</desc>
    <defs>
      <marker id="eigen-power-en-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#334155"></path>
      </marker>
    </defs>
    <line x1="82" y1="278" x2="690" y2="278" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#eigen-power-en-arrow)"></line>
    <line x1="110" y1="315" x2="110" y2="48" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#eigen-power-en-arrow)"></line>
    <line x1="110" y1="278" x2="650" y2="112" stroke="#2563eb" stroke-width="2.4" stroke-dasharray="8 6"></line>
    <text x="632" y="101" font-size="14" fill="#1d4ed8">Dominant direction x₁</text>
    <line x1="110" y1="278" x2="302" y2="128" stroke="#64748b" stroke-width="2.2" marker-end="url(#eigen-power-en-arrow)"></line>
    <line x1="110" y1="278" x2="407" y2="140" stroke="#0f766e" stroke-width="2.2" marker-end="url(#eigen-power-en-arrow)"></line>
    <line x1="110" y1="278" x2="512" y2="130" stroke="#d97706" stroke-width="2.2" marker-end="url(#eigen-power-en-arrow)"></line>
    <line x1="110" y1="278" x2="585" y2="118" stroke="#dc2626" stroke-width="2.2" marker-end="url(#eigen-power-en-arrow)"></line>
    <circle cx="110" cy="278" r="4" fill="#334155"></circle>
    <text x="296" y="119" font-size="13" fill="#475569">z⁽⁰⁾</text>
    <text x="412" y="132" font-size="13" fill="#0f766e">z⁽¹⁾</text>
    <text x="518" y="122" font-size="13" fill="#b45309">z⁽²⁾</text>
    <text x="590" y="110" font-size="13" fill="#b91c1c">z⁽³⁾</text>
    <text x="674" y="294" font-size="14" fill="#475569">Direction</text>
    <text x="116" y="60" font-size="14" fill="#475569">Another eigendirection</text>
    <text x="92" y="299" font-size="13" fill="#64748b">0</text>
  </svg>
  <p class="eigenvalue-figure__note">The drawing shows a real two-dimensional case; the complex case also involves an overall phase. The vector lengths are arranged for readability, while normalization preserves the direction; here the directions move progressively closer to the blue dominant eigendirection.</p>
</figure>

With a suitable choice of $B$, $z^{(k)}$ can serve as an approximation to an eigenvector associated with an eigenvalue $\lambda$. The **Rayleigh quotient** then gives an approximation to $\lambda$:

$$
R(z^{(k)},B)=\frac{(z^{(k)})^H Bz^{(k)}}{(z^{(k)})^H z^{(k)}}.
$$

The Rayleigh quotient is the complex-valued version of the ratio between the component produced when $B$ acts on a vector and the vector itself. If $z$ is exactly an eigenvector, then

$$
R(z,B)=\frac{z^H(\lambda z)}{z^Hz}=\lambda.
$$

We now study the basic properties of the iteration when $B$ is diagonalizable. Let its eigenvalues be $\lambda_1,\ldots,\lambda_n$. If a vector $x\in\mathbb{C}^n$ has the unique decomposition

$$
x=u+v,
\qquad
u\in\operatorname{Eig}_B(\lambda_i),
\qquad
v\in\bigoplus_{\lambda_j\ne\lambda_i}\operatorname{Eig}_B(\lambda_j)
$$

with $u\ne0$, we say that $x$ has a component in $\operatorname{Eig}_B(\lambda_i)$. The vector $u$ is the component of $x$ in $\operatorname{Eig}_B(\lambda_i)$.

**Theorem 6.2.2.** Let $B\in\mathbb{C}^{n\times n}$ be diagonalizable, with eigenvalues $\lambda_1,\ldots,\lambda_n$, and suppose that

$$
\lambda_1=\cdots=\lambda_r,
\qquad
|\lambda_r|>|\lambda_{r+1}|\ge\cdots\ge|\lambda_n|,
$$

where $r<n$. If the initial vector $z^{(0)}$ has a nonzero component in $\operatorname{Eig}_B(\lambda_1)$, then the vector iteration (6.2) satisfies

$$
R(z^{(k)},B)
=\frac{(z^{(k)})^HBz^{(k)}}{(z^{(k)})^Hz^{(k)}}
=\lambda_1+O(q^k),
\qquad
k\to\infty,
\qquad
q:=\frac{|\lambda_{r+1}|}{|\lambda_1|}<1.
$$

Moreover,

$$
z^{(k)}=\frac{\lambda_1^k}{|\lambda_1|^k}\frac{x_1}{\|x_1\|}+O(q^k),
\qquad
k\ge 1,
$$

where $\|\cdot\|$ may be any vector norm, and $x_1$ denotes the component of $z^{(0)}$ in $\operatorname{Eig}_B(\lambda_1)$.

This conclusion is the usual convergence mechanism of **power iteration**: the component associated with the eigenvalue of largest modulus is multiplied by the largest amplification factor at every step, while the remaining components become relatively smaller. The convergence rate is determined by

$$
q=\frac{|\lambda_{r+1}|}{|\lambda_1|}
$$

and the iteration becomes slower as $q$ approaches $1$, because the dominant and subdominant directions become harder to distinguish.

**Proof (for readers interested in the details).** As before, consider the unnormalized sequence

$$
\widetilde z^{(k+1)}=B\widetilde z^{(k)},
\qquad
\widetilde z^{(0)}=z^{(0)}.
$$

Then, for $k\ge 1$,

$$
z^{(k)}=\frac{\widetilde z^{(k)}}{\|\widetilde z^{(k)}\|}.
$$

The initial vector can be represented as

$$
z^{(0)}=x_1+\sum_{j=r+1}^n x_j,
\qquad
x_j\in\operatorname{Eig}_B(\lambda_j),
\qquad
x_1\ne 0.
$$

Substituting into $\widetilde z^{(k+1)}=B\widetilde z^{(k)}$ gives

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

Because $|\lambda_j/\lambda_1|\le q<1$ for $j>r$, it follows that

$$
\widetilde z^{(k)}=\lambda_1^k\left(x_1+O(q^k)\right).
$$

Therefore,

$$
\begin{aligned}
(\widetilde z^{(k)})^HB\widetilde z^{(k)}
&=(\widetilde z^{(k)})^H\widetilde z^{(k+1)}\\
&=\overline{\lambda_1^k}\lambda_1^{k+1}
\left(x_1+O(q^k)\right)^H\left(x_1+O(q^k)\right)\\
&=\lambda_1|\lambda_1|^{2k}\left(\|x_1\|_2^2+O(q^k)\right),
\end{aligned}
$$

and

$$
(\widetilde z^{(k)})^H\widetilde z^{(k)}
=|\lambda_1|^{2k}\left(\|x_1\|_2^2+O(q^k)\right).
$$

Consequently,

$$
R(z^{(k)},B)=R(\widetilde z^{(k)},B)
=\lambda_1\frac{\|x_1\|_2^2+O(q^k)}{\|x_1\|_2^2+O(q^k)}
=\lambda_1+O(q^k).
$$

Similarly,

$$
\begin{aligned}
z^{(k)}
&=\frac{\widetilde z^{(k)}}{\|\widetilde z^{(k)}\|}
=\frac{\lambda_1^k(x_1+O(q^k))}{|\lambda_1|^k(\|x_1\|+O(q^k))}\\
&=\frac{\lambda_1^k}{|\lambda_1|^k}\frac{x_1}{\|x_1\|}+O(q^k).
\end{aligned}
$$

The phase factor

$$
\frac{\lambda_1^k}{|\lambda_1|^k}
$$

is simply $1$ in the real case when $\lambda_1>0$. In the general complex case, it means that the iterates may change their overall phase as $k$ changes, while their eigendirection remains stable.

**Remark 6.2.3.** Even if $z^{(0)}$ has no component in $\operatorname{Eig}_B(\lambda_1)$, this situation is uncommon for a sufficiently generic choice of the initial vector; in actual computations, roundoff errors will usually introduce such a component. However, if the problem has a special symmetry, a component may remain exactly zero in exact arithmetic, and one cannot rely on roundoff to repair the initial vector.

For a Hermitian matrix, the Rayleigh quotient converges to $\lambda_1$ with order $q^2$.

**Theorem 6.2.4.** Let $B\in\mathbb{C}^{n\times n}$ be Hermitian. Under the assumptions of Theorem 6.2.2, the Rayleigh quotient satisfies

$$
R(z^{(k)},B)
=\frac{(z^{(k)})^HBz^{(k)}}{(z^{(k)})^Hz^{(k)}}
=\lambda_1+O(q^{2k}),
\qquad
k\to\infty,
\qquad
q=\frac{|\lambda_{r+1}|}{|\lambda_1|}<1.
$$

The extra square comes from the orthogonal eigenvector structure of Hermitian matrices: the first-order term in the vector error cancels in the Rayleigh quotient, so the eigenvalue approximation usually converges faster than the eigenvector direction.

### 6.2.2 von Mises Power Iteration and Wielandt Inverse Iteration

Suppose that $A\in\mathbb{C}^{n\times n}$ is given. Different choices of the iteration matrix $B$ lead to different vector iteration methods.

**von Mises power iteration.**

Taking $B=A$ gives the basic vector iteration. Its convergence properties follow directly from Theorems 6.2.2 and 6.2.4. It is suitable for finding the eigenvalue of largest modulus and its eigenvector. If the two largest eigenvalues have very similar moduli, convergence is slow.

**Wielandt inverse iteration.**

A clear drawback of vector iteration is that convergence is slow when the eigenvalues are poorly separated, and the method can only find an eigenvalue of largest modulus. Wielandt inverse iteration overcomes these limitations. To use it, we need a good approximation $\mu$ to an eigenvalue $\lambda_j$ such that

$$
|\lambda_j-\mu|\ll|\lambda_i-\mu|,
\qquad
\lambda_i\ne\lambda_j.
$$

When $\mu\ne\lambda_j$, the matrix

$$
B=(A-\mu I)^{-1}
$$

has eigenvalues

$$
\mu_i=\frac{1}{\lambda_i-\mu}.
$$

Thus $|\mu_j|\gg|\mu_i|$ for every $\mu_i\ne\mu_j$. Moreover, $x_j$ is an eigenvector of $B$ associated with $\mu_j$ if and only if it is an eigenvector of $A$ associated with $\lambda_j$.

The corresponding Wielandt inverse iteration is

$$
z^{(k+1)}=\frac{\widehat z^{(k+1)}}{\|\widehat z^{(k+1)}\|},
\qquad
\widehat z^{(k+1)}=(A-\mu I)^{-1}z^{(k)}.
$$

The idea is simple: originally, the eigenvalue farthest from the origin is the most prominent; after shifting and inverting, the eigenvalue closest to $\mu$ is amplified most strongly. Therefore, once $\mu$ is close to the target eigenvalue, inverse iteration can lock onto an interior eigenvalue.

In practice, one does not explicitly form $(A-\mu I)^{-1}$. Instead, the iteration is implemented as

$$
\text{solve }(A-\mu I)\widehat z^{(k+1)}=z^{(k)},
\qquad
\text{then set }z^{(k+1)}=\frac{\widehat z^{(k+1)}}{\|\widehat z^{(k+1)}\|}.
$$

This distinction is important: explicitly constructing the inverse is usually more expensive and less numerically stable. An actual program factors the fixed matrix $A-\mu I$ once, then repeatedly solves the resulting linear system.

If

$$
q:=\max_{\substack{1\le i\le n\\\lambda_i\ne\lambda_j}}
\frac{|\lambda_j-\mu|}{|\lambda_i-\mu|}<1,
$$

then Theorem 6.2.2 gives the following convergence property for Wielandt inverse iteration:

$$
R\left(z^{(k)},(A-\mu I)^{-1}\right)
=\frac{(z^{(k)})^H\widehat z^{(k+1)}}{(z^{(k)})^Hz^{(k)}}
=\frac{1}{\lambda_j-\mu}+O(q^k),
$$

and

$$
z^{(k)}=\frac{|\lambda_j-\mu|^k}{(\lambda_j-\mu)^k}\frac{x_j}{\|x_j\|}+O(q^k),
$$

where $x_j$ is the component of $z^{(0)}$ in

$$
\operatorname{Eig}_A(\lambda_j)
=\operatorname{Eig}_{(A-\mu I)^{-1}}\left(\frac{1}{\lambda_j-\mu}\right).
$$

If $A$ is also Hermitian, Theorem 6.2.4 gives

$$
R\left(z^{(k)},(A-\mu I)^{-1}\right)
=\frac{(z^{(k)})^H\widehat z^{(k+1)}}{(z^{(k)})^Hz^{(k)}}
=\frac{1}{\lambda_j-\mu}+O(q^{2k}).
$$

Note that inverse iteration requires $A-\mu I$ to be invertible. If $\mu$ is too close to an eigenvalue, the linear system becomes ill-conditioned, but this is also what strongly amplifies the target eigenvector. In practice, the shift is usually generated and updated with the help of the Rayleigh quotient or the QR method.

---

Return to [Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part I]({{ '/en/eigenvalue-problems-part-i/' | relative_url }}).

The third article of Chapter 6 is currently available in Chinese: [Numerical Analysis Lecture (VI), Part III]({{ '/zh/eigenvalue-problems-part-iii/' | relative_url }}).

**Terminology and notation**

- vector iteration: repeatedly apply a matrix and normalize the resulting vector.
- power iteration: the vector iteration used to find an eigenvalue of largest modulus.
- inverse iteration: solve $(A-\mu I)\widehat z=z$ to find an eigenvalue near the shift $\mu$.
- Rayleigh quotient: $R(z,A)=z^HAz/(z^Hz)$, a scalar estimate of an eigenvalue.
- Hermitian matrix: a matrix satisfying $A^H=A$.
- unitary matrix: a matrix satisfying $U^HU=I$.
- Euclidean norm: usually denoted by $\|\cdot\|_2$.

**References**

- [4] R. Plato. *Numerische Mathematik kompakt* (*Compact Numerical Mathematics*). Vieweg Verlag, Braunschweig, 2000. 6.3.2.
- [8] J. Werner. *Numerische Mathematik 2* (*Numerical Mathematics 2*). Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.
