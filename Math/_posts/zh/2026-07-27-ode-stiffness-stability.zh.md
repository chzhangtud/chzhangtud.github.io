---
title: "数值分析讲义（三）：常微分方程初值问题与刚性 Part II"
lang: "zh"
date: 2026-07-27
permalink: /zh/ode-stiffness-stability/
en_link: /en/ode-stiffness-stability/
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

<a href="{{ page.en_link }}" class="btn">Read in English</a>

建议先阅读 [数值分析讲义（三）：常微分方程初值问题与刚性 Part I]({{ '/zh/ode-initial-value-stability/' | relative_url }})。本篇继续整理常微分方程（ordinary differential equation, ODE）初值问题（initial value problem, IVP）中的刚性微分方程、稳定区域、A 稳定（A-stability）和 L 稳定（L-stability）。

---

## 3.2 刚性微分方程

在许多应用中，例如化学反应过程，以及偏微分方程的半离散化中，会出现刚性系统。虽然它们同样也是初值问题，但对于许多方法（不是所有方法），为了得到准确解，它们会迫使步长 $h$ 小到难以接受。

从一个由 $n$ 个常微分方程组成的初值问题出发。相应地，记 IVP$_n$ 为 $n$ 维 initial value problem：

$$
\text{(IVP}_n\text{)}\qquad
y'(t)=f(t,y(t)),\qquad t\in[a,b],
$$

$$
y(a)=y_0,
$$

其中

$$
f:[a,b]\times\mathbb{R}^n\to\mathbb{R}^n,
\qquad
y_0\in\mathbb{R}^n.
$$

文献中对“刚性系统”这一概念的定义并不完全统一。直观地说，刚性问题的解往往同时包含两个时间尺度：一部分变化较慢，另一部分会在很短时间内迅速衰减。

线性情形记为 LIVP$_n$（linear initial value problem）：

$$
\text{(LIVP}_n\text{)}\qquad
y'(t)=Ay(t)+c,\qquad t\in[a,b],
$$

$$
y(a)=y_0,
$$

其中矩阵 $A\in\mathbb{R}^{n\times n}$，向量 $c\in\mathbb{R}^n$。

此外，设 $A\in\mathbb{R}^{n\times n}$ 可对角化，并有相应特征值 $\lambda_i$ 和特征向量 $v_i$。若 $y_P$ 是一个特解，则通解具有形式

$$
y(t)=y_H(t)+y_P(t),
\qquad
y_H(t)=\sum_{i=1}^{n}C_i e^{\lambda_i t}v_i.
$$

若实部小于0

$$
\operatorname{Re}(\lambda_i)<0,\qquad i=1,\ldots,n,
$$

则

$$
\lim_{t\to\infty} y_H(t)\to 0,
$$

因此所有解都趋近于 $y_P$。其中，$y_H$ 中满足 $\operatorname{Re}(\lambda_i)\ll -1$ 的项衰减非常快，而满足 $\operatorname{Re}(\lambda_i)\not\ll -1$ 的项衰减明显较慢。也就是说，如果系统既有实部远小于 $0$ 的特征值，又有实部接近 $0$ 但仍为负的特征值，就会同时出现快、慢两个尺度；这类系统称为刚性系统，见定义 3.2.2。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">性质示意图：刚性来自快慢尺度同时存在</figcaption>
  <svg viewBox="0 0 760 340" role="img" aria-labelledby="ode-stiffness-title ode-stiffness-desc">
    <title id="ode-stiffness-title">刚性系统中的快衰减模态和慢衰减模态</title>
    <desc id="ode-stiffness-desc">图中显示 e^{-1000t} 快速衰减，e^{-t} 缓慢衰减。解已经由慢模态主导后，显式方法仍可能被快模态的稳定性限制住。</desc>
    <rect x="0" y="0" width="760" height="340" fill="#ffffff" />
    <line x1="82" y1="266" x2="690" y2="266" stroke="#334155" stroke-width="2" />
    <line x1="82" y1="55" x2="82" y2="266" stroke="#334155" stroke-width="2" />
    <text x="674" y="296" fill="#334155" font-size="16">t</text>
    <text x="40" y="65" fill="#334155" font-size="16">模态幅值</text>
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
    <text x="198" y="86" fill="#7c3aed" font-size="15">快模态基本消失</text>
    <text x="416" y="214" fill="#1d6fb8" font-size="16">慢模态：e^{-t}</text>
    <text x="202" y="252" fill="#c1121f" font-size="16">快模态：e^{-1000t}</text>
    <rect x="430" y="82" width="216" height="74" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <text x="448" y="108" fill="#334155" font-size="15">解看起来变化很慢</text>
    <text x="448" y="132" fill="#334155" font-size="15">但显式稳定步长仍可能很小</text>
  </svg>
  <p class="ode-figure__note">刚性问题中，快衰减分量很快从解里消失，但它对应的特征值实部远小于 $0$，仍会限制显式方法可选的稳定步长。</p>
