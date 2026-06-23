import { useState } from 'react'
import { FileText, Download, CheckCircle2, History, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../../components/PageHeader'
import { SectionCard } from '../../components/SectionCard'
import { LoadingState } from '../../components/LoadingState'
import { EmptyState } from '../../components/EmptyState'
import { TermoDocumento } from '@/features/termos/components/TermoDocumento'
import { gerarTermoPdf } from '@/features/termos/lib/termoPdf'
import { useTermoStatus, useMeusAceites } from '@/features/termos/hooks/useTermos'
import { formatarDataHora } from '../../utils/format'

export function AlunoTermosPage() {
  const { data: status, isLoading } = useTermoStatus()
  const { data: aceites = [] } = useMeusAceites()
  const [baixando, setBaixando] = useState(false)

  const termo = status?.termo

  async function baixar() {
    if (!termo) return
    setBaixando(true)
    try {
      const aceite =
        status?.aceito && status.versaoAceita != null && status.aceitoEm
          ? { versao: status.versaoAceita, aceitoEm: status.aceitoEm }
          : null
      await gerarTermoPdf(termo, aceite)
    } catch {
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Termos de Uso"
        subtitle="Documento vigente, seu aceite e histórico de versões."
        icon={FileText}
      />

      {isLoading ? (
        <LoadingState />
      ) : !termo ? (
        <SectionCard>
          <EmptyState icon={FileText} message="Nenhum termo de uso publicado no momento." />
        </SectionCard>
      ) : (
        <>
          {/* Status do aceite */}
          <SectionCard
            title="Seu aceite"
            icon={ShieldCheck}
            action={
              <Button size="sm" variant="outline" onClick={baixar} disabled={baixando}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> {baixando ? 'Gerando...' : 'Baixar PDF'}
              </Button>
            }
          >
            {status?.aceito ? (
              <p className="flex items-center gap-2 text-sm text-cinza-forte">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                Você aceitou a versão {status.versaoAceita} em {formatarDataHora(status.aceitoEm)}.
              </p>
            ) : (
              <p className="text-sm text-amber-700">Aceite pendente para a versão {status?.versaoAtual}.</p>
            )}
          </SectionCard>

          {/* Documento vigente */}
          <SectionCard>
            <TermoDocumento termo={termo} />
          </SectionCard>

          {/* Histórico de aceites */}
          <SectionCard title="Histórico de versões aceitas" icon={History}>
            {aceites.length === 0 ? (
              <EmptyState icon={History} message="Nenhum aceite registrado ainda." />
            ) : (
              <ul className="divide-y divide-bege-cartao -my-2">
                {aceites.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cinza-forte truncate">{a.termo.titulo}</p>
                      <p className="text-xs text-cinza-texto">Versão {a.versao}</p>
                    </div>
                    <span className="text-xs text-cinza-texto shrink-0">{formatarDataHora(a.aceitoEm)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
