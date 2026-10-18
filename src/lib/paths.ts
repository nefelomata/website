// Internal links must include the base path (/website/ on GitHub Pages).
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function url(path = ''): string {
  return BASE + path.replace(/^\//, '');
}

const ROMAN: [number, string][] = [
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function roman(n: number): string {
  let out = '';
  for (const [value, numeral] of ROMAN) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

export function chapterLabel(entry: { data: { label?: string; order: number } }): string {
  return entry.data.label ?? `Chapter ${roman(entry.data.order)}`;
}

export function chapterNumeral(entry: { data: { label?: string; order: number } }): string {
  return entry.data.label ? entry.data.label : roman(entry.data.order);
}
