import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  sectionName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export default class MeetingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[L10 Meeting] Error in ${this.props.sectionName || 'section'}:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto mt-16 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cult-red/20 mb-4">
            <AlertTriangle size={20} className="text-cult-red-bright" />
          </div>
          <h3 className="font-display text-lg text-cult-white tracking-wider mb-2">
            SOMETHING WENT WRONG
          </h3>
          <p className="text-xs text-cult-text mb-1">
            {this.props.sectionName
              ? `The ${this.props.sectionName} section encountered an error.`
              : 'This section encountered an error.'}
          </p>
          <p className="text-[10px] font-mono text-cult-text/40 mb-6 break-all px-4">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-ghost text-xs inline-flex items-center gap-2"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}