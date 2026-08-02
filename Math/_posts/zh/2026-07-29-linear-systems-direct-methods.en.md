---
title: "Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part I"
lang: "en"
date: 2026-07-29
permalink: /en/linear-systems-direct-methods/
zh_link: /zh/linear-systems-direct-methods/
categories:
  - Math
tags:
  - Numerical Methods
  - Linear Systems
  - Matrix Factorization
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

.gauss-stepper {
  background: #ffffff;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.gauss-stepper__header {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.gauss-stepper__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.gauss-stepper__button {
  background: #12343b;
  border: 1px solid #12343b;
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  line-height: 1.2;
  min-height: 2.3rem;
  padding: 0.45rem 0.75rem;
}

.gauss-stepper__button:disabled {
  background: #d8e0e4;
  border-color: #c6d1d8;
  color: #687985;
  cursor: default;
}

.gauss-stepper__counter {
  color: #54656f;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.gauss-stepper__title {
  font-weight: 700;
  margin: 0;
}

.gauss-stepper__explain {
  color: #455461;
  margin: 0;
}

.gauss-stepper__workspace {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.15fr) minmax(16rem, 0.85fr);
}

.gauss-stepper__matrix-wrap {
  overflow-x: auto;
}

.gauss-stepper__matrix {
  border-collapse: collapse;
  font-family: "Consolas", "SFMono-Regular", monospace;
  font-size: 1rem;
  min-width: 28rem;
  table-layout: fixed;
  width: 100%;
}

.gauss-stepper__matrix td {
  border: 1px solid #cbd5dc;
  min-width: 3.2rem;
  padding: 0.5rem 0.4rem;
  text-align: center;
}

.gauss-stepper__matrix td:nth-child(3) {
  border-right: 2px solid #64748b;
}

.gauss-stepper__matrix .is-pivot {
  background: #ffe8a3;
  box-shadow: inset 0 0 0 2px #d28400;
  font-weight: 700;
}

.gauss-stepper__matrix .is-updated {
  background: #e3f7ec;
  font-weight: 700;
}

.gauss-stepper__matrix .is-zeroed {
  background: #ffe4e1;
  color: #a1271b;
  font-weight: 700;
}

.gauss-stepper__side {
  background: #f5f8fa;
  border: 1px solid #d7dee2;
  border-radius: 8px;
  padding: 0.85rem;
}

.gauss-stepper__formula {
  font-family: "Consolas", "SFMono-Regular", monospace;
  margin: 0 0 0.6rem;
  white-space: pre-wrap;
}

.gauss-stepper__result {
  color: #325f3c;
  font-weight: 700;
  margin: 0;
}

@media (max-width: 640px) {
  .gauss-stepper__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .gauss-stepper__workspace {
    grid-template-columns: 1fr;
  }

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
<script>
document.addEventListener('DOMContentLoaded', () => {
  const stepper = document.querySelector('[data-gauss-stepper]');
  if (!stepper) return;

  const steps = [
    {
      title: 'Original Augmented Matrix',
      explain: 'First write Ax=b as an augmented matrix. In the first column, the largest candidate pivot in absolute value is 2, so partial pivoting moves the second row to the top.',
      matrix: [['1', '2', '-1', '2'], ['2', '-2', '4', '10'], ['2', '1', '-2', '-2']],
      pivot: [[1, 0], [2, 0]],
      formula: 'Candidate pivots: |1|, |2|, |2|\nChoose the 2 in row 2 and swap R1 <-> R2',
      result: ''
    },
    {
      title: 'Swap Row 1 and Row 2',
      explain: 'The pivot 2 is now in the first row. Next, use only the first row to eliminate the entries below it in the first column.',
      matrix: [['2', '-2', '4', '10'], ['1', '2', '-1', '2'], ['2', '1', '-2', '-2']],
      pivot: [[0, 0]],
      formula: 'R1 <- old R2\nR2 <- old R1\nR3 unchanged',
      result: ''
    },
    {
      title: 'Eliminate the First Column',
      explain: 'A multiplier is "entry to eliminate / pivot". These multipliers later become the strict lower triangular part of L.',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '3', '-6', '-12']],
      pivot: [[0, 0]],
      zeroed: [[1, 0], [2, 0]],
      updated: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]],
      formula: 'l21 = 1/2,  R2 <- R2 - (1/2) R1\nl31 = 1,    R3 <- R3 - R1',
      result: 'The first column is now zero below the pivot.'
    },
    {
      title: 'Move to the Lower-Right Subproblem',
      explain: 'After the first column is processed, the algorithm only looks at the lower-right 2x2 block and the corresponding right-hand side. The two candidates in the second column are both 3.',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '3', '-6', '-12']],
      pivot: [[1, 1], [2, 1]],
      formula: 'Candidate pivots: |3|, |3|\nNo swap is needed here; use the 3 in row 2 as the pivot',
      result: ''
    },
    {
      title: 'Eliminate the Second Column',
      explain: 'Use row 2 to eliminate the 3 in row 3, column 2; the multiplier is l32=1.',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '0', '-3', '-9']],
      pivot: [[1, 1]],
      zeroed: [[2, 1]],
      updated: [[2, 2], [2, 3]],
      formula: 'l32 = 1\nR3 <- R3 - R2',
      result: 'This gives the upper triangular system Rx=c.'
    },
    {
      title: 'Back Substitution',
      explain: 'An upper triangular system is solved upward, starting from the last unknown.',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '0', '-3', '-9']],
      pivot: [[2, 2], [1, 1], [0, 0]],
      formula: '-3 x3 = -9  =>  x3 = 3\n3 x2 - 3 x3 = -3  =>  x2 = 2\n2 x1 - 2 x2 + 4 x3 = 10  =>  x1 = 1',
      result: 'The solution is x = (1, 2, 3)^T.'
    }
  ];

  let index = 0;
  const title = stepper.querySelector('[data-gauss-title]');
  const explain = stepper.querySelector('[data-gauss-explain]');
  const matrix = stepper.querySelector('[data-gauss-matrix]');
  const formula = stepper.querySelector('[data-gauss-formula]');
  const result = stepper.querySelector('[data-gauss-result]');
  const counter = stepper.querySelector('[data-gauss-counter]');
  const prev = stepper.querySelector('[data-gauss-prev]');
  const next = stepper.querySelector('[data-gauss-next]');
  const reset = stepper.querySelector('[data-gauss-reset]');

  const keyFor = ([row, col]) => `${row}-${col}`;

  function render() {
    const step = steps[index];
    const pivot = new Set((step.pivot || []).map(keyFor));
    const zeroed = new Set((step.zeroed || []).map(keyFor));
    const updated = new Set((step.updated || []).map(keyFor));

    title.textContent = step.title;
    explain.textContent = step.explain;
    formula.textContent = step.formula;
    result.textContent = step.result;
    counter.textContent = `${index + 1} / ${steps.length}`;
    prev.disabled = index === 0;
    next.disabled = index === steps.length - 1;

    matrix.innerHTML = '';
    step.matrix.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      row.forEach((value, colIndex) => {
        const td = document.createElement('td');
        const key = `${rowIndex}-${colIndex}`;
        td.textContent = value;
        if (pivot.has(key)) td.classList.add('is-pivot');
        if (updated.has(key)) td.classList.add('is-updated');
        if (zeroed.has(key)) td.classList.add('is-zeroed');
        tr.appendChild(td);
      });
      matrix.appendChild(tr);
    });
  }

  prev.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    render();
  });
  next.addEventListener('click', () => {
    index = Math.min(steps.length - 1, index + 1);
    render();
  });
  reset.addEventListener('click', () => {
    index = 0;
    render();
  });
  render();
});
</script>

