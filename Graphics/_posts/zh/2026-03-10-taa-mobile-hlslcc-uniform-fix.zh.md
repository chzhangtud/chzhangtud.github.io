---
title: "移动端 TAA：HLSLCC 整型 Uniform 错位问题"
lang: "zh"
date: 2026-03-10
permalink: /zh/taa-mobile-hlslcc-uniform-fix/
en_link: /en/taa-mobile-hlslcc-uniform-fix/
categories:
tags:
  - TAA
  - Mobile
  - Vulkan
  - HLSLCC
---

<style>
body {
  font-size: 14px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

<a href="{{ page.en_link }}" class="btn">Read in English</a>

* TOC
{:toc}

**背景。** 在将虚幻引擎 4.27 风格的 TAA（时序抗锯齿）移植到较老的 4.24 移动渲染管线时，TAA 会在 Vulkan 或 OpenGL ES 的移动路径上执行。该环境下存在一个 bug，表现为：程序运行到一定帧数后，某个 uniform buffer 里的整型数值会错乱，shader 读到错误数据，画面会在某一刻突然出错（例如布尔标志或像素坐标会变成很大的整数，按 IEEE754 解释成 float 后恰好是视口宽高或其倒数）。本文总结原因和一种可行 workaround。

## SM5 与 Vulkan/GLES 移动端：两条编译路径

**SM5 (D3D11/12)：**  
HLSL 由 FXC 编译。所有 cbuffer 参数（float 与 int）按 C++ 结构体布局打进同一个 constant buffer，运行时按字节从结构体拷贝，没有按类型拆分。

**Vulkan / GLES（移动预览）：**  
走 **HLSLCC**（HLSL → GLSL → SPIR-V）。HLSLCC 会把松散全局参数按类型拆成两个 uniform block：

```glsl
layout(binding=0, std140) uniform HLSLCC_CB  { vec4 cu_f[N]; };  // 所有 float 参数
layout(binding=1, std140) uniform HLSLCC_CBi { ivec4 cu_i[3]; }; // 所有 int 参数
```

Vulkan RHI 在 shader 编译期生成一张 **EmulatedUBsCopyInfo** 表：为每个参数记录「从 C++ 结构体偏移 X 处拷贝 Y 字节到打包的 float/int buffer 的偏移 Z」。每帧 dispatch 前会调用类似 `SetEmulatedUniformBufferIntoPacked` 按这张表做拷贝。因此同一份逻辑上的 cbuffer 在移动 Vulkan/GLES 上被拆成一个 float UBO 和一个 int UBO，C++ 结构体偏移到这两个 UBO 槽位的映射由 HLSLCC 路径生成。

## 问题表现：int uniform 读到了 float 数据

在 **int** uniform block 里看到的错误数值（例如在调试器或导出 `cu_i` 时），按 IEEE754 重新解释为 float 后，往往对应视口宽高及其倒数：

| `cu_i` 原始值（按 int） | 按 IEEE754 解释为 float |
|------------------------|--------------------------|
| 1126170624             | 160.0                    |
| 1119092736             | 90.0                     |
| 1003277517             | 1/160                    |
| 1010174817             | 1/90                     |

这些正好对应视口尺寸向量 (W, H, 1/W, 1/H)（例如 160×90）。说明 **EmulatedUBsCopyInfo** 里给 int 参数用的**源字节偏移**指到了 C++ 结构体中存放视口数据的那一段，而不是真正 int 参数所在的位置。问题出在 int 块的**偏移计算错误**，而不是内存被覆盖。

## 偏移为何算错：std140 与 C++ 布局不一致

HLSLCC 根据 **HLSL cbuffer 布局**计算每个变量在 C++ 结构体中的「源」字节偏移。生成的 GLSL 遵循 std140：float 数组每个元素按 16 字节（vec4）对齐。因此 HLSLCC 认为 9 个元素的 float 数组占 **9×16=144 字节**，而 C++ 结构体里同样数组一般是 **9×4=36 字节**。于是 HLSLCC 算出的「下一个参数起始位置」（例如该数组后的第一个 int 参数）相对实际 C++ 布局整体错位 144−36=108 字节，拷贝表就会把 int 块的源区域指到视口尺寸等 float 数据（或相邻数据）上，GPU 最终把 float 的字节读进了 int uniform。

## Workaround：用 float 传参，在 shader 里转回

一种稳妥的 workaround 是在移动 Vulkan/GLES 路径下**不在该 cbuffer 里使用整型参数**：把受影响的参数改成 float 传递（例如布尔用 0.0/1.0，像素坐标用 `float2`），在 shader 入口再转回目标类型（例如和 0.5 比较得到布尔，坐标转成 `int2`）。这样 HLSLCC 没有 int 参数可打包，就不会生成 `cu_i` / `HLSLCC_CBi`，**EmulatedUBsCopyInfo** 里也没有 int 条目，错误偏移的路径不会被走到。本质是通过从该 cbuffer 中移除整型 uniform 来绕过 bug，而不是去改 HLSLCC 的偏移计算。

## 小结

| 方面 | 说明 |
|------|------|
| **现象** | 在移动 Vulkan/GLES 上，TAA 的整型参数（如布尔、像素坐标）读到的值错误，按 float 解释时常对应视口相关数据。 |
| **原因** | HLSLCC 按 std140（float 数组每元素 16 字节）算源偏移，C++ 结构体按 4 字节/float → int 参数的源偏移错位，读到了 float 数据。 |
| **修复** | 用 float 传这些值，在 shader 内再转为 int/布尔，使整型 uniform block 不被使用，从而不走错误偏移路径。 |

**本文为博主原创，转载时请注明出处与原文链接，谢谢。**
