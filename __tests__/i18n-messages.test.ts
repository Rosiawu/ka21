import zh from '../messages/zh.json';
import en from '../messages/en.json';

describe('i18n messages', () => {
  test('zh messages contain required namespaces and keys', () => {
    expect(zh).toHaveProperty('Common.siteTitle');
    expect(zh).toHaveProperty('Home.subtitle');
  });

  test('en messages contain required namespaces and keys', () => {
    expect(en).toHaveProperty('Common.siteTitle');
    expect(en).toHaveProperty('Home.subtitle');
  });
});

