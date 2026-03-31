import type { Metadata } from 'next';
import { getBaseUrl } from './hreflang';

export function createDefaultIcons(): NonNullable<Metadata['icons']> {
  return {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/KA21.png',
  };
}

export function createMetadataBase(): URL {
  return new URL(getBaseUrl());
}
