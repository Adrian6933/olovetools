import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { ToolTheme } from '../../lib/themes';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  theme: ToolTheme;
  items: BreadcrumbItem[];
  /** Base URL for the JSON-LD structured data (e.g. https://olovetools.com/en/compresssnap) */
  pageUrl: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ theme, items, pageUrl }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: it.href } : {}),
    })),
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="max-w-screen-xl mx-auto px-4 pt-3"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol
        className="flex flex-wrap items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: theme.textMuted }}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              className="flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {i === 0 && <Home className="w-3 h-3" aria-hidden="true" />}
              {it.href && !isLast ? (
                <a
                  href={it.href}
                  className="transition-colors hover:opacity-100"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
                  itemProp="item"
                >
                  <span itemProp="name">{it.label}</span>
                </a>
              ) : (
                <span style={{ color: theme.text }} itemProp="name">
                  {it.label}
                </span>
              )}
              <meta itemProp="position" content={String(i + 1)} />
              {!isLast && <ChevronRight className="w-3 h-3 opacity-40" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
