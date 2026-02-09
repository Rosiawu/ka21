/**
 * 工具函数集合
 */

import { Tool } from './types';

/**
 * 获取工具的图标URL
 * 优先级：icons.svg > icons.png > icon
 * @param tool 工具对象
 * @returns 图标URL字符串
 */
export function getToolIconUrl(tool: Tool): string {
  if (!tool) return '';
  
  // 确保路径以/开头
  const ensurePathStartsWithSlash = (path: string) => {
    if (!path) return '';
    return path.startsWith('/') ? path : `/${path}`;
  };
  
  // 按优先级获取图标：icons.svg > icons.png > icon
  const iconPath = tool.icons?.svg || tool.icons?.png || tool.icon || '';
  const finalPath = ensurePathStartsWithSlash(iconPath);
  
  return finalPath;
}

/**
 * 生成图片加载占位符的SVG
 * @param w 宽度
 * @param h 高度
 * @returns SVG占位符字符串
 */
export function shimmer(w: number, h: number): string {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect id="r" width="${w}" height="${h}" fill="#f4f4f5" />
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
    </svg>
  `;
}

/**
 * 将字符串转换为Base64
 * @param str 输入字符串
 * @returns Base64编码字符串
 */
export function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
}

/**
 * 处理图片加载错误
 * @param e 错误事件
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>): void {
  // 图片加载失败时的处理
  const imgElement = e.currentTarget as HTMLImageElement;
  
  // 尝试使用备用图标
  const backupIconPath = '/icons/default-icon.png';
  if (imgElement.src !== backupIconPath) {
    imgElement.src = backupIconPath;
  } else {
    imgElement.style.display = 'none';
    // 添加错误类
    imgElement.parentElement?.classList.add('icon-error');
  }
}

/**
 * 生成随机ID
 * @returns 随机ID字符串
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
} 