import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeProvider from '../src/components/ThemeProvider';

type MockProps = {
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  children?: React.ReactNode;
};

const nextThemesProviderMock = jest.fn(({ children }: MockProps) => (
  <div data-testid="mock-theme-provider">{children}</div>
));

jest.mock('next-themes', () => ({
  ThemeProvider: (props: MockProps) => nextThemesProviderMock(props),
}));

describe('ThemeProvider wrapper', () => {
  beforeEach(() => {
    nextThemesProviderMock.mockClear();
  });

  test('renders children through next-themes provider with default settings', () => {
    render(
      <ThemeProvider>
        <span data-testid="child">content</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('mock-theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('content');

    expect(nextThemesProviderMock).toHaveBeenCalledTimes(1);
    expect(nextThemesProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attribute: 'class',
        defaultTheme: 'system',
        enableSystem: true,
        disableTransitionOnChange: true,
      })
    );
  });

  test('forwards extra props to underlying provider', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <span data-testid="child">content</span>
      </ThemeProvider>
    );

    expect(nextThemesProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultTheme: 'dark',
      })
    );
  });
});
