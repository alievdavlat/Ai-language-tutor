import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Card } from '../ui'

interface ErrorBoundaryState {
  err: Error | null
  stack: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { err: null, stack: null }

  static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    return { err, stack: null }
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', err, info)
    this.setState({ err, stack: info.componentStack ?? null })
  }

  private readonly handleReload = (): void => {
    location.reload()
  }

  render(): ReactNode {
    if (!this.state.err) return this.props.children
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <div className="text-3xl mb-2">💥</div>
          <h1 className="text-xl font-bold mb-2">Something broke</h1>
          <p className="text-sm text-red-400 mb-3">{this.state.err.message}</p>
          {this.state.stack && (
            <pre className="text-[10px] text-slate-500 whitespace-pre-wrap overflow-auto max-h-64 bg-black/30 rounded p-2">
              {this.state.stack}
            </pre>
          )}
          <Button variant="ghost" className="mt-4" onClick={this.handleReload}>
            Reload app
          </Button>
        </Card>
      </div>
    )
  }
}
