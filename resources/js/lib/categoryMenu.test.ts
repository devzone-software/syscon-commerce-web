import { describe, expect, it } from 'vitest';
import { groupCategories } from './categoryMenu';

describe('category menu', () => {
  it('groups the catalog categories by family, in menu order', () => {
    expect(
      groupCategories([
        'Switches',
        'Cámaras IP',
        'Memorias',
        'Cables de red',
        'Energía',
        'Antivirus',
        'Licencias de software',
        'Varios',
      ]),
    ).toEqual([
      { name: 'Redes y conectividad', categories: ['Cables de red', 'Switches'] },
      { name: 'Seguridad y videovigilancia', categories: ['Cámaras IP'] },
      { name: 'Computación y componentes', categories: ['Memorias'] },
      { name: 'Software y licencias', categories: ['Antivirus', 'Licencias de software'] },
      { name: 'Energía', categories: ['Energía'] },
      { name: 'Otras categorías', categories: ['Varios'] },
    ]);
  });
});