</figure>

**例 3.2.1：** 考虑问题

$$
y'=Ay,
\qquad
y(0)=y_0:=
\begin{pmatrix}
C_1+C_2\\
C_1-C_2
\end{pmatrix},
$$

其中 $C_1,C_2\in\mathbb{R}$，并且

$$
A=
\begin{pmatrix}
\frac{\lambda_1+\lambda_2}{2} & \frac{\lambda_1-\lambda_2}{2}\\
\frac{\lambda_1-\lambda_2}{2} & \frac{\lambda_1+\lambda_2}{2}
\end{pmatrix}.
$$

$A$ 的特征值为 $\lambda_1,\lambda_2$，对应特征向量分别为

$$
\begin{pmatrix}1\\1\end{pmatrix}
\qquad\text{和}\qquad
\begin{pmatrix}1\\-1\end{pmatrix}.
$$

例如当

$$
\lambda_1=-1,\qquad \lambda_2=-1000
$$

时，解为

$$
y(t)
=C_1\begin{pmatrix}1\\1\end{pmatrix}e^{-t}
+C_2\begin{pmatrix}1\\-1\end{pmatrix}e^{-1000t}.
$$

第二项在极短时间后几乎不再起作用。第一项起主导作用，并且在 $t\to\infty$ 时也趋于 0。对于一个合适的积分方法，人们期望它在不对步长作强限制的情况下给出满足

$$
\lim_{j\to\infty}u_j=0
$$

的近似值 $u_j$。

然而，例如，如果使用显式 Euler 方法，那么由

$$
u_0=y_0
=C_1\begin{pmatrix}1\\1\end{pmatrix}
+C_2\begin{pmatrix}1\\-1\end{pmatrix}
$$

得到

$$
u_1=(I+hA)u_0
=C_1(1+h\lambda_1)\begin{pmatrix}1\\1\end{pmatrix}
+C_2(1+h\lambda_2)\begin{pmatrix}1\\-1\end{pmatrix},
$$

进而归纳得到

$$
u_j
=C_1(1+h\lambda_1)^j\begin{pmatrix}1\\1\end{pmatrix}
+C_2(1+h\lambda_2)^j\begin{pmatrix}1\\-1\end{pmatrix}.
$$

若 $C_2\ne0$，则必须选择

$$
|1+h\lambda_2|<1,
$$

也就是

$$
-h\lambda_2=1000h<2,
$$

