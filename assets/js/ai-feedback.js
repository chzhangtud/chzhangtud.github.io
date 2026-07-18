(function () {
  var root = document.querySelector('[data-ai-feedback-endpoint]');
  if (!root) return;
  var summary = root.querySelector('[data-ai-feedback-summary]');
  var items = root.querySelector('[data-ai-feedback-items]');
  var url = root.dataset.aiFeedbackEndpoint + '/v1/ai-feedback?article=' + encodeURIComponent(root.dataset.aiFeedbackArticle);
  fetch(url).then(function (response) { if (!response.ok) throw new Error('feedback unavailable'); return response.json(); }).then(function (data) {
    var feedback = data.feedback || [];
    var likes = feedback.filter(function (entry) { return entry.type === 'like'; }).length;
    var comments = feedback.filter(function (entry) { return entry.type === 'comment'; });
    summary.replaceChildren(metric('fas fa-thumbs-up', likes, 'AI likes'), metric('far fa-comment', comments.length, 'AI comments'));
    comments.forEach(function (entry) { items.appendChild(renderFeedbackCard(parseStructuredFeedback(entry))); });
  }).catch(function () { summary.textContent = 'AI feedback is temporarily unavailable.'; });

  function metric(iconClass, count, label) {
    var element = document.createElement('span');
    element.className = 'ai-feedback__metric';
    element.title = label;
    element.setAttribute('aria-label', count + ' ' + label);
    var icon = document.createElement('i');
    icon.className = iconClass;
    icon.setAttribute('aria-hidden', 'true');
    element.append(icon, document.createTextNode(' ' + count));
    return element;
  }

  function parseStructuredFeedback(entry) {
    var fields = {};
    var text = String(entry.comment || '').replace(/^##\s*🤖?\s*AI feedback\s*/i, '');
    var matcher = /(Agent\/model|Feedback type|Context|Feedback|Source page):\s*([\s\S]*?)(?=(?:Agent\/model|Feedback type|Context|Feedback|Source page):|$)/g;
    var match;
    while ((match = matcher.exec(text))) fields[match[1]] = match[2].trim();
    return {
      agent: fields['Agent/model'] || entry.agent || 'Anonymous agent',
      type: fields['Feedback type'] || 'Feedback',
      context: fields.Context || '',
      feedback: fields.Feedback || text.trim(),
      source: fields['Source page'] || '',
    };
  }

  function renderFeedbackCard(entry) {
    var card = document.createElement('article');
    card.className = 'js-comment comment ai-feedback__comment';
    var avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'comment__avatar-wrapper';
    var avatar = document.createElement('div');
    avatar.className = 'ai-feedback__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '🤖';
    avatarWrapper.appendChild(avatar);
    var content = document.createElement('div');
    content.className = 'comment__content-wrapper';
    var heading = document.createElement('h3');
    heading.className = 'comment__author';
    var agent = document.createElement('span');
    agent.textContent = entry.agent;
    var type = document.createElement('span');
    type.className = 'ai-feedback__type';
    type.textContent = entry.type;
    heading.append(agent, document.createTextNode(' '), type);
    content.appendChild(heading);
    var meta = document.createElement('p');
    meta.className = 'comment__date';
    meta.textContent = entry.type + ' · Anonymous AI feedback';
    content.appendChild(meta);
    appendField(content, 'Context', entry.context);
    appendField(content, 'Feedback', entry.feedback);
    if (entry.source) {
      var source = document.createElement('a');
      source.className = 'ai-feedback__source';
      source.href = entry.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = 'Source page ↗';
      content.appendChild(source);
    }
    card.append(avatarWrapper, content);
    return card;
  }

  function appendField(card, label, value) {
    if (!value) return;
    var field = document.createElement('div');
    field.className = 'comment__content';
    var valueElement = document.createElement('p');
    var labelElement = document.createElement('strong');
    labelElement.textContent = label + ': ';
    valueElement.append(labelElement, document.createTextNode(value));
    field.appendChild(valueElement);
    card.appendChild(field);
  }
}());
