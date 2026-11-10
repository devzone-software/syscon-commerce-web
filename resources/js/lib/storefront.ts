/** Public settings rendered by Laravel; no payment or mail credentials reach the browser. */
type Storefront = {
  demo: boolean;
  contactsVerified: boolean;
  company: {
    city: string;
    phone: string;
    phoneHref: string;
    email: string;
    salesEmail: string;
    whatsappLabel: string;
    whatsappHref: string;
  };
};

const fallback: Storefront = {
  demo: true,
  contactsVerified: false,
  company: {
    city: 'Juliaca, Puno, Perú',
    phone: '(01) 748-2900',
    phoneHref: 'tel:+5117482900',
    email: 'contacto@gruposyscon.pe',
    salesEmail: 'ventas@gruposyscon.pe',
    whatsappLabel: '+51 987 654 321',
    whatsappHref: 'https://wa.me/51987654321',
  },
};

function readStorefront(): Storefront {
  if (typeof document === 'undefined') return fallback;
  try {
    const value = JSON.parse(
      document.querySelector<HTMLMetaElement>('meta[name="syscon-storefront"]')?.content ?? 'null',
    );
    if (!value?.company) return fallback;
    return { ...fallback, ...value, company: { ...fallback.company, ...value.company } };
  } catch {
    return fallback;
  }
}

export const storefront = readStorefront();