才能保证 $\lim_{j\to\infty}u_j=0$。合适的方法应尽可能对所有 $h>0$ 都确保这一点。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">性质示意图：显式 Euler 的稳定步长被最快模态限制</figcaption>
  <svg viewBox="0 0 860 380" role="img" aria-labelledby="ode-euler-step-title ode-euler-step-desc">
    <title id="ode-euler-step-title">显式 Euler 在负实轴上的稳定步长限制</title>
    <desc id="ode-euler-step-desc">对显式 Euler 方法，负实轴上的稳定区间为 -2 到 0。同一个步长 h 对慢模态 lambda=-1 仍在稳定区间内，但对快模态 lambda=-1000 会把 q=lambda h 推到稳定区间之外。</desc>
    <rect x="0" y="0" width="860" height="380" fill="#ffffff" />
    <line x1="100" y1="188" x2="635" y2="188" stroke="#334155" stroke-width="2" />
    <polygon points="635,188 622,181 622,195" fill="#334155" />
    <text x="610" y="222" fill="#334155" font-size="16">Re(q)</text>
    <rect x="180" y="148" width="360" height="80" rx="6" fill="#dbeafe" stroke="#1d6fb8" stroke-width="2" />
    <text x="302" y="138" fill="#1d6fb8" font-size="16">稳定区间 S：-2 ≤ q ≤ 0</text>
    <g stroke="#334155" stroke-width="2">
      <line x1="180" y1="176" x2="180" y2="200" />
      <line x1="360" y1="176" x2="360" y2="200" />
      <line x1="540" y1="176" x2="540" y2="200" />
    </g>
    <text x="168" y="246" fill="#64748b" font-size="15">-2</text>
    <text x="350" y="246" fill="#64748b" font-size="15">-1</text>
    <text x="536" y="246" fill="#64748b" font-size="15">0</text>
    <circle cx="538" cy="188" r="8" fill="#2a9d55" />
    <text x="432" y="120" fill="#2a9d55" font-size="15">慢模态 q=-h≈0</text>
    <line x1="538" y1="181" x2="482" y2="124" stroke="#2a9d55" stroke-width="2" />
    <circle cx="74" cy="188" r="8" fill="#c1121f" />
    <text x="58" y="118" fill="#c1121f" font-size="15">快模态 q=-1000h</text>
    <text x="42" y="141" fill="#c1121f" font-size="15">已越过 -2</text>
    <line x1="82" y1="181" x2="118" y2="146" stroke="#c1121f" stroke-width="2" />
    <path d="M 540 274 C 465 256 270 256 180 274" fill="none" stroke="#7c3aed" stroke-width="3" stroke-dasharray="8 7" />
    <text x="245" y="304" fill="#7c3aed" font-size="15">若 λ=-1000，则 h&lt;0.002 才能留在区间内</text>
    <rect x="650" y="86" width="170" height="184" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <text x="668" y="116" fill="#334155" font-size="15">q = λh</text>
    <text x="668" y="148" fill="#334155" font-size="15">λ₁=-1：</text>
    <text x="668" y="171" fill="#2a9d55" font-size="15">q₁=-h，限制宽松</text>
    <text x="668" y="207" fill="#334155" font-size="15">λ₂=-1000：</text>
    <text x="668" y="230" fill="#c1121f" font-size="15">q₂=-1000h</text>
    <text x="668" y="253" fill="#c1121f" font-size="15">限制最严格</text>
  </svg>
  <p class="ode-figure__note">对多模态系统，步长必须同时让所有 $q_i=\lambda_i h$ 落在稳定区域内；因此最快衰减模态往往决定显式方法的最大步长。</p>
</figure>

因此，尽管解本身几乎不再变化，Euler 方法仍需要非常小的步长。这类微分方程称为刚性微分方程。形式化定义并不统一，下面的定义使用最为广泛。

**定义 3.2.2：** 如果 $A$ 的特征值实部非正，并且 $A$ 同时具有满足 $\operatorname{Re}(\lambda_i)\ll -1$ 的特征值，以及实部接近 $0$ 但仍为负的特征值，则称初值问题 (LIVP$_n$) 为刚性的。

下面转入刚性微分方程的数值处理。

为了推导刚性微分方程的一个简单模型方程，先考虑 $c=0$ 的 (LIVP$_n$)，即

$$
y'=Ay,
\qquad
y(0)=y_0.
\tag{3.9}
$$

设 $A$ 可对角化。那么存在 $M\in\mathbb{R}^{n\times n}$，使得

$$
MAM^{-1}=\operatorname{diag}(\lambda_1,\ldots,\lambda_n),
$$

其中 $\lambda_1,\ldots,\lambda_n$ 是 $A$ 的特征值。令 $z=My$，则

$$
z'=MAy=MAM^{-1}z
=\operatorname{diag}(\lambda_1,\ldots,\lambda_n)z,
\qquad
z(0)=My_0.
$$

因此，$z=My$ 的分量 $z_i$ 满足

$$
z_i'=\lambda_i z_i,
\qquad
z_i(0)=(My_0)_i.
\tag{3.10}
$$

对刚性微分方程，还满足 $\operatorname{Re}(\lambda_i)\le0$，其中一些特征值的实部远小于 $0$，另一些特征值的实部接近 $0$ 但仍为负。

**观察**

如果一个数值方法对所有微分方程 (3.10) 表现良好，那么它通常也会适合原系统。

因此引出如下模型问题。

**模型方程**

$$
y'=\lambda y,
\qquad
y(0)=1,
\qquad
\lambda\in\mathbb{C},\quad \operatorname{Re}(\lambda)<0.
\tag{3.11}
$$

其解为

$$
y(t)=e^{\lambda t},
$$

并且由于 $\operatorname{Re}(\lambda)<0$，有

$$
\lim_{t\to\infty}y(t)=0.
\tag{3.12}
$$

也就是说，解会根据
$$|\operatorname{Re}(\lambda)|$$
的大小以非常不同的速度衰减。为了使一个方法适合刚性微分方程，下面的要求被证明是有用的。

