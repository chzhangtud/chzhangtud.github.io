---
title: "Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part III"
lang: "en"
date: 2026-09-12
permalink: /en/eigenvalue-problems-part-iii/
zh_link: /zh/eigenvalue-problems-part-iii/
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

<a href="{{ page.zh_link }}" class="btn">中文版</a>

It is best to read [Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part II]({{ '/en/eigenvalue-problems-part-ii/' | relative_url }}) first. This is the third article of Chapter 6 and introduces the basic properties and convergence of the QR method, shift techniques, and Householder transformations.

---

## 6.3 The QR Method

The previous article showed that one way to approach an eigenvalue problem is to use similarity transformations to convert a matrix into a simpler form. The QR method follows exactly this idea: at each step, it factors the current matrix into a unitary matrix and an upper-triangular matrix, then exchanges their order.

The QR decomposition is written as

$$
A=QR,
$$

where $Q$ is unitary and $R$ is upper triangular. A unitary matrix preserves the Euclidean norm, which makes it more stable in numerical computation than a general elimination transformation; the eigenvalues of an upper-triangular matrix are read directly from its diagonal.

The Francis QR iteration described below is the basis of many efficient methods for computing eigenvalues and eigenvectors. Starting from $A^{(1)}=A\in\mathbb{C}^{n\times n}$, the QR method applies a unitary similarity transformation of the following form.

**Algorithm 6.3.1: QR method.** Let $A\in\mathbb{C}^{n\times n}$ be given.

0. Set $A^{(1)}:=A$.

1. For $l=1,2,\ldots$, compute

$$
A^{(l)}=:Q_lR_l,
\qquad
Q_l\in\mathbb{C}^{n\times n}\text{ is unitary},
\qquad
R_l\in\mathbb{C}^{n\times n}\text{ is upper triangular},
$$

$$
A^{(l+1)}:=R_lQ_l.
\tag{6.4}
$$

Thus, each step requires the QR decomposition

$$
A^{(l)}=Q_lR_l,
\qquad
R_l\text{ is upper triangular},
\qquad
Q_l\text{ is unitary},
\qquad
Q_l^H=Q_l^{-1}.
$$

This step is not merely “multiplying the same two matrices in a different order.” Since $A^{(l)}=Q_lR_l$, we have

$$
R_lQ_l=Q_l^{-1}A^{(l)}Q_l.
$$

Therefore, $A^{(l+1)}$ is similar to $A^{(l)}$, so the eigenvalues are preserved exactly; what changes is the distribution of the off-diagonal entries.

<figure class="qr-figure">
  <figcaption class="qr-figure__caption">The core QR iteration: factor, exchange, and obtain a similar matrix</figcaption>
  <svg viewBox="0 0 820 330" role="img" aria-labelledby="qr-flow-en-title qr-flow-en-desc">
    <title id="qr-flow-en-title">QR iteration flow</title>
    <desc id="qr-flow-en-desc">The current matrix A with superscript l is first factored into the unitary matrix Q_l and the upper-triangular matrix R_l. Computing R_l Q_l gives the next matrix, which is similar to the current one, so the eigenvalues remain unchanged.</desc>
    <defs>
      <marker id="qr-flow-en-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#334155"></path>
      </marker>
    </defs>
    <rect x="42" y="112" width="132" height="72" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2"></rect>
    <text x="108" y="146" text-anchor="middle" font-size="23" fill="#1e3a8a">A⁽ˡ⁾</text>
    <text x="108" y="168" text-anchor="middle" font-size="13" fill="#1e3a8a">current matrix</text>
    <line x1="174" y1="148" x2="250" y2="148" stroke="#334155" stroke-width="2" marker-end="url(#qr-flow-en-arrow)"></line>
    <rect x="250" y="94" width="168" height="108" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"></rect>
    <text x="334" y="128" text-anchor="middle" font-size="19" fill="#92400e">A⁽ˡ⁾ = QₗRₗ</text>
    <text x="334" y="153" text-anchor="middle" font-size="13" fill="#92400e">Qₗ: unitary</text>
    <text x="334" y="174" text-anchor="middle" font-size="13" fill="#92400e">Rₗ: upper triangular</text>
    <line x1="418" y1="148" x2="494" y2="148" stroke="#334155" stroke-width="2" marker-end="url(#qr-flow-en-arrow)"></line>
    <rect x="494" y="112" width="132" height="72" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"></rect>
    <text x="560" y="146" text-anchor="middle" font-size="21" fill="#166534">RₗQₗ</text>
    <text x="560" y="168" text-anchor="middle" font-size="13" fill="#166534">exchange product</text>
    <line x1="626" y1="148" x2="700" y2="148" stroke="#334155" stroke-width="2" marker-end="url(#qr-flow-en-arrow)"></line>
    <rect x="700" y="112" width="78" height="72" rx="10" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"></rect>
    <text x="739" y="146" text-anchor="middle" font-size="20" fill="#5b21b6">A⁽ˡ⁺¹⁾</text>
    <text x="739" y="168" text-anchor="middle" font-size="12" fill="#5b21b6">similar</text>
    <path d="M739 190 C739 260 108 260 108 190" fill="none" stroke="#64748b" stroke-width="1.7" stroke-dasharray="7 5" marker-end="url(#qr-flow-en-arrow)"></path>
    <text x="410" y="286" text-anchor="middle" font-size="14" fill="#475569">A⁽ˡ⁺¹⁾ = Qₗ⁻¹ A⁽ˡ⁾ Qₗ; eigenvalues unchanged</text>
  </svg>
  <p class="qr-figure__note">Every step is a unitary similarity transformation, so the spectrum does not change. The goal is to make the matrix increasingly close to upper triangular, so that its eigenvalues can be read from the diagonal.</p>
