---
title: "Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part I"
lang: "en"
date: 2026-09-12
permalink: /en/eigenvalue-problems-part-i/
zh_link: /zh/eigenvalue-problems-part-i/
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

<a href="{{ page.zh_link }}" class="btn">中文版</a>

It is best to read [Numerical Analysis Lecture (V): Nonlinear Systems of Equations]({{ '/en/nonlinear-equations/' | relative_url }}) first. This is the first article of Chapter 6 and introduces the basic concepts of eigenvalue problems, representative applications, and perturbation theory.

---

## 6.1 The Eigenvalue Problem

In many engineering and physical problems—for example, when studying vibrations in mechanical or electrical systems—it is important to determine the eigenvalues and eigenvectors of a matrix $A\in\mathbb{C}^{n\times n}$. They describe, respectively, the scales or frequencies that can occur in the system and the corresponding directions or shapes. As we will see, discrete processes such as PageRank can also be formulated as eigenvalue problems.

### 6.1.1 Fundamentals

**Definition 6.1.1.** Let $A\in\mathbb{C}^{n\times n}$. If there is a vector $x\in\mathbb{C}^n$ with $x\ne 0$ such that

$$
Ax=\lambda x,
$$

then $\lambda\in\mathbb{C}$ is called an **eigenvalue** of $A$. A vector $x\in\mathbb{C}^n$ satisfying this relation is called the (right) **eigenvector** associated with $\lambda$. The set $\sigma(A)$ of all eigenvalues of $A$ is called the **spectrum** of $A$.

The length of an eigenvector is not intrinsically meaningful: if $x$ is an eigenvector, then every nonzero multiple $cx$ is an eigenvector for the same eigenvalue. What matters is the direction it determines; in a complex vector space, vectors that differ only by an overall complex phase represent the same direction.

The subspace

$$
\operatorname{Eig}_A(\lambda):=\{x\in\mathbb{C}^n:(A-\lambda I)x=0\}
$$

is called the **eigenspace** of $A$ associated with $\lambda$. Its dimension

$$
\gamma(\lambda):=\dim\operatorname{Eig}_A(\lambda)=n-\operatorname{rank}(A-\lambda I)
$$

is called the **geometric multiplicity** of $\lambda$. It is the maximum number of linearly independent eigenvectors associated with $\lambda$.

Clearly, $\lambda$ is an eigenvalue of $A$ if and only if

$$
\chi(\lambda):=\det(A-\lambda I)=0,
$$

that is, if and only if $\lambda$ is a zero of the characteristic polynomial $\chi(\mu)$. This is an $n$th-degree polynomial of the form

$$
\chi(\mu)=(-1)^n\mu^n+(-1)^{n-1}\mu^{n-1}\operatorname{tr}(A)+\cdots+\det(A).
$$

Let $\lambda_1,\ldots,\lambda_k$ be the distinct zeros of $\chi$ in $\mathbb{C}$, that is, the distinct eigenvalues of $A$, and let their multiplicities be $\nu_i$, $i=1,\ldots,k$. Then

$$
\nu_1+\cdots+\nu_k=n,
$$

and $\chi$ factors as

$$
\chi(\mu)=(-1)^n(\mu-\lambda_1)^{\nu_1}\cdots(\mu-\lambda_k)^{\nu_k}.
$$

The number $\nu(\lambda_i)=\nu_i$ is called the **algebraic multiplicity** of $\lambda_i$. One can show that

$$
\gamma(\lambda_i)\le \nu(\lambda_i).
$$

The algebraic multiplicity counts how often a zero is repeated in the characteristic polynomial, whereas the geometric multiplicity is the dimension of the corresponding eigenspace. When the two multiplicities are equal, the eigenvalue has enough linearly independent eigenvectors for that eigenspace; when they differ, the matrix generally cannot be diagonalized using eigenvectors alone.

The following proposition collects several basic properties of eigenvalues and eigenvectors.

**Proposition 6.1.2.** Let $A\in\mathbb{C}^{n\times n}$ be arbitrary.

