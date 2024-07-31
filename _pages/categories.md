---
title: Archive
permalink: /categories/
layout: single
---

<div id="archives">
  <ul>
    {% for category in site.categories %}
      <li>
        <!-- Category heading with anchor link -->
        <h2 id="{{ category | first | slugify }}">
          <a href="#{{ category | first | slugify }}">{{ category | first }}</a>
        </h2>
        <ul>
          {% assign category_name = category | first %}
          {% for post in site.posts %}
            {% if post.categories contains category_name %}
              <li><a href="{{ post.url }}">{{ post.title }}</a> - {{ post.date | date: "%B %d, %Y" }}</li>
            {% endif %}
          {% endfor %}
        </ul>
      </li>
    {% endfor %}
  </ul>
</div>





<!-- ---
title: Archive
permalink: /archive/
layout: single
---
<div id="archives">
  <ul>
    {% for post in site.posts %}
      <li><a href="{{ post.url }}">{{ post.title }}</a> - {{ post.date | date: "%B %d, %Y" }}</li>
    {% endfor %}
  </ul>
</div> -->