**要求**

对 (3.11) 数值得到的近似解，应尽可能好地反映精确解 $y(t)=e^{\lambda t}$ 的性质，特别是 (3.12)。

于是得到下面的定义。

**定义 3.2.3（A 稳定，绝对稳定）**  
这里的 A 稳定来自 A-stability，也常译为绝对稳定。

若一个方法应用于模型问题 (3.11) 时，对每个步长 $h>0$ 都产生一个序列 $\{u_j\}_{j\in\mathbb{N}_0}$，满足

$$
|u_{j+1}|\le |u_j|,
\qquad \forall j\ge0,
$$

则称该方法绝对稳定，或 A 稳定。

对许多单步方法，应用到模型问题 (3.11) 时有关系

$$
u_{j+1}=R(q)u_j,
\qquad q=\lambda h,
$$

其中 $R:D\to\mathbb{C}$，$0\in D\subseteq\mathbb{C}$。

这里可以这样读：把一个单步法套到测试方程 $y'=\lambda y$ 上以后，一步更新通常不再需要保留完整的微分方程形式，而会化成“旧值乘以一个复数”的形式。这个复数就是 $R(q)$，称为放大因子；它只依赖于组合量 $q=\lambda h$，而不是分别依赖 $\lambda$ 和 $h$。因此，$\lambda$ 的衰减速度和步长 $h$ 会一起决定一次数值步到底是在缩小误差、保持幅值，还是放大误差。

这里的 $D$ 是 $R$ 有定义的复数范围。写成 $0\in D\subseteq\mathbb{C}$，只是说明 $R$ 至少在 $q=0$ 附近有意义，但不一定对所有复数 $q$ 都有定义。比如后面的隐式 Euler 有 $R(q)=1/(1-q)$，所以 $q=1$ 处没有定义；隐式梯形规则有 $R(q)=(1+q/2)/(1-q/2)$，所以 $q=2$ 处没有定义。稳定区域只会在 $R$ 有定义的地方讨论。

有了这个写法，稳定性判断就变得很直接：

$$
u_j=R(q)^j u_0.
$$

如果
$$|R(q)|\le1$$
,一步不会放大当前数值；如果 $|R(q)|<1$，反复迭代后这个模态会衰减；如果 $|R(q)|>1$，即使精确解本来应该衰减，数值解也可能越算越大。稳定区域 $S$ 本质上就是所有满足 $|R(q)|\le1$ 的 $q=\lambda h$ 的集合。

**例 3.2.4：** 把显式 Euler 方法应用到模型问题 (3.11)，得到

$$
u_{j+1}
=u_j+h\lambda u_j
=(1+\lambda h)u_j
=(1+q)u_j,
$$

所以显式 Euler 方法的稳定函数为

$$
R(q)=1+q.
$$

**定义 3.2.5**  
$R$ 称为该单步方法的**稳定函数**。集合

$
S=\{q\in\mathbb{C}: |R(q)|\le1\}
$

称为该单步方法的**稳定区域**。

显然有

$$
\text{A 稳定}
\Longleftrightarrow
|R(q)|\le1\quad \forall q\in\mathbb{C},\ \operatorname{Re}(q)<0
$$

$$
\Longleftrightarrow
S\supset\{q\in\mathbb{C}:\operatorname{Re}(q)<0\}.
$$

**定义 3.2.6（L 稳定）**  
L-stability 是数值常微分方程文献中的约定名称。这里的 $L$ 通常不再像 A-stability 中的 A 那样展开成一个统一使用的英文短语；实际要记住的是它比 A 稳定更强，额外要求稳定函数在负实轴远端还要趋于 0。也就是说，对于 $q=\lambda h$ 中实部很大的负数，数值方法不仅不能放大，还应当把这种快速衰减模态强力压下去。

若一个方法 A 稳定，并且其稳定函数还满足

$$
\lim_{q\to-\infty}R(q)=0,
$$

