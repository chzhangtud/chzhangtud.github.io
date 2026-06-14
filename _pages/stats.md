---
title: "Statistics"
permalink: /stats/
layout: single
comments: false
---

<style>
.stats-wrap {
  max-width: 900px;
  margin: 0 auto;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
  margin: 1.5em 0 2.5em;
}
.stats-card {
  text-align: center;
  padding: 1.4em 1em;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #6a82fb 0%, #5b6ef5 50%, #8e54e9 100%);
  box-shadow: 0 6px 16px rgba(91, 110, 245, 0.28);
}
.stats-card .num {
  display: block;
  font-size: 1.9em;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 0.25em;
}
.stats-card .label {
  display: block;
  margin-top: 0.35em;
  font-size: 0.82em;
  opacity: 0.92;
}
.stats-card i {
  font-size: 1.25em;
  opacity: 0.95;
}
.stats-panel {
  margin: 1.5em 0;
  padding: 1.5em;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  background: #fafafa;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}
.stats-panel h2 {
  margin-top: 0;
  margin-bottom: 1em;
  font-size: 1.1em;
  text-align: center;
}
.stats-panel h2 i {
  margin-right: 0.4em;
  color: #5b6ef5;
}
.stats-panel .embed {
  display: flex;
  justify-content: center;
}
.stats-panel .embed img {
  max-width: 100%;
  height: auto;
}
@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<div class="stats-wrap" markdown="1">

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

<!-- MapMyVisitors (formerly ClustrMaps) live visitor globe. -->
<div class="stats-panel" id="visitor-map">
  <h2><i class="fas fa-globe-asia"></i>Visitor Map</h2>
  <div class="embed">
    <script type="text/javascript" id="mmvst_globe" src="//mapmyvisitors.com/globe.js?d=GBmlKrL6uBeezGD45DoXSOT51WrrBHZWUyAgvE5MvhQ"></script>
  </div>
</div>

<!-- Stop the globe from navigating away on click/tap; rotation still pauses on hover/touch (built into globe.js). -->
<script>
(function () {
  function disableGlobeLink() {
    var a = document.getElementById('mmvst_a');
    if (!a) return false;
    a.removeAttribute('href');
    a.style.cursor = 'default';
    a.addEventListener('click', function (e) { e.preventDefault(); }, true);
    return true;
  }
  var tries = 0;
  var timer = setInterval(function () {
    if (disableGlobeLink() || ++tries > 60) clearInterval(timer);
  }, 250);
})();
</script>

<!-- Flag Counter (counter id: TSy). Tweak the URL params to adjust the layout. -->
<div class="stats-panel" id="flag-counter">
  <h2><i class="fas fa-flag"></i>Country Distribution</h2>
  <div class="embed">
    <img src="https://s01.flagcounter.com/count2/TSy/bg_FFFFFF/txt_000000/border_CCCCCC/columns_3/maxflags_15/viewers_0/labels_1/pageviews_1/flags_0/percent_1/" alt="Flag Counter" border="0">
  </div>
</div>

</div>
