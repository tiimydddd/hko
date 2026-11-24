import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { FirestoreErrorInfo } from '../firebase/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  firestoreInfo: FirestoreErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      firestoreInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsed: FirestoreErrorInfo | null = null;
    try {
      const obj = JSON.parse(error.message) as Partial<FirestoreErrorInfo>;
      if (obj && typeof obj.error === 'string' && typeof obj.operationType === 'string') {
        parsed = obj as FirestoreErrorInfo;
      }
    } catch {
      // plain runtime error
    }
    return {
      hasError: true,
      message: parsed ? parsed.error : error.message || '發生未預期錯誤',
      firestoreInfo: parsed,
    };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { firestoreInfo, message } = this.state;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="max-w-lg w-full rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-7 h-7 shrink-0" />
            <div>
              <h1 className="text-lg font-bold">
                {firestoreInfo ? '雲端資料庫權限或連線錯誤' : '應用程式遇到異常'}
              </h1>
              <p className="text-xs text-slate-400">STCA Weather 安全攔截保護</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-sm text-slate-200 space-y-1.5">
            <p className="font-medium break-words">{message}</p>
            {firestoreInfo && (
              <p className="text-xs text-slate-400 font-mono-telemetry">
                Operation: {firestoreInfo.operationType} · Path: {firestoreInfo.path ?? '-'}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '', firestoreInfo: null })}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2.5 text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              嘗試恢復畫面
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2.5 text-sm transition"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }
}
