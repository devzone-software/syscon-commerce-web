import accesorios from '../../images/photos/cat-accesorios.webp';
import accessPoints from '../../images/photos/cat-access-points.webp';
import almacenamiento from '../../images/photos/cat-almacenamiento.webp';
import antivirus from '../../images/photos/cat-antivirus.webp';
import cables from '../../images/photos/cat-cables.webp';
import camaras from '../../images/photos/cat-camaras.webp';
import computacion from '../../images/photos/cat-computacion.webp';
import conectividad from '../../images/photos/cat-conectividad.webp';
import energia from '../../images/photos/cat-energia.webp';
import fibra from '../../images/photos/cat-fibra.webp';
import licencias from '../../images/photos/cat-licencias.webp';
import memorias from '../../images/photos/cat-memorias.webp';
import perifericos from '../../images/photos/cat-perifericos.webp';
import racks from '../../images/photos/cat-racks.webp';
import routers from '../../images/photos/cat-routers.webp';
import switches from '../../images/photos/cat-switches.webp';
import { normalize } from './catalog';

/**
 * Real photo (Unsplash, see images/photos/CREDITOS.md) for each catalog category. They show
 * the kind of product, not the exact item for sale. Order matters: the first match wins.
 */
const categoryPhotos: [RegExp, string][] = [
  [/camara|vigilan|cctv/, camaras],
  [/antivirus|segur/, antivirus],
  [/licenc|software|office|windows/, licencias],
  [/fibra|internet/, fibra],
  [/access/, accessPoints],
  [/router/, routers],
  [/switch/, switches],
  [/rack/, racks],
  [/cable/, cables],
  [/accesorio/, accesorios],
  [/conect|adaptador|tarjeta de red/, conectividad],
  [/almacen|disco|ssd|nas/, almacenamiento],
  [/memoria|ram/, memorias],
  [/periferic|teclado|mouse/, perifericos],
  [/energ|ups|estabiliz/, energia],
  [/comput|laptop|notebook|\bpc\b/, computacion],
];

/** Photo for a category name, or null when none fits (the icon is used instead). */
export const categoryPhoto = (name: string) =>
  categoryPhotos.find(([pattern]) => pattern.test(normalize(name)))?.[1] ?? null;
