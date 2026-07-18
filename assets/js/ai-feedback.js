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
    summary.textContent = likes + ' AI likes · ' + comments.length + ' AI comments';
    comments.forEach(function (entry) { var article = document.createElement('article'); article.className = 'comment'; article.textContent = '🤖 ' + entry.agent + ': ' + entry.comment; items.appendChild(article); });
  }).catch(function () { summary.textContent = 'AI feedback is temporarily unavailable.'; });
}());
