---
title: Categories
permalink: /categories/
layout: single
comments: false
---

<p class="page__taxonomy">
  <strong><i class="fas fa-fw fa-language" aria-hidden="true"></i> Language </strong>
  <span itemprop="keywords">
    <a href="#zh" class="page__taxonomy-item p-category" rel="tag">中文</a><span class="sep">, </span>
    <a href="#en" class="page__taxonomy-item p-category" rel="tag">English</a>
  </span>
</p>

{% assign sections = "zh,en" | split: "," %}
{% for lang in sections %}
  {% if lang == "zh" %}
    {% assign lang_label = "中文" %}
  {% else %}
    {% assign lang_label = "English" %}
  {% endif %}

  <section id="{{ lang }}" class="taxonomy__section">
    <h2 class="archive__subtitle">{{ lang_label }}</h2>

    <ul>
      {% for category in site.categories %}
        {% assign category_name = category | first %}
        {% assign has_posts = false %}

        {% for post in category.last %}
          {% if post.hidden != true %}
            {% assign post_lang = post.lang | default: site.default_lang %}
            {% if post_lang == lang %}
              {% assign has_posts = true %}
            {% endif %}
          {% endif %}
        {% endfor %}

        {% if has_posts %}
          <li>
            <h3 id="{{ category_name | slugify }}-{{ lang }}">
              <a href="#{{ category_name | slugify }}-{{ lang }}">{{ category_name }}</a>
            </h3>

            <ul>
              {% for post in category.last %}
                {% if post.hidden != true %}
                  {% assign post_lang = post.lang | default: site.default_lang %}
                  {% if post_lang == lang %}
                    <li>
                      <a href="{{ post.url | relative_url }}">{{ post.title }}</a> - {{ post.date | date: "%Y-%m-%d" }}
                    </li>
                  {% endif %}
                {% endif %}
              {% endfor %}
            </ul>
          </li>
        {% endif %}
      {% endfor %}
    </ul>
  </section>
{% endfor %}
