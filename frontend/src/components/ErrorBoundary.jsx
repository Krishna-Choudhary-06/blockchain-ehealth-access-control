import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Application error boundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof this.props.onReset === 'function') {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl font-black">
              !
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Something interrupted the page
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The interface hit an unexpected error. You can reset the page and try again without losing your saved data.
            </p>
            {this.state.error && (
              <pre className="text-left text-[11px] bg-slate-950 text-slate-200 rounded-2xl p-4 overflow-auto max-h-48">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-3"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold py-3"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