则称该方法 L 稳定。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">性质示意图：A 稳定和 L 稳定的差别</figcaption>
  <svg viewBox="0 0 860 390" role="img" aria-labelledby="ode-l-stability-title ode-l-stability-desc">
    <title id="ode-l-stability-title">A 稳定和 L 稳定在负实轴远端的差别</title>
    <desc id="ode-l-stability-desc">横轴为 s=-q，越往右表示 q 越接近负实轴远端。隐式 Euler 的 |R(-s)| 趋于 0，隐式梯形规则的 |R(-s)| 趋向 1，因此前者 L 稳定，后者不是 L 稳定。</desc>
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
    <text x="756" y="121" fill="#334155" font-size="14">隐式 Euler</text>
    <line x1="704" y1="154" x2="746" y2="154" stroke="#c1121f" stroke-width="4" />
    <text x="756" y="159" fill="#334155" font-size="14">梯形规则</text>
    <text x="704" y="186" fill="#64748b" font-size="13">上虚线：幅值 1</text>
    <text x="222" y="246" fill="#1d6fb8" font-size="15">趋于 0：强阻尼</text>
    <text x="440" y="114" fill="#c1121f" font-size="15">趋向 1：不强阻尼</text>
  </svg>
  <p class="ode-figure__note">A 稳定保证左半平面不放大；L 稳定还要求很快衰减的模态在数值上也被压到接近 0。</p>
</figure>

### 3.2.1 一些方法的稳定区域

**显式 Euler 方法**

把显式 Euler 方法应用到模型问题 (3.11)，得到

$$
u_{j+1}=u_j+h\lambda u_j=(1+\lambda h)u_j,
$$

因此稳定函数为

$$
R(q)=1+q.
$$

稳定区域为

$$
S=\{q\in\mathbb{C}: |1+q|\le1\}.
$$

因此显式 Euler 方法不是 A 稳定的（例如取 $q=-1+2i$）。

**注 3.2.7：** 甚至可以证明，所有显式 Runge-Kutta 方法都不是 A 稳定的。

**隐式 Euler 方法**

隐式 Euler 方法对模型问题 (3.11) 给出

$$
u_{j+1}=u_j+h\lambda u_{j+1},
$$

因此

$$
u_{j+1}=\frac{1}{1-\lambda h}u_j.
$$

这给出稳定函数

$$
R(q)=\frac{1}{1-q},
\qquad q\ne1,
$$

以及稳定区域

$$
S=\{q\in\mathbb{C}: |1-q|\ge1\}
\supset
\{q\in\mathbb{C}: \operatorname{Re}(q)<0\}.
$$

因此隐式 Euler 方法是 A 稳定的，甚至是 L 稳定的。

**隐式梯形规则**

方法方程为

$$
u_{j+1}
=u_j+\frac{h}{2}\bigl(f(u_j)+f(u_{j+1})\bigr).
$$

对模型问题 (3.11)，得到

$$
u_{j+1}
=u_j+\frac{h}{2}\lambda(u_j+u_{j+1}),
$$

因此

$$
u_{j+1}
=
\frac{1+\lambda h/2}{1-\lambda h/2}u_j.
$$

所以

$$
R(q)=\frac{1+q/2}{1-q/2},
\qquad q\ne2,
$$

稳定区域为

$$
S
=\{q\in\mathbb{C}: |1+q/2|\le |1-q/2|\}
=\{q\in\mathbb{C}: \operatorname{Re}(q)\le0\}.
$$

因此隐式梯形规则是 A 稳定的，但不是 L 稳定的，因为

