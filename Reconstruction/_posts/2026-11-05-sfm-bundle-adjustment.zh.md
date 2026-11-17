---
title: "三维重建（二）：特征轨迹、相机注册与束调整"
date: 2026-11-05
lang: zh
permalink: /zh/sfm-bundle-adjustment/
en_link: /en/sfm-bundle-adjustment/
series: 3d-reconstruction
series_order: 2
classes: reconstruction-article
categories: [Computer Vision]
tags: [3D Reconstruction, SfM, SIFT, Bundle Adjustment]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "将城堡照片中的局部特征连接成轨迹，经 PnP 注册相机，再从重投影目标、局部线性化与 Schur 补理解束调整。"
---

{% include reconstruction-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

[第一篇]({{ '/zh/reconstruction-intuition/' | relative_url }})建立了相机投影、对极约束与三角化：给定相机，可以从对应点恢复三维位置；给定可靠对应，也能约束相机之间的运动。实际的 11 张城堡照片需要同时完成这两件事。局部特征提供观测关系，特征轨迹把图像对连接成场景，束调整则使相机与三维点在共同的投影模型下协调起来。

本篇沿用 $$\mathbf X_i=R_i\mathbf X+\mathbf t_i$$ 的世界到相机约定。像素观测用 $$\mathbf p_{ij}$$ 表示，其中 $$i$$ 指相机，$$j$$ 指场景点；只有被该图像实际观测到的对应才参与后面的目标函数。

## 1. 从局部外观建立对应

城堡的窗沿、门框和砖缝提供了许多局部结构。相机移动后，它们的位置、尺度和方向发生变化，但附近的梯度布局往往仍可辨认。SIFT（Scale-Invariant Feature Transform）在尺度空间中寻找稳定结构，估计主要方向，再用局部梯度直方图构成经典的 128 维描述子。检测位置与描述外观是两个相关但不同的步骤。

{% include reconstruction-figure.html kind="features" caption="两张真实城堡照片的 SIFT 对应与局部图像块" %}

在图中选中一个门框或窗沿对应，可以对照两边放大块的中心。对于第一个图像的描述子 $$\mathbf f$$，记第二个图像里最近和次近的描述子距离为 $$d_1,d_2$$，常见的比值检验保留

$$
\frac{d_1}{d_2}<\tau
$$

的候选。它要求最佳候选明显优于另一个选择，而不只是“绝对距离似乎不大”。重复窗格可能让多个候选都很接近，正是这种外观歧义使比值检验有用。

本页在宽 960 的两张缩略图上各提取了 2,500 个特征，使用 $$\tau=0.8$$ 得到 1,089 个候选，再用基础矩阵 RANSAC 筛出 875 个几何内点。网页只画出其中一部分。这个展示直接使用原始缩略图，未先去畸变，因此直线极线模型是一种近似筛选；正式重建应在正确相机模型下处理观测。第三篇的独立平面扫描会先去畸变，再估计标定相机的相对位姿。

几何内点仍需要结合场景判断。重复窗户可能形成自洽的误配，一整面近似平坦的立面又可能由单应关系解释。匹配数量、图像覆盖、视差和模型类型应共同决定一个图像对是否适合重建。图中的两视图特征由本系列独立计算，并非上游 SfM 的原始轨迹。

## 2. 特征轨迹与新相机注册

从图像对走向完整场景，需要将重复出现的同一个物理位置合并起来。例如，A 图的特征与 B 图的特征对应，B 的这个特征又与 C 图中的位置对应，就可以尝试构成一条三视图轨迹。对于第 $$j$$ 个三维点，轨迹可记为

$$
\mathcal T_j=\{(i,\mathbf p_{ij})\mid i\in\mathcal V_j\}.
$$

其中 $$\mathcal V_j$$ 为观测到点 $$j$$ 的图像集合。轨迹记录的是一个点在哪些图像中出现。合并时若同一轨迹在一张图中包含两个冲突位置，就需要处理错误关联，不能无条件沿匹配图传递。稳定且分布广的轨迹同时约束多台相机；集中在局部纹理或运动树叶上的大量对应，则未必具有同等价值。

当初始相机与部分三维点已经建立，新照片可以通过二维—三维对应注册到场景。PnP（Perspective-n-Point）以已有 $$\mathbf X_j$$ 和新图中的 $$\mathbf p_{ij}$$ 为输入，估计该图的位姿。其重投影精化可写成

$$
(R_i^*,\mathbf t_i^*)=
\arg\min_{R_i,\mathbf t_i}
\sum_{j\in\mathcal J_i}
\rho\!\left(
\left\lVert\pi\!\left(K_i(R_i\mathbf X_j+\mathbf t_i)\right)-\mathbf p_{ij}\right\rVert^2
\right).
$$

这里 $$\mathcal J_i$$ 是新图与已有结构之间的有效关联，$$\rho$$ 用于减弱外点影响，$$\pi((a,b,c)^\top)=(a/c,b/c)^\top$$。实际通常先用鲁棒采样和位姿求解器获得初值，再进行非线性精化。

PnP 与第一篇的相对位姿估计具有不同输入：前者使用二维—三维对应，后者使用二维—二维对应。新图注册后，又可以与已有图像三角化更多轨迹，为后续照片提供新的三维支持。城堡上游运行先初始化了 8 个视图，再注册其余 3 张照片，期间不断三角化、筛点和优化，体现的正是这种反馈关系。

## 3. 共同的重投影目标

独立估计位姿和三角化只是得到一份初步场景。相机稍有偏转，会影响它看到的许多点；一个三维点的位置变化，又会影响所有观测它的图像。束调整（Bundle Adjustment，BA）将这些耦合关系放进同一个优化问题。

令 $$\mathbf c_i$$ 包含相机位姿及选定的内参，预测像素为 $$\hat{\mathbf p}_{ij}=\mathcal P(\mathbf c_i,\mathbf X_j)$$，残差定义为预测减观测：

$$
\mathbf r_{ij}=\mathcal P(\mathbf c_i,\mathbf X_j)-\mathbf p_{ij}.
$$

设 $$\Omega$$ 是全部有效观测的索引集合，$$\Sigma_{ij}$$ 描述观测坐标的不确定性，一个常见目标为

$$
\min_{\{\mathbf c_i\},\{\mathbf X_j\}}
\frac12\sum_{(i,j)\in\Omega}
\rho\!\left(\mathbf r_{ij}^\top\Sigma_{ij}^{-1}\mathbf r_{ij}\right).
$$

当 $$\Sigma_{ij}=I$$ 且 $$\rho(s)=s$$ 时，它就是所有二维重投影距离平方的和。协方差给不同方向和精度的观测设置合理权重；鲁棒损失则降低少数巨大残差对结果的支配。两者的作用应分别理解。

对于城堡门框，一个错误相机可以迫使很多点一起迁就；联合优化能利用其他照片对这些点的观测纠正这种补偿。若误配恰好形成结构化的错误模型，鲁棒损失却未必能识别它，因此 BA 仍依赖前面的几何验证和轨迹管理。

<details class="mv-derivation" markdown="1">
<summary>推导：高斯观测、白化残差与鲁棒损失</summary>

若观测误差独立服从零均值高斯分布，其似然包含

$$
p(\mathbf p_{ij}\mid\mathbf c_i,\mathbf X_j)
\propto
\exp\!\left(-\frac12\mathbf r_{ij}^\top\Sigma_{ij}^{-1}\mathbf r_{ij}\right).
$$

取所有观测似然的负对数，并将协方差视为已知常量，就得到加权最小二乘。若 $$L_{ij}^\top L_{ij}=\Sigma_{ij}^{-1}$$，白化残差为 $$\bar{\mathbf r}_{ij}=L_{ij}\mathbf r_{ij}$$，其欧氏范数平方正好等于上述马氏距离平方。

高斯模型没有解释粗大误配，因此常进一步采用鲁棒损失。Huber 损失对平方范数 $$s$$ 的一种写法为

$$
\rho_\delta(s)=
\begin{cases}
s,&s\le\delta^2,\\
2\delta\sqrt{s}-\delta^2,&s>\delta^2.
\end{cases}
$$

小残差仍按平方距离计，大残差的影响增长得较慢。阈值 $$\delta$$ 应与白化后的误差尺度对应；它并不是一个与坐标单位无关的通用常数。

</details>

## 4. 从非线性目标到局部更新

投影中有深度除法，旋转也受正交约束，因而 BA 不能一次线性求完。将全部待优化变量局部参数化为 $$\boldsymbol\theta$$，在当前估计附近，堆叠残差满足

$$
\mathbf r(\boldsymbol\theta\boxplus\Delta)
\approx\mathbf r(\boldsymbol\theta)+J\Delta.
$$

$$J$$ 是雅可比，$$\boxplus$$ 表示在合适的参数空间中施加增量；对旋转不能简单地任意修改矩阵元素。固定当前局部权重矩阵 $$W$$ 后，可通过阻尼正规方程求一次候选更新：

$$
(J^\top WJ+\lambda D)\Delta=-J^\top W\mathbf r.
$$

$$D$$ 是适当的正对角缩放，$$\lambda$$ 控制阻尼。求解器用真实目标判断这一步是否可信，并调整允许的步长。上式是局部加权近似，不表示鲁棒目标的所有二阶细节都由一个固定 $$W$$ 完整描述；Levenberg–Marquardt 和信赖域方法正是在这类局部模型上控制更新。

<details class="mv-derivation" markdown="1">
<summary>推导：透视投影与位姿扰动的雅可比</summary>

先忽略畸变，令相机点 $$\mathbf X_i=(X_c,Y_c,Z_c)^\top$$。像素对相机坐标的导数为

$$
J_{\rm proj}=
\begin{pmatrix}
f_x/Z_c&0&-f_xX_c/Z_c^2\\
0&f_y/Z_c&-f_yY_c/Z_c^2
\end{pmatrix}.
$$

因此残差对世界点的导数为 $$J_{\mathbf X}=J_{\rm proj}R_i$$。

对于位姿，选用作用在完整世界到相机变换左侧的小刚体扰动，增量顺序为 $$(\delta\mathbf v,\delta\boldsymbol\omega)$$。一阶近似给出

$$
\mathbf X_i'
\approx
(I+[\delta\boldsymbol\omega]_\times)\mathbf X_i+\delta\mathbf v
=
\mathbf X_i+\delta\mathbf v-[\mathbf X_i]_\times\delta\boldsymbol\omega.
$$

于是

$$
J_{\rm pose}=
J_{\rm proj}
\begin{bmatrix}I&-[\mathbf X_i]_\times\end{bmatrix}.
$$

这里 $$\delta\mathbf v$$ 是左侧刚体扰动的平移分量，不能与只对原始 $$\mathbf t_i$$ 相加的另一种参数化混用。若选择右侧扰动或不同增量顺序，雅可比也随之改变。

内参、畸变和残差白化通过链式法则继续连接到这些导数。本段只给出理想针孔模型下的几何部分；它也是检验实现中变换方向和符号是否一致的一个基准。

</details>

{% include reconstruction-figure.html kind="bundle" caption="四相机、18 个三维点的联合优化：观测、重投影与误差" %}

实验中蓝点是固定的含噪观测，橙色十字是当前模型的投影，线段表示残差。四台针孔相机观测 18 个点，共有 72 条二维观测；焦距和前两台相机位姿固定，优化另外两台的旋转、平移与所有三维点。观测的每个像素分量加入了标准差 0.4 的高斯噪声。

滑块改变从同一初值出发的最大函数评估预算，显示真实求解快照。全局误差从约 12.51 像素降到 0.38 像素，所用统计量是

$$
{\rm RMS}=
\sqrt{\frac1{\lvert\Omega\rvert}
\sum_{(i,j)\in\Omega}\lVert\mathbf r_{ij}\rVert^2}.
$$

它是每条观测二维距离的均方根，不是每个坐标分量的 RMS，也不是求解器的总 cost。实验采用 SciPy 的信赖域最小二乘，展示的是联合优化的机制，不是城堡 BA 的原始历史，也不是 Levenberg–Marquardt 的逐步运行录像。

## 5. 利用稀疏结构求解束调整

场景里虽然有许多未知量，一条重投影观测只关联一个点、相应的相机及可能共享的内参，不会同时依赖所有三维点。将变量分成相机增量 $$\Delta_c$$ 和点增量 $$\Delta_x$$，局部系统可写成

$$
\begin{pmatrix}U&B\\B^\top&V\end{pmatrix}
\begin{pmatrix}\Delta_c\\\Delta_x\end{pmatrix}
=
\begin{pmatrix}\mathbf b_c\\\mathbf b_x\end{pmatrix}.
$$

如果没有点与点之间的额外先验，$$V$$ 由各点的小块组成，易于分别求解。消去点增量，便得到相机的约化系统

$$
(U-BV^{-1}B^\top)\Delta_c
=\mathbf b_c-BV^{-1}\mathbf b_x.
$$

括号中的矩阵称为 Schur 补。求出相机增量后再回代三维点，使计算集中在较小的相机系统上，同时保留两类变量的联合影响。

<details class="mv-derivation" markdown="1">
<summary>推导：Schur 消元与三维点的回代</summary>

分块系统的第二行给出

$$
B^\top\Delta_c+V\Delta_x=\mathbf b_x,
\qquad
\Delta_x=V^{-1}(\mathbf b_x-B^\top\Delta_c).
$$

把它代入第一行 $$U\Delta_c+B\Delta_x=\mathbf b_c$$，整理后得到正文中的约化系统。实际实现通过解小型线性系统施加 $$V^{-1}$$，通常不显式构造整个逆矩阵。

共享内参可包含在相机一侧，位置或其他先验会增加残差块。若模型直接耦合不同三维点，$$V$$ 的简单块对角结构也会改变。固定规范自由度和适当阻尼，是使局部系统可稳定求解的重要条件。

</details>

这种结构也解释了局部与全局 BA 的分工。新照片加入时，只调整附近相机与点能够减少成本；随后在更大场景上优化，则能协调更广的误差传播。城堡运行中的多次 BA 与筛点不是重复执行同一件事，而是在观测集合和参数可信程度不断变化时重新协调几何。

## 6. 坐标自由度与实际误差

仅凭投影，整体平移、旋转和统一尺度无法由图像决定。对一个已标定场景，任取正尺度 $$s$$、旋转 $$Q$$ 和平移 $$\mathbf a$$，都可以将世界点变为 $$\mathbf X_j'=sQ\mathbf X_j+\mathbf a$$，再同步修改相机，使所有图像位置保持不变。这七个自由度称为相似变换的规范自由度。

<details class="mv-derivation" markdown="1">
<summary>推导：相似变换下投影不变及其约束方式</summary>

取

$$
R_i'=R_iQ^\top,
\qquad
\mathbf t_i'=s\mathbf t_i-R_iQ^\top\mathbf a.
$$

则

$$
R_i'\mathbf X_j'+\mathbf t_i'
=s(R_i\mathbf X_j+\mathbf t_i),
$$

而透视投影满足 $$\pi(s\mathbf y)=\pi(\mathbf y)$$，因此重投影不变。需要固定参考位姿并约束尺度，或使用已知长度、控制点和其他先验，才能消除对应的自由度。只固定一台相机位姿，通常仍留下全局尺度。

本页实验固定两台相机的完整位姿，给出了已知基线，是便于观察的较强约束；真实系统不一定采取同样的固定方式。未知内参或退化运动还可能引入更多不确定性，不能只靠计数七个规范自由度判断问题一定良定。

</details>

内参也需要按观测条件逐步处理。焦距、深度和畸变可能相互补偿；把全部参数过早放开，优化器可能用不合理标定迁就错误结构。共享同一镜头模型有助于增加约束，但变焦或其他明显标定变化又可能需要分组。保留覆盖广、具有足够三角化角度的观测，有助于区分这些影响。

上游城堡日志中的一次初始化 BA 使用 8 张图、16,759 条轨迹与 55,578 条重投影观测，cost 从约 52,361 降到 12,532，随后报告平均重投影误差约 0.47 像素；后续注册、优化和筛选结束后，保留观测的平均误差约为 0.44 像素。平均距离、上面实验的 RMS 和总 cost 是不同统计量，不能直接互换。它们也只说明已建模型对观测的拟合程度，不能单独证明整座城堡的三维精度。

## 7. 向稠密重建传递几何

SfM 结束后，图像、对应标定和位姿已经处于共同坐标体系，稀疏结构还能帮助选择邻图与估计深度范围。交接时必须保留这些关系：只有一个不含相机的 PLY 点云，通常不足以直接启动 MVS；去畸变后的图像若再缩放或裁剪，也需要匹配的新内参。

至此，稀疏阶段将局部外观连接成共同的几何解释。接下来可以固定相机，将某个像素沿视线的位置作为未知量。[第三篇]({{ '/zh/multi-view-stereo/' | relative_url }})会沿着这一步，从平面诱导单应推到真实图像中的匹配代价，再走向多视图一致性与融合。

**记号与参考。**$$\Omega$$ 为有效图像观测集合，$$\mathbf r_{ij}$$ 为预测减观测的二维残差，$$\Sigma_{ij}$$ 为观测协方差，$$\rho$$ 为鲁棒损失，$$J$$ 为局部雅可比。特征的构造可参考 [SIFT 原始论文](https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf)；SfM 的组织方式可参考 [Structure-from-Motion Revisited](https://demuc.de/papers/schoenberger2016sfm.pdf)。优化器与 Schur 求解器的实现细节见 [Ceres 教程](https://ceres-solver.readthedocs.io/latest/nnls_tutorial.html)和[线性求解文档](https://ceres-solver.readthedocs.io/latest/nnls_solving.html)。

**数据与复现说明。**城堡照片和实际运行日志来自[固定版本的 OpenMVS 示例](https://github.com/cdcseacave/openMVS_sample/tree/8b67734532c4391604c646071938e7ac8ae9486d)，其[授权原文]({{ '/assets/data/reconstruction/LICENSE-OpenMVS-sample.txt' | relative_url }})随资源保留。两视图[特征匹配]({{ '/assets/data/reconstruction/features.json' | relative_url }})和四相机[合成 BA 快照]({{ '/assets/data/reconstruction/bundle.json' | relative_url }})由处理脚本独立生成，后者不含真实城堡的相机或优化历史。运行 <code>python scripts/prepare_reconstruction.py</code> 可重新生成这些教学数据，需要 NumPy、SciPy、OpenCV 与 Pillow。
