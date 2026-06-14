---
title: "Statistics"
permalink: /stats/
layout: single
comments: false
---

<style>
.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  margin: 1.5em 0;
}
.stats-card {
  flex: 1 1 160px;
  text-align: center;
  padding: 1.2em 1em;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #6a82fb 0%, #5b6ef5 50%, #8e54e9 100%);
  box-shadow: 0 4px 12px rgba(91, 110, 245, 0.25);
}
.stats-card .num {
  display: block;
  font-size: 1.8em;
  font-weight: 700;
  line-height: 1.2;
}
.stats-card .label {
  display: block;
  margin-top: 0.3em;
  font-size: 0.85em;
  opacity: 0.9;
}
.stats-card i {
  font-size: 1.1em;
  opacity: 0.95;
}
.stats-section {
  margin: 2em 0;
}
</style>

This page shows live visit statistics for the site.

<div class="stats-grid">
  <div class="stats-card">
    <i class="fas fa-eye"></i>
    <span class="num" id="busuanzi_value_page_pv">…</span>
    <span class="label">Views of this page</span>
  </div>
  <div class="stats-card">
    <i class="fas fa-user-friends"></i>
    <span class="num" id="busuanzi_value_site_uv">…</span>
    <span class="label">Unique visitors</span>
  </div>
  <div class="stats-card">
    <i class="fas fa-chart-line"></i>
    <span class="num" id="busuanzi_value_site_pv">…</span>
    <span class="label">Total visits</span>
  </div>
</div>

## Visitor Map

<!-- MapMyVisitors (formerly ClustrMaps) live visitor globe. -->
<div class="stats-section" id="visitor-map" style="text-align:center;">
  <script type="text/javascript" id="mmvst_globe" src="//mapmyvisitors.com/globe.js?d=GBmlKrL6uBeezGD45DoXSOT51WrrBHZWUyAgvE5MvhQ"></script>
</div>

## Country Distribution

<!-- Flag Counter placeholder.
     Generate a counter at https://flagcounter.com and paste the provided
     <a ...><img ...></a> snippet below. -->
<div class="stats-section" id="flag-counter">
  <p><em>Country flags will appear here once the widget code is added.</em></p>
</div>
