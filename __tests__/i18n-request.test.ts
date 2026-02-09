// Mock next-intl/server to avoid ESM transform issues and heavy imports
jest.mock('next-intl/server', () => ({
  getRequestConfig: (factory: any) => factory
}));

import getRequestConfig from '@/i18n/request';

describe('i18n request config', () => {
  test('exports a callable request config function', () => {
    expect(typeof getRequestConfig).toBe('function');
  });
});
