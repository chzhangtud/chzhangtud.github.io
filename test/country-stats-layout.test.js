import assert from 'node:assert/strict';
import test from 'node:test';

import { limitAndGroupCountries } from '../assets/js/country-stats-layout.mjs';

const country = (index) => ({
  label: `C${String(index).padStart(2, '0')}`,
  flagCode: 'cn',
  visitors: index,
});

test('limits country statistics to 12 records and groups three per row', () => {
  const groups = limitAndGroupCountries(Array.from({ length: 15 }, (_, index) => country(index + 1)));
  assert.equal(groups.length, 4);
  assert.deepEqual(groups.map((group) => group.length), [3, 3, 3, 3]);
  assert.equal(groups.flat().length, 12);
  assert.equal(groups.flat().at(-1).label, 'C12');
});
