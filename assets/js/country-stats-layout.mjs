export const MAX_COUNTRIES = 12;
export const GROUPS_PER_ROW = 3;

export function limitAndGroupCountries(countries) {
  const visibleCountries = countries.slice(0, MAX_COUNTRIES);
  const groups = [];
  for (let index = 0; index < visibleCountries.length; index += GROUPS_PER_ROW) {
    groups.push(visibleCountries.slice(index, index + GROUPS_PER_ROW));
  }
  return groups;
}