<a href="{{ page.zh_link }}" class="btn">中文版</a>

It is best to read [Numerical Analysis Lecture (III): Initial Value Problems and Stiffness Part II]({{ '/en/ode-stiffness-stability/' | relative_url }}) first. This Part I covers the first half of solving linear systems: problem formulation, Gaussian elimination, pivoting strategies, and the LR triangular factorization obtained from the elimination process.

---

## 4.1 Problem Statement and Introduction

This chapter discusses direct methods for solving linear systems.

**Linear system**  
Find $x\in\mathbb{R}^n$ such that

$$
Ax=b
\tag{4.1}
$$

where

$$
A=
\begin{pmatrix}
a_{11}&a_{12}&\cdots&a_{1n}\\
a_{21}&a_{22}&\cdots&a_{2n}\\
\vdots&\vdots&\ddots&\vdots\\
a_{n1}&a_{n2}&\cdots&a_{nn}
\end{pmatrix}\in\mathbb{R}^{n\times n},
\qquad
b=
\begin{pmatrix}
b_1\\ b_2\\ \vdots\\ b_n
\end{pmatrix}\in\mathbb{R}^n,
\qquad
x=
\begin{pmatrix}
x_1\\ x_2\\ \vdots\\ x_n
\end{pmatrix}\in\mathbb{R}^n .
\tag{4.2}
$$

The direct methods discussed here produce the solution of (4.1) after finitely many operations, if rounding errors are ignored. As is well known, (4.1) is the matrix form of the system

$$
a_{i1}x_1+a_{i2}x_2+\cdots+a_{in}x_n=b_i,\qquad i=1,\ldots,n.
$$

In practice, linear systems often appear as auxiliary problems inside larger computations. They arise, for example, in boundary value and initial-boundary value problems for ordinary and partial differential equations, circuit simulation, electromagnetic field computation, and image processing. One estimate says that roughly $75\%$ of computation time in technical and scientific computing is spent solving linear systems.

We first recall the following fact.

**Proposition 4.1.1**  
The linear system (4.1) has a solution if and only if

$$
\operatorname{rang}(A)=\operatorname{rang}(A,b).
$$

Here, for a matrix $B\in\mathbb{R}^{n\times m}$, its rank is defined as

$$
\operatorname{Rang}(B)
=\text{maximum number of linearly independent row vectors }r
=\text{maximum number of linearly independent column vectors }r.
$$

The linear system (4.1) has a unique solution if and only if $A$ is invertible; equivalently, $\det(A)\ne 0$. In that case the unique solution is

$$
x=A^{-1}b.
$$

## 4.2 Gaussian Elimination and Matrix Triangular Factorization

The basic procedure of Gaussian elimination has already appeared in linear algebra. We briefly review the method, then explain how it gives a triangular factorization of a matrix. We also discuss how rounding errors can affect the computation and how this effect can be controlled effectively.

The basic idea of Gaussian elimination is to use elementary operations to transform the system (4.1) into a system of the form

$$
Ry=c,\qquad y_{\sigma_i}=x_i,\quad i=1,\ldots,n,
$$

