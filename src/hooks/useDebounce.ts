import { useEffect, useState } from 'react'; // 引入React的状态和副作用Hook

/**
 * 通用防抖 Hook
 * - 简单可读：仅保留必要状态，便于人类理解
 * - 最少状态：仅维护被防抖后的值
 * - 数据驱动：视图从返回值推导，不维护中间渲染状态
 * 
 * @param value 需要防抖的值（任意类型）
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  // 创建本地状态用于存储防抖后的值，初始值为传入的value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 创建一个定时器，在指定延迟后更新防抖值
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    
    // 返回清理函数，在依赖项变化或组件卸载时清除定时器
    return () => clearTimeout(timer);
  }, [value, delay]); // 当输入值或延迟时间变化时重新执行effect

  // 返回防抖后的值
  return debouncedValue;
}

export default useDebounce;

