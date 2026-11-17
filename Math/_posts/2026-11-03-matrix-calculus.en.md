---
title: "Matrix and Vector Derivatives: Shapes, Examples, and Exponentials"
date: 2026-11-03
lang: en
permalink: /en/matrix-calculus/
zh_link: /zh/matrix-calculus/
categories:
  - Math
tags:
  - Linear Algebra
  - Matrix Calculus
classes: statistics-article
toc: true
toc_label: On this page
toc_sticky: true
excerpt: "A practical introduction to gradients, Jacobians, least squares, matrix chain rules, and the difference between elementwise and matrix exponentials."
---

{% include statistics-assets.html %}

<a href="{{ page.zh_link | relative_url }}" class="btn">中文版</a>

Expressions such as $Ax$, $x^\top Ax$, and $e^A$ become easier once we answer two questions: what shape is the result, and which quantity is the variable? This article uses small examples rather than an exhaustive formula collection.

All quantities are real, vectors are columns, and anything not designated as a variable is held constant. Matrices may be rectangular unless an operation, such as matrix powers or matrix exponentials, requires a square matrix.

## 1. Start with shapes

> **Hint:** Scalars, vectors, and matrices play different roles in the same expression.

For $A\in\mathbb R^{m\times n}$, $x\in\mathbb R^n$, and scalar $a$:

| Expression | Shape | Meaning |
| --- | --- | --- |
| $ax$ | $n\times1$ | Scale each component |
| $Ax$ | $m\times1$ | Matrix-vector product |
| $x^\top x$ | Scalar | Sum of component squares |
| $xx^\top$ | $n\times n$ | Outer product, entry $x_ix_j$ |
| $x\odot x$ | $n\times1$ | Elementwise squares |

For $x=(1,2)^\top$, we get $x^\top x=5$, but

$$
xx^\top=\begin{pmatrix}1&2\\2&4\end{pmatrix},\qquad
x\odot x=\begin{pmatrix}1\\4\end{pmatrix}.
$$

Scalar addition requires a convention. Software's `A + 2` typically broadcasts 2 to every entry, mathematically $A+2\mathbf1_m\mathbf1_n^\top$. For a square matrix, $A+2I$ instead adds 2 only to diagonal entries.

**Takeaway:** Distinguish matrix products, inner products, outer products, and elementwise operations.

## 2. What shape does a derivative have?

> **Hint:** Count the input components and output components first.

For scalar $f$ and vector $x$, we use a column gradient:

$$
\nabla_x f=\begin{pmatrix}\partial f/\partial x_1\\\vdots\\\partial f/\partial x_n\end{pmatrix}.
$$

For vector $y(x)\in\mathbb R^m$, collect partial derivatives in a Jacobian:

$$
J_{y,x}\in\mathbb R^{m\times n},\qquad
(J_{y,x})_{ij}=\frac{\partial y_i}{\partial x_j}.
$$

For example, $y_1=x_1^2+x_2$ and $y_2=3x_1$ give

$$
J_{y,x}=\begin{pmatrix}2x_1&1\\3&0\end{pmatrix}.
$$

For scalar $f(W)$ and $W\in\mathbb R^{m\times n}$, the gradient has the same shape as $W$:

$$
(\nabla_W f)_{ij}=\frac{\partial f}{\partial W_{ij}}.
$$

A matrix output differentiated with respect to a matrix generally needs more indices. We will express its small changes directly rather than introduce higher-order arrays. Some texts use row derivatives for scalar functions of vectors; those differ from our column gradients by a transpose.

**Takeaway:** Scalar-objective gradients match the variable's shape. Vector-to-vector derivatives are Jacobians.

## 3. Linear functions and transposes

> **Hint:** Expand a matrix expression into sums when in doubt.

For constant $a$, $f=a^\top x=\sum_i a_ix_i$ has $\nabla_x f=a$. For $y=Ax+b$,

$$
J_{y,x}=A.
$$

But a scalar objective $f=c^\top(Ax+b)$ has

$$
\nabla_x f=A^\top c.
$$

These results describe different output types. For

$$
A=\begin{pmatrix}1&2\\3&4\end{pmatrix},\quad
c=\begin{pmatrix}5\\6\end{pmatrix},\quad b=0,
$$

we have $f=23x_1+34x_2$, hence $\nabla_x f=(23,34)^\top=A^\top c$.

**Takeaway:** A linear map's Jacobian is $A$; propagating a scalar objective's gradient back through it uses $A^\top$.

## 4. Squares and least squares

> **Hint:** Compute a residual, then propagate its effect back to the variable.

For $f=x^\top x=\sum_i x_i^2$, the gradient is $2x$. More generally,

$$
f=x^\top Ax,\qquad\nabla_x f=(A+A^\top)x.
$$

Only for symmetric $A$ does this simplify to $2Ax$. For $$A=\begin{pmatrix}1&2\\0&3\end{pmatrix}$$, expansion gives $f=x_1^2+2x_1x_2+3x_2^2$ and gradient $(2x_1+2x_2,2x_1+6x_2)^\top$.

