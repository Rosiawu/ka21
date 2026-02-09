/**
 * 自定义类型声明
 */

// JSON模块声明 - 使用泛型替代any
declare module '*.json' {
  // 使用Record类型代替any，提供更好的类型安全性
  const value: Record<string, unknown>;
  export default value;
}

// 其他可能的自定义声明...

/**
 * 自定义全局类型声明
 */

// 为静态资源导入添加类型声明
declare module '*.svg' {
  import React from 'react';
  const SVGComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
} 