$$
\lim_{q\to-\infty}R(q)=-1.
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">稳定区域示意图：模型方程 $y'=\lambda y$ 的三种稳定区域</figcaption>
  <svg viewBox="0 0 920 430" role="img" aria-labelledby="ode-stab-title ode-stab-desc">
    <title id="ode-stab-title">显式 Euler、隐式 Euler 和隐式梯形规则的稳定区域</title>
    <desc id="ode-stab-desc">复平面上，显式 Euler 的稳定区域是以 -1 为圆心、半径为 1 的圆盘；隐式 Euler 的稳定区域是以 1 为圆心、半径为 1 的圆盘外部；隐式梯形规则的稳定区域是左半平面。</desc>
    <rect x="0" y="0" width="920" height="430" fill="#ffffff" />
    <g transform="translate(70 52)">
      <rect x="0" y="0" width="238" height="238" fill="#f8fafc" stroke="#d7dee2" />
      <circle cx="86" cy="119" r="46" fill="#dbeafe" stroke="#1d6fb8" stroke-width="3" />
      <line x1="24" y1="119" x2="222" y2="119" stroke="#334155" stroke-width="2" />
      <line x1="132" y1="27" x2="132" y2="214" stroke="#334155" stroke-width="2" />
      <polygon points="222,119 211,113 211,125" fill="#334155" />
      <polygon points="132,27 126,38 138,38" fill="#334155" />
      <text x="174" y="108" fill="#334155" font-size="13">Re(q)</text>
      <text x="140" y="41" fill="#334155" font-size="13">Im(q)</text>
      <g stroke="#334155" stroke-width="2">
        <line x1="40" y1="113" x2="40" y2="125" />
        <line x1="86" y1="113" x2="86" y2="125" />
        <line x1="132" y1="113" x2="132" y2="125" />
        <line x1="126" y1="73" x2="138" y2="73" />
        <line x1="126" y1="165" x2="138" y2="165" />
      </g>
      <circle cx="86" cy="119" r="4" fill="#1d6fb8" />
      <text x="30" y="142" fill="#64748b" font-size="13">-2</text>
      <text x="78" y="142" fill="#64748b" font-size="13">-1</text>
      <text x="128" y="142" fill="#64748b" font-size="13">0</text>
      <text x="143" y="78" fill="#64748b" font-size="13">i</text>
      <text x="143" y="170" fill="#64748b" font-size="13">-i</text>
      <text x="44" y="266" fill="#334155" font-size="17">显式 Euler</text>
      <text x="38" y="291" fill="#64748b" font-size="14">|1+q| ≤ 1</text>
    </g>
    <g transform="translate(342 52)">
      <rect x="0" y="0" width="238" height="238" fill="#f8fafc" stroke="#d7dee2" />
      <rect x="0" y="0" width="238" height="238" fill="#dcfce7" opacity="0.72" />
      <circle cx="178" cy="119" r="46" fill="#ffffff" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
      <line x1="24" y1="119" x2="222" y2="119" stroke="#334155" stroke-width="2" />
      <line x1="132" y1="27" x2="132" y2="214" stroke="#334155" stroke-width="2" />
      <polygon points="222,119 211,113 211,125" fill="#334155" />
      <polygon points="132,27 126,38 138,38" fill="#334155" />
      <text x="174" y="108" fill="#334155" font-size="13">Re(q)</text>
      <text x="140" y="41" fill="#334155" font-size="13">Im(q)</text>
      <g stroke="#334155" stroke-width="2">
        <line x1="86" y1="113" x2="86" y2="125" />
        <line x1="132" y1="113" x2="132" y2="125" />
        <line x1="178" y1="113" x2="178" y2="125" />
        <line x1="126" y1="73" x2="138" y2="73" />
        <line x1="126" y1="165" x2="138" y2="165" />
      </g>
      <text x="78" y="142" fill="#64748b" font-size="13">-1</text>
      <text x="128" y="142" fill="#64748b" font-size="13">0</text>
      <text x="174" y="142" fill="#64748b" font-size="13">1</text>
      <text x="143" y="78" fill="#64748b" font-size="13">i</text>
      <text x="143" y="170" fill="#64748b" font-size="13">-i</text>
      <text x="18" y="36" fill="#2a9d55" font-size="13">稳定：|1-q| ≥ 1</text>
      <text x="142" y="70" fill="#c1121f" font-size="13">不稳定圆盘</text>
      <text x="38" y="266" fill="#334155" font-size="17">隐式 Euler</text>
      <text x="24" y="291" fill="#64748b" font-size="14">圆盘 |1-q| &lt; 1 之外</text>
    </g>
    <g transform="translate(614 52)">
      <rect x="0" y="0" width="238" height="238" fill="#f8fafc" stroke="#d7dee2" />
      <rect x="0" y="0" width="132" height="238" fill="#fde68a" opacity="0.78" />
      <line x1="24" y1="119" x2="222" y2="119" stroke="#334155" stroke-width="2" />
      <line x1="132" y1="27" x2="132" y2="214" stroke="#334155" stroke-width="3" />
      <polygon points="222,119 211,113 211,125" fill="#334155" />
      <polygon points="132,27 126,38 138,38" fill="#334155" />
      <text x="174" y="108" fill="#334155" font-size="13">Re(q)</text>
      <text x="140" y="41" fill="#334155" font-size="13">Im(q)</text>
      <g stroke="#334155" stroke-width="2">
        <line x1="40" y1="113" x2="40" y2="125" />
        <line x1="86" y1="113" x2="86" y2="125" />
        <line x1="132" y1="113" x2="132" y2="125" />
        <line x1="126" y1="73" x2="138" y2="73" />
        <line x1="126" y1="165" x2="138" y2="165" />
      </g>
      <text x="30" y="142" fill="#64748b" font-size="13">-2</text>
      <text x="78" y="142" fill="#64748b" font-size="13">-1</text>
      <text x="128" y="142" fill="#64748b" font-size="13">0</text>
      <text x="143" y="78" fill="#64748b" font-size="13">i</text>
      <text x="143" y="170" fill="#64748b" font-size="13">-i</text>
      <text x="28" y="36" fill="#946200" font-size="13">稳定：Re(q) ≤ 0</text>
      <text x="31" y="266" fill="#334155" font-size="17">隐式梯形规则</text>
      <text x="26" y="291" fill="#64748b" font-size="14">左半平面，边界也稳定</text>
    </g>
    <text x="312" y="381" fill="#334155" font-size="18">q = λh 的位置决定数值步是否会衰减</text>
  </svg>
  <p class="ode-figure__note">每个小图都画在 $q=\lambda h$ 的复平面上：横轴是 $\operatorname{Re}(q)$，纵轴是 $\operatorname{Im}(q)$。隐式 Euler 的稳定区域不是单纯的左半平面，而是圆盘 $|1-q|<1$ 的外部；隐式梯形规则的稳定区域才是左半平面 $\operatorname{Re}(q)\le0$。</p>
