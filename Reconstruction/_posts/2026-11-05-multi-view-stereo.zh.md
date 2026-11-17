---
title: "三维重建（三）：平面扫描、PatchMatch 与多视图融合"
date: 2026-11-05
lang: zh
permalink: /zh/multi-view-stereo/
en_link: /en/multi-view-stereo/
series: 3d-reconstruction
series_order: 3
classes: reconstruction-article
categories: [Computer Vision]
tags: [3D Reconstruction, Multi-view Stereo, PatchMatch, OpenMVS]
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "从已知相机的相对投影推导平面诱导单应，在真实城堡照片上理解 SSD 与 ZNCC，再连接 PatchMatch、多视图一致性、深度融合与表面。"
---

{% include reconstruction-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

[前一篇]({{ '/zh/sfm-bundle-adjustment/' | relative_url }})把图像中的局部特征组织成轨迹，并共同优化相机与稀疏结构。现在固定相机，继续恢复门框周围的砖墙。稀疏特征已经足以支撑相机估计，墙面上更多像素却还没有三维位置；Multi-view Stereo（MVS）利用同一套投影几何，为这些位置寻找跨图像的表面证据。

本篇采用逐参考图估计深度与局部法线、再融合的路线。正文从相对投影推到局部平面的图像变换，再把这个变换用于实际匹配。这样，平面扫描、PatchMatch 与深度融合可以理解为同一个估计问题的不同环节。

## 1. 从一个像素到一块局部表面

沿用第一篇的约定，参考相机为 $$r$$，支持相机为 $$s$$，$$\mathbf X_s=R\mathbf X_r+\mathbf t$$。对于参考像素 $$\tilde{\mathbf p}_r$$，归一化视线为 $$\mathbf q_r=K_r^{-1}\tilde{\mathbf p}_r$$。给定参考相机的光轴深度 $$Z$$ 后，这个点投到支持图的位置是

$$
\mathbf p_s(Z)=
\pi\!\left(K_s\left(ZR\mathbf q_r+\mathbf t\right)\right).
$$

改变 $$Z$$，投影沿第一篇的极线移动。相机几何限定候选的位置，图像外观再帮助选择其中的深度。这里估计的是参考相机的 Z 深度；若其他系统使用射线距离，需要先转换深度定义。

仅比较一个像素容易遇到相同颜色。门框和砖缝之所以有辨识力，在于一小片区域的结构。为了同时投影整个参考图像块，可以把附近表面近似为参考相机坐标中的平面

$$
\mathbf n^\top\mathbf X_r=h,
\qquad \lVert\mathbf n\rVert=1.
$$

$$\mathbf n$$ 是局部法线，$$h$$ 是有符号平面偏移。对中心像素，$$h=Z\mathbf n^\top\mathbf q_r$$，所以“中心深度加法线”和“局部平面”是等价的候选表达。邻域像素落到这个平面上后，支持图像中的采样位置由一个单应矩阵给出：

$$
\tilde{\mathbf p}_s\sim
H_{sr}(\mathbf n,h)\tilde{\mathbf p}_r,
\qquad
H_{sr}=K_s\left(R+\frac{\mathbf t\mathbf n^\top}{h}\right)K_r^{-1}.
$$

法线在这里直接影响图像块的形变。城堡正立面、侧翼和屋顶的方向不同，只移动匹配窗口的中心，无法普遍对齐整块纹理。局部平面近似将深度和方向同时纳入评分。

<details class="mv-derivation" markdown="1">
<summary>推导：平面诱导单应与公式中的正负号</summary>

对平面上的任一点，有 $$\mathbf n^\top\mathbf X_r=h$$，因此

$$
\mathbf t
=\frac{\mathbf t\mathbf n^\top}{h}\mathbf X_r,
\qquad
\mathbf X_s=
\left(R+\frac{\mathbf t\mathbf n^\top}{h}\right)\mathbf X_r.
$$

再代入 $$\mathbf X_r=Z_rK_r^{-1}\tilde{\mathbf p}_r$$，并投影到支持图，齐次尺度 $$Z_r$$ 被消去，就得到正文的 $$H_{sr}$$。

若资料把平面写成 $$\mathbf n^\top\mathbf X_r+d_\pi=0$$，则 $$h=-d_\pi$$，公式就写成 $$K_s(R-\mathbf t\mathbf n^\top/d_\pi)K_r^{-1}$$。这两种符号来自平面方程约定不同，不能只对照加减号判断哪个实现正确。

对于任意邻域像素 $$\mathbf q$$，射线与平面的交点深度为 $$Z(\mathbf q)=h/(\mathbf n^\top\mathbf q)$$。当分母接近零、深度为负或投影落在有效图像之外时，这个采样不适合作为当前可见表面的匹配证据。公式也要求 $$h\ne0$$，平面不能经过参考相机中心。

</details>

## 2. 将几何候选变成图像代价

设参考窗口中有 $$N$$ 个采样位置 $$\mathbf p_k$$。对给定平面，记参考灰度与经过单应变换采样的支持灰度分别为

$$
a_k=I_r(\mathbf p_k),
\qquad
b_k=I_s\!\left(\pi(H_{sr}\tilde{\mathbf p}_k)\right).
$$

投影通常落在非整数像素处，因此需要插值。实验使用双线性采样，所有候选都在相同的参考窗口上比较，窗口大小变化时也保持代价的归一化含义。

直接的平方差代价为 SSD（Sum of Squared Differences）。本页采用每像素平均值并按 8 位灰度范围归一化：

$$
C_{\rm SSD}=\frac1{N\,255^2}\sum_{k=1}^N(a_k-b_k)^2.
$$

曝光差会改变这个值，即使纹理几何已经对齐。零均值归一化互相关 ZNCC 则先减去各块平均亮度，再比较其变化结构：

$$
{\rm ZNCC}=
\frac{\sum_k(a_k-\bar a)(b_k-\bar b)}
{\sqrt{\sum_k(a_k-\bar a)^2}\sqrt{\sum_k(b_k-\bar b)^2}},
\qquad
C_{\rm NCC}=1-{\rm ZNCC}.
$$

当两块有足够变化时，$$C_{\rm NCC}$$ 的理论范围为 0 到 2，越低表示结构越相似。分母过小时，归一化会放大噪声，因此低纹理像素还需要单独的可靠性判断。

{% include reconstruction-figure.html kind="sweep" caption="真实城堡照片的平面扫描：候选深度、图像块与匹配代价" %}

先在“门框附近”选择 21 像素窗口，拖动候选或跳到曲线最低点。参考图中的黄色区域保持固定，支持图中的四边形随候选平面移动；放大块显示附近的结构。曲线就是逐个计算上述代价后的结果，而不是绘制的示意函数。

这个实验使用两张真实照片，按上游日志中的末次标定去畸变，独立恢复相对位姿，并固定正对参考相机的法线 $$\mathbf n=(0,0,1)^\top$$。此时 $$h=Z$$，单应简化为 $$K_s(R+\mathbf t\mathbf e_3^\top/Z)K_r^{-1}$$，与实验数据生成代码一致。相对平移被归一化为长度 1，因而深度是基线相对单位，不是米，也不同于完整模型的显示坐标。

21 像素门框区域的最低代价约为 0.018，对应相对深度约 9.66。它表示当前位姿、法线与搜索范围下有一个很好的局部外观解释；这个数值尚未经过独立真值验证，也没有包含后续多视图融合。

<details class="mv-derivation" markdown="1">
<summary>推导：ZNCC 对整体增益与偏移的不变性</summary>

令支持块发生受控变化 $$b_k'=\alpha b_k+\beta$$，其中 $$\alpha>0$$，且不发生截断。其均值为 $$\bar b'=\alpha\bar b+\beta$$，于是

$$
b_k'-\bar b'=\alpha(b_k-\bar b).
$$

ZNCC 分子因此乘以 $$\alpha$$，支持块的范数也乘以 $$\alpha$$，两者抵消，所以 $$\operatorname{ZNCC}(\mathbf a,\mathbf b')=\operatorname{ZNCC}(\mathbf a,\mathbf b)$$。若 $$\alpha<0$$，相关性的符号会改变。

实验的亮度选项使用 $$\alpha=1.2,\beta=20$$，只作用于代价计算且不截断。因此 SSD 曲线改变，ZNCC 曲线保持不变。局部阴影、饱和、反射或视角相关高光不符合这个全块线性变化模型，不能由这条不变性推出对任意光照的鲁棒性。

</details>

切换到重复窗格，可以比较不同候选的局部低谷以及窗口大小的影响。较大窗口带来上下文，也更容易跨过窗框与后方墙面的深度边界；较小窗口定位更局部，外观却可能不够独特。天空区域在 21 像素窗口下的参考灰度标准差只有约 $$0.70/255$$，归一化后的曲线仍有最小值，但它可能主要反映微小噪声。实验保留这个现象并提示低纹理，实际系统还需用纹理、支持视图和一致性共同筛选。

## 3. 从平面扫描到 PatchMatch

实验沿 161 个深度候选逐一评分。它在逆深度 $$\nu=1/Z$$ 上均匀取样，因此相邻候选的深度间隔并不相等。对于第一篇的校正双目，$$d=fB\nu$$，均匀逆深度对应均匀视差，这使有限候选能更贴近图像上的分辨率要求。

完整场景既要为许多像素搜索深度，又要估计局部法线，直接穷举的成本迅速增长。PatchMatch 利用表面的空间连贯性：如果邻居找到了能解释砖墙的局部平面，这个平面很可能也值得当前像素测试。传播的是平面假设，必须在当前位置重新求交和评分。

具体地，若邻居平面为 $$(\mathbf n_a,h_a)$$，当前像素的候选深度是

$$
Z_{\rm cand}(\mathbf p)=
\frac{h_a}{\mathbf n_a^\top K_r^{-1}\tilde{\mathbf p}}.
$$

斜墙上的邻居与当前像素可以有不同深度，但共享相同平面；直接复制邻居的一个深度标量会丢失这层关系。传播之外，还需要随机或逐渐缩小范围的扰动，使算法能发现尚未出现的深度和方向候选。好的假设会扩散，错误候选则应在重新评分时被拒绝。

多尺度处理将较低分辨率上的稳定估计传到细尺度继续精化。粗尺度有助于搜索较大范围并借用上下文，也可能混合细窗框与背景，因此细尺度需要保留修正边界的机会。各尺度的焦距和主点必须与图像同步缩放。实验只演示固定法线的双视图平面扫描，没有运行这些完整的 PatchMatch 与多尺度步骤。

## 4. 支持视图与几何一致性

多张照片提供了更多观测，同时带来不同可见性。门洞右壁可能被某个方向的门框挡住，而顶部窗沿仍然清楚。通常先根据共享稀疏点、重叠、视角和分辨率选择邻图，再为具体像素判断有效支持。

若用 $$C_s(\mathbf p,Z,\mathbf n)$$ 表示某个支持图的光度代价，一种聚合表达是

$$
C_{\rm photo}=\sum_{s\in\mathcal S(\mathbf p)}
w_sC_s(\mathbf p,Z,\mathbf n),
\qquad w_s\ge0,\quad\sum_sw_s=1.
$$

它描述的是选取和加权支持证据的思想，并非断言所有实现使用同一组权重。简单平均所有视图会受到遮挡影响，只取单张最低代价又容易接受偶然的重复纹理；具体算法需要在可见性、鲁棒聚合与支持数量之间取得平衡。

仅有相似外观还不够。当支持图也有自己的深度图 $$D_s$$ 时，可以检查两个估计是否位于同一空间层。设参考候选投到支持图的位置为 $$\mathbf p_s$$，预期深度为 $$Z_s^{\rm pred}$$：

$$
\mathbf X_s=R\!\left(Z_rK_r^{-1}\tilde{\mathbf p}_r\right)+\mathbf t,
\qquad
Z_s^{\rm pred}=\mathbf e_3^\top\mathbf X_s.
$$

在 $$\mathbf p_s$$ 读取有效深度 $$D_s(\mathbf p_s)$$，反投影并变回参考相机，得到

$$
\mathbf X_r^{\rm back}
=R^\top\!\left(D_s(\mathbf p_s)K_s^{-1}\tilde{\mathbf p}_s-\mathbf t\right),
\qquad
\mathbf p_r^{\rm back}=\pi(K_r\mathbf X_r^{\rm back}).
$$

于是可以同时衡量往返像素误差和相对深度差：

$$
e_p=\lVert\mathbf p_r^{\rm back}-\mathbf p_r\rVert,
\qquad
e_Z=\frac{\lvert D_s(\mathbf p_s)-Z_s^{\rm pred}\rvert}
{\max(D_s(\mathbf p_s),Z_s^{\rm pred})}.
$$

两种误差分别约束图像位置与空间层次，需在有效、正深度且具有可见性意义的采样上使用。若支持图深度明显更近，参考候选可能被遮挡；若它明显更远，则可能存在空闲空间冲突。无效深度不能当作普通的零深度参与这些比较。

多视图一致性会降低部分偶然匹配的影响，但各图深度仍共享相机估计，系统性标定偏差可以传到所有视图。阈值还要随分辨率、尺度与噪声条件解释，不能由固定像素误差直接推出固定米制精度。

## 5. 从深度观测到共同表面

每张深度图都以自己的相机为参照。对于有效深度 $$D_i(\mathbf p)$$，对应世界点是

$$
\mathbf X^{(i)}=
R_i^\top\!\left(D_i(\mathbf p)K_i^{-1}\tilde{\mathbf p}-\mathbf t_i\right).
$$

同一个窗角可以从多张参考图产生多次测量。融合需要先通过位置、深度、法线和可见性判断它们是否描述相同表面，再进行聚合。对于已经确定相容的一组测量，简单的加权位置可写成

$$
\bar{\mathbf X}=
\frac{\sum_i\omega_i\mathbf X^{(i)}}{\sum_i\omega_i}.
$$

权重可以反映质量或支持程度，但不能因此假定这些测量在统计上完全独立。融合也不是把附近的所有点无条件平均：窗框前沿与后方墙面可能很近，却属于两层不同表面；不恰当合并会抹掉门洞结构。增加支持数有助于去噪，同时可能丢掉只被少数相机看见的细部。

{% include reconstruction-figure.html kind="viewer" caption="融合后的城堡点云与无贴图网格：对照门洞层次、屋顶边界与未观测区域" %}

在同一视角切换稠密点与网格，再缓慢转向侧面，可以把这些抽象关系落实到门洞和窗沿上。点大小只改变显示覆盖，不能代表重建完整度；网页还只显示 65,000 个稠密点，所以可见孔隙也可能受抽样影响。网格保留全部 244,247 个三角形，并且没有用照片纹理掩盖形状。

上游日志记录了 11 张深度图，深度估计分辨率为 1416×1064，融合并裁到感兴趣区域后输出 425,342 个点。深度样本数与最终点数不能直接相减来解释表面损失，因为同一表面可以被多张图重复观测，融合还包含筛选与去重。

## 6. 表面表示与重建评估

点云记录离散测量，网格进一步决定它们怎样连成面。不同方法会使用定向点、空间划分、相机可见性或自由空间等证据，对缺失区域也有不同假设。精细化可以继续利用图像调整已有表面，但受初始拓扑和观测覆盖约束；未拍到的背面不会因为细分更多就自动可信。

纹理映射又是另一层估计，它涉及图像选择、曝光协调、接缝与纹理图集。清楚的砖缝可能主要来自照片颜色，几何仍是一块平面。因此用于尺寸测量时，要单独验证表面，不能只看最后的彩色渲染。

有独立参考数据时，准确度通常衡量重建到参考表面的距离，完整度衡量参考可见表面被恢复的程度。评估需要明确尺度对齐、采样、裁剪和可见范围。本例没有独立标定真值，网页能够支持几何观察与缺陷定位，不能据此给出毫米精度或算法排名。低重投影误差、更多点数与更好外观分别提供不同信息。

至此，三篇的计算关系闭合起来：对应点支持相机与稀疏点的恢复，束调整协调共同观测，平面诱导投影则把固定相机用于稠密图像匹配，最后由多视图一致性与融合得到可检查的表面。学习式 MVS 会用特征与代价体改变表征和推断方式，仍需处理这些几何与可见性关系。

## 7. 复现与延伸资料

本系列的处理脚本生成缩略图、特征匹配、合成 BA 和独立平面扫描实验，并转换上游完整几何。它不重跑城堡的全部 SfM/MVS。平面扫描的[标定、位姿与代价数据]({{ '/assets/data/reconstruction/plane-sweep.json' | relative_url }})记录了 161 个逆深度候选；每个窗口的代价由未压缩灰度图计算，显示图则为 WebP，存在轻微压缩差异。

<details class="mv-derivation" markdown="1">
<summary>复现附录：网页数据与完整 OpenMVS 流程</summary>

在本仓库根目录执行下面的命令，会从固定版本下载上游数据并生成网页教学实验，需要 NumPy、SciPy、OpenCV 与 Pillow：

    python scripts/prepare_reconstruction.py

若要从全部 11 张原始照片重跑完整场景，需另行安装带 CreateStructure 的 OpenMVS 版本，并把原始 images 目录放在工作目录。以下命令摘自[上游运行脚本](https://github.com/cdcseacave/openMVS_sample/blob/8b67734532c4391604c646071938e7ac8ae9486d/run_pipeline.sh)，略去直接对稀疏点建网格的对照分支：

    CreateStructure -s images -o scene.sfm --export-mvs scene.mvs --extract-colors 1
    DensifyPointCloud scene.mvs
    ReconstructMesh scene_dense.mvs -p scene_dense.ply
    RefineMesh scene_dense.mvs -m scene_dense_mesh.ply -o scene_dense_mesh_refine.mvs --scales 1 --max-face-area 16
    TextureMesh scene_dense.mvs -m scene_dense_mesh_refine.ply -o scene_dense_mesh_refine_texture.mvs

依次检查相机场景、深度中间数据、稠密点云、初步网格、精细网格与纹理结果，保留版本、参数和日志。图像分辨率、支持视图和搜索范围都会改变资源开销，放松过滤也可能增加点数。应先确认相机与覆盖合理，再提高细节设置。

命令以安装版本的帮助为准，本次未在本机验证完整重建链；网页两张缩略图不能替代全部原图。其他 SfM 工具的结果需经适当导入器转换，保持图像、内参与位姿一致。安装入口见 [OpenMVS releases](https://github.com/cdcseacave/openMVS/releases)，另一条端到端路线可参考 [COLMAP CLI](https://colmap.github.io/cli.html)。

</details>

**记号与参考。**$$Z$$ 为参考相机的光轴深度，$$\nu=1/Z$$ 为逆深度，$$(\mathbf n,h)$$ 满足 $$\mathbf n^\top\mathbf X_r=h$$，$$H_{sr}$$ 将参考图像块映到支持图，$$D_i$$ 为第 $$i$$ 张深度图。倾斜平面与传播可参考 [PatchMatch Stereo](https://www.microsoft.com/en-us/research/publication/patchmatch-stereo-stereo-matching-with-slanted-support-windows/)；深度、法线、视图选择与几何一致性的结合可参考 [Pixelwise View Selection for Unstructured Multi-View Stereo](https://demuc.de/papers/schoenberger2016mvs.pdf)。具体阶段及接口见 [OpenMVS 官方流程](https://github.com/cdcseacave/openMVS/blob/develop/docs/wiki/Usage.md)。

**数据与使用说明。**完整交互模型来自[固定版本的 OpenMVS 示例](https://github.com/cdcseacave/openMVS_sample/tree/8b67734532c4391604c646071938e7ac8ae9486d)，未在本次工作中重跑。原始数量和展示变换见[数据清单]({{ '/assets/data/reconstruction/manifest.json' | relative_url }})，上游 AGPL-3.0 [授权原文]({{ '/assets/data/reconstruction/LICENSE-OpenMVS-sample.txt' | relative_url }})随资源保留，具体材料以原始来源的使用条件为准。
