import { describe, expect, it } from 'vitest';
import { isServicePlan, planInquiryUrl, planPriceSuffix } from './servicePlans';

describe('Ficon internet plans', () => {
  const plan = {
    category: 'Internet de fibra óptica',
    brand: 'Ficon',
    name: 'Ficon Hogar 200 Mbps',
  };
  const router = { category: 'Routers', brand: 'Demo NetForge', name: 'Router Wi-Fi 6' };

  it('recognises the monthly plans and leaves the other products alone', () => {
    expect(isServicePlan(plan)).toBe(true);
    expect(isServicePlan(router)).toBe(false);
    expect(planPriceSuffix(plan)).toBe(' /mes');
    expect(planPriceSuffix(router)).toBe('');
  });

  it('asks for coverage through the prefilled contact form', () => {
    const url = planInquiryUrl(plan);
    expect(url.startsWith('/contacto?')).toBe(true);
    expect(new URLSearchParams(url.split('?')[1].split('#')[0]).get('proyecto')).toBe(
      'internet de fibra óptica Ficon (Ficon Hogar 200 Mbps)',
    );
  });
});
