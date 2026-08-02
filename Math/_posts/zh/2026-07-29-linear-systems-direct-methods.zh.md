---
title: "数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part I"
lang: "zh"
date: 2026-07-29
permalink: /zh/linear-systems-direct-methods/
en_link: /en/linear-systems-direct-methods/
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
      title: '原始增广矩阵',
      explain: '先把 Ax=b 写成增广矩阵。第一列中绝对值最大的候选主元是 2，因此列主元搜索会把第二行放到最上面。',
      matrix: [['1', '2', '-1', '2'], ['2', '-2', '4', '10'], ['2', '1', '-2', '-2']],
      pivot: [[1, 0], [2, 0]],
      formula: '候选主元：|1|, |2|, |2|\n选择第二行的 2，并交换 R1 <-> R2',
      result: ''
    },
    {
      title: '交换第一行和第二行',
      explain: '主元 2 被放到第一行。接下来只用第一行去消去它下面第一列中的元素。',
      matrix: [['2', '-2', '4', '10'], ['1', '2', '-1', '2'], ['2', '1', '-2', '-2']],
      pivot: [[0, 0]],
      formula: 'R1 <- 原 R2\nR2 <- 原 R1\nR3 保持不变',
      result: ''
    },
    {
      title: '消去第一列',
      explain: '乘子就是“要消掉的数 / 主元”。这些乘子后面会进入 L 的严格下三角部分。',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '3', '-6', '-12']],
      pivot: [[0, 0]],
      zeroed: [[1, 0], [2, 0]],
      updated: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]],
      formula: 'l21 = 1/2,  R2 <- R2 - (1/2) R1\nl31 = 1,    R3 <- R3 - R1',
      result: '第一列已经变成主元下方全为 0。'
    },
    {
      title: '进入右下角子问题',
      explain: '第一列处理完后，算法只看右下角 2x2 子块和对应右端项。第二列中两个候选都是 3。',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '3', '-6', '-12']],
      pivot: [[1, 1], [2, 1]],
      formula: '候选主元：|3|, |3|\n这里无需交换，取第二行的 3 作为主元',
      result: ''
    },
    {
      title: '消去第二列',
      explain: '第三行第二列的 3 用第二行消掉，乘子 l32=1。',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '0', '-3', '-9']],
      pivot: [[1, 1]],
      zeroed: [[2, 1]],
      updated: [[2, 2], [2, 3]],
      formula: 'l32 = 1\nR3 <- R3 - R2',
      result: '现在得到上三角系统 Rx=c。'
    },
    {
      title: '回代求解',
      explain: '上三角系统可以从最后一个未知量开始向上求解。',
      matrix: [['2', '-2', '4', '10'], ['0', '3', '-3', '-3'], ['0', '0', '-3', '-9']],
      pivot: [[2, 2], [1, 1], [0, 0]],
      formula: '-3 x3 = -9  =>  x3 = 3\n3 x2 - 3 x3 = -3  =>  x2 = 2\n2 x1 - 2 x2 + 4 x3 = 10  =>  x1 = 1',
      result: '解为 x = (1, 2, 3)^T。'
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

<a href="{{ page.en_link }}" class="btn">Read in English</a>

建议先阅读 [数值分析讲义（三）：常微分方程初值问题与刚性 Part II]({{ '/zh/ode-stiffness-stability/' | relative_url }})。本篇整理线性方程组求解的前半部分：问题表述、Gauss 消去法、主元策略，以及由消去过程得到的 LR 三角分解。

---

## 4.1 问题表述与引言

本章讨论求解线性方程组的直接方法。

**线性方程组**  
要求解 $x\in\mathbb{R}^n$，使

$$
Ax=b
\tag{4.1}
$$

其中

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

这里讨论的直接方法在不考虑舍入误差的前提下，可以在有限步计算之后给出 (4.1) 的解。众所周知，(4.1) 是下面方程组的矩阵写法：

$$
a_{i1}x_1+a_{i2}x_2+\cdots+a_{in}x_n=b_i,\qquad i=1,\ldots,n.
$$

线性方程组在实践中经常作为大量问题的辅助问题出现。例如，在常微分方程和偏微分方程的边值问题、初边值问题求解中，在电路仿真、电磁场计算、图像处理等问题中都会遇到线性方程组。有估计认为，在技术和科学计算领域，大约 $75\%$ 的计算时间都花在线性方程组的求解上。

我们先回顾如下事实。

**命题 4.1.1**  
线性方程组 (4.1) 有解，当且仅当

$$
\operatorname{rang}(A)=\operatorname{rang}(A,b).
$$

这里，对于矩阵 $B\in\mathbb{R}^{n\times m}$，其秩定义为

$$
\operatorname{Rang}(B)
=\text{线性无关行向量的最大个数 }r
=\text{线性无关列向量的最大个数 }r.
$$

线性方程组 (4.1) 有唯一解，当且仅当 $A$ 可逆；等价地，$\det(A)\ne 0$。此时唯一解为

$$
x=A^{-1}b.
$$

## 4.2 Gauss 消去法与矩阵三角分解

Gauss 消去法的基本做法在线性代数中已经出现过。这里我们先简短回顾该方法，然后说明如何由它得到矩阵的三角分解。此外，我们还会说明舍入误差可能造成什么影响，以及如何有效抑制这种影响。

Gauss 消去法的基本思想是：通过初等操作把方程组 (4.1) 化为形如

$$
Ry=c,\qquad y_{\sigma_i}=x_i,\quad i=1,\ldots,n,
$$

的方程组。这里 $(\sigma_1,\ldots,\sigma_n)$ 是执行过的列置换，$R$ 是上三角矩阵

$$
R=
\begin{pmatrix}
r_{11}&\cdots&r_{1n}\\
&\ddots&\vdots\\
0&&r_{nn}
\end{pmatrix}.
$$

允许的初等操作包括：

- 将一个方程的若干倍加到另一个方程上；
- 行交换，也就是交换方程；
- 列交换，它对应未知量的重新编号。

所得方程组与 (4.1) 有相同解集。(4.3) 称为阶梯型方程组；只要 $R$ 可逆，它就可以很容易地通过回代求解。若没有执行列交换，则 $x=y$。

### 4.2.1 阶梯型方程组的求解

阶梯型方程组

$$
Ry=c
\tag{4.3}
$$

其中

$$
R=
\begin{pmatrix}
r_{11}&\cdots&r_{1n}\\
&\ddots&\vdots\\
0&&r_{nn}
\end{pmatrix},
\tag{4.4}
$$

以及

$$
Lz=d
\tag{4.5}
$$

其中

$$
L=
\begin{pmatrix}
l_{11}&0\\
\vdots&\ddots\\
l_{n1}&\cdots&l_{nn}
\end{pmatrix},
$$

显然可以分别通过回代和前代求解。

**定理 4.2.1**  
设 $R=(r_{ij})\in\mathbb{R}^{n\times n}$ 和 $L=(l_{ij})\in\mathbb{R}^{n\times n}$ 分别是可逆的上三角矩阵和下三角矩阵，并设

$$
c=(c_1,\ldots,c_n)^T,\qquad d=(d_1,\ldots,d_n)^T.
$$

则 (4.3) 和 (4.5) 的解可以如下计算：

a) 对上三角系统 (4.3) 作回代：

$$
y_i=
\frac{c_i-\sum_{j=i+1}^n r_{ij}y_j}{r_{ii}},
\qquad i=n,n-1,\ldots,1.
$$

b) 对下三角系统 (4.5) 作前代：

$$
z_i=
\frac{d_i-\sum_{j=1}^{i-1}l_{ij}z_j}{l_{ii}},
\qquad i=1,2,\ldots,n.
$$

**注 4.2.2**  
如果没有额外的特殊稀疏结构，例如稀疏性或带状结构，回代需要 $O(n^2)$ 次基本算术操作。

### 4.2.2 Gauss 消去法

现在说明如何用 Gauss 消去法得到一个阶梯型方程组。基本过程应该已经在线性代数中学过。与其直接操作方程 (4.1)，更方便的做法是在增广系数矩阵

$$
(A,b)=
\begin{pmatrix}
a_{11}&\cdots&a_{1n}&b_1\\
\vdots&\ddots&\vdots&\vdots\\
a_{n1}&\cdots&a_{nn}&b_n
\end{pmatrix}
$$

上执行操作。

Gauss 消去法的基本过程如下。

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">图 4-1：用例 4.2.3 逐步跟踪列主元 Gauss 消去和回代。</figcaption>
<div class="gauss-stepper" data-gauss-stepper>
  <div class="gauss-stepper__header">
    <div>
      <p class="gauss-stepper__title" data-gauss-title></p>
      <p class="gauss-stepper__explain" data-gauss-explain></p>
    </div>
    <div class="gauss-stepper__controls" aria-label="Gauss 消去步骤控制">
      <button class="gauss-stepper__button" type="button" data-gauss-prev>上一步</button>
      <button class="gauss-stepper__button" type="button" data-gauss-next>下一步</button>
      <button class="gauss-stepper__button" type="button" data-gauss-reset>重置</button>
      <span class="gauss-stepper__counter" data-gauss-counter aria-live="polite"></span>
    </div>
  </div>
  <div class="gauss-stepper__workspace">
    <div class="gauss-stepper__matrix-wrap" aria-live="polite">
      <table class="gauss-stepper__matrix" aria-label="例 4.2.3 的增广矩阵">
        <tbody data-gauss-matrix></tbody>
      </table>
    </div>
    <div class="gauss-stepper__side">
      <p class="gauss-stepper__formula" data-gauss-formula></p>
      <p class="gauss-stepper__result" data-gauss-result></p>
    </div>
  </div>
  <noscript>
    <p>例 4.2.3 经过行交换、两轮消去后得到上三角系统，回代给出 $x=(1,2,3)^T$。</p>
  </noscript>
