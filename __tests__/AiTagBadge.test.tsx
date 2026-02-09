import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AiTagBadge from '../src/components/AiTagBadge';

let mockResolvedTheme: 'light' | 'dark' | undefined = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
  }),
}));

describe('AiTagBadge', () => {
  test('renders light theme styles by default', async () => {
    mockResolvedTheme = 'light';
    render(<AiTagBadge tagId="ai-writing" />);

    const badge = await screen.findByText('写作生成器');
    await waitFor(() => {
      expect(badge).toHaveStyle({
        backgroundColor: 'rgba(16, 185, 129, 0.082)',
        color: 'rgb(16, 185, 129)',
        borderColor: 'rgba(16, 185, 129, 0.19)',
      });
    });
  });

  test('applies dark theme overrides', async () => {
    mockResolvedTheme = 'dark';
    render(<AiTagBadge tagId="ai-writing" />);

    const badge = await screen.findByText('写作生成器');
    await waitFor(() => {
      expect(badge).toHaveStyle({
        backgroundColor: 'rgba(16, 185, 129, 0.19)',
        color: 'rgb(112, 213, 179)',
        borderColor: 'rgba(16, 185, 129, 0.314)',
      });
    });
  });
});
