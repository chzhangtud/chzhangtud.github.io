import { GROUPS_PER_ROW, limitAndGroupCountries } from './country-stats-layout.mjs';

(function () {
  var panel = document.getElementById('country-stats');
  if (!panel) return;

  var status = panel.querySelector('[data-country-stats-status]');
  var tableRoot = panel.querySelector('[data-country-stats-table]');

  function setStatus(message, warning) {
    status.textContent = message;
    status.hidden = false;
    status.className = warning ? 'country-stats-status is-warning' : 'country-stats-status';
  }

  function appendCell(row, value, isHeader) {
    var cell = document.createElement(isHeader ? 'th' : 'td');
    cell.textContent = value;
    if (isHeader) cell.scope = 'col';
    row.appendChild(cell);
    return cell;
  }

  function appendCountry(row, country) {
    var identityCell = document.createElement('td');
    var identity = document.createElement('span');
    identity.className = 'country-stats-identity';
    var flag = document.createElement('img');
    flag.className = 'country-stats-flag';
    flag.src = 'https://flagcdn.com/24x18/' + country.flagCode + '.png';
    flag.alt = country.label + ' flag';
    flag.width = 24;
    flag.height = 18;
    flag.loading = 'lazy';
    identity.appendChild(flag);
    identity.appendChild(document.createTextNode(country.label));
    identityCell.appendChild(identity);
    row.appendChild(identityCell);
    appendCell(row, String(country.visitors), false);
  }

  function isCountry(record) {
    return record
      && typeof record.label === 'string'
      && /^[A-Z]{2}(?:-[A-Z]{2})?$/.test(record.label)
      && typeof record.flagCode === 'string'
      && /^[a-z]{2}$/.test(record.flagCode)
      && Number.isInteger(record.visitors)
      && record.visitors >= 0;
  }

  function render(countries) {
    var table = document.createElement('table');
    table.className = 'country-stats-table';
    var tableHead = document.createElement('thead');
    var header = document.createElement('tr');
    for (var column = 0; column < GROUPS_PER_ROW; column += 1) {
      appendCell(header, 'Country/Region', true);
      appendCell(header, 'Visitors', true);
    }
    tableHead.appendChild(header);
    table.appendChild(tableHead);

    var tableBody = document.createElement('tbody');
    limitAndGroupCountries(countries).forEach(function (countryGroup) {
      var row = document.createElement('tr');
      countryGroup.forEach(function (country) {
        appendCountry(row, country);
      });
      if (countryGroup.length < GROUPS_PER_ROW) {
        var emptyCell = document.createElement('td');
        emptyCell.colSpan = (GROUPS_PER_ROW - countryGroup.length) * 2;
        emptyCell.className = 'country-stats-empty';
        emptyCell.setAttribute('aria-hidden', 'true');
        row.appendChild(emptyCell);
      }
      tableBody.appendChild(row);
    });
    table.appendChild(tableBody);

    tableRoot.replaceChildren(table);
    tableRoot.hidden = false;
    status.hidden = true;
  }

  async function load() {
    try {
      var endpoint = panel.dataset.endpoint;
      if (!endpoint) throw new Error('missing endpoint');
      var response = await fetch(endpoint);
      if (!response.ok) throw new Error('request failed');
      var payload = await response.json();
      if (!payload || !Array.isArray(payload.countries) || !payload.countries.every(isCountry)) throw new Error('invalid response');
      render(payload.countries);
    } catch (error) {
      tableRoot.replaceChildren();
      tableRoot.hidden = true;
      setStatus('Country statistics are currently unavailable.', true);
    }
  }

  load();
})();