a) If $\lambda$ is an eigenvalue of $A$, then $\lambda$ is an eigenvalue of $A^T$, while $\overline{\lambda}$ is an eigenvalue of

$$
A^H:=\overline{A}^T.
$$

b) For any nonsingular matrix $T\in\mathbb{C}^{n\times n}$, the matrix similar to $A$,

$$
B:=T^{-1}AT,
$$

has the same characteristic polynomial and the same eigenvalues as $A$. If $x$ is an eigenvector of $A$, then

$$
y:=T^{-1}x
$$

is an eigenvector of $B$.

c) If $A$ is a **Hermitian matrix** (also called a self-adjoint matrix), meaning that $A^H=A$ with $A^H:=\overline{A}^T$, then all eigenvalues of $A$ are real. If $A$ is a **unitary matrix**, meaning that $A^H=A^{-1}$, then every eigenvalue $\lambda$ satisfies $\lvert\lambda\rvert=1$.

Some terminology here is easy to confuse. A Hermitian matrix is a complex matrix that is unchanged by taking the conjugate transpose:

$$
A^H=A.
$$

For a real matrix, conjugation does not change the entries, so a Hermitian matrix reduces to a real symmetric matrix satisfying $A^T=A$. In the notation $A^H$, the superscript $H$ means **conjugate transpose**: first take the complex conjugate of every entry and then transpose the matrix. This is not the same operation as taking the transpose $A^T$ alone.

A **unitary matrix** satisfies

$$
U^HU=UU^H=I,
\qquad
U^{-1}=U^H.
$$

Unitary matrices preserve inner products and lengths in complex vector spaces, so they can be viewed as the complex analogue of rotations and reflections. Orthogonal matrices are the real special case: for $U\in\mathbb{R}^{n\times n}$, unitarity becomes

$$
U^T=U^{-1},
\qquad
U^TU=UU^T=I.
$$

Because unitary transformations preserve the Euclidean norm, they are usually preferred in numerical computation: the transformation does not artificially enlarge vector lengths or substantially worsen errors measured through those lengths.

If a matrix $A\in\mathbb{C}^{n\times n}$ has $n$ linearly independent eigenvectors $x_1,\ldots,x_n$, then $A$ is called **diagonalizable**. Let

$$
T:=(x_1,\ldots,x_n).
$$

Then $T$ is invertible, and if $\lambda_i$ is the eigenvalue associated with $x_i$, then

$$
T^{-1}AT=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)=:D.
$$

Indeed,

$$
AT=(\lambda_1x_1,\ldots,\lambda_nx_n)=TD.
$$

The matrix $B=T^{-1}AT$ is called a **similarity transformation** of $A$. It changes the coordinate representation of the matrix but not its eigenvalues. If $T$ is also unitary, the change of coordinates preserves inner products and the Euclidean norm as well.

Hermitian matrices $A\in\mathbb{C}^{n\times n}$, that is, matrices satisfying $A^H=A$, and their real symmetric counterparts play an important role here. Every Hermitian matrix can be diagonalized with the help of a unitary matrix $U$:

$$
U^{-1}AU=D,
\qquad
U^H=U^{-1}.
$$

If $A=A^T$ is real, $U\in\mathbb{R}^{n\times n}$ can be chosen to be orthogonal, so that

$$
U^{-1}AU=D,
\qquad
U^T=U^{-1}.
$$

This is the **spectral theorem** for Hermitian matrices: it guarantees not only that the eigenvalues are real, but also that there is an orthonormal set of eigenvectors. This additional structure is one reason why the **Rayleigh quotient** has better convergence behavior later on.

### 6.1.2 Examples

**Example 6.1.3 (Fundamental and resonant frequencies of a vibrating structure).** Consider a mechanical structure, such as a vehicle body, bridge, or building. We want to know which frequencies it can vibrate at and what the corresponding vibration shapes look like. The same type of model arises in electrical circuits. These questions are important in vibration and noise control and in the design of structures such as buildings and aircraft.

Let $y_i(t)\in\mathbb{R}^3$ denote the displacement at time $t$ of a point $x_i\in\mathbb{R}^3$ on the structure, where $1\le i\le n$. In the undamped vibration problem driven by an external force $f(t)$, let

