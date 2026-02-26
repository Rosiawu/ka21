import type { Tool } from '@/lib/types';

interface StructuredDataProps {
  tool?: Tool;
  type: 'Tool' | 'WebPage' | 'Organization';
  url?: string;
  title?: string;
  description?: string;
  locale?: string;
}

export default function StructuredData({
  tool,
  type,
  url,
  title,
  description,
  locale = 'zh'
}: StructuredDataProps) {
  const getStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.tools';
    const isEn = locale === 'en';
    const orgName = isEn ? 'KA21 Tools' : 'KA21工具导航';
    const webName = isEn ? 'KA21: One-stop AI Resource Hub' : '数字生命卡兹克-KA21工具导航';
    const orgDescription = isEn
      ? 'A curated navigation platform for practical AI tools.'
      : '一个专注于展示和分享优质AI工具的导航平台';

    switch (type) {
      case 'Tool':
        if (!tool) return null;

        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: tool.name,
          description: tool.description,
          url: tool.url,
          applicationCategory: 'AI Tool',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          aggregateRating: tool.groupComments && tool.groupComments.length > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: '4.5',
            reviewCount: tool.groupComments.length,
            bestRating: '5',
            worstRating: '1'
          } : undefined,
          creator: {
            '@type': 'Organization',
            name: orgName,
            url: baseUrl
          }
        };

      case 'WebPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description: description,
          url: url,
          inLanguage: isEn ? 'en-US' : 'zh-CN',
          isPartOf: {
            '@type': 'WebSite',
            name: orgName,
            url: baseUrl
          }
        };

      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: webName,
          description: orgDescription,
          url: baseUrl,
          logo: `${baseUrl}/KA21.png`,
          sameAs: [
            // 可以添加社交媒体链接
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service'
          }
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
}
