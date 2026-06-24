import React from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false })
    if (this.props.onRetry) {
      this.props.onRetry()
    } else {
      window.location.reload()
    }
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-6 min-h-[400px] w-full animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-rose-500/20 bg-white/70 dark:bg-slate-900/60 p-8 shadow-xl backdrop-blur-xl transition-all duration-300">
            {/* Background ambient glow */}
            <div className="absolute -right-20 -top-20 -z-10 h-60 w-60 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 -z-10 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Animated Warning Icon */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-455">
                <span className="absolute inset-0 rounded-2xl bg-rose-500/20 animate-pulse"></span>
                <ShieldAlert className="h-8 w-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Component Execution Halted
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  An error occurred while evaluating policies or rendering ledger data in this module. The safety sandbox has intercepted the crash.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-indigo-650 hover:from-rose-700 hover:to-indigo-755 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/10 hover:shadow-rose-700/15 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Operation
                </button>
                
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  {this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  {this.state.showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Technical Accordion */}
              {this.state.showDetails && (
                <div className="w-full text-left space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-455 font-mono text-[10px] uppercase font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Console Stack Trace
                  </div>
                  <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto max-h-48 text-[11px] font-mono text-slate-305 leading-relaxed">
                    <div className="font-bold text-rose-400 mb-2">
                      Error: {this.state.error?.message || String(this.state.error)}
                    </div>
                    <pre className="whitespace-pre text-slate-400 text-[10px]">
                      {this.state.errorInfo?.componentStack || 'No component stack trace available'}
                    </pre>
                  </div>
                </div>
              )}

              {/* HIPAA / Blockchain Footer compliance note */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-2">
                ABAC Secure Sandbox • Channel Integrity Secured
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