Here $(\sigma_1,\ldots,\sigma_n)$ is the column permutation that has been applied, and $R$ is the upper triangular matrix

$$
R=
\begin{pmatrix}
r_{11}&\cdots&r_{1n}\\
&\ddots&\vdots\\
0&&r_{nn}
\end{pmatrix}.
$$

The allowed elementary operations are:

- adding a multiple of one equation to another equation;
- row swaps, that is, swapping equations;
- column swaps, which correspond to renumbering the unknowns.

The resulting system has the same solution set as (4.1). Equation (4.3) is called a triangular, or echelon-form, system. As long as $R$ is invertible, it can be solved easily by back substitution. If no column swaps were performed, then $x=y$.

### 4.2.1 Solving Triangular Systems

The triangular system

$$
Ry=c
\tag{4.3}
$$

where

$$
R=
\begin{pmatrix}
r_{11}&\cdots&r_{1n}\\
&\ddots&\vdots\\
0&&r_{nn}
\end{pmatrix},
\tag{4.4}
$$

and

$$
Lz=d
\tag{4.5}
$$

where

$$
L=
\begin{pmatrix}
l_{11}&0\\
\vdots&\ddots\\
l_{n1}&\cdots&l_{nn}
\end{pmatrix},
$$

can clearly be solved by back substitution and forward substitution, respectively.

**Theorem 4.2.1**  
Let $R=(r_{ij})\in\mathbb{R}^{n\times n}$ and $L=(l_{ij})\in\mathbb{R}^{n\times n}$ be invertible upper and lower triangular matrices, respectively, and let

$$
c=(c_1,\ldots,c_n)^T,\qquad d=(d_1,\ldots,d_n)^T.
$$

Then the solutions of (4.3) and (4.5) can be computed as follows:

a) Back substitution for the upper triangular system (4.3):

$$
y_i=
\frac{c_i-\sum_{j=i+1}^n r_{ij}y_j}{r_{ii}},
\qquad i=n,n-1,\ldots,1.
$$

b) Forward substitution for the lower triangular system (4.5):

$$
z_i=
\frac{d_i-\sum_{j=1}^{i-1}l_{ij}z_j}{l_{ii}},
\qquad i=1,2,\ldots,n.
$$

**Remark 4.2.2**  
Without additional special sparse structure, such as sparsity or bandedness, back substitution requires $O(n^2)$ elementary arithmetic operations.

### 4.2.2 Gaussian Elimination

We now explain how Gaussian elimination produces a triangular system. The basic procedure should already be familiar from linear algebra. Instead of operating directly on the equations in (4.1), it is more convenient to work with the augmented coefficient matrix

$$
(A,b)=
\begin{pmatrix}
a_{11}&\cdots&a_{1n}&b_1\\
\vdots&\ddots&\vdots&\vdots\\
a_{n1}&\cdots&a_{nn}&b_n
\end{pmatrix}
$$

and perform operations on it.

The basic Gaussian elimination process is as follows.

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">Figure 4-1: Step-by-step partial-pivot Gaussian elimination and back substitution for Example 4.2.3.</figcaption>
<div class="gauss-stepper" data-gauss-stepper>
  <div class="gauss-stepper__header">
    <div>
      <p class="gauss-stepper__title" data-gauss-title></p>
      <p class="gauss-stepper__explain" data-gauss-explain></p>
    </div>
    <div class="gauss-stepper__controls" aria-label="Gaussian elimination step controls">
      <button class="gauss-stepper__button" type="button" data-gauss-prev>Previous</button>
      <button class="gauss-stepper__button" type="button" data-gauss-next>Next</button>
      <button class="gauss-stepper__button" type="button" data-gauss-reset>Reset</button>
      <span class="gauss-stepper__counter" data-gauss-counter aria-live="polite"></span>
    </div>
  </div>
  <div class="gauss-stepper__workspace">
    <div class="gauss-stepper__matrix-wrap" aria-live="polite">
      <table class="gauss-stepper__matrix" aria-label="Augmented matrix from Example 4.2.3">
        <tbody data-gauss-matrix></tbody>
      </table>
    </div>
    <div class="gauss-stepper__side">
      <p class="gauss-stepper__formula" data-gauss-formula></p>
      <p class="gauss-stepper__result" data-gauss-result></p>
    </div>
  </div>
  <noscript>
    <p>After one row swap and two elimination rounds, Example 4.2.3 gives an upper triangular system; back substitution gives $x=(1,2,3)^T$.</p>
  </noscript>
</div>
<p class="linear-system-figure__note">This figure grounds the ideas of partial pivoting, stored multipliers, and shrinking subproblems in the same 3-by-3 example. Yellow marks the current pivot, red marks entries just eliminated to zero, and green marks entries updated in the current round.</p>
</figure>

**Basic Concepts of Gaussian Elimination**

**Step 0: Initialization.**

$$
(A^{(1)},b^{(1)})
=
\begin{pmatrix}
a^{(1)}_{11}&\cdots&a^{(1)}_{1n}&b^{(1)}_1\\
\vdots&\ddots&\vdots&\vdots\\
a^{(1)}_{n1}&\cdots&a^{(1)}_{nn}&b^{(1)}_n
\end{pmatrix}
:=(A,b).
$$

**Step 1: Choose a pivot.** Find an equation $r$ that depends on $x_1$, that is, a row satisfying $a^{(1)}_{r1}\ne 0$, and swap it with the first equation:

