import "./index.css";

import { InvalidAccessTokenError } from "@openauthjs/openauth/error";
import { Component, StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { App } from "~/renderer/app.js";
import { AppHeader } from "~/renderer/components/app-header.js";
import { Providers, queryClient } from "~/renderer/providers.js";

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo; }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    if (error instanceof InvalidAccessTokenError) {
      // Clear any stored tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('challenge');

      // Return special state for auth errors
      return { hasError: false, error: undefined };
    }

    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error instanceof InvalidAccessTokenError) {
      return;
    }

    console.error(error);
    // console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    // Reset error state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });

    // Clear cache and refetch all queries
    queryClient.clear();
    queryClient.resetQueries();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Something went wrong
            </h1>
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-left">
              <p className="font-bold mb-2">Error:</p>
              <p className="mb-4">{this.state.error?.message || 'An error occurred in the application.'}</p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  <p className="font-bold mb-2">Stack trace:</p>
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-64 bg-red-50 p-2 rounded">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="font-bold mt-4 mb-2">Component stack:</p>
                      <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-64 bg-red-50 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </>
              )}
            </div>
            <button
              onClick={this.resetError}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

declare global {
  interface Window {
    __REACT_ROOT__: ReactDOM.Root;
  }
}

const root = (() => {
  if (!window.__REACT_ROOT__) {
    window.__REACT_ROOT__ = ReactDOM.createRoot(rootElement);
  }
  return window.__REACT_ROOT__;
})();

root.render(
  <StrictMode>
    <Providers>
      <div className="[app-region:drag] z-10 sticky top-0 h-10 select-all bg-accent"></div>
      <ErrorBoundary>
        <AppHeader />
        <App />
        <footer className="container mx-auto py-8">
          <div className="max-w-prose">
            <p className="text-sm text-muted-foreground">
              © 2025 Imapsync App. Available under Personal Use License for personal use.
              Commercial use requires a separate license - contact
              {" "}
              <a
                className="underline hover:text-foreground transition-colors"
                href="mailto:me@casperengelmann.com"
              >
                me@casperengelmann.com
              </a>
            </p>

            <p className="text-sm text-red-500 mt-1">
              Note: Using this software in a business environment or for commercial purposes
              without a valid commercial license is strictly prohibited.
            </p>
          </div>
        </footer>
      </ErrorBoundary>
    </Providers>
  </StrictMode>
);
