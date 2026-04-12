function isWechatHostedImageHost(hostname: string) {
  return hostname === 'qpic.cn' || hostname.endsWith('.qpic.cn') || hostname === 'res.wx.qq.com';
}

export function getEventImageSrc(imageUrl?: string) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('/')) return imageUrl;

  try {
    const parsed = new URL(imageUrl);
    if (!isWechatHostedImageHost(parsed.hostname)) {
      return parsed.toString();
    }

    const proxyUrl = new URL('/api/miniapp/image-proxy', 'https://ka21.local');
    proxyUrl.searchParams.set('url', parsed.toString());
    return `${proxyUrl.pathname}${proxyUrl.search}`;
  } catch {
    return imageUrl;
  }
}