</div>
<p class="linear-system-figure__note">这张图把文字里的“列主元搜索、保存乘子、缩小子问题”落实到同一个 3 阶例子上；黄色表示当前主元，红色表示刚被消成 0 的位置，绿色表示本轮被更新的条目。</p>
</figure>

**Gauss 消去法的基本概念**

**步骤 0：初始化。**

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

**步骤 1：选主元。** 寻找一个依赖 $x_1$ 的方程 $r$，也就是满足 $a^{(1)}_{r1}\ne 0$ 的行，并将它与第一个方程交换：

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

若 $A$ 可逆，则总能找到这样的 $r$，因为 $A$ 的第一列不可能全为零。

**步骤 2：消去。** 从其余方程中减去第一方程的适当倍数，使这些方程中 $x_1$ 的系数变为零。显然应从第 $i$ 个方程中减去第一方程的 $l_{i1}$ 倍，其中

$$
l_{i1}=\frac{\widetilde a^{(1)}_{i1}}{\widetilde a^{(1)}_{11}}.
$$

于是得到

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

也可以把剩余的子系统明确记作块矩阵：

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

**步骤 3：迭代。** 对 $k=2,\ldots,n-1$，把“选主元”和“消去”两个步骤应用于剩余的子系统。

第 <span>$k$</span> 步包含两个子步骤。

**第 <span>$k$</span> 轮步骤 1：选主元并换行。** 选取主元 <span>$a^{(k)}_{rk}\ne 0$</span>，其中 <span>$k\le r\le n$</span>，交换第 <span>$k$</span> 行和第 <span>$r$</span> 行：

$$
(A^{(k)},b^{(k)})\rightsquigarrow(\widetilde A^{(k)},\widetilde b^{(k)}).
$$

**第 <span>$k$</span> 轮步骤 2：消去。** 从第 <span>$i$</span> 个方程中减去第 <span>$k$</span> 个方程的 <span>$l_{ik}$</span> 倍，其中

