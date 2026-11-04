import { Component } from 'react'

// Shows a readable message instead of a blank screen if something crashes while rendering
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">{String(this.state.error?.message || this.state.error)}</p>
        <button className="btn-primary mt-5" onClick={() => window.location.reload()}>Reload the app</button>
      </div>
    )
  }
}
