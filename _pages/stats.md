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
  margin: 1.2em 0 2em;
  overflow: hidden;
  border: 1px solid #d8dde2;
  border-radius: 8px;
  background: #fbfbfc;
}
.stats-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 0.7em;
  row-gap: 0.25em;
  align-items: center;
  padding: 0.85em 1em;
  color: #333f48;
  background: #fbfbfc;
}
.stats-card + .stats-card {
  border-left: 1px solid #e1e5e8;
}
.stats-card .num {
  display: block;
  font-size: 1.25em;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}
.stats-card .label {
  display: block;
  grid-column: 2;
  margin: 0;
  font-size: 0.82em;
  color: #5f6972;
}
.stats-card i {
  grid-row: 1 / span 2;
  font-size: 1em;
  color: #69737d;
}
.stats-panel {
  margin: 1.5em 0;
  padding: 1.5em;
  border: 1px solid #d8dde2;
  border-radius: 8px;
  background: #fbfbfc;
}
.stats-panel h2 {
  margin-top: 0;
  margin-bottom: 1em;
  font-size: 1.1em;
  text-align: center;
}
.stats-panel h2 i {
  margin-right: 0.4em;
  color: #69737d;
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
.country-stats-updated {
  margin: 0.85em 0 0;
  color: #6c757d;
  font-size: 0.82em;
  text-align: right;
}
.country-stats-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.country-stats-table-wrap {
  width: 100%;
  overflow-x: hidden;
}
.country-stats-table th,
.country-stats-table td {
  padding: 0.6em 0.35em;
  border-top: 1px solid #e1e5e8;
  text-align: left;
  overflow-wrap: anywhere;
}
.country-stats-table th {
  color: #4f565c;
  font-size: 0.86em;
}
.country-stats-table th:nth-child(odd),
.country-stats-table td:nth-child(odd) {
  width: 24%;
}
.country-stats-table th:nth-child(even),
.country-stats-table td:nth-child(even) {
  width: 9.333%;
  text-align: right;
}
.country-stats-identity {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: 0.4em;
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
  .stats-card + .stats-card {
    border-top: 1px solid #e1e5e8;
    border-left: 0;
  }
  .country-stats-table th,
  .country-stats-table td {
    padding-right: 0.2em;
    padding-left: 0.2em;
    font-size: 0.78em;
  }
  .country-stats-flag {
    width: 20px;
    height: 15px;
  }
}
</style>

<div class="stats-wrap" markdown="1">

This page shows live visit statistics for the site.

<div class="stats-grid">
  <div class="stats-card">
    <i class="fas fa-eye"></i>
    <span class="num" id="busuanzi_value_page_pv">...</span>
    <span class="label">Views of this page</span>
  </div>
  <div class="stats-card">
    <i class="fas fa-user-friends"></i>
    <span class="num" id="busuanzi_value_site_uv">...</span>
    <span class="label">Unique visitors</span>
  </div>
  <div class="stats-card">
    <i class="fas fa-chart-line"></i>
    <span class="num" id="busuanzi_value_site_pv">...</span>
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
  <div class="country-stats-table-wrap" data-country-stats-table hidden></div>
  <p class="country-stats-updated" data-country-stats-updated hidden></p>
</div>
<script type="module" src="{{ '/assets/js/country-stats.js' | relative_url }}"></script>

</div>
