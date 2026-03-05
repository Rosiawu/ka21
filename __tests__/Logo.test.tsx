import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Logo from '../src/components/Logo';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, className, ...props }: any) {
    return <img src={src} alt={alt} className={className} {...props} />;
  };
});

describe('Logo Component', () => {
  test('renders with default props', () => {
    render(<Logo />);
    
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/KA21.svg');
    expect(img).toHaveAttribute('alt', 'KA21');
    expect(img).toHaveAttribute('aria-label', 'KA21');
  });

  test('renders with custom alt text', () => {
    render(<Logo alt="Custom Logo" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Custom Logo');
    expect(img).toHaveAttribute('aria-label', 'Custom Logo');
  });

  test('applies small size classes', () => {
    render(<Logo size="small" />);
    
    const container = screen.getByRole('img').parentElement;
    const img = screen.getByRole('img');
    
    expect(container).toHaveClass('w-24');
    expect(img).toHaveClass('h-6');
  });

  test('applies medium size classes', () => {
    render(<Logo size="medium" />);
    
    const container = screen.getByRole('img').parentElement;
    const img = screen.getByRole('img');
    
    expect(container).toHaveClass('w-28');
    expect(img).toHaveClass('h-8');
  });

  test('applies large size classes', () => {
    render(<Logo size="large" />);
    
    const container = screen.getByRole('img').parentElement;
    const img = screen.getByRole('img');
    
    expect(container).toHaveClass('w-32');
    expect(img).toHaveClass('h-24');
  });

  test('applies custom className', () => {
    render(<Logo className="custom-class" />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  test('applies transition classes', () => {
    render(<Logo />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass('transition-transform', 'duration-200');
  });

  test('has correct base classes on container', () => {
    render(<Logo />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('flex', 'items-center', 'justify-center');
  });

  test('does not apply dark mode invert classes', () => {
    render(<Logo />);
    
    const img = screen.getByRole('img');
    expect(img).not.toHaveClass('dark:invert', 'dark:brightness-0', 'dark:contrast-200');
  });

  test('applies transition classes without dark mode inversion', () => {
    render(<Logo />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass(
      'transition-transform', 
      'duration-200',
      'hover:scale-105'
    );
  });

  test('applies hover scale effect', () => {
    render(<Logo />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass('hover:scale-105');
  });

  test('applies all classes including hover effect', () => {
    render(<Logo />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass(
      'transition-transform', 
      'duration-200',
      'hover:scale-105'
    );
  });
});
