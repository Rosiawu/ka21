import React from 'react';
import Link from '@/i18n/Link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
  className?: string;
}

export default function Breadcrumb({ items, ariaLabel, className }: BreadcrumbProps) {
  return (
    <nav className={className || 'flex items-center'} aria-label={ariaLabel}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center">
            {idx > 0 && (
              <span className="mx-2 text-gray-500 dark:text-gray-400">/</span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

