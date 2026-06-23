import { useState } from 'react'
import { CheckSquare2, Square, Download, LogOut, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TermoDocumento } from './TermoDocumento'
import { gerarTermoPdf } from '../lib/termoPdf'
import { useAceitarTermo } from '../hooks/useTermos'
import type { TermoUso } from '@/services/termos.service'

/**
 * Tela obrigatória de 1º acesso: bloqueia o portal até o aluno aceitar os termos.
 * Permite ler o documento completo, baixar o PDF e confirmar a leitura antes de aceitar.
 */
export function AceiteTermosGate({ termo, onSair }: { termo: TermoUso; onSair: () => void }) {
  const [confirmado, setConfirmado] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const aceitar = useAceitarTermo()

  async function baixarPdf() {
    setBaixando(true)
    try {
      await gerarTermoPdf(termo)
    } catch {
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-creme-fundo flex flex-col">
      {/* Cabeçalho fixo */}
      <header className="bg-roxo-profundo text-branco-puro shadow-md shrink-0">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">Termos de Uso e Prestação de Serviços</p>
              <p className="text-white/60 text-xs">Aceite necessário para continuar</p>
            </div>
          </div>
          <button
            onClick={onSair}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-branco-puro transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* Documento (rolável) */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-branco-puro rounded-2xl border border-bege-cartao shadow-sm p-5 sm:p-8">
            <TermoDocumento termo={termo} />
          </div>
          <p className="text-xs text-cinza-texto text-center mt-4">
            Role até o fim para ler o documento completo. Você pode baixar uma cópia em PDF a qualquer momento.
          </p>
        </div>
      </div>

      {/* Rodapé de ação fixo */}
      <footer className="shrink-0 bg-branco-puro border-t border-bege-cartao">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          <button
            type="button"
            onClick={() => setConfirmado((v) => !v)}
            className="flex items-start gap-3 text-left w-full group"
          >
            {confirmado ? (
              <CheckSquare2 className="w-5 h-5 text-roxo-profundo shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-cinza-medio shrink-0 mt-0.5 group-hover:text-roxo-profundo transition-colors" />
            )}
            <span className="text-sm text-cinza-forte">
              Li e concordo com os Termos de Uso e Prestação de Serviços da {`Clínica Performance e Saúde`}.
            </span>
          </button>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={baixarPdf} disabled={baixando} className="sm:w-auto">
              <Download className="w-4 h-4 mr-1.5" /> {baixando ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
            <Button
              onClick={() => aceitar.mutate()}
              disabled={!confirmado || aceitar.isPending}
              className="bg-rosa-vibrante text-branco-puro hover:bg-roxo-profundo sm:w-auto"
            >
              {aceitar.isPending ? 'Registrando...' : 'Aceito os Termos'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