$$
l_{ik}=\frac{\widetilde a^{(k)}_{ik}}{\widetilde a^{(k)}_{kk}},
\qquad i=k+1,\ldots,n.
$$

于是

$$
(\widetilde A^{(k)},\widetilde b^{(k)})
\rightsquigarrow
(A^{(k+1)},b^{(k+1)}).
$$

经过 $k$ 次消去之后，

$$
(A,b)=:(A^{(1)},b^{(1)})\to(A^{(2)},b^{(2)})\to\cdots\to(A^{(k+1)},b^{(k+1)}),
$$

得到的中间矩阵具有如下形状：

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

经过 $n-1$ 次消去后，得到阶梯型方程组 (4.3)

$$
Rx=c,\qquad R=A^{(n)},\quad c=b^{(n)}.
$$

### 4.2.3 主元策略

在第 <span>$k$</span> 轮的主元选择步骤中确定的元素 <span>$a^{(k)}_{rk}$</span> 称为主元。理论上，选主元时可以选择任意 <span>$a^{(k)}_{rk}\ne 0$</span>。但选取很小的主元可能导致舍入误差被剧烈放大。因此通常按如下方式选择 <span>$a^{(k)}_{rk}$</span>：

**列主元搜索**：选取 $k\le r\le n$，使

$$
|a^{(k)}_{rk}|=\max_{k\le i\le n}|a^{(k)}_{ik}|.
$$

这里应当先对 $A$ 的行作平衡化，使各行范数处于同一数量级。

**例 4.2.3**  
考虑

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

它给出增广矩阵

$$
\begin{pmatrix}
1&2&-1&2\\
2&-2&4&10\\
2&1&-2&-2
\end{pmatrix}.
$$

列主元搜索后交换前两行：

$$
\begin{pmatrix}
2&-2&4&10\\
1&2&-1&2\\
2&1&-2&-2
\end{pmatrix}.
$$

消去第一列时，乘子为 $l_{21}=1/2$ 和 $l_{31}=1$，得到

$$
\begin{pmatrix}
2&-2&4&10\\
0&3&-3&-3\\
0&3&-6&-12
\end{pmatrix}.
$$

再次列主元搜索并消去第二列，乘子为 $l_{32}=1$，得到

$$
\begin{pmatrix}
2&-2&4&10\\
0&3&-3&-3\\
0&0&-3&-9
\end{pmatrix}.
$$

把这个例子继续写成三角分解，可以更清楚地看到 <span>$L$</span> 矩阵从哪里来。原系数矩阵为

$$
A=
\begin{pmatrix}
1&2&-1\\
2&-2&4\\
2&1&-2
\end{pmatrix}.
$$

第一次列主元搜索交换前两行，因此

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

第一轮消去保存的乘子是

$$
l_{21}=\frac{1}{2},\qquad l_{31}=1.
$$

第二轮不需要换行，消去第二列时保存

$$
l_{32}=1.
$$

因此这些乘子组成下三角矩阵

$$
L=
\begin{pmatrix}
1&0&0\\
\frac12&1&0\\
1&1&1
\end{pmatrix},
$$

而消去结束后的上三角系数矩阵为

$$
R=
\begin{pmatrix}
2&-2&4\\
0&3&-3\\
0&0&-3
\end{pmatrix}.
$$

直接相乘可以验证：

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

所以在这个例子中，Gauss 消去不仅把方程组变成上三角形式，同时也给出了 <span>$PA=LR$</span>。

### 4.2.4 Gauss 方法的实际实现

在计算机实现中，通常也会保存用到的乘子 $l_{ik}$。我们将看到，此时 Gauss 消去法会“免费”给出 $A$ 的一个三角分解，也称 LR 分解：

$$
LR=PA.
\tag{4.6}
$$

这里 $R\in\mathbb{R}^{n\times n}$ 是形如 (4.4) 的上三角矩阵，$L\in\mathbb{R}^{n\times n}$ 是形如

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

