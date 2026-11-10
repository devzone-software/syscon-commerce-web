import type { Product } from '../types';

// Local visual examples for the original seeded catalog only. An admin's own
// image (including removing it) always takes precedence. No catalog data is saved.
export const catalogPhotos: Readonly<Record<string, string>> = {
  'DEMO-ADP-USB-ETH': 'usb-ethernet.jpg',
  'DEMO-ADP-USB-WIFI': 'usb-wifi.jpg',
  'DEMO-AP-WIFI6': 'access-point.png',
  'DEMO-CAM-IP-FHD': 'camera-indoor.jpg',
  'DEMO-CAM-IP-POE': 'camera-outdoor.jpg',
  'DEMO-CBL-C6-1M': 'cable.jpg',
  'DEMO-CBL-C6-5M': 'cable.jpg',
  'DEMO-CBL-C6-10M': 'cable.jpg',
  'DEMO-CON-RJ45-C6': 'connector.jpg',
  'DEMO-KBD-USB': 'keyboard.png',
  'DEMO-MSE-USB': 'mouse.png',
  'DEMO-NIC-PCIE-GB': 'nic.jpg',
  'DEMO-ORG-CBL-1U': 'organizer.jpg',
  'DEMO-PP-C6-24': 'patch-panel.jpg',
  'DEMO-RAM-DDR4-8': 'ram.png',
  'DEMO-RAM-DDR4-16': 'ram.png',
  'DEMO-RCK-6U': 'rack.jpg',
  'DEMO-RCK-9U': 'rack.jpg',
  'DEMO-RTR-AX1500': 'router-wifi.jpg',
  'DEMO-RTR-GB-ENT': 'router-business.jpg',
  'DEMO-SSD-1TB': 'ssd-nvme.jpg',
  'DEMO-SSD-480': 'ssd-sata.jpg',
  'DEMO-SW-GB-08': '../product-photos/tl-sg108.jpg',
  'DEMO-SW-GB-24': 'switch-24.jpg',
  'DEMO-UPS-600': 'ups.jpg',
};

export function referencePhoto(product: Product): string | null {
  const photo = catalogPhotos[product.sku];
  if (!photo || !product.brand?.startsWith('Demo ') || !product.imageUrl) return null;
  try {
    const url = new URL(product.imageUrl, 'http://localhost');
    const original = `/images/products/${product.sku.toLowerCase()}.svg`;
    if (url.pathname !== original || url.search || url.hash) return null;
    return `/examples/catalog-photos/${photo}`;
  } catch {
    return null;
  }
}
