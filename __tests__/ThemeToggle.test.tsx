import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../src/components/ThemeToggle';

const setThemeMock = jest.fn();
let mockResolvedTheme: 'light' | 'dark' | undefined;

jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: setThemeMock,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockResolvedTheme = 'light';
    setThemeMock.mockClear();
  });

  test('renders moon icon in light mode and toggles to dark', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: '切换到夜间模式' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  test('renders sun icon in dark mode and toggles to light', () => {
    mockResolvedTheme = 'dark';
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: '切换到日间模式' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });
});
