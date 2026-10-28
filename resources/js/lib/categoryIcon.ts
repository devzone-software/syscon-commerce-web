import componentsIcon from '../../images/categories/components.svg';
import laptopIcon from '../../images/categories/laptop.svg';
import officeIcon from '../../images/categories/office.svg';
import peripheralsIcon from '../../images/categories/peripherals.svg';
import securityIcon from '../../images/categories/security.svg';
import serverIcon from '../../images/categories/server.svg';
import softwareIcon from '../../images/categories/software.svg';
import storageIcon from '../../images/categories/storage.svg';
import { normalize } from './catalog';

/** The catalog categories are free text, so each one gets the icon of the closest family. */
const categoryIcons: [RegExp, string][] = [
  [/office|ofimatic|productiv/, officeIcon],
  [/software|licenc|windows|sistema/, softwareIcon],
  [/segur|antivirus|camara|vigilan/, securityIcon],
  [/laptop|computa|\bpc\b|notebook|equipo/, laptopIcon],
  [/servidor|red|router|switch|rack|cable|conect|access/, serverIcon],
  [/almacen|ssd|disco|nas/, storageIcon],
  [/componente|memoria|ram|tarjeta|grafica|procesador/, componentsIcon],
];

export const categoryIcon = (name: string) =>
  categoryIcons.find(([pattern]) => pattern.test(normalize(name)))?.[1] ?? peripheralsIcon;
