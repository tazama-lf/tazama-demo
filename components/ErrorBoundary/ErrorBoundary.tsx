// SPDX-License-Identifier: Apache-2.0
import React from "react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="col-span-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Something went wrong rendering the pipeline.</p>
          {this.state.error && <p className="mt-1 font-mono text-xs">{this.state.error.message}</p>}
        </div>
      )
    }
    return this.props.children
  }
}