$$
y(t)=(y_i(t))_{1\le i\le n}.
$$

The initial-value problem is

$$
My''(t)=-Ay(t)+f(t),
\qquad
y(0)=y^{(0)},
\qquad
y'(0)=y^{(1)},
$$

where the mass matrix $M\in\mathbb{R}^{3n\times 3n}$ is invertible and the stiffness matrix is $A\in\mathbb{R}^{3n\times 3n}$. The solution of this problem is the sum of a particular solution of the nonhomogeneous equation and the general solution of the homogeneous equation. The homogeneous equation is

$$
My''(t)=-Ay(t),
$$

which is equivalent to

$$
y''(t)=-M^{-1}Ay(t).
$$

It can be shown that, with $B:=M^{-1}A$, the matrix $B$ is diagonalizable and has real eigenvalues

$$
0<\lambda_1\le\lambda_2\le\cdots\le\lambda_{3n}
$$

with corresponding eigenvectors $v_1,\ldots,v_{3n}$. Since $Bv_i=\lambda_i v_i$, the functions

$$
\phi_i(t):=\left(a_i\sin(\sqrt{\lambda_i}\,t)+b_i\cos(\sqrt{\lambda_i}\,t)\right)v_i
$$

are all solutions of the homogeneous equation, because

$$
\phi_i''(t)
=-\lambda_i\left(a_i\sin(\sqrt{\lambda_i}\,t)+b_i\cos(\sqrt{\lambda_i}\,t)\right)v_i
=-\lambda_i\phi_i(t)=-B\phi_i(t).
$$

Thus, $\phi_i(t)$ is one **mode of vibration** of the structure. The angular frequency of the $i$th mode is $\sqrt{\lambda_i}$, and its ordinary frequency is

$$
\frac{\sqrt{\lambda_i}}{2\pi}.
$$

The corresponding deformation shape of the structure is given by the eigenvector $v_i$. The smallest eigenvalue usually corresponds to the lowest frequency, the fundamental frequency that is most easily excited by an external force.