的下三角矩阵，$P$ 是只对 $A$ 的行作置换的置换矩阵。

由此得到带列主元搜索的 Gauss 方法实现。

**算法 4.2.4：带列主元搜索的 Gauss 消去法**

令 $(A^{(1)},b^{(1)})=(A,b)$。同时令

$$
L^{(1)}=0\in\mathbb{R}^{n\times n}.
$$

这里的 $L^{(1)}$ 不是最终分解中的 $L$，而只是一个用来暂存消去乘子的辅助矩阵。它的主对角线全为 $0$，只在严格下三角位置记录已经得到的乘子；最终的下三角矩阵才是单位矩阵加上这些乘子，即 $L=I+L^{(n)}$。

对 $k=1,2,\ldots,n-1$：

1. 列主元搜索：确定 $k\le r\le n$，使

$$
|a^{(k)}_{rk}|=\max_{k\le i\le n}|a^{(k)}_{ik}|.
$$

若 $a^{(k)}_{rk}=0$：停止，$A$ 奇异。

交换 $(A^{(k)},b^{(k)})$ 和 $L^{(k)}$ 的第 $r$ 行与第 $k$ 行。结果形式上记为

$$
(\widetilde A^{(k)},\widetilde b^{(k)}),\qquad \widetilde L^{(k)}.
$$

2. 消去：对 $i=k+1,\ldots,n$，从 $(\widetilde A^{(k)},\widetilde b^{(k)})$ 的第 $i$ 行中减去第 $k$ 行的 $l_{ik}$ 倍，并把乘子 $l_{ik}$ 存入 $\widetilde L^{(k)}$。其中

$$
l_{ik}=\frac{\widetilde a^{(k)}_{ik}}{\widetilde a^{(k)}_{kk}}.
$$

形式上，结果记为 $(A^{(k+1)},b^{(k+1)})$ 和 $L^{(k+1)}$。

具体地，初始化

$$
(A^{(k+1)},b^{(k+1)}):=(\widetilde A^{(k)},\widetilde b^{(k)}),
\qquad
L^{(k+1)}:=\widetilde L^{(k)}.
$$

对 $i=k+1,\ldots,n$：

$$
l_{ik}=\frac{\widetilde a^{(k)}_{ik}}{\widetilde a^{(k)}_{kk}},
\qquad
b_i^{(k+1)}=\widetilde b_i^{(k)}-l_{ik}\widetilde b_k^{(k)},
$$

$$
a^{(k+1)}_{ik}=0,
\qquad
l^{(k+1)}_{ik}=l_{ik}
\quad\text{（保存乘子）}.
$$

对 $j=k+1,\ldots,n$：

$$
a^{(k+1)}_{ij}
=\widetilde a^{(k)}_{ij}-l_{ik}\widetilde a^{(k)}_{kj}.
$$

结果为

$$
R:=A^{(n)},\qquad c:=b^{(n)},\qquad L:=I+L^{(n)},
$$

其中 $I\in\mathbb{R}^{n\times n}$ 是单位矩阵。

该方法给出的阶梯型方程组

$$
Rx=c,\qquad R=A^{(n)},\quad c=b^{(n)}
$$

与原方程组 $Ax=b$ 有相同解集。

在计算机实现中，可以用原来存放 $A$ 和 $b$ 的数组来保存所有 $A^{(k)}$、$b^{(k)}$、$\widetilde A^{(k)}$、$\widetilde b^{(k)}$。这个暂存矩阵 $L^{(k)}$ 可以节省空间地存放在严格下三角中原本产生零的位置上。

**注 4.2.5**  
若没有额外的特殊稀疏结构，该算法需要 $O(n^3/3-n/3)$ 次基本算术操作。

### 4.2.5 完全主元搜索

也可以不用列主元搜索，而使用完全主元搜索。此时主元搜索不局限于当前第一列。算法 4.2.4 中步骤 1 需要修改如下。

**算法 4.2.6：带完全主元搜索的 Gauss 消去法**

