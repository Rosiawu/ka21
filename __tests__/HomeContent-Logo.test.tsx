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

describe('Logo Component Integration', () => {
  test('renders with large size and custom className', () => {
    render(<Logo size="large" className="h-24" />);
    
    const img = screen.getByRole('img');
    const container = img.parentElement;
    
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/KA21.svg');
    expect(img).toHaveAttribute('alt', 'KA21');
    expect(img).toHaveClass('h-24'); // large size class
    expect(container).toHaveClass('h-24'); // custom className
  });

  test('applies all required classes for production use', () => {
    render(<Logo size="large" className="h-24" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass(
      'h-24', // size class
      'transition-transform', 
      'duration-200',
      'hover:scale-105'
    );
  });

  test('has correct container classes', () => {
    render(<Logo size="large" className="h-24" />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass(
      'flex', 
      'items-center', 
      'justify-center',
      'w-32', // large container class
      'h-24'  // custom className
    );
  });

  test('maintains accessibility attributes', () => {
    render(<Logo size="large" className="h-24" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('role', 'img');
    expect(img).toHaveAttribute('aria-label', 'KA21');
  });
});