$$
(A^{(1)},b^{(1)})
=
\begin{pmatrix}
a^{(1)}_{11}&\cdots&a^{(1)}_{1n}&b^{(1)}_1\\
\vdots&&\vdots&\vdots\\
a^{(1)}_{r1}&\cdots&a^{(1)}_{rn}&b^{(1)}_r\\
\vdots&&\vdots&\vdots\\
a^{(1)}_{n1}&\cdots&a^{(1)}_{nn}&b^{(1)}_n
\end{pmatrix}
\rightsquigarrow
\begin{pmatrix}
a^{(1)}_{r1}&\cdots&a^{(1)}_{rn}&b^{(1)}_r\\
\vdots&&\vdots&\vdots\\
a^{(1)}_{11}&\cdots&a^{(1)}_{1n}&b^{(1)}_1\\
\vdots&&\vdots&\vdots\\
a^{(1)}_{n1}&\cdots&a^{(1)}_{nn}&b^{(1)}_n
\end{pmatrix}
:=
\begin{pmatrix}
\widetilde a^{(1)}_{11}&\cdots&\widetilde a^{(1)}_{1n}&\widetilde b^{(1)}_1\\
\vdots&&\vdots&\vdots\\
\widetilde a^{(1)}_{n1}&\cdots&\widetilde a^{(1)}_{nn}&\widetilde b^{(1)}_n
\end{pmatrix}
=
(\widetilde A^{(1)},\widetilde b^{(1)}).
$$

If $A$ is invertible, such an $r$ always exists, because the first column of $A$ cannot be identically zero.

**Step 2: Eliminate.** Subtract a suitable multiple of the first equation from each remaining equation so that the coefficient of $x_1$ becomes zero there. Clearly, from the $i$-th equation we should subtract $l_{i1}$ times the first equation, where

$$
l_{i1}=\frac{\widetilde a^{(1)}_{i1}}{\widetilde a^{(1)}_{11}}.
$$

This gives

$$
(\widetilde A^{(1)},\widetilde b^{(1)})
\rightsquigarrow
(A^{(2)},b^{(2)})
=
\begin{pmatrix}
\widetilde a^{(1)}_{11}&\widetilde a^{(1)}_{12}&\cdots&\widetilde a^{(1)}_{1n}&\widetilde b^{(1)}_1\\
0&a^{(2)}_{22}&\cdots&a^{(2)}_{2n}&b^{(2)}_2\\
\vdots&\vdots&\ddots&\vdots&\vdots\\
0&a^{(2)}_{n2}&\cdots&a^{(2)}_{nn}&b^{(2)}_n
\end{pmatrix}.
$$

The remaining subsystem can also be written explicitly as a block matrix:

$$
(A^{(2)},b^{(2)})
:=
\begin{pmatrix}
\widetilde a^{(1)}_{11}&\cdots&\widetilde a^{(1)}_{1n}&\widetilde b^{(1)}_1\\
0&&&\\
\vdots&&\widehat A^{(2)}&\widehat b^{(2)}\\
0&&&
\end{pmatrix}.
$$

**Step 3: Iterate.** For $k=2,\ldots,n-1$, apply the two steps "choose a pivot" and "eliminate" to the remaining subsystem.

Step <span>$k$</span> consists of two substeps.

**Round <span>$k$</span>, step 1: choose a pivot and swap rows.** Choose a pivot <span>$a^{(k)}_{rk}\ne 0$</span>, where <span>$k\le r\le n$</span>, and swap rows <span>$k$</span> and <span>$r$</span>:

$$
(A^{(k)},b^{(k)})\rightsquigarrow(\widetilde A^{(k)},\widetilde b^{(k)}).
$$

**Round <span>$k$</span>, step 2: eliminate.** From the <span>$i$</span>-th equation, subtract <span>$l_{ik}$</span> times the <span>$k$</span>-th equation, where

$$
l_{ik}=\frac{\widetilde a^{(k)}_{ik}}{\widetilde a^{(k)}_{kk}},
\qquad i=k+1,\ldots,n.
$$

Thus

$$
(\widetilde A^{(k)},\widetilde b^{(k)})
\rightsquigarrow
(A^{(k+1)},b^{(k+1)}).
$$

After $k$ elimination steps,

$$
(A,b)=:(A^{(1)},b^{(1)})\to(A^{(2)},b^{(2)})\to\cdots\to(A^{(k+1)},b^{(k+1)}),
$$

the intermediate matrix has the following shape:

$$
(A^{(k+1)},b^{(k+1)})
=
\begin{pmatrix}
\widetilde a^{(1)}_{11}&\cdots&\widetilde a^{(1)}_{1k}&\cdots&\widetilde a^{(1)}_{1n}&\widetilde b^{(1)}_1\\
0&\ddots&\vdots&&\vdots&\vdots\\
\vdots&&\widetilde a^{(k)}_{kk}&\cdots&\widetilde a^{(k)}_{kn}&\widetilde b^{(k)}_k\\
0&\cdots&0&&&\\
\vdots&&\vdots&\widehat A^{(k+1)}&&\widehat b^{(k+1)}\\
0&\cdots&0&&&
\end{pmatrix}.
$$

After $n-1$ elimination steps, we obtain the triangular system (4.3)

$$
Rx=c,\qquad R=A^{(n)},\quad c=b^{(n)}.
$$

