import { useEffect } from 'react'; // 引入React副作用Hook

// 定义热键类型接口
export type Hotkey = {
  combo: string; // 快捷键组合，例如 'ctrl+k', 'esc'
  handler: (e: KeyboardEvent) => void; // 触发时执行的处理函数
};

/**
 * 匹配键盘事件是否符合指定的快捷键组合
 * @param e 键盘事件对象
 * @param combo 快捷键组合字符串
 * @returns 是否匹配
 */
function matchCombo(e: KeyboardEvent, combo: string): boolean {
  // 将组合键转换为小写，便于统一比较
  const key = combo.toLowerCase();
  
  // 处理Esc键的特殊情况
  if (key === 'esc' || key === 'escape') return e.key.toLowerCase() === 'escape';
  
  // 处理Enter键的特殊情况
  if (key === 'enter') return e.key.toLowerCase() === 'enter';
  
  // 处理包含修饰键的组合（如ctrl+k）
  if (key.includes('+')) {
    const parts = key.split('+'); // 分割快捷键组合
    const finalKey = parts[parts.length - 1]; // 获取最后的主键
    const metaPressed = e.ctrlKey || e.metaKey; // 检查是否按下Ctrl或Cmd键（同时支持 Windows Ctrl 与 Mac Cmd）
    return metaPressed && e.key.toLowerCase() === finalKey; // 修饰键和主键都匹配
  }
  
  // 处理单个键的情况
  return e.key.toLowerCase() === key;
}

/**
 * 全局快捷键 Hook
 * - 数据驱动：仅注册与卸载事件，不引入额外状态
 * - 简单可读：组合字符串匹配，支持 ctrl/cmd + key
 * 
 * @param hotkeys 热键配置数组
 */
export function useHotkey(hotkeys: Hotkey[]) {
  useEffect(() => {
    // 定义键盘按下事件处理函数
    const onKeyDown = (e: KeyboardEvent) => {
      // 遍历所有热键配置
      for (const hk of hotkeys) {
        // 检查当前按键是否匹配热键组合
        if (matchCombo(e, hk.combo)) {
          // 阻止浏览器默认行为，以匹配原实现体验
          e.preventDefault();
          // 执行对应的处理函数
          hk.handler(e);
          // 找到匹配项后跳出循环
          break;
        }
      }
    };

    // 在window上添加键盘事件监听器
    window.addEventListener('keydown', onKeyDown);
    
    // 返回清理函数，在组件卸载或依赖项变化时移除事件监听器
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkeys]); // 当hotkeys数组变化时重新绑定事件
}

export default useHotkey;
