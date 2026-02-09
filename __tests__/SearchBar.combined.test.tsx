/**
 * SearchBar 综合测试
 * 合并了原有的多个测试文件，保留核心功能测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../src/components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // 基础渲染测试
  describe('基础渲染', () => {
    test('正确渲染搜索输入框', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    test('输入框具有正确的样式类', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const container = screen.getByRole('textbox').closest('div')?.parentElement;
      expect(container).toHaveClass('flex', 'items-stretch', 'rounded-lg', 'bg-white');
    });
  });

  // 交互功能测试
  describe('交互功能', () => {
    test('输入时触发 onChange', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
      fireEvent.change(input, { target: { value: 'test search' } });

      expect(mockOnChange).toHaveBeenCalledWith('test search');
    });

    test('有内容时显示清除按钮', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const clearButton = screen.getByLabelText('清除搜索');
      expect(clearButton).toBeInTheDocument();
    });

    test('空内容时不显示清除按钮', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const clearButton = screen.queryByLabelText('清除搜索');
      expect(clearButton).not.toBeInTheDocument();
    });

    test('点击清除按钮清空输入', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const clearButton = screen.getByLabelText('清除搜索');
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    test('点击搜索按钮触发搜索', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const searchButton = screen.getByLabelText('搜索');
      fireEvent.click(searchButton);

      // 搜索按钮应该触发 onChange（如果有搜索逻辑的话）
      expect(mockOnChange).toHaveBeenCalled();
    });

    test('按 Enter 键触发搜索', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      // Enter 键应该触发 onChange
      expect(mockOnChange).toHaveBeenCalled();
    });

    test('按 Escape 键清空输入', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('搜索AI工具名称、描述');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  // 可访问性测试
  describe('可访问性', () => {
    test('输入框具有正确的 aria 属性', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', '搜索工具');
    });

    test('清除按钮具有正确的 aria 标签', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);

      const clearButton = screen.getByLabelText('清除搜索');
      expect(clearButton).toBeInTheDocument();
    });

    test('搜索按钮具有正确的 aria 标签', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const searchButton = screen.getByLabelText('搜索');
      expect(searchButton).toBeInTheDocument();
    });
  });

  // 样式和性能测试
  describe('样式和性能', () => {
    test('CSS 类名数量合理', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const container = screen.getByRole('textbox').closest('div')?.parentElement;
      const classNames = container?.className.split(' ') || [];

      // 外层容器应该有合理的类名数量（不超过15个）
      expect(classNames.length).toBeLessThanOrEqual(15);
    });

    test('组件渲染性能合理', () => {
      const startTime = performance.now();

      render(<SearchBar value="" onChange={mockOnChange} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 初始渲染时间应该在合理范围内（小于100ms）
      expect(renderTime).toBeLessThan(100);
    });
  });

  // 边界情况测试
  describe('边界情况', () => {
    test('处理空值', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    test('处理长文本', () => {
      const longText = 'a'.repeat(1000);
      render(<SearchBar value={longText} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(longText);
    });

    test('处理特殊字符', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<SearchBar value={specialText} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(specialText);
    });
  });
});