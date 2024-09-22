---
title: "WebGL图形应用抓帧分析- RenderDoc + SpectorJS"
lang: "zh"
date: 2024-08-30
permalink: /zh/webgl-renderdoc/
en_link: /en/webgl-renderdoc/
pre_requisite:
categories:
tags:
  - Debug
---

<style>
body {
  font-size: 14px;
}
.container {
  max-width: 1200px;
  margin: 0 auto; /* 使页面居中 */
}
</style>

<head>
  <script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
      }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>

<a href="{{ page.en_link }}" class="btn">Read in English</a>

* TOC
{:toc}

桌面端及移动端的图形程序可以用 Nsight, RenderDoc, Arm performance studio, Snapdragon Profiler 来较为方便的调试学习。
当我们在互联网上发现某些比较不错图形应用，想要结合源码以及图形渲染的绘制流程了解其背后的算法时，RenderDoc 和 Spector.js 都是不错的工具。本文简单介绍一下 RenderDoc 抓帧 WebGL 应用的流程，主要是记录一下过程备忘。

# Prerequisite
Chrome (2023.03以前的版本): 相关原因的调研在后记中。

# 流程
1.下载网页内容到本地，包括 html文件，相关的CSS,JavaScript以及相关资产。注：有些比较复杂的网页，对于JavaScript动态加载的资源可能不会直接下载，需要打开**开发者工具**手动下载。

2.本地启动 HTTP 服务器 （Python HTTP server or Node.js HTTP server or whatever you like）

3.为了允许RenderDoc更好的捕获和分析渲染的帧数据，需要进行一些相关的设置，再用浏览器访问相关的网页。可以将如下bash code打包成一个 .bat文件并启动。相关解释在后记。
```
set RENDERDOC_HOOK_EGL=0
"PathToYourChromeEXE\chrome.exe" http://localhost:5500/pagename.html --disable-gpu-sandbox --gpu-startup-dialog --disable-direct-composition --disable-web-security --user-data-dir=PathToYourWebApp
```
4.启动后chrome进程的pid会弹窗弹出，此时不要关闭弹窗，记录下pid。
<div style="text-align:center">
  <img src="/assets/imgs/webglCapture/pidCapture.png" width="200" height="200" alt="" />
  <p><strong></strong></p>
</div>

5.设置RenderDoc,Tools -> Settings, Enable projess injection
<div style="text-align:center">
  <img src="/assets/imgs/webglCapture/renderdocSettings.png" width="600" height="600" alt="" />
  <p><strong></strong></p>
</div>

6.重启RenderDoc，File -> Inject into process，搜索pid，并注入
<div style="text-align:center">
  <img src="/assets/imgs/webglCapture/renderdocInject.png" width="600" height="600" alt="" />
  <p><strong></strong></p>
</div>

7.继续Chrome进程 (点击 Chrome 进程的pid弹窗中的确定)

8.Capture Frame，查看相关绘制流程
<div style="text-align:center">
  <img src="/assets/imgs/webglCapture/renderdocCapture.png" width="600" height="600" alt="" />
  <p><strong></strong></p>
</div>

# Spector.js
Spector.js 是一个插件，功能比较强大，同样可以调试 WebGL 应用，可以查看绘制过程的shader代码，不过其抓帧显示的图形Command调用过于繁琐，不便观察。
而用 RenderDoc 抓帧查看整体流程可读性更强一些，不过缺点是 shader code 不一定能够查看修改。二者刚好行程互补，一起配合使用。
<div style="text-align:center">
  <img src="/assets/imgs/webglCapture/spectorjs1.png" width="600" height="600" alt="" />
  <img src="/assets/imgs/webglCapture/spectorjs2.png" width="600" height="600" alt="" />
  <p><strong></strong></p>
</div>

# 后记
1. 为什么用2023.03以前的chrome 配合 renderdoc 抓帧 web 应用？
  - 老版本的 Chrome 使用 OpenGL 或者 Angle 作为渲染 API，与 RenderDoc 兼容性较好。2023后，Chrome 逐渐转向了更多的 WebGPU 及其他后端，如 Vulkan 或 Direct3D12。还没有完全与 RenderDoc 集成。
  - 现代版本的 Chrome 加强了对用户数据和进程的保护，许多调试工具需要较高的权限或额外的设置。
  - 新 Chrome 中，图形渲染可能已经完全从浏览器主进程或渲染进程中剥离，或者封装在了更严格的沙箱中，使得 RenderDoc 更难插入渲染管线进行捕捉。

2. 上述设置的含义：
  - ```set RENDERDOC_HOOK_EGL=0``` ：控制 RenderDoc 不会拦截 EGL 调用。
  - ```--disable-gpu-sandbox``` ： 禁用 GPU 沙盒机制， 为了使 RenderDoc 能够访问 GPU 渲染的上下文。
  - ```--gpu-startup-dialog``` : 在 GPU 初始化时暂停进程，以拿到进程pid，为了使用 RenderDoc 的 process injection 功能。
  - ```--disable-direct-composition``` : 禁用 DirectComposition，可以防止复杂的硬件加速与调试工具发生冲突，简化调试。
  - ```--disable-web-security``` : 禁用浏览器的同源策略和其他 web 安全功能。这样可以跨域请求资源，适用于本地开发或测试环境, 不能在生产环境中使用！

**本博文内容为作者原创，转载请注明出处并附上原文链接，感谢支持与理解。**