</figure>

This decomposition can be computed with the Householder method, which is introduced briefly at the end of this article for interested readers.

### 6.3.1 Basic Properties of the QR Method

First observe that (6.4) indeed generates a sequence of pairwise unitarily similar matrices $A^{(l)}$.

**Lemma 6.3.2.** Let $Q_l$ and $R_l$ be produced by Algorithm 6.3.1, and define

$$
Q_{1\ldots l}:=Q_1Q_2\cdots Q_l,
\qquad
R_{l\ldots 1}:=R_lR_{l-1}\cdots R_1.
$$

Then

$$
A^{(l+1)}=Q_l^{-1}A^{(l)}Q_l
=Q_{1\ldots l}^{-1}AQ_{1\ldots l},
\qquad
l=1,2,\ldots.
$$

**Proof.** Equation (6.4) gives $R_l=Q_l^{-1}A^{(l)}$, and therefore

$$
A^{(l+1)}=R_lQ_l=Q_l^{-1}A^{(l)}Q_l.
$$

Induction gives

$$
A^{(l+1)}=Q_l^{-1}\cdots Q_1^{-1}A^{(1)}Q_1\cdots Q_l
=Q_{1\ldots l}^{-1}AQ_{1\ldots l}.
$$

Thus, QR iteration does not change the eigenvalues. On the other hand, if the strictly lower-triangular part of the matrix becomes small, the limit approaches an upper-triangular matrix. This is the reason that the diagonal entries converge to the eigenvalues.

### 6.3.2 Convergence of the QR Method

We first state a result for a matrix whose eigenvalue moduli are separated. Under suitable conditions, after a unitary diagonal scaling of the form $S_l^{-1}A^{(l)}S_l$, the sequence generated by QR iteration converges to an upper-triangular matrix $U$. The convergence rate depends on the separation between the eigenvalue moduli.

**Theorem 6.3.3.** Let $A\in\mathbb{C}^{n\times n}$ be nonsingular, with eigenvalues strictly separated in modulus:

$$
|\lambda_1|>|\lambda_2|>\cdots>|\lambda_n|.
$$

Let $v_1,\ldots,v_n$ be the corresponding eigenvectors, and suppose that the inverse of

$$
T=(v_1,\ldots,v_n)
$$

admits an LR decomposition without row exchanges. Then the QR method in Algorithm 6.3.1 satisfies

$$
A^{(l)}=S_lUS_l^{-1}+O(q^{l-1}),
\qquad
l\to\infty,
\qquad
q:=\max_{j=1,\ldots,n-1}\left|\frac{\lambda_{j+1}}{\lambda_j}\right|,
$$

where $U$ is the upper-triangular matrix

$$
U=
\begin{pmatrix}
\lambda_1&*&\cdots&*\\
&\ddots&\ddots&\vdots\\
&&\ddots&*\\
&&&\lambda_n
\end{pmatrix},
$$