在算法 4.2.4 中，将步骤 1 修改为：

1'. 完全主元搜索：确定 $k\le r\le n$、$k\le s\le n$，使

$$
|a^{(k)}_{rs}|=\max_{k\le i,j\le n}|a^{(k)}_{ij}|.
$$

若 $a^{(k)}_{rs}=0$：停止，$A$ 奇异。

交换 $(A^{(k)},b^{(k)})$ 和 $L^{(k)}$ 的第 $r$ 行与第 $k$ 行，同时交换 $(A^{(k)},b^{(k)})$ 和 $L^{(k)}$ 的第 $s$ 列与第 $k$ 列。结果形式上记为

$$
(\widetilde A^{(k)},\widetilde b^{(k)}),\qquad \widetilde L^{(k)}.
$$

注意：每次列交换都会导致 $x$ 的分量相应重新编号。也就是说，解出 (4.3) 之后，必须把结果向量 $x$ 的分量交换回去。

通常只有在矩阵“接近奇异”时才使用完全主元搜索，以尽量减小舍入误差影响。

### 4.2.6 得到一个三角分解

带列主元搜索的 Gauss 消去法（算法 4.2.4）给出 $A$ 的一个三角分解或 LR 分解：

$$
LR=PA.
\tag{4.6}
$$

这里 $R\in\mathbb{R}^{n\times n}$ 和 $L\in\mathbb{R}^{n\times n}$ 分别是算法 4.2.4 给出的形如 (4.4) 的上三角矩阵和形如 (4.7) 的下三角矩阵，$P$ 是执行行交换所对应的置换矩阵。

带完全主元搜索的 Gauss 消去法（算法 4.2.6）给出三角分解

$$
LR=PAQ,
\tag{4.8}
$$

其中 $P$ 和 $Q$ 分别是执行行交换和列交换所对应的置换矩阵。

**注 4.2.7**  
当需要对多个右端项求解 (4.1) 时，三角分解 (4.6) 或 (4.8) 非常有用。事实上，

$$
Ax=b
\Longleftrightarrow
PAQy=Pb,\quad x=Qy
\Longleftrightarrow
LRy=Pb,\quad x=Qy.
$$

若记 $z:=Ry$，则得到

$$
Lz=Pb,\qquad Ry=z,\qquad x=Qy.
$$

在列主元搜索的情况下，$Q=I$。

因此可以按如下步骤求出 $x$：

**三角分解下的前代-回代**

1. 根据定理 4.2.1，通过前代求解 $Lz=Pb$；
2. 根据定理 4.2.1，通过回代求解 $Ry=z$；
3. 得到解 $x=Qy$。

