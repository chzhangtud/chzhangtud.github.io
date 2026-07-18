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
.stats-panel .embed-status {
  margin: 0.9em 0 0;
  font-size: 0.92em;
  line-height: 1.55;
  color: #555;
  text-align: center;
}
.stats-panel .embed-status.is-warning {
  color: #8a5a00;
}
.country-stats-status {
  margin: 0.9em 0 0;
  font-size: 0.92em;
  line-height: 1.55;
  color: #555;
  text-align: center;
}
.country-stats-status.is-warning {
  color: #8a5a00;
}
.country-stats-table {
  width: 100%;
  border-collapse: collapse;
}
.country-stats-table th,
.country-stats-table td {
  padding: 0.65em 0.5em;
  border-top: 1px solid #e6e6e6;
  text-align: left;
}
.country-stats-table th:last-child,
.country-stats-table td:last-child {
  text-align: right;
}
.country-stats-identity {
  display: inline-flex;
  align-items: center;
  gap: 0.55em;
}
.country-stats-flag {
  width: 24px;
  height: 18px;
  object-fit: cover;
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

<!-- MapMyVisitors live visitor map. -->
<div class="stats-panel" id="visitor-map">
  <h2><i class="fas fa-globe-asia"></i>Visitor Map</h2>
  <div class="embed">
    <script type="text/javascript" id="mapmyvisitors" src="//mapmyvisitors.com/map.js?d=Gi8B3_EApaCi2filpg_cUbG20TcOcyLhM14xp7mb7ew&cl=ffffff&w=a"></script>
  </div>
  <p class="embed-status" id="visitor-map-status" hidden></p>
</div>

<!-- Stop the map widget from navigating away on click/tap. -->
<script>
(function () {
  var status = document.getElementById('visitor-map-status');

  function setStatus(message, warning) {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    status.className = warning ? 'embed-status is-warning' : 'embed-status';
  }

  function disableWidgetLink() {
    var a = document.getElementById('mapmyvisitors-widget');
    if (!a) return false;
    a.removeAttribute('href');
    a.style.cursor = 'default';
    a.addEventListener('click', function (e) { e.preventDefault(); }, true);
    return true;
  }
  var tries = 0;
  var timer = setInterval(function () {
    if (disableWidgetLink() || ++tries > 60) clearInterval(timer);
  }, 250);

  window.addEventListener('load', function () {
    setTimeout(function () {
      var widget = document.getElementById('mapmyvisitors-widget');
      var map = document.querySelector('.mapmyvisitors-map');
      if (!widget || !map) {
        setStatus('MapMyVisitors widget content is currently unavailable. This usually means the widget key is invalid, inactive, or the service is not returning public widget data yet.', true);
      }
    }, 8000);
  });
})();
</script>

<div class="stats-panel" id="country-stats" data-endpoint="{{ site.country_stats.endpoint }}">
  <h2><i class="fas fa-flag"></i>Country Distribution</h2>
  <p class="country-stats-status" data-country-stats-status>Loading country statistics...</p>
  <div data-country-stats-table hidden></div>
</div>
<script type="module" src="{{ '/assets/js/country-stats.js' | relative_url }}"></script>

</div>