and $S_l=\operatorname{diag}(\sigma_1^{(l)},\ldots,\sigma_n^{(l)})$ is a unitary phase matrix satisfying $\lvert\sigma_i^{(l)}\rvert=1$. In particular, if $a_{11}^{(l)},\ldots,a_{nn}^{(l)}$ are the diagonal entries of $A^{(l)}$, then

$$
|a_{ii}^{(l)}-\lambda_i|=O(q^{l-1}).
$$

**Proof.** See, for example, Plato [4].

The matrix $S_l$ simply multiplies each coordinate component by a complex number of modulus $1$, which amounts to adjusting its phase without changing its length. The central message of the theorem is that stronger separation of the eigenvalue moduli makes $q$ smaller and causes the off-diagonal entries to decay faster.

**Remark 6.3.4.**

- The corresponding eigenvectors can be computed by inverse vector iteration, using the diagonal entries of $A^{(l)}$ as the shift $\mu$ at each step.

- If $T^{-1}$ admits an LR decomposition only after row exchanges, the QR method still converges, but the eigenvalues appearing on the diagonal of the limiting matrix $U$ may occur in a different order.

- If not all eigenvalues are separated in modulus, for example

  $$
  |\lambda_1|>\cdots>|\lambda_r|=|\lambda_{r+1}|>\cdots>|\lambda_n|,
  $$

  which may occur when a real matrix $A$ has a pair of conjugate complex eigenvalues, then $S_l^{-1}A^{(l)}S_l$ converges outside the region marked by $\times$ to a matrix of the following form:

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

  The two eigenvalues of the matrix block

  $$
  \begin{pmatrix}
  a_{r,r}^{(l)}&a_{r,r+1}^{(l)}\\
  a_{r+1,r}^{(l)}&a_{r+1,r+1}^{(l)}
  \end{pmatrix}
  $$

  converge to $\lambda_r$ and $\lambda_{r+1}$. This explains why, when complex eigenvalues occur as a conjugate pair, the algorithm may naturally retain a real $2\times2$ block instead of placing the two complex eigenvalues separately on the real diagonal.

- When the eigenvalue separation is poor, QR iteration converges very slowly. Shift techniques can greatly accelerate the convergence of the last row toward $(0,\ldots,0,\lambda_n)$; we introduce this technique next.

### 6.3.3 Shift Techniques

A more precise analysis shows that the last row of $A^{(l)}$ has the form

$$
\left(O\left(\left|\frac{\lambda_n}{\lambda_{n-1}}\right|^{l-1}\right),a_{nn}^{(l)}\right).
$$

Therefore, when $\lvert\lambda_n\rvert\ll\lvert\lambda_{n-1}\rvert$, the entries $a_{n,j}^{(l)}$ for $1\le j<n$ tend very quickly to $0$, while $a_{nn}^{(l)}$ tends very quickly to $\lambda_n$. Once $\lambda_n$ has been determined accurately, one can switch to the $(n-1)\times(n-1)$ leading submatrix of $A^{(l)}$ to compute $\lambda_{n-1}$.

To increase the separation between $\lambda_n$ and $\lambda_{n-1}$, apply the QR method to $A^{(l)}-\mu_lI$ at every step, where $\mu_l\approx\lambda_n$, and then correct for the shift. In other words, instead of computing (6.4), use the shift $\mu_l\approx\lambda_n$ to compute

$$
A^{(l)}-\mu_lI=:Q_lR_l,
\qquad
Q_l\in\mathbb{C}^{n\times n}\text{ is unitary},
\qquad
R_l\in\mathbb{C}^{n\times n}\text{ is upper triangular},
$$

$$
A^{(l+1)}:=R_lQ_l+\mu_lI.
$$

It is easy to verify that we still have

$$
A^{(l+1)}=Q_l^{-1}A^{(l)}Q_l.
$$

The role of a shift can be understood as first translating the entire spectrum so that the target eigenvalue is near the origin, and then isolating it more quickly through the QR factorization and exchange product. The shift does not change the final eigenvalues because $\mu_lI$ is added back at the end.

