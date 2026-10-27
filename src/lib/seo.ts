const SITE_URL = 'https://myprospect.asia';

export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Prospect Asia',
  legalName: 'PT Kita Berani Bicara',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  slogan: '#JadiAtletModern',
  description:
    'Sports Communication program untuk atlet: public speaking & bahasa Inggris khusus konteks olahraga.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bandung',
    addressCountry: 'ID',
  },
  sameAs: [],
  founder: { '@type': 'Person', name: 'Ferri Ahrial' },
};

export function faqSchema(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function courseSchema(opts: {
  name: string;
  description: string;
  url: string;
  price?: number;
  duration?: string;
}): Record<string, unknown> {
  const hasPrice = typeof opts.price === 'number' && opts.price > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'id',
    provider: { '@type': 'Organization', name: 'Prospect Asia', sameAs: SITE_URL },
    ...(opts.duration ? { timeRequired: opts.duration } : {}),
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            price: opts.price,
            priceCurrency: 'IDR',
            availability: 'https://schema.org/InStock',
            url: opts.url,
          },
        }
      : {}),
  };
}
