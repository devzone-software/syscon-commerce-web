import { normalize } from './catalog';

export type CategoryFamily = { name: string; categories: string[] };

/** Families of the header menu; the catalog categories are free text, so they match by name. */
const families: [string, RegExp][] = [
  ['Redes y conectividad', /cable|accesorio|router|switch|access|rack|conect|red\b|fibra|internet/],
  ['Seguridad y videovigilancia', /camara|vigilan|segur|alarma/],
  ['Computación y componentes', /comput|laptop|memoria|almacen|disco|ssd|periferic|monitor/],
  ['Software y licencias', /software|licenc|antivirus|office|windows/],
  ['Energía', /energ|ups|estabiliz/],
];

/** Groups the categories by family, in menu order; unknown ones go to "Otras categorías". */
export function groupCategories(categories: string[]): CategoryFamily[] {
  const groups = new Map<string, string[]>();
  for (const category of [...categories].sort((a, b) => a.localeCompare(b, 'es'))) {
    const family =
      families.find(([, pattern]) => pattern.test(normalize(category)))?.[0] ?? 'Otras categorías';
    groups.set(family, [...(groups.get(family) ?? []), category]);
  }
  return [...families.map(([name]) => name), 'Otras categorías']
    .filter((name) => groups.has(name))
    .map((name) => ({ name, categories: groups.get(name)! }));
}