<figure class="qr-figure">
  <figcaption class="qr-figure__caption">One shifted QR step: shift the spectrum, then iterate</figcaption>
  <svg viewBox="0 0 820 300" role="img" aria-labelledby="qr-shift-en-title qr-shift-en-desc">
    <title id="qr-shift-en-title">Shifted QR iteration flow</title>
    <desc id="qr-shift-en-desc">After subtracting the shift times the identity matrix, the matrix is factored by QR, RQ is computed, and the shift times the identity is added back to obtain the next matrix, which is unitarily similar to the original matrix.</desc>
    <defs>
      <marker id="qr-shift-en-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#334155"></path>
      </marker>
    </defs>
    <rect x="26" y="98" width="168" height="76" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2"></rect>
    <text x="110" y="130" text-anchor="middle" font-size="18" fill="#1e3a8a">A⁽ˡ⁾ − μₗI</text>
    <text x="110" y="153" text-anchor="middle" font-size="13" fill="#1e3a8a">move target eigenvalue near 0</text>
    <line x1="194" y1="136" x2="267" y2="136" stroke="#334155" stroke-width="2" marker-end="url(#qr-shift-en-arrow)"></line>
    <rect x="267" y="98" width="145" height="76" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"></rect>
    <text x="339" y="130" text-anchor="middle" font-size="19" fill="#92400e">QₗRₗ</text>
    <text x="339" y="153" text-anchor="middle" font-size="13" fill="#92400e">QR factorization</text>
    <line x1="412" y1="136" x2="485" y2="136" stroke="#334155" stroke-width="2" marker-end="url(#qr-shift-en-arrow)"></line>
    <rect x="485" y="98" width="145" height="76" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"></rect>
    <text x="557" y="130" text-anchor="middle" font-size="19" fill="#166534">RₗQₗ + μₗI</text>
    <text x="557" y="153" text-anchor="middle" font-size="13" fill="#166534">exchange and shift back</text>
    <line x1="630" y1="136" x2="703" y2="136" stroke="#334155" stroke-width="2" marker-end="url(#qr-shift-en-arrow)"></line>
    <rect x="703" y="98" width="91" height="76" rx="10" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"></rect>
    <text x="748" y="130" text-anchor="middle" font-size="18" fill="#5b21b6">A⁽ˡ⁺¹⁾</text>
    <text x="748" y="153" text-anchor="middle" font-size="12" fill="#5b21b6">faster separation</text>
    <text x="410" y="238" text-anchor="middle" font-size="14" fill="#475569">A⁽ˡ⁺¹⁾ = Qₗ⁻¹ A⁽ˡ⁾ Qₗ; the shift changes speed, not the spectrum</text>
  </svg>
  <p class="qr-figure__note">If $\mu_l$ is already close to the target eigenvalue, the corresponding eigenvalue of $A^{(l)}-\mu_lI$ is close to $0$. During the shifted iteration, this eigendirection can therefore be separated more easily.</p>
</figure>

**A common shift strategy.** An efficient shift strategy is to choose $\mu_l$ as the eigenvalue closest to $a_{n,n}^{(l)}$ among the eigenvalues of

$$
\begin{pmatrix}
a_{n-1,n-1}^{(l)}&a_{n-1,n}^{(l)}\\
a_{n,n-1}^{(l)}&a_{n,n}^{(l)}
\end{pmatrix}.
$$

If the distances are equal, choose the eigenvalue with positive imaginary part.

The shifted QR method can quickly produce a matrix $A^{(l)}$ whose last row is highly accurate as an approximation to $(0,\ldots,0,\lambda_n)$. One then applies the shifted QR method to the upper-left $(n-1)\times(n-1)$ submatrix of $A^{(l)}$ to compute $\lambda_{n-1}$, and so on. This process of reducing the problem size step by step is usually called **deflation**.

**Remark 6.3.5.** Shifted QR iteration is currently regarded as one of the best iterative methods for solving the complete eigenvalue problem. Efficient implementations usually first reduce the matrix to Hessenberg form and use Francis's implicit-shift strategy to reduce the cost of each step; the basic formulas here are sufficient to explain the convergence idea.

**Computing eigenvectors.** Eigenvectors can still be computed by inverse vector iteration, using the eigenvalues obtained from the QR method as the shift $\mu$.

### 6.3.4 Computing the QR Decomposition (for Interested Readers)

