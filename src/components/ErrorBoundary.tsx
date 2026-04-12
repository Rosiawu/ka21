"use client";

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
  componentStack?: string;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.setState({
      errorMessage,
      componentStack: errorInfo.componentStack ?? undefined,
    });

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined, componentStack: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">加载失败，请重试</p>
            {process.env.NODE_ENV !== 'production' && this.state.errorMessage ? (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-left text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
                <p className="font-medium">开发态错误信息</p>
                <p className="mt-1 break-words">{this.state.errorMessage}</p>
                {this.state.componentStack ? (
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[11px] leading-5">
                    {this.state.componentStack.trim()}
                  </pre>
                ) : null}
              </div>
            ) : null}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              重试
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