### 4.2.3 Pivoting Strategies

The element <span>$a^{(k)}_{rk}$</span> chosen in the pivot-selection step of round <span>$k$</span> is called the pivot. In theory, any <span>$a^{(k)}_{rk}\ne 0$</span> can be used as the pivot. In practice, a very small pivot can strongly amplify rounding errors. Therefore <span>$a^{(k)}_{rk}$</span> is usually chosen as follows:

**Partial pivoting**: choose $k\le r\le n$ such that

$$
|a^{(k)}_{rk}|=\max_{k\le i\le n}|a^{(k)}_{ik}|.
$$

Before doing this, the rows of $A$ should be equilibrated so that their row norms are of the same order of magnitude.

**Example 4.2.3**  
Consider

$$
\begin{pmatrix}
1&2&-1\\
2&-2&4\\
2&1&-2
\end{pmatrix}x
=
\begin{pmatrix}
2\\ 10\\ -2
\end{pmatrix}.
$$

This gives the augmented matrix

$$
\begin{pmatrix}
1&2&-1&2\\
2&-2&4&10\\
2&1&-2&-2
\end{pmatrix}.
$$

After partial pivoting, swap the first two rows:

$$
\begin{pmatrix}
2&-2&4&10\\
1&2&-1&2\\
2&1&-2&-2
\end{pmatrix}.
$$

When eliminating the first column, the multipliers are $l_{21}=1/2$ and $l_{31}=1$, giving

$$
\begin{pmatrix}
2&-2&4&10\\
0&3&-3&-3\\
0&3&-6&-12
\end{pmatrix}.
$$

Apply partial pivoting again and eliminate the second column. The multiplier is $l_{32}=1$, giving

$$
\begin{pmatrix}
2&-2&4&10\\
0&3&-3&-3\\
0&0&-3&-9
\end{pmatrix}.
$$

Continuing this example as a triangular factorization makes it clearer where the <span>$L$</span> matrix comes from. The original coefficient matrix is

$$
A=
\begin{pmatrix}
1&2&-1\\
2&-2&4\\
2&1&-2
\end{pmatrix}.
$$

The first partial-pivoting step swaps the first two rows, so

$$
P=
\begin{pmatrix}
0&1&0\\
1&0&0\\
0&0&1
\end{pmatrix},
\qquad
PA=
\begin{pmatrix}
2&-2&4\\
1&2&-1\\
2&1&-2
\end{pmatrix}.
$$

The multipliers stored in the first elimination round are

$$
l_{21}=\frac{1}{2},\qquad l_{31}=1.
$$

The second round needs no row swap; when eliminating the second column, we store

$$
l_{32}=1.
$$

These multipliers therefore form the lower triangular matrix

$$
L=
\begin{pmatrix}
1&0&0\\
\frac12&1&0\\
1&1&1
\end{pmatrix},
$$

and the upper triangular coefficient matrix after elimination is

$$
R=
\begin{pmatrix}
2&-2&4\\
0&3&-3\\
0&0&-3
\end{pmatrix}.
$$

Direct multiplication verifies that

$$
LR=
\begin{pmatrix}
1&0&0\\
\frac12&1&0\\
1&1&1
\end{pmatrix}
\begin{pmatrix}
2&-2&4\\
0&3&-3\\
0&0&-3
\end{pmatrix}
=
\begin{pmatrix}
2&-2&4\\
1&2&-1\\
2&1&-2
\end{pmatrix}
=PA.
$$

Thus in this example, Gaussian elimination not only transforms the system into upper triangular form, but also gives <span>$PA=LR$</span>.

### 4.2.4 Practical Implementation of the Gaussian Method

In computer implementations, the multipliers $l_{ik}$ used during elimination are usually stored as well. We will see that Gaussian elimination then gives a triangular factorization of $A$ essentially for free, also called an LR factorization:

$$
LR=PA.
\tag{4.6}
$$

Here $R\in\mathbb{R}^{n\times n}$ is an upper triangular matrix of the form (4.4), and $L\in\mathbb{R}^{n\times n}$ is a lower triangular matrix of the form

$$
L=
\begin{pmatrix}
1&0&&&\\
l_{21}&1&&&\\
l_{31}&l_{32}&1&&\\
\vdots&\vdots&\ddots&\ddots&\\
l_{n1}&\cdots&l_{n,n-1}&1
\end{pmatrix}
\tag{4.7}
$$

while $P$ is a permutation matrix that only permutes the rows of $A$.

This leads to the following implementation of Gaussian elimination with partial pivoting.

**Algorithm 4.2.4: Gaussian Elimination with Partial Pivoting**

Set $(A^{(1)},b^{(1)})=(A,b)$. At the same time set

$$
L^{(1)}=0\in\mathbb{R}^{n\times n}.
$$

Here $L^{(1)}$ is not the final factor $L$ in the factorization. It is only an auxiliary matrix used to temporarily store elimination multipliers. Its main diagonal is all $0$, and only strict lower triangular entries record the multipliers that have already been obtained. The final lower triangular matrix is the identity matrix plus these multipliers, namely $L=I+L^{(n)}$.

For $k=1,2,\ldots,n-1$:

1. Partial pivoting: determine $k\le r\le n$ such that

$$
|a^{(k)}_{rk}|=\max_{k\le i\le n}|a^{(k)}_{ik}|.
$$

If $a^{(k)}_{rk}=0$: stop; $A$ is singular.