For least squares,

$$
r=Ax-b,\qquad f=\frac12\lVert r\rVert_2^2,
\qquad\boxed{\nabla_x f=A^\top(Ax-b)}.
$$

With $$A=\begin{pmatrix}1&2\\0&1\end{pmatrix}$$, $x=(1,1)^\top$, and $b=(2,0)^\top$, the residual is $(1,1)^\top$, the loss is 1, and the gradient is $(1,3)^\top$.

<details markdown="1">
<summary>Derivation using the ordinary chain rule</summary>

$$
f=\frac12\sum_i\left(\sum_j A_{ij}x_j-b_i\right)^2,
\qquad\frac{\partial f}{\partial x_k}=\sum_i r_iA_{ik}.
$$

The sum is the $k$th component of $A^\top r$. The factor $1/2$ cancels the 2 from differentiating a square.

</details>

**Takeaway:** Least-squares gradients are a transposed matrix times a residual; general quadratic forms require both $A$ and $A^\top$.

## 5. Differentiating with respect to a matrix

> **Hint:** Start with a scalar objective and treat every matrix entry as a variable.

Let $y=Wx+b$, $\ell=\tfrac12\lVert y-t\rVert_2^2$, and $r=y-t$. Then

$$
\boxed{\nabla_W\ell=rx^\top},\qquad
\nabla_b\ell=r,\qquad\nabla_x\ell=W^\top r.
$$

Each $W_{ij}$ affects $y_i$ with coefficient $x_j$, giving $\partial\ell/\partial W_{ij}=r_ix_j$. With $x=(1,2)^\top$ and $r=(3,-1)^\top$,

$$
\nabla_W\ell=\begin{pmatrix}3\\-1\end{pmatrix}\begin{pmatrix}1&2\end{pmatrix}
=\begin{pmatrix}3&6\\-1&-2\end{pmatrix}.
$$

For a batch of column examples $X\in\mathbb R^{n\times B}$ and fixed target matrix $T$, omitting biases,

$$
\ell=\frac1{2B}\lVert WX-T\rVert_F^2,\qquad
\nabla_W\ell=\frac1B(WX-T)X^\top.
$$

The squared Frobenius norm is the sum of all squared entries. The batch gradient averages the individual outer products.

**Takeaway:** A scalar objective's matrix gradient stores entrywise partial derivatives and must match the matrix shape.

## 6. Differentials and the chain rule

> **Hint:** Describe how a small input change affects the output.

For a scalar objective, $df=(\nabla_x f)^\top dx$. For a matrix variable,

$$
df=\sum_{i,j}(\nabla_W f)_{ij}\,dW_{ij}
=\operatorname{tr}((\nabla_W f)^\top dW).
$$

The trace sums diagonal entries; here it simply packages an elementwise sum of products.

For $Y=AB$, the product rule is

$$
dY=(dA)B+A(dB).
$$

Given downstream gradient $G=\nabla_Y f$, we obtain $\nabla_A f=GB^\top$ and $\nabla_B f=A^\top G$. When the same variable occurs twice, include both paths:

$$
d(A^2)=(dA)A+A(dA).
$$

Generally this cannot become $2A\,dA$, because matrices need not commute.

For $y=y(x)$ and scalar $f=f(y)$, the vector chain rule is

$$
\boxed{\nabla_x f=J_{y,x}^\top\nabla_y f}.
$$

For example, $z=Ax+b$, $h=\sigma(z)$ elementwise, and $f=\sum_i h_i$ give

$$
\nabla_x f=A^\top(h\odot(1-h)).
$$

For another downstream objective, first multiply its gradient $\nabla_h f$ elementwise into $h\odot(1-h)$. This is one layer of backpropagation.

**Takeaway:** Preserve multiplication order, add contributions from multiple paths, and transpose Jacobians when propagating scalar-objective gradients.

## 7. Vector and matrix exponents

> **Hint:** Distinguish applying an exponential to each entry from exponentiating a linear transformation.

**Elementwise exponential.** In machine learning, $\exp(x)$ for a vector usually means

$$
\exp(x)=\begin{pmatrix}e^{x_1}\\\vdots\\e^{x_n}\end{pmatrix},\qquad
J_{\exp(x),x}=\operatorname{diag}(e^{x_1},\ldots,e^{x_n}).
$$

For $x=(0,\log2)^\top$, the result is $(1,2)^\top$. For scalar $f=e^{x_1}+e^{x_2}$, the gradient at that point is also $(1,2)^\top$.

The operation also applies entrywise to rectangular or square matrices. For example,

$$
A=\begin{pmatrix}0&1\\0&0\end{pmatrix},\qquad
\exp_{\mathrm{elem}}(A)=\begin{pmatrix}1&e\\1&1\end{pmatrix}.
$$