所以一旦三角分解已经给出，则对每一个右端项，(4.1) 都可以在 $O(n^2)$ 次操作内求解。

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">图 4-2：同一例子的乘子如何组成 $L$，消去结果如何成为 $R$。</figcaption>
<svg role="img" aria-labelledby="kap4-lr-example-title kap4-lr-example-desc" viewBox="0 0 1000 370" xmlns="http://www.w3.org/2000/svg">
  <title id="kap4-lr-example-title">从 Gauss 消去读出 LR 分解</title>
  <desc id="kap4-lr-example-desc">例 4.2.3 中先交换前两行，消去乘子 l21, l31 和 l32 组成下三角矩阵 L，最后的上三角系数组成 R，满足 PA 等于 LR。</desc>
  <rect width="1000" height="370" fill="#ffffff"/>
  <text x="500" y="36" text-anchor="middle" font-size="23" font-weight="700" fill="#17252a">例 4.2.3：消去过程同时给出 PA = LR</text>

  <g font-family="Consolas, SFMono-Regular, monospace" font-size="18" text-anchor="middle">
    <text x="120" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">行交换 P</text>
    <rect x="48" y="100" width="144" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="84" y="130">0</text><text x="120" y="130">1</text><text x="156" y="130">0</text>
    <text x="84" y="160">1</text><text x="120" y="160">0</text><text x="156" y="160">0</text>
    <text x="84" y="190">0</text><text x="120" y="190">0</text><text x="156" y="190">1</text>
    <text x="120" y="238" font-family="sans-serif" font-size="14" fill="#54656f">把原矩阵前两行交换</text>

    <text x="312" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">PA</text>
    <rect x="240" y="100" width="144" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="276" y="130">2</text><text x="312" y="130">-2</text><text x="348" y="130">4</text>
    <text x="276" y="160">1</text><text x="312" y="160">2</text><text x="348" y="160">-1</text>
    <text x="276" y="190">2</text><text x="312" y="190">1</text><text x="348" y="190">-2</text>

    <text x="424" y="158" font-size="28" font-weight="700" fill="#455461">=</text>

    <text x="544" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">L：保存的乘子</text>
    <rect x="456" y="100" width="176" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="500" y="130">1</text><text x="544" y="130">0</text><text x="588" y="130">0</text>
    <text x="500" y="160" fill="#b45309" font-weight="700">1/2</text><text x="544" y="160">1</text><text x="588" y="160">0</text>
    <text x="500" y="190" fill="#b45309" font-weight="700">1</text><text x="544" y="190" fill="#b45309" font-weight="700">1</text><text x="588" y="190">1</text>
    <text x="544" y="238" font-family="sans-serif" font-size="14" fill="#54656f">l21=1/2, l31=1, l32=1</text>

    <text x="672" y="158" font-size="25" font-weight="700" fill="#455461">x</text>

    <text x="800" y="82" font-family="sans-serif" font-size="17" font-weight="700" fill="#12343b">R：最后的上三角矩阵</text>
    <rect x="720" y="100" width="160" height="104" fill="#f5f8fa" stroke="#aab8c2"/>
    <text x="760" y="130">2</text><text x="800" y="130">-2</text><text x="840" y="130">4</text>
    <text x="760" y="160">0</text><text x="800" y="160">3</text><text x="840" y="160">-3</text>
    <text x="760" y="190">0</text><text x="800" y="190">0</text><text x="840" y="190">-3</text>
  </g>

  <g font-size="15" fill="#334155">
    <rect x="150" y="286" width="230" height="48" rx="8" fill="#eef6f2" stroke="#8ab7a0"/>
    <text x="265" y="316" text-anchor="middle">分解阶段：对 A 做一次 O(n^3) 消去</text>
    <path d="M390 310 H458" fill="none" stroke="#78909c" stroke-width="2" marker-end="url(#kap4-lr-arrow)"/>
    <rect x="470" y="286" width="380" height="48" rx="8" fill="#f5f1e8" stroke="#d0aa58"/>
    <text x="660" y="316" text-anchor="middle">求解阶段：每个右端项只做 Lz=Pb 与 Rx=z，O(n^2)</text>
  </g>
  <defs>
    <marker id="kap4-lr-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="#78909c"/>
    </marker>
  </defs>
</svg>
<p class="linear-system-figure__note">这里的 $L$ 不是重新计算出来的：它的严格下三角元素就是图 4-1 中各轮消去保存的乘子；$R$ 则是消去结束后的上三角系数矩阵。</p>
</figure>

下面说明带列主元搜索的 Gauss 消去法确实给出三角分解 (4.6)。完全主元搜索可以类似分析。

### 4.2.7 消去步骤的矩阵表示

考虑带列主元搜索的 Gauss 消去法（算法 4.2.4）。形式上，过渡

$$
(A^{(k)},b^{(k)})
\to
(\widetilde A^{(k)},\widetilde b^{(k)})
\to
(A^{(k+1)},b^{(k+1)})
$$

可以通过左乘矩阵表示。事实上，

$$
(\widetilde A^{(k)},\widetilde b^{(k)})
=P_k(A^{(k)},b^{(k)})
\quad\text{（行交换）},
$$

$$
(A^{(k+1)},b^{(k+1)})
=L_k(\widetilde A^{(k)},\widetilde b^{(k)})
=L_kP_k(A^{(k)},b^{(k)})
\quad\text{（消去）}.
$$