**Example 6.1.4 (Google's PageRank algorithm).** Consider $N$ web pages. Suppose page $i$ contains $k_i$ links to other pages. The probability of moving from page $i$ to page $j$ can be modeled by

$$
p_{ij}=
\begin{cases}
\displaystyle\frac{\alpha}{k_i}+\frac{1-\alpha}{N}, & \text{if page $i$ contains a link to page $j$},\\[6pt]
\displaystyle\frac{1-\alpha}{N}, & \text{if page $i$ does not contain a link to page $j$}.
\end{cases}
$$

Usually $\alpha=0.85$ is chosen. Let

$$
P=(p_{ij})_{1\le i,j\le N}.
$$

The page weights are given by a vector $\pi\in\mathbb{R}^N$, called the **stationary distribution**, satisfying

$$
\pi=P^T\pi,
\qquad
\sum_{i=1}^N\pi_i=1,
\qquad
\pi_i\ge 0.
$$

Intuitively, if $\pi_i$ represents the average proportion of Internet users staying on page $i$, then this proportion remains unchanged after users move between pages according to the transition probabilities $p_{ij}$. Once the system reaches equilibrium, $\pi_i$ is therefore the average proportion of users staying on page $i$.

The key point is again an eigenvalue problem: the stationary distribution is an eigenvector of $P^T$ associated with the eigenvalue $1$, normalized so that its entries sum to $1$. The rows of a stochastic matrix sum to $1$, so $1$ is an eigenvalue; adding the random-jump term helps make the stationary distribution unique and positive.

### 6.1.3 Basic Concepts in Numerical Methods

The numerical methods for computing eigenvalues and eigenvectors discussed below can be divided roughly into two classes: methods based on **vector iteration** and methods based on **similarity transformations**.

**Vector iteration**

The first class consists of vector iterations, which typically have the form

$$
x^{(k+1)}=\frac{Bx^{(k)}}{\lVert Bx^{(k)}\rVert},
\qquad
k=0,1,\ldots,
$$

where $x^{(0)}$ is the initial vector, $B$ is the iteration matrix, and $\lVert\cdot\rVert$ is some vector norm. At every step, the vector is multiplied by $B$ and then normalized so that its length does not grow or shrink without bound.

**Reducing the problem to a simpler form by similarity transformations**

According to Proposition 6.1.2, a similarity transformation

$$
B=T^{-1}AT
$$

preserves the eigenvalues of $A$. Moreover, if $y$ is an eigenvector of $B$, then $x=Ty$ is an eigenvector of the original matrix $A$.

Thus, we can use a sequence of similarity transformations

$$
A^{(0)}:=A\longrightarrow A^{(1)}\longrightarrow\cdots,
\qquad
A^{(k+1)}=T_k^{-1}A^{(k)}T_k
\tag{6.1}
$$

to reduce $A$ to a simpler form, making its eigenvalues and eigenvectors easier to compute. This chapter focuses on the QR method, which is one of the fastest methods for solving eigenvalue problems.

**The QR method**

The QR method applies unitary matrices $T_i$ so that the entries in the lower-left part of $A^{(k)}$ gradually approach zero; at the same time, the diagonal entries of $A^{(k)}$ approach the eigenvalues of $A$. In other words, it tries to transform the matrix into upper-triangular form, because the eigenvalues of a triangular matrix appear directly on its diagonal. The QR method will be developed in detail in the third article.

### 6.1.4 Perturbation Theory for Eigenvalue Problems

Matrices in numerical computation are usually known only approximately, or rounding errors are introduced during computation. We therefore need to know how far the eigenvalues move when the entries of a matrix change slightly.

For an upper- or lower-triangular matrix, the eigenvalues are the diagonal entries. As mentioned above, the QR method uses similarity transformations to reduce the off-diagonal part, in particular the strictly lower-triangular part. Perturbation theory for eigenvalues provides bounds that measure how close the diagonal entries are to the eigenvalues.

We begin with a basic result.

**Theorem 6.1.5.** Let $\lambda_i(A)$, $i=1,\ldots,n$, be the eigenvalues of $A\in\mathbb{C}^{n\times n}$ arranged according to some rule—for example, in increasing order of their real parts, breaking ties by increasing imaginary parts. Then the mapping

$$
A\in\mathbb{C}^{n\times n}\longmapsto \lambda_i(A),
\qquad
i=1,\ldots,n,
$$

is continuous. In other words, the eigenvalues vary continuously with the matrix.

**Proof.** See, for example, Werner [8].

Gershgorin disks provide an important eigenvalue inclusion criterion.

**Theorem 6.1.6.** Let $A=(a_{ij})\in\mathbb{C}^{n\times n}$ be arbitrary.

a) We have

$$
\sigma(A)\subseteq\bigcup_{i=1}^n K_i,
$$

where the Gershgorin disks are

$$
K_i:=\left\{\mu\in\mathbb{C}:\lvert\mu-a_{ii}\rvert\le\sum_{\substack{j=1\\j\ne i}}^n\lvert a_{ij}\rvert\right\},
\qquad
i=1,\ldots,n.
$$

b) Suppose that the union $G_1$ of $k$ Gershgorin disks is disjoint from the union $G_2$ of the remaining $n-k$ Gershgorin disks. Then $G_1$ contains exactly $k$ eigenvalues of $A$, while $G_2$ contains exactly $n-k$ eigenvalues.

**Interpretation.** For row $i$, the diagonal entry $a_{ii}$ is the center of the disk, and the sum of the absolute values of the other entries in that row is its radius. Part a) says that every eigenvalue of the matrix lies in at least one of these disks. The disks are only candidate regions; an eigenvalue does not have to lie at a disk center. If a group of disks is completely separated from the remaining disks, part b) also determines how many eigenvalues lie in each group, counted with algebraic multiplicity.

In the notation above, $\mu$ is a generic point in the complex plane, $\sigma(A)$ is the spectrum of $A$, and $\bigcup_{i=1}^nK_i$ denotes the union of all $n$ disks. The condition $G_1\cap G_2=\varnothing$ means that the two groups of disks have no common point.

