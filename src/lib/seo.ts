// ============================================================================
// SEO helper — generates JSON-LD structured data for tool pages
// Used inside React components (the <script> tag renders server-side too).
// ============================================================================

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  title: string;
  text: string;
}

export interface ToolSeoInput {
  toolSlug: string;
  toolName: string;
  description: string;
  pageUrl: string;
  faq?: FaqItem[];
  howTo?: { title: string; description: string; steps: HowToStep[] };
  breadcrumbs?: { label: string; href: string }[];
}

/** WebApplication schema — used in every tool page */
export function buildWebApplicationLd(input: ToolSeoInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `oLoveTools - ${input.toolName}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    description: input.description,
    url: input.pageUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'oLoveTools',
      url: 'https://olovetools.com',
    },
  };
}

/** FAQPage schema — generates rich snippets in Google */
export function buildFaqLd(faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

/** HowTo schema — generates step-by-step rich snippets */
export function buildHowToLd(
  title: string,
  description: string,
  steps: HowToStep[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    totalTime: 'PT1M',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.text,
    })),
  };
}

/** BreadcrumbList schema — for breadcrumb navigation in search results */
export function buildBreadcrumbLd(items: { label: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: it.href,
    })),
  };
}

/** Build all the <script type="application/ld+json"> strings for a tool page. */
export function buildAllToolLd(input: ToolSeoInput): string[] {
  const out: string[] = [JSON.stringify(buildWebApplicationLd(input))];
  if (input.faq && input.faq.length > 0) {
    out.push(JSON.stringify(buildFaqLd(input.faq)));
  }
  if (input.howTo && input.howTo.steps.length > 0) {
    out.push(
      JSON.stringify(
        buildHowToLd(input.howTo.title, input.howTo.description, input.howTo.steps)
      )
    );
  }
  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    out.push(JSON.stringify(buildBreadcrumbLd(input.breadcrumbs)));
  }
  return out;
}