Swap rows $r$ and $k$ in $(A^{(k)},b^{(k)})$ and in $L^{(k)}$. Formally denote the result by

$$
(\widetilde A^{(k)},\widetilde b^{(k)}),\qquad \widetilde L^{(k)}.
$$

2. Elimination: for $i=k+1,\ldots,n$, subtract $l_{ik}$ times row $k$ from row $i$ of $(\widetilde A^{(k)},\widetilde b^{(k)})$, and store the multiplier $l_{ik}$ in $\widetilde L^{(k)}$, where

$$
l_{ik}=\frac{\widetilde a^{(k)}_{ik}}{\widetilde a^{(k)}_{kk}}.
$$

Formally, denote the result by $(A^{(k+1)},b^{(k+1)})$ and $L^{(k+1)}$.

More concretely, initialize

$$
(A^{(k+1)},b^{(k+1)}):=(\widetilde A^{(k)},\widetilde b^{(k)}),
\qquad
L^{(k+1)}:=\widetilde L^{(k)}.
$$

For $i=k+1,\ldots,n$:

$$
l_{ik}=\frac{\widetilde a^{(k)}_{ik}}{\widetilde a^{(k)}_{kk}},
\qquad
b_i^{(k+1)}=\widetilde b_i^{(k)}-l_{ik}\widetilde b_k^{(k)},
$$

$$
a^{(k+1)}_{ik}=0,
\qquad
l^{(k+1)}_{ik}=l_{ik}
\quad\text{(store the multiplier)}.
$$

For $j=k+1,\ldots,n$:

$$
a^{(k+1)}_{ij}
=\widetilde a^{(k)}_{ij}-l_{ik}\widetilde a^{(k)}_{kj}.
$$

The result is

$$
R:=A^{(n)},\qquad c:=b^{(n)},\qquad L:=I+L^{(n)},
$$

where $I\in\mathbb{R}^{n\times n}$ is the identity matrix.

The triangular system produced by this method,

$$
Rx=c,\qquad R=A^{(n)},\quad c=b^{(n)}
$$

has the same solution set as the original system $Ax=b$.

In a computer implementation, the arrays that originally store $A$ and $b$ can be reused to store all $A^{(k)}$, $b^{(k)}$, $\widetilde A^{(k)}$, and $\widetilde b^{(k)}$. The temporary storage matrix $L^{(k)}$ can be stored space-efficiently in the strict lower triangular positions where zeros are created.

**Remark 4.2.5**  
Without additional special sparse structure, this algorithm requires $O(n^3/3-n/3)$ elementary arithmetic operations.

### 4.2.5 Complete Pivoting

Instead of partial pivoting, one can also use complete pivoting. The pivot search is then not restricted to the current first column. Step 1 in Algorithm 4.2.4 must be changed as follows.

**Algorithm 4.2.6: Gaussian Elimination with Complete Pivoting**

In Algorithm 4.2.4, replace step 1 by:

1'. Complete pivoting: determine $k\le r\le n$ and $k\le s\le n$ such that

$$
|a^{(k)}_{rs}|=\max_{k\le i,j\le n}|a^{(k)}_{ij}|.
$$

If $a^{(k)}_{rs}=0$: stop; $A$ is singular.

Swap rows $r$ and $k$ in $(A^{(k)},b^{(k)})$ and in $L^{(k)}$; at the same time, swap columns $s$ and $k$ in $(A^{(k)},b^{(k)})$ and in $L^{(k)}$. Formally denote the result by

$$
(\widetilde A^{(k)},\widetilde b^{(k)}),\qquad \widetilde L^{(k)}.
$$

Note: each column swap renumbers the components of $x$ accordingly. This means that after solving (4.3), the components of the result vector $x$ must be swapped back.

Complete pivoting is usually used only when a matrix is nearly singular, in order to reduce the influence of rounding errors as much as possible.

### 4.2.6 Obtaining a Triangular Factorization

Gaussian elimination with partial pivoting (Algorithm 4.2.4) gives a triangular factorization, or LR factorization, of $A$:

$$
LR=PA.
\tag{4.6}
$$

Here $R\in\mathbb{R}^{n\times n}$ and $L\in\mathbb{R}^{n\times n}$ are, respectively, the upper triangular matrix of the form (4.4) and the lower triangular matrix of the form (4.7) produced by Algorithm 4.2.4, while $P$ is the permutation matrix corresponding to the row swaps.

Gaussian elimination with complete pivoting (Algorithm 4.2.6) gives the triangular factorization

$$
LR=PAQ,
\tag{4.8}
$$

where $P$ and $Q$ are the permutation matrices corresponding to the row swaps and column swaps, respectively.

**Remark 4.2.7**  
The triangular factorization (4.6) or (4.8) is very useful when (4.1) must be solved for several right-hand sides. Indeed,

$$
Ax=b
\Longleftrightarrow
PAQy=Pb,\quad x=Qy
\Longleftrightarrow
LRy=Pb,\quad x=Qy.
$$

If we set $z:=Ry$, then we obtain

$$
Lz=Pb,\qquad Ry=z,\qquad x=Qy.
$$

In the partial-pivoting case, $Q=I$.

Thus $x$ can be found by the following steps:

**Forward and Back Substitution after Triangular Factorization**

1. Solve $Lz=Pb$ by forward substitution, using Theorem 4.2.1;
2. Solve $Ry=z$ by back substitution, using Theorem 4.2.1;
3. Obtain the solution $x=Qy$.