</figure>

**隐式 Runge-Kutta 方法**

隐式 Runge-Kutta 方法特别适合刚性微分方程。若 Butcher 表中的系数 $\alpha_{ij}$ 不构成严格下三角矩阵，就得到隐式 Runge-Kutta 方法。其方法方程为

$$
k_i=k_i(t,u,h)
:=
f\left(
t+\gamma_i h,\,
u+h\sum_{l=1}^{r}\alpha_{il}k_l
\right),
\qquad i=1,\ldots,r,
$$

$$
\varphi(t,h;u)
=\sum_{i=1}^{r}\beta_i k_i.
\tag{3.13}
$$

注意这里求和到 $r$，而不是 $i-1$。

隐式 Runge-Kutta 方法是一个显式单步方法，只是各级 $k_i$ 由一个非线性方程组的解给出。实际上可以选择系数 $\alpha_{ij},\beta_i,\gamma_i$，使其成为一个 $L$ 稳定且阶数为 $p=2r$ 的方法。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：隐式 Runge-Kutta 的各级需要联立求解</figcaption>
  <svg viewBox="0 0 860 420" role="img" aria-labelledby="ode-irk-title ode-irk-desc">
    <title id="ode-irk-title">隐式 Runge-Kutta 方法的级变量联立关系</title>
    <desc id="ode-irk-desc">图中三个级变量 k1、k2、k3 彼此耦合。系数矩阵 alpha 的非零项可以出现在对角线和上三角部分，所以不能按 k1 到 k3 顺序直接显式计算，而需要在每一步解一个方程组。</desc>
    <rect x="0" y="0" width="860" height="420" fill="#ffffff" />
    <rect x="46" y="62" width="278" height="260" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <text x="74" y="96" fill="#334155" font-size="17">级变量互相依赖</text>
    <circle cx="126" cy="178" r="42" fill="#dbeafe" stroke="#1d6fb8" stroke-width="3" />
    <circle cx="246" cy="136" r="42" fill="#dcfce7" stroke="#2a9d55" stroke-width="3" />
    <circle cx="246" cy="244" r="42" fill="#fee2e2" stroke="#c1121f" stroke-width="3" />
    <text x="111" y="184" fill="#334155" font-size="18">k₁</text>
    <text x="231" y="142" fill="#334155" font-size="18">k₂</text>
    <text x="231" y="250" fill="#334155" font-size="18">k₃</text>
    <path d="M 166 165 C 188 148 204 141 206 140" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-arrow)" />
    <path d="M 208 163 C 181 183 166 193 165 194" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-arrow)" />
    <path d="M 246 178 L 246 202" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-arrow)" />
    <path d="M 213 226 C 178 212 156 199 154 198" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#ode-irk-arrow)" />
    <defs>
      <marker id="ode-irk-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 Z" fill="#334155" />
      </marker>
    </defs>
    <rect x="368" y="62" width="220" height="260" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <text x="404" y="96" fill="#334155" font-size="17">α 系数矩阵</text>
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
    <text x="404" y="278" fill="#64748b" font-size="14">非严格下三角：存在同时耦合</text>
    <rect x="628" y="94" width="190" height="196" rx="6" fill="#f8fafc" stroke="#d7dee2" />
    <text x="650" y="126" fill="#334155" font-size="16">每一步要求解</text>
    <text x="650" y="158" fill="#334155" font-size="15">(I-qA)k = λuⱼ1</text>
    <text x="650" y="190" fill="#334155" font-size="15">再计算</text>
    <text x="650" y="222" fill="#334155" font-size="15">uⱼ₊₁ = uⱼ + hβᵀk</text>
    <text x="650" y="258" fill="#64748b" font-size="14">计算更重，稳定性更强</text>
  </svg>
  <p class="ode-figure__note">显式 Runge-Kutta 可以逐级计算；隐式 Runge-Kutta 的 $k_i$ 通常互相依赖，因此每个时间步要先解出整组 stage。</p>