We finish by introducing a numerical method for computing a QR decomposition. For $B\in\mathbb{C}^{n\times n}$, find a unitary matrix $Q\in\mathbb{C}^{n\times n}$ and an upper-triangular matrix $R\in\mathbb{C}^{n\times n}$ such that

$$
B=QR.
\tag{6.5}
$$

**Computing the QR decomposition with Householder transformations**

Householder transformations compute (6.5) in $n-1$ steps. Each step processes one column below the current diagonal and uses a unitary transformation to turn all remaining entries in that column into $0$ simultaneously.

**Initialization**

$$
B^{(0)}:=B=
\begin{pmatrix}
*&\cdots\\
b^{(0)}&\ddots\\
*&\cdots
\end{pmatrix}.
$$

**Step 0.** Determine the unitary matrix $T_0$ (see (6.7) and (6.8)) such that

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

**Step 1.** Determine the unitary matrix $T_1$ (see (6.7) and (6.8)) such that

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

**Step $k$, $k=2,\ldots,n-2$.** Determine the unitary matrix $T_k$ (see (6.7) and (6.8)) such that

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

and write it in block form as

$$
B^{(k+1)}=
\begin{pmatrix}
B_1^{(k+1)}&B_2^{(k+1)}\\
0&0&b^{(k+1)}&B_3^{(k+1)}\\
0&0&&
\end{pmatrix}.
$$

The purpose of this block notation is only to mark the processed upper-left block and the trailing part that still has to be processed. Each step zeros the entries below the diagonal in one column without disturbing the entries that have already been zeroed.

<figure class="qr-figure">
  <figcaption class="qr-figure__caption">Householder transformation: reflecting a column vector onto a coordinate axis</figcaption>
  <svg viewBox="0 0 820 340" role="img" aria-labelledby="qr-householder-en-title qr-householder-en-desc">
    <title id="qr-householder-en-title">Householder reflection maps a vector to a coordinate-axis direction</title>
    <desc id="qr-householder-en-desc">In a two-dimensional real schematic, the vector b points up and to the right, while the Householder reflection maps it to the negative first coordinate-axis direction. The transformation preserves length, changes only direction, and can zero the entries below the diagonal in a matrix column.</desc>
    <defs>
      <marker id="qr-householder-en-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#334155"></path>
      </marker>
    </defs>
    <line x1="94" y1="252" x2="360" y2="252" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-en-arrow)"></line>
    <line x1="94" y1="286" x2="94" y2="48" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-en-arrow)"></line>
    <line x1="94" y1="252" x2="283" y2="126" stroke="#2563eb" stroke-width="3" marker-end="url(#qr-householder-en-arrow)"></line>
    <text x="288" y="120" font-size="16" fill="#1d4ed8">b</text>
    <path d="M185 252 A91 91 0 0 0 163 204" fill="none" stroke="#2563eb" stroke-width="1.5"></path>
    <text x="163" y="226" font-size="13" fill="#1d4ed8">direction</text>
    <line x1="94" y1="252" x2="340" y2="252" stroke="#dc2626" stroke-width="3" stroke-dasharray="8 5" marker-end="url(#qr-householder-en-arrow)"></line>
    <text x="282" y="275" font-size="16" fill="#b91c1c">H b = −‖b‖₂ e₁</text>
    <line x1="428" y1="252" x2="758" y2="252" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-en-arrow)"></line>
    <line x1="470" y1="286" x2="470" y2="48" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#qr-householder-en-arrow)"></line>
    <line x1="470" y1="252" x2="702" y2="252" stroke="#dc2626" stroke-width="3" stroke-dasharray="8 5" marker-end="url(#qr-householder-en-arrow)"></line>
    <text x="566" y="226" font-size="15" fill="#b91c1c">retain only the first component</text>
    <text x="520" y="310" font-size="14" fill="#475569">all other components become 0</text>
    <text x="50" y="67" font-size="14" fill="#475569">before reflection</text>
    <text x="431" y="67" font-size="14" fill="#475569">after reflection</text>
    <text x="105" y="274" font-size="13" fill="#64748b">0</text>
    <text x="481" y="274" font-size="13" fill="#64748b">0</text>
  </svg>
  <p class="qr-figure__note">The two-dimensional drawing only illustrates the geometry. In the actual algorithm, $H_k$ acts on a trailing subspace of the matrix and maps the current column vector to a coordinate-axis direction, eliminating several entries at once.</p>