这里 $P_k$ 是基本置换矩阵，由单位矩阵交换第 $k$ 行与第 $r$ 行得到：

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

而 $L_k$ 是基本消去矩阵：

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

经过 Gauss 算法的 $n-1$ 个步骤后，得到

$$
R=A^{(n)}=L_{n-1}P_{n-1}\cdots L_1P_1A.
$$

如果消去过程中不需要行交换，则

$$
R=A^{(n)}=L_{n-1}\cdots L_1A,
$$

从而

$$
A=L_1^{-1}\cdots L_{n-1}^{-1}R=:LR.
$$

容易验证

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

因此，对 Gauss 方法给出的矩阵 $L$ 和 $R$，若不选主元，则有

$$
A=LR.
$$

一般地，有如下定理。

**定理 4.2.8**  
设 $A\in\mathbb{R}^{n\times n}$ 非奇异。则：

i) 算法 4.2.4 中的 Gauss 消去法给出形如 (4.7) 的下三角矩阵 $L$ 和上三角矩阵 $R$，满足

$$
LR=PA.
$$

这里 $P=P_{n-1}\cdots P_1$ 是置换矩阵，其中 $P_k$ 是第 $k$ 步行交换对应的置换矩阵。

ii) 算法 4.2.6 给出三角分解

$$
LR=PAQ.
$$

这里 $P$ 如上，$Q=Q_1\cdots Q_{n-1}$，其中 $Q_k$ 是第 $k$ 步列交换对应的置换矩阵。

**证明**  
如果没有发生行交换和列交换，上面已经证明了结论。

一般情形下可以证明：带列主元搜索的 Gauss 方法（或带完全主元搜索的 Gauss 方法）给出的 $L,R$，与对 $PA$（或 $PAQ$）不选主元地执行 Gauss 方法所得结果相同。

有一些重要的矩阵子类可以不进行主元搜索。

### 4.2.8 不需要主元搜索的矩阵类

- $A=A^T$ 是对称正定矩阵，也就是

$$
x^TAx>0\qquad \forall x\in\mathbb{R}^n\setminus\{0\}.
$$

我们后面会继续讨论这一类矩阵。

- $A$ 严格对角占优，也就是

$$
|a_{ii}|>\sum_{\substack{j=1\\j\ne i}}^n |a_{ij}|,
\qquad i=1,\ldots,n.
$$


- $A$ 是 M-矩阵，也就是

$$
a_{ii}>0,\qquad i=1,\ldots,n,
$$

$$
a_{ij}\le 0,\qquad i\ne j,
$$

并且

$$
D^{-1}(A-D),\qquad D=\operatorname{diag}(a_{11},\ldots,a_{nn})
$$

的所有特征值的模都小于 $1$。

---

<!-- 继续阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part II]({{ '/zh/linear-systems-cholesky-conditioning/' | relative_url }})。 -->

**英文缩写与记号说明**

- LR 分解：这里沿用讲义记号，$L$ 是下三角矩阵，$R$ 是上三角矩阵；在许多英文教材中同一结构常写作 LU decomposition。
- pivot：主元；partial pivoting 对应本文的列主元搜索，complete pivoting 对应完全主元搜索。

**来源、版权与使用说明**

本文整理自本地保存的 TU Darmstadt 2016 年 Mathematik 4 ET/3Inf 讲义文件 `Skript-Mathe4ET-3Inf-2016-Kap4-5.pdf` 中的第 4 章，并参考同目录下的中文翻译草稿 `Skript-Mathe4ET-3Inf-2016-Kap4.zh.md`。正文为个人学习、翻译与知识整理用途发布，文中的中文表述、补充说明和重新制作的图表不代表原作者或官方立场。

本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原始材料来源的前提下，用于非商业学习、交流和引用。由于本文部分内容基于课程讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、课程页面及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议先确认原始材料的授权状态。

如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系指出，我会及时处理或删除。