Once the triangular factorization is available, each right-hand side in (4.1) can therefore be solved in $O(n^2)$ operations.

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">Figure 4-2: How the multipliers in the same example form $L$, and how the elimination result becomes $R$.</figcaption>
<svg role="img" aria-labelledby="kap4-lr-example-title kap4-lr-example-desc" viewBox="0 0 1000 370" xmlns="http://www.w3.org/2000/svg">
  <title id="kap4-lr-example-title">Reading the LR Factorization from Gaussian Elimination</title>
  <desc id="kap4-lr-example-desc">In Example 4.2.3, the first two rows are swapped first; the elimination multipliers l21, l31, and l32 form the lower triangular matrix L; the final upper triangular coefficients form R; and PA equals LR.</desc>
  <rect width="1000" height="370" fill="#ffffff"/>
  <text x="500" y="36" text-anchor="middle" font-size="23" font-weight="700" fill="#17252a">Example 4.2.3: Elimination Also Produces PA = LR</text>

  <g font-family="Consolas, SFMono-Regular, monospace" font-size="18" text-anchor="middle">
    <text x="120" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">Row Swap P</text>
    <rect x="48" y="100" width="144" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="84" y="130">0</text><text x="120" y="130">1</text><text x="156" y="130">0</text>
    <text x="84" y="160">1</text><text x="120" y="160">0</text><text x="156" y="160">0</text>
    <text x="84" y="190">0</text><text x="120" y="190">0</text><text x="156" y="190">1</text>
    <text x="120" y="238" font-family="sans-serif" font-size="14" fill="#54656f">Swap the first two rows of the original matrix</text>

    <text x="312" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">PA</text>
    <rect x="240" y="100" width="144" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="276" y="130">2</text><text x="312" y="130">-2</text><text x="348" y="130">4</text>
    <text x="276" y="160">1</text><text x="312" y="160">2</text><text x="348" y="160">-1</text>
    <text x="276" y="190">2</text><text x="312" y="190">1</text><text x="348" y="190">-2</text>

    <text x="424" y="158" font-size="28" font-weight="700" fill="#455461">=</text>

    <text x="544" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">L: Stored Multipliers</text>
    <rect x="456" y="100" width="176" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="500" y="130">1</text><text x="544" y="130">0</text><text x="588" y="130">0</text>
    <text x="500" y="160" fill="#b45309" font-weight="700">1/2</text><text x="544" y="160">1</text><text x="588" y="160">0</text>
    <text x="500" y="190" fill="#b45309" font-weight="700">1</text><text x="544" y="190" fill="#b45309" font-weight="700">1</text><text x="588" y="190">1</text>
    <text x="544" y="238" font-family="sans-serif" font-size="14" fill="#54656f">l21=1/2, l31=1, l32=1</text>

    <text x="672" y="158" font-size="25" font-weight="700" fill="#455461">x</text>

    <text x="800" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">R: Final Upper Triangular Matrix</text>
    <rect x="720" y="100" width="160" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="760" y="130">2</text><text x="800" y="130">-2</text><text x="840" y="130">4</text>
    <text x="760" y="160">0</text><text x="800" y="160">3</text><text x="840" y="160">-3</text>
    <text x="760" y="190">0</text><text x="800" y="190">0</text><text x="840" y="190">-3</text>
  </g>

  <g font-size="15" fill="#334155">
    <rect x="150" y="286" width="230" height="48" rx="8" fill="#eef6f2" stroke="#8ab7a0"/>
    <text x="265" y="316" text-anchor="middle">Factorization phase: one O(n^3) elimination on A</text>
    <path d="M390 310 H458" fill="none" stroke="#78909c" stroke-width="2" marker-end="url(#kap4-lr-arrow)"/>
    <rect x="470" y="286" width="380" height="48" rx="8" fill="#f5f1e8" stroke="#d0aa58"/>
    <text x="660" y="316" text-anchor="middle">Solve phase: for each right-hand side, only Lz=Pb and Rx=z, O(n^2)</text>
  </g>
  <defs>
    <marker id="kap4-lr-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="#78909c"/>
    </marker>
  </defs>
</svg>
<p class="linear-system-figure__note">This $L$ is not recomputed from scratch: its strict lower triangular entries are exactly the multipliers stored in each elimination round in Figure 4-1, while $R$ is the upper triangular coefficient matrix left after elimination.</p>
</figure>

We now show that Gaussian elimination with partial pivoting really does give the triangular factorization (4.6). Complete pivoting can be analyzed similarly.

### 4.2.7 Matrix Representation of Elimination Steps

Consider Gaussian elimination with partial pivoting (Algorithm 4.2.4). Formally, the transition

$$
(A^{(k)},b^{(k)})
\to
(\widetilde A^{(k)},\widetilde b^{(k)})
\to
(A^{(k+1)},b^{(k+1)})
$$

can be represented by left multiplication with matrices. Indeed,

$$
(\widetilde A^{(k)},\widetilde b^{(k)})
=P_k(A^{(k)},b^{(k)})
\quad\text{(row swap)},
$$

$$
(A^{(k+1)},b^{(k+1)})
=L_k(\widetilde A^{(k)},\widetilde b^{(k)})
=L_kP_k(A^{(k)},b^{(k)})
\quad\text{(elimination)}.
$$