</figure>

**Result**

$$
R:=B^{(n-1)},
\qquad
Q:=(T_{n-2}\cdots T_0)^H=T_0^H\cdots T_{n-2}^H.
$$

**Method explanation.** Indeed, $R=B^{(n-1)}$ is upper triangular, while

$$
Q=T_0^H\cdots T_{n-2}^H
$$

is a product of unitary matrices and is therefore unitary as well. Furthermore,

$$
R=B^{(n-1)}=T_{n-2}\cdots T_0B=Q^HB,
$$

so

$$
QR=B.
$$

**Computing the transformation $T_k$**

It remains to explain how to compute $T_k$. In the Householder method, each $T_k$ is chosen as

$$
T_k=
\begin{pmatrix}
I_k&0\\
0&H_k
\end{pmatrix},
\tag{6.7}
$$

where $I_k$ is the identity matrix in $\mathbb{R}^{k\times k}$ and $H_k\in\mathbb{R}^{(n-k)\times(n-k)}$ is a Householder transformation of the form

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
1, & \text{if }b_1^{(k)}=0,\\[2pt]
\displaystyle\frac{b_1^{(k)}}{|b_1^{(k)}|}, & \text{otherwise}.
\end{cases}
\tag{6.8}
$$

Although the block notation above uses real identity matrices, the formula itself also applies to complex vectors; in that case, $w_k^H$ must use the conjugate transpose. The parameter $\sigma_k$ is chosen as the phase of the first entry to avoid severe cancellation during subtraction.

A Householder matrix can be viewed as a reflection across a hyperplane. It satisfies

$$
H_k^H=H_k,
\qquad
H_k^HH_k=I,
$$

so it is both Hermitian and unitary. With this choice, one can show that

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

It follows that each $B^{(k+1)}$ indeed has the form shown in (6.6). Since every step uses a unitary transformation, it does not amplify the Euclidean norm in exact arithmetic; this is one of the main reasons Householder QR is more robust than direct Gram–Schmidt orthogonalization.

---

Return to [Numerical Analysis Lecture (VI): Methods for Computing Eigenvalues and Eigenvectors, Part II]({{ '/en/eigenvalue-problems-part-ii/' | relative_url }}).

**Terminology and notation**

- QR decomposition: $A=QR$, where $Q$ is unitary and $R$ is upper triangular.
- shift: a parameter used to perform QR iteration on $A-\mu I$ before adding $\mu I$ back.
- Hessenberg form: a matrix whose entries below the first subdiagonal are zero; it is commonly used to reduce the cost of QR iteration.
- deflation: after determining one eigenvalue, switch to the remaining leading submatrix.
- Householder transformation: a unitary reflection that simultaneously zeros several components of a column vector.
- Francis QR iteration: a shifted and implicitly implemented QR iteration framework that is standard in practical eigenvalue software.
- LR decomposition: a factorization into a lower-triangular matrix and an upper-triangular matrix.
- Euclidean norm: usually denoted by $\|\cdot\|_2$.
- $A^H$: the conjugate transpose, $A^H=\overline A^T$; for a real matrix, it is simply $A^T$.

**References**

- [4] R. Plato. *Numerische Mathematik kompakt* (*Compact Numerical Mathematics*). Vieweg Verlag, Braunschweig, 2000. 6.3.2.
- [8] J. Werner. *Numerische Mathematik 2* (*Numerical Mathematics 2*). Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**Source, Copyright, and Usage Notes**

This article mainly refers to the numerical analysis lecture notes in TU Darmstadt's open repository:
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
The upstream repository includes an Unlicense notice. This article is published for personal study, translation, and knowledge organization. The English wording, explanatory additions, and remade figures in this article do not represent the original authors or any official position.
The personal organization, English text, explanatory notes, and remade figures in this article may be used for non-commercial study, discussion, and citation with attribution and the original link. Since part of this article is based on translation and organization of TU Darmstadt's public lecture notes, the original material and any materials it may contain should remain subject to the original authors, repository, and license notices. For commercial use, systematic redistribution, publication, or large-scale adaptation, please verify the licensing status of the original material as well.
If there are any translation, formula, terminology, or interpretation errors, or if the rights holder believes the material has been used improperly, please contact me and I will correct or remove it promptly.