</figure>

**Butcher 表**

$$
\begin{array}{c|ccccc}
\gamma_1 & \alpha_{11} & \cdots & \cdots & \alpha_{1,r-1} & \alpha_{1,r}\\
\gamma_2 & \alpha_{21} & \cdots & \cdots & \alpha_{2,r-1} & \alpha_{2,r}\\
\vdots & \vdots & \vdots & \ddots & \vdots & \vdots\\
\gamma_r & \alpha_{r1} & \cdots & \cdots & \alpha_{r,r-1} & \alpha_{r,r}\\
\hline
& \beta_1 & \beta_2 & \cdots & \beta_{r-1} & \beta_r
\end{array}
$$

如果

$$
\beta=(\beta_1,\ldots,\beta_r)^T\in\mathbb{R}^r
$$

且 $A=(\alpha_{ij})$ 是 $\alpha$ 系数组成的矩阵，则对模型方程 (3.11)，$r$ 级 Runge-Kutta 方法可按如下方式计算：

$$
u_{j+1}
=
\left(
1+\lambda h\,\beta^T(I-\lambda h A)^{-1}\mathbf{1}
\right)u_j
$$

$$
=\left(
1+q\,\beta^T(I-qA)^{-1}\mathbf{1}
\right)u_j,
$$

其中 $\mathbf{1}\in\mathbb{R}^r$ 是所有分量都为 1 的向量。由此可得

$$
R(q)
=1+q\,\beta^T(I-qA)^{-1}\mathbf{1}
=
\frac{\det(I-qA+q\mathbf{1}\beta^T)}
{\det(I-qA)}.
$$

因此 $R(q)$ 是一个有理函数。

---

返回阅读 [数值分析讲义（三）：常微分方程初值问题与刚性 Part I]({{ '/zh/ode-initial-value-stability/' | relative_url }})。

**参考文献**

- [1] P. Deuflhard and F. Bornemann. *Numerische Mathematik II*. de Gruyter, Berlin, 2002. 3.1.5.
- [2] P. Deuflhard and F. Hohmann. *Numerische Mathematik I*. de Gruyter, Berlin, 2008. 1.2.3.
- [3] H. Heuser. *Gewöhnliche Differentialgleichungen*. Teubner, Stuttgart, 1989. 3.1.
- [4] R. Plato. *Numerische Mathematik kompakt*. Vieweg Verlag, Braunschweig, 2000. 1.2.3, 6.3.2.
- [5] J. Stoer. *Numerische Mathematik 1*. Springer Verlag, Berlin, 1994. 1.2.3, 4.4.2.
- [6] W. Törnig and P. Spellucci. *Numerische Mathematik für Ingenieure und Physiker 2*. Springer Verlag, Berlin, 1990. 1.2.3.
- [7] W. Walter. *Gewöhnliche Differentialgleichungen*. Springer, Berlin, 1986. 3.1.
- [8] J. Werner. *Numerische Mathematik 2*. Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**英文缩写与术语说明**

- ODE：ordinary differential equation，常微分方程。
- IVP：initial value problem，初值问题。
- LIVP：linear initial value problem，线性初值问题。
- RK4：fourth-order Runge-Kutta method，经典四阶 Runge-Kutta 方法。
- A-stability：A 稳定，也称绝对稳定。
- L-stability：L 稳定；除 A 稳定外，还要求稳定函数在负实轴远端趋于 0。

**来源、版权与使用说明**

本文主要参考 TU Darmstadt 信息学专业公开仓库中的数值分析基础课讲义：
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
原仓库包含 The Unlicense 授权说明。本文作为个人学习、翻译与知识整理用途发布，文中的中文表述、补充解释和图表重制不代表原作者或官方立场。
本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原文链接的前提下，用于非商业学习、交流和引用。由于本文部分内容基于 TU Darmstadt 公开讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议同时确认原始材料的授权状态。
如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系我指出，我会及时处理或删除。
