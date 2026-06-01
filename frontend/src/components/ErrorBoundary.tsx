import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-creme-fundo">
          <div className="text-center space-y-4">
            <p className="text-rosa-vibrante text-xl font-semibold">
              Algo deu errado.
            </p>
            <p className="text-cinza-texto">
              Recarregue a página ou entre em contato com o suporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-roxo-profundo text-branco-puro rounded-md hover:opacity-90 transition-opacity"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