<figure class="eigenvalue-figure">
  <figcaption class="eigenvalue-figure__caption">Gershgorin disks: diagonal entries give the centers, and the remaining entries in each row determine the radius</figcaption>
  <svg viewBox="0 0 760 360" role="img" aria-labelledby="eigen-gershgorin-en-title eigen-gershgorin-en-desc">
    <title id="eigen-gershgorin-en-title">Gershgorin disks and possible eigenvalues</title>
    <desc id="eigen-gershgorin-en-desc">The complex plane contains three disks centered at diagonal entries of a matrix. Dark points indicate illustrative possible eigenvalues inside the union of the disks; the disks are inclusion regions, not the eigenvalues themselves.</desc>
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
    <text x="172" y="78" font-size="13" fill="#475569">Union of disks: candidate region</text>
    <line x1="174" y1="84" x2="229" y2="135" stroke="#475569" stroke-width="1.2"></line>
    <text x="560" y="306" font-size="13" fill="#475569">Dark points: illustrative eigenvalues</text>
    <circle cx="545" cy="301" r="4.5" fill="#111827"></circle>
  </svg>
  <p class="eigenvalue-figure__note">The center is $a_{ii}$, and the radius is the sum of the absolute values of the off-diagonal entries in row $i$. The dark points only illustrate possible eigenvalues; they do not mean that every disk center is an eigenvalue.</p>
</figure>

The following result applies to diagonalizable matrices.

**Theorem 6.1.7 (Bauer–Fike).** Let $A\in\mathbb{C}^{n\times n}$ be diagonalizable, that is,

$$
T^{-1}AT=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)=:D.
$$

Then, for every matrix $\Delta A\in\mathbb{C}^{n\times n}$,

$$
\forall\mu\in\sigma(A+\Delta A):
\quad
\min_{i=1,\ldots,n}\lvert\mu-\lambda_i\rvert
\le \operatorname{cond}_2(T)\lVert\Delta A\rVert_2.
$$

Here, $\lVert\cdot\rVert_2$ is the matrix norm induced by the Euclidean norm, and

$$
\operatorname{cond}_2(T):=\lVert T\rVert_2\lVert T^{-1}\rVert_2
$$

is the corresponding **condition number** of $T$. The condition number measures how strongly a coordinate transformation can amplify errors: if the columns of $T$ are nearly linearly dependent, $T^{-1}$ can be very large, and the eigenvalues can be highly sensitive to perturbations.

**Remark 6.1.8.** If $A$ is Hermitian, then $T$ can be chosen to be unitary, in which case

$$
\operatorname{cond}_2(T)=1.
$$

In this sense, the eigenvalue problem for a Hermitian matrix is well-conditioned: small perturbations of the matrix are not additionally amplified by the eigenvector basis.

---

Return to [Numerical Analysis Lecture (V): Nonlinear Systems of Equations]({{ '/en/nonlinear-equations/' | relative_url }}).

**Terminology and notation**

- eigenvalue, eigenvector, spectrum: the basic terms for the eigenvalue problem.
- Hermitian matrix: a matrix satisfying $A^H=A$, also called a self-adjoint matrix.
- unitary matrix: a matrix satisfying $U^HU=I$; the real special case is an orthogonal matrix.
- Euclidean norm: usually denoted by $\lVert\cdot\rVert_2$.
- $A^H$: the conjugate transpose, $A^H=\overline A^T$.
- stationary distribution: a probability distribution unchanged by the transition process.
- Gershgorin disk: the disk centered at $a_{ii}$ with radius equal to the sum of the absolute values of the off-diagonal entries in row $i$.
- Rayleigh quotient: a scalar quantity used to estimate eigenvalues, especially for Hermitian matrices.
- condition number: a measure of how strongly errors or perturbations can be amplified.

**References**

- [4] R. Plato. *Numerische Mathematik kompakt* (*Compact Numerical Mathematics*). Vieweg Verlag, Braunschweig, 2000. 6.3.2.
- [8] J. Werner. *Numerische Mathematik 2* (*Numerical Mathematics 2*). Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.
