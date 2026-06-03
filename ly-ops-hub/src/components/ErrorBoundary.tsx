// ============================================================
// LY-OPS Hub — Error Boundary
// ============================================================

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] px-4 text-center">
          <div className="mb-3 text-5xl">💥</div>
          <h2 className="text-xl font-bold text-white">页面出错了</h2>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            {this.state.error?.message || "未知错误"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white"
          >
            重新加载
          </button>
          <details className="mt-4 max-w-lg text-left">
            <summary className="cursor-pointer text-xs text-gray-600">
              错误详情
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-red-400">
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