Here $P_k$ is the elementary permutation matrix obtained by swapping rows $k$ and $r$ in the identity matrix:

$$
P_k=
\begin{array}{c}
\\[-1.8em]
k\to\\[2.2em]
r\to
\end{array}
\left(
\begin{array}{ccccccccc}
1&&&&&&&&\\
&\ddots&&&&&&&\\
&&1&&&&&&\\
&&&0&&1&&&\\
&&&&1&&&&\\
&&&&&\ddots&&&\\
&&&1&&0&&&\\
&&&&&&1&&\\
&&&&&&&\ddots&
\end{array}
\right).
\tag{4.9}
$$

and $L_k$ is the elementary elimination matrix:

$$
L_k=
\begin{pmatrix}
1&&&&0\\
&\ddots&&&\\
&&1&&\\
&&-l_{k+1,k}&1&\\
0&&\vdots&&\ddots\\
&&-l_{nk}&0&1
\end{pmatrix}.
\tag{4.10}
$$

After the $n-1$ steps of the Gaussian algorithm, we obtain

$$
R=A^{(n)}=L_{n-1}P_{n-1}\cdots L_1P_1A.
$$

If no row swaps are needed during elimination, then

$$
R=A^{(n)}=L_{n-1}\cdots L_1A,
$$

and therefore

$$
A=L_1^{-1}\cdots L_{n-1}^{-1}R=:LR.
$$

It is easy to verify that

$$
L=L_1^{-1}\cdots L_{n-1}^{-1}
=
\begin{pmatrix}
1&0&&&\\
l_{21}&1&&&\\
l_{31}&l_{32}&1&&\\
\vdots&\vdots&\ddots&\ddots&\\
l_{n1}&\cdots&l_{n,n-1}&1
\end{pmatrix}
=I+L^{(n)}.
$$

Therefore, for the matrices $L$ and $R$ produced by the Gaussian method without pivoting,

$$
A=LR.
$$

In general, we have the following theorem.

**Theorem 4.2.8**  
Let $A\in\mathbb{R}^{n\times n}$ be nonsingular. Then:

i) The Gaussian elimination method in Algorithm 4.2.4 produces a lower triangular matrix $L$ of the form (4.7) and an upper triangular matrix $R$ satisfying

$$
LR=PA.
$$

Here $P=P_{n-1}\cdots P_1$ is a permutation matrix, where $P_k$ is the permutation matrix corresponding to the row swap in step $k$.

ii) Algorithm 4.2.6 produces the triangular factorization

$$
LR=PAQ.
$$

Here $P$ is as above, and $Q=Q_1\cdots Q_{n-1}$, where $Q_k$ is the permutation matrix corresponding to the column swap in step $k$.

**Proof**  
If no row swaps or column swaps occur, the result has already been proved above.

In the general case, one can show that the $L,R$ produced by Gaussian elimination with partial pivoting (or with complete pivoting) are the same as those obtained by applying Gaussian elimination without pivoting to $PA$ (or $PAQ$).

Some important subclasses of matrices do not require pivoting.

### 4.2.8 Matrix Classes That Do Not Require Pivoting

- $A=A^T$ is symmetric positive definite, meaning

$$
x^TAx>0\qquad \forall x\in\mathbb{R}^n\setminus\{0\}.
$$

We will return to this class of matrices later.

- $A$ is strictly diagonally dominant, meaning

$$
|a_{ii}|>\sum_{\substack{j=1\\j\ne i}}^n |a_{ij}|,
\qquad i=1,\ldots,n.
$$


- $A$ is an M-matrix, meaning

$$
a_{ii}>0,\qquad i=1,\ldots,n,
$$

$$
a_{ij}\le 0,\qquad i\ne j,
$$

and

$$
D^{-1}(A-D),\qquad D=\operatorname{diag}(a_{11},\ldots,a_{nn})
$$

has all eigenvalues with modulus less than $1$.

---

<!-- Continue with [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part II]({{ '/en/linear-systems-cholesky-conditioning/' | relative_url }}) once Part II is ready to publish. -->

**Abbreviations and Notation**

- LR factorization: this article keeps the lecture note notation, where $L$ is lower triangular and $R$ is upper triangular. In many English textbooks the same structure is called LU decomposition.
- pivot: the pivot element; partial pivoting is the row-based pivot search used in this article, while complete pivoting searches both rows and columns.

**Source, Copyright, and Usage Notes**

This article is organized from Chapter 4 of the locally saved TU Darmstadt 2016 Mathematik 4 ET/3Inf lecture file `Skript-Mathe4ET-3Inf-2016-Kap4-5.pdf`, with reference to the Chinese translation draft `Skript-Mathe4ET-3Inf-2016-Kap4.zh.md` in the same local directory. It is published for personal study, translation, and knowledge organization. The English wording, supplementary explanations, and remade figures in this article do not represent the original authors or an official position.

My organization, English wording, supplementary explanations, and remade figures in this article may be used for non-commercial study, discussion, and citation, provided that the author and original material source are credited. Because parts of this article are based on translation and organization of course lecture notes, the original lecture notes and any materials they may contain should still be governed by their original authors, course pages, and relevant authorization statements. For commercial use, systematic republication, publication, or large-scale adaptation, please confirm the authorization status of the original materials first.

If there are omissions or errors in translation, formulas, terminology, or interpretation, or if a relevant rights holder considers the use of any content inappropriate, please contact me and I will handle or remove it promptly.
