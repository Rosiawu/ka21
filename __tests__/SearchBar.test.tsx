import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../src/components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders search input with correct placeholder', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  test('calls onChange when user types in input', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    fireEvent.change(input, { target: { value: 'test search' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('test search');
  });

  test('displays clear button when there is text', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const clearButton = screen.getByLabelText('清除搜索');
    expect(clearButton).toBeInTheDocument();
  });

  test('does not display clear button when input is empty', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const clearButton = screen.queryByLabelText('清除搜索');
    expect(clearButton).not.toBeInTheDocument();
  });

  test('calls onChange with empty string when clear button is clicked', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const clearButton = screen.getByLabelText('清除搜索');
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  test('clears input when Escape key is pressed', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  test('has correct accessibility attributes', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('搜索工具');
    expect(input).toBeInTheDocument();
    
    const searchButton = screen.getByLabelText('搜索');
    expect(searchButton).toBeInTheDocument();
  });

  test('renders with flex layout structure', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    // 检查外层容器是否有 flex 布局
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('flex', 'items-stretch', 'rounded-lg', 'bg-white', 'shadow-input');
    
    // 检查输入框容器
    const inputContainer = outerContainer.querySelector('.flex-1');
    expect(inputContainer).toBeInTheDocument();
    
    // 检查按钮容器
    const buttonContainer = outerContainer.querySelector('.flex-shrink-0');
    expect(buttonContainer).toBeInTheDocument();
  });

  test('input has correct styling classes', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    expect(input).toHaveClass('w-full', 'h-11', 'px-3', 'sm:px-5', 'pl-8', 'sm:pl-10', 'text-sm', 'sm:text-base', 'rounded-l-lg');
    expect(input).toHaveClass('outline-none', 'border-none', 'focus:outline-none');
  });

  test('search button has correct styling classes', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    const buttonContainer = container.querySelector('.flex-shrink-0');
    expect(buttonContainer).toHaveClass('h-11', 'px-3', 'sm:px-6', 'bg-purple-600', 'hover:bg-purple-700', 'rounded-lg');
  });

  test('component structure matches design requirements', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    // 验证外层容器结构
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('flex', 'items-stretch');
    
    // 验证输入框容器结构
    const inputContainer = outerContainer.querySelector('.flex-1');
    expect(inputContainer).toBeInTheDocument();
    expect(inputContainer).toHaveClass('relative');
    
    // 验证按钮容器结构
    const buttonContainer = outerContainer.querySelector('.flex-shrink-0');
    expect(buttonContainer).toBeInTheDocument();
    expect(buttonContainer).toHaveClass('flex', 'items-center');
    
    // 验证输入框无边框
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    expect(input).toHaveClass('border-none', 'outline-none');
    
    // 验证按钮有背景色
    expect(buttonContainer).toHaveClass('bg-purple-600');
  });

  test('uses purple color theme', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    const buttonContainer = container.querySelector('.flex-shrink-0');
    expect(buttonContainer).toHaveClass('bg-purple-600', 'hover:bg-purple-700');
    
    // 验证清除按钮也使用紫色主题
    const clearButton = screen.queryByLabelText('清除搜索');
    if (clearButton) {
      expect(clearButton).toHaveClass('hover:bg-purple-800');
    }
  });

  test('uses shadow-input system', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('shadow-input');
  });

  test('input text colors are properly defined', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    expect(input).toHaveClass('text-gray-900', 'placeholder-gray-500');
  });

  test('has correct size specifications', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    // 验证整体高度44px (h-11)
    const outerContainer = container.firstChild as HTMLElement;
    const inputContainer = outerContainer.querySelector('.flex-1');
    const buttonContainer = outerContainer.querySelector('.flex-shrink-0');
    
    expect(inputContainer?.querySelector('input')).toHaveClass('h-11');
    expect(buttonContainer).toHaveClass('h-11');
    
    // 验证按钮内边距px-6 (左右各24px)
    expect(buttonContainer).toHaveClass('px-3', 'sm:px-6');
    
    // 验证输入框内边距px-5 (左右各20px)
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    expect(input).toHaveClass('px-3', 'sm:px-5');
    
    // 验证文本大小
    expect(input).toHaveClass('text-sm', 'sm:text-base');
  });

  test('maintains consistent sizing across all elements', () => {
    const { container } = render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    const inputContainer = outerContainer.querySelector('.flex-1');
    const buttonContainer = outerContainer.querySelector('.flex-shrink-0');
    
    // 所有主要元素都应该有相同的高度
    expect(inputContainer?.querySelector('input')).toHaveClass('h-11');
    expect(buttonContainer).toHaveClass('h-11');
    
    // 清除按钮应该有合适的尺寸
    const clearButton = screen.getByLabelText('清除搜索');
    expect(clearButton).toHaveClass('w-5', 'h-5', 'sm:w-6', 'sm:h-6');
    
    // 搜索按钮中的图标应该有合适的尺寸
    const searchButton = buttonContainer?.querySelector('button[aria-label="搜索"]');
    const searchIcon = searchButton?.querySelector('svg');
    expect(searchIcon).toHaveClass('w-4', 'h-4', 'sm:w-5', 'sm:h-5');
  });

  test('has simplified focus states', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    
    // 验证输入框没有边框和轮廓
    expect(input).toHaveClass('border-none', 'outline-none', 'focus:outline-none');
    
    // 验证容器有聚焦效果
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('focus-within:shadow-lg', 'transition-shadow', 'duration-200');
  });

  test('maintains container shadow effect', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('shadow-input');
    
    // 验证聚焦时阴影会增强
    expect(outerContainer).toHaveClass('focus-within:shadow-lg');
  });

  test('has enhanced button interactions', () => {
    const { container } = render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const buttonContainer = container.querySelector('.flex-shrink-0');
    
    // 验证按钮容器有悬停和点击效果
    expect(buttonContainer).toHaveClass('hover:bg-purple-700', 'hover:opacity-90', 'active:scale-95');
    expect(buttonContainer).toHaveClass('transition-all', 'duration-150');
    
    // 验证清除按钮有交互效果
    const clearButton = screen.getByLabelText('清除搜索');
    expect(clearButton).toHaveClass('hover:text-purple-100', 'hover:bg-purple-800', 'active:scale-90');
    expect(clearButton).toHaveClass('transition-all', 'duration-150');
  });

  test('button interactions follow Toolify.ai design patterns', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    const buttonContainer = container.querySelector('.flex-shrink-0');
    
    // 验证悬停透明度效果 (参考Toolify.ai的hover:opacity-90)
    expect(buttonContainer).toHaveClass('hover:opacity-90');
    
    // 验证点击反馈效果
    expect(buttonContainer).toHaveClass('active:scale-95');
    
    // 验证过渡动画
    expect(buttonContainer).toHaveClass('transition-all', 'duration-150');
  });

  test('preserves all existing functionality', () => {
    const { container } = render(<SearchBar value="test" onChange={mockOnChange} />);
    
    // 1. 验证清除按钮功能
    const clearButton = screen.getByLabelText('清除搜索');
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(mockOnChange).toHaveBeenCalledWith('');
    
    // 2. 验证键盘快捷键 (Ctrl+K) - 通过全局键盘事件测试
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
    
    // 3. 验证Escape键清除功能
    fireEvent.change(input, { target: { value: 'test again' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(mockOnChange).toHaveBeenCalledWith('');
    
    // 4. 验证无障碍访问性
    expect(input).toHaveAttribute('aria-label', '搜索工具');
    expect(clearButton).toHaveAttribute('aria-label', '清除搜索');
    const searchButton = screen.getByLabelText('搜索');
    expect(searchButton).toHaveAttribute('aria-label', '搜索');
    
    // 5. 验证输入功能
    fireEvent.change(input, { target: { value: 'new test' } });
    expect(mockOnChange).toHaveBeenCalledWith('new test');
  });

  test('keyboard shortcuts work correctly', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    
    // 测试 Ctrl+K 聚焦
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
    
    // 测试 Command+K 聚焦 (Mac)
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(document.activeElement).toBe(input);
  });

  test('accessibility features are maintained', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);
    
    // 验证所有交互元素都有正确的aria-label
    expect(screen.getByLabelText('搜索工具')).toBeInTheDocument();
    expect(screen.getByLabelText('清除搜索')).toBeInTheDocument();
    expect(screen.getByLabelText('搜索')).toBeInTheDocument();
    
    // 验证输入框有正确的类型
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  test('has mobile-responsive design', () => {
    const { container } = render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    const buttonContainer = container.querySelector('.flex-shrink-0');
    const clearButton = screen.getByLabelText('清除搜索');
    
    // 验证移动端内边距
    expect(input).toHaveClass('px-3', 'sm:px-5', 'pl-8', 'sm:pl-10');
    
    // 验证移动端文本大小
    expect(input).toHaveClass('text-sm', 'sm:text-base');
    
    // 验证按钮容器移动端内边距
    expect(buttonContainer).toHaveClass('px-3', 'sm:px-6');
    
    // 验证清除按钮移动端尺寸
    expect(clearButton).toHaveClass('w-5', 'h-5', 'sm:w-6', 'sm:h-6');
    expect(clearButton).toHaveClass('mr-1', 'sm:mr-2');
    
    // 验证图标移动端尺寸
    const clearIcon = clearButton.querySelector('svg');
    expect(clearIcon).toHaveClass('w-3', 'h-3', 'sm:w-4', 'sm:h-4');
    
    const searchButton = buttonContainer?.querySelector('button[aria-label="搜索"]');
    const searchIcon = searchButton?.querySelector('svg');
    expect(searchIcon).toHaveClass('w-4', 'h-4', 'sm:w-5', 'sm:h-5');
  });

  test('has touch-friendly interaction areas', () => {
    const { container } = render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const buttonContainer = container.querySelector('.flex-shrink-0');
    const clearButton = screen.getByLabelText('清除搜索');
    
    // 验证按钮容器有足够的触摸区域 (44px高度)
    expect(buttonContainer).toHaveClass('h-11');
    
    // 验证清除按钮有合适的触摸区域
    expect(clearButton).toHaveClass('w-5', 'h-5', 'sm:w-6', 'sm:h-6');
    
    // 验证按钮有cursor-pointer
    expect(buttonContainer).toHaveClass('cursor-pointer');
  });

  test('supports dark mode', () => {
    const { container } = render(<SearchBar value="test" onChange={mockOnChange} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    const buttonContainer = container.querySelector('.flex-shrink-0');
    const clearButton = screen.getByLabelText('清除搜索');
    
    // 验证外层容器深色模式
    expect(outerContainer).toHaveClass('bg-white', 'dark:bg-slate-800');
    expect(outerContainer).toHaveClass('shadow-input', 'dark:shadow-slate-900/20');
    expect(outerContainer).toHaveClass('focus-within:shadow-lg', 'dark:focus-within:shadow-slate-900/30');
    
    // 验证输入框深色模式
    expect(input).toHaveClass('text-gray-900', 'dark:text-slate-100');
    expect(input).toHaveClass('placeholder-gray-500', 'dark:placeholder-slate-400');
    
    // 验证按钮容器深色模式
    expect(buttonContainer).toHaveClass('bg-purple-600', 'dark:bg-purple-700');
    expect(buttonContainer).toHaveClass('hover:bg-purple-700', 'dark:hover:bg-purple-600');
    
    // 验证清除按钮深色模式
    expect(clearButton).toHaveClass('hover:text-purple-100', 'dark:hover:text-purple-200');
    expect(clearButton).toHaveClass('hover:bg-purple-800', 'dark:hover:bg-purple-500');
  });

  test('maintains proper contrast in dark mode', () => {
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);
    
    const outerContainer = container.firstChild as HTMLElement;
    const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
    
    // 验证深色模式下的对比度
    expect(outerContainer).toHaveClass('dark:bg-slate-800'); // 深色背景
    expect(input).toHaveClass('dark:text-slate-100'); // 浅色文字
    expect(input).toHaveClass('dark:placeholder-slate-400'); // 中等对比度的占位符
  });
});