For scalar $f(A)=\sum_{i,j}e^{A_{ij}}$, the gradient is $\exp_{\mathrm{elem}}(A)$.

**Matrix exponential.** For square $A$, linear algebra usually defines

$$
\boxed{e^A=I+A+\frac{A^2}{2!}+\frac{A^3}{3!}+\cdots}.
$$

Powers use matrix multiplication and the constant term is $I$. Our example has $A^2=0$, so

$$
e^A=I+A=\begin{pmatrix}1&1\\0&1\end{pmatrix}.
$$

Even the zero matrix exposes the difference: its matrix exponential is $I$, whereas its elementwise exponential is all ones.

For diagonal $D=\operatorname{diag}(a,b)$, $e^D=\operatorname{diag}(e^a,e^b)$, with zero off-diagonal entries. If $A=PDP^{-1}$, then $e^A=Pe^DP^{-1}$. Not every matrix is diagonalizable, and numerical algorithms need not rely on diagonalization. See the [MIT lecture](https://math.mit.edu/~dyatlov/18.03/lectures/Section8-3.pdf) for the definition and these properties.

For scalar variable $t$ and fixed matrix $A$,

$$
\frac{d}{dt}e^{tA}=Ae^{tA}=e^{tA}A.
$$

In our nilpotent example, $e^{tA}=I+tA$, whose derivative is $A$. This exponential solves $$u'(t)=Au(t)$$ as $u(t)=e^{tA}u(0)$.

If $A=A(t)$, the scalar-looking formula $$e^{A(t)}A'(t)$$ is generally invalid because $A$ and $$A'$$ may not commute.

<details markdown="1">
<summary>Optional: how the matrix exponential changes when the matrix changes</summary>

Differentiating the power series gives

$$
d(e^A)=dA+\frac{A\,dA+dA\,A}{2!}
+\frac{A^2dA+A\,dA\,A+dA\,A^2}{3!}+\cdots.
$$

Only when $A$ commutes with $dA$ does this simplify to $e^A dA$.

</details>

**Takeaway:** Vector exponentials in learning formulas usually act entrywise; matrix exponentials in linear systems use matrix powers. Check the definition.

## 8. Three mixed-operation examples

> **Hint:** Break a long expression into a score, a nonlinear operation, and a scalar objective.

**An inner product inside a scalar exponential:**

$$
f=e^{a^\top x+b},\qquad\nabla_x f=e^{a^\top x+b}a.
$$

At $a=(1,2)^\top$, $b=0$, $x=(0,0)^\top$, the gradient is $(1,2)^\top$.

**Matrix multiplication, elementwise exponentiation, and summation:**

$$
f=\sum_i e^{(Ax+b)_i},\qquad\nabla_x f=A^\top\exp(Ax+b).
$$

For $$A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$$ and $x=b=0$, the exponential vector is $(1,1)^\top$ and the gradient is $(4,6)^\top$.

**A quadratic inside a Gaussian-shaped function**, with symmetric $A$:

$$
f=e^{-\frac12x^\top Ax},\qquad\nabla_x f=-fAx.
$$

At $A=I$, $x=(1,0)^\top$, the value is $e^{-1/2}$ and the gradient is $(-e^{-1/2},0)^\top$. Moving toward the origin increases the value. A normalized nondegenerate Gaussian density additionally requires positive definite $A$ and its normalization constant.

**Takeaway:** These expressions combine ordinary linear, square, and exponential derivatives through the chain rule.

## 9. A compact reference

> **Hint:** Check constants, variables, and conventions before using a formula.

| Expression | Variable / derivative type | Result |
| --- | --- | --- |
| $a^\top x$ | $x$, gradient | $a$ |
| $Ax+b$ | $x$, Jacobian | $A$ |
| $x^\top x$ | $x$ | $2x$ |
| $x^\top Ax$ | $x$ | $(A+A^\top)x$ |
| $\tfrac12\lVert Ax-b\rVert_2^2$ | $x$ | $A^\top(Ax-b)$ |
| $\tfrac12\lVert Wx-t\rVert_2^2$ | $W$ | $(Wx-t)x^\top$ |
| $e^{a^\top x}$ | $x$ | $e^{a^\top x}a$ |
| $\sum_i e^{(Ax)_i}$ | $x$ | $A^\top\exp(Ax)$, elementwise exponential |
| $e^{tA}$, fixed $A$ | Scalar $t$ | $Ae^{tA}$, matrix exponential |

Check the result's shape, multiplication order, and whether every dependency path was included. When uncertain, expand a two-dimensional example and differentiate component by component.

**Takeaway:** Identify shapes, split the computation, and check the result.

**Further reading.** [Stanford CS231n: vectorized backpropagation](https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture4.pdf); [MIT: matrix exponentials](https://math.mit.edu/~dyatlov/18.03/lectures/Section8-3.pdf). The examples and derivations here are independently organized to emphasize column-gradient conventions and operation meanings.
