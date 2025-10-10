---
title: "Gallery"
permalink: /gallery/
layout: single
comments: false
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

This page shows a few cases of the Computer Graphics features I've implemented.

* TOC
{:toc}

# Real-Time Rendering
## Ray Tracing Scene with Vulkan <a href="/en/rtrt-vulkan-scene/" class="btn">Page</a>
This scene is created using Vulkan Ray Tracing to help get a better grasp of Vulkan APIs. It demonstrates ray-traced reflections and refractions in a water pool. The water simulation and caustics generation are done using heightmap-based methods (check out the [link](https://madebyevan.com/webgl-water/)). The water heightmap simulation runs on a Compute pipeline, while caustics generation uses a Graphics pipeline. Finally, the overall rendering is handled through the Ray Tracing pipeline. In the scene, the flight helmet is a detailed triangle-based model, while the spheres and planes are represented using implicit expressions. It’s pretty interesting because to trace rays effectively, different types of BLAS are used for these geometries, all contributing to the final TLAS.
<video width="100%" height="auto" controls>
    <source src="/assets/videos/caustics/rtscene.mp4" type="video/mp4">
</video>

## Mesh shading
<select id="img-set">
  <option value="set1" selected>Scene 1</option>
  <option value="set2">Scene 2</option>
</select>

<div id="juxta-container">
  <div id="juxta" class="juxtapose" data-startingposition="50%">
    <img src="/assets/imgs/meshshading/scene1.png" data-label="Shading" />
    <img src="/assets/imgs/meshshading/meshlets1.png" data-label="Meshlets" />
  </div>
</div>

<script>
const imgSet = {
  set1: [
    "/assets/imgs/meshshading/scene1.png",
    "/assets/imgs/meshshading/meshlets1.png"
  ],
  set2: [
    "/assets/imgs/meshshading/scene2.png",
    "/assets/imgs/meshshading/meshlets2.png"
  ]
};

const select = document.getElementById("img-set");
const container = document.getElementById("juxta-container");

select.addEventListener("change", (e) => {
  const key = e.target.value;
  const [imgA, imgB] = imgSet[key];

  // remove old juxtapose instance
  const oldJuxta = document.getElementById("juxta");
  if (oldJuxta) oldJuxta.remove();

  // recreate juxtapose DOM
  const newJuxta = document.createElement("div");
  newJuxta.id = "juxta";
  newJuxta.className = "juxtapose";
  newJuxta.dataset.startingposition = "50%";
  newJuxta.innerHTML = `
    <img src="${imgA}" data-label="Shading" />
    <img src="${imgB}" data-label="Meshlets" />
  `;
  container.appendChild(newJuxta);

  // re initialize juxtapose
  if (window.juxtapose && window.juxtapose.scanPage) {
    setTimeout(() => window.juxtapose.scanPage(), 1);
  }
});
</script>

## Hitchcock Zooming (Dolly Zooming)
<video width="100%" height="auto" controls>
    <source src="/assets/videos/dollyzoom/dollyZoom.mp4" type="video/mp4">
</video>

## Linearly Transformed Cosines (LTC) based Area Light
<div style="text-align:center">
  <img src="/assets/imgs/arealight/lightedCar.png" width="800" height="800" alt="" />
</div>

## Transmission and Thick Sphere Refraction
<div class="juxtapose" data-startingposition="50%" data-showlabels="true" data-showcredits="true">
    <img src="/assets/imgs/ssRefraction/thinRefraction.png" alt="Thin" data-label="Thin" />
    <img src="/assets/imgs/ssRefraction/thickRefraction.png" alt="Thick" data-label="Thick" />
</div>

## Cascaded Shadow Mapping <a href="/zh/csm/" class="btn">Page</a>
<div class="juxtapose" data-startingposition="50%" data-showlabels="true" data-showcredits="true">
    <img src="/assets/imgs/csm/wo_csm.png" alt="No CSM" data-label="No CSM" />
    <img src="/assets/imgs/csm/wi_csm.png" alt="CSM" data-label="CSM" />
</div>

## Screen Space Decal
<div class="juxtapose" data-startingposition="50%" data-showlabels="true" data-showcredits="true">
    <img src="/assets/imgs/decal/wo_decal.png" alt="No Decal" data-label="No Decal" />
    <img src="/assets/imgs/decal/wi_decal.png" alt="Decal" data-label="Decal" />
</div>

<!-- ## Water Caustics
<video width="100%" height="auto" controls>
    <source src="/assets/videos/caustics/caustics.mp4" type="video/mp4">
</video> -->

## Glasses-Free 3D on a Foldable Phone
<video width="100%" height="auto" controls>
    <source src="/assets/videos/autostereoscopy/autostereoscopy.mp4" type="video/mp4">
</video>


<!-- ## Motion Blur
## Shader Graph
## Graphed Post Process
## Cloth Sheen and Subsurface Color
## Pixar USD -->
