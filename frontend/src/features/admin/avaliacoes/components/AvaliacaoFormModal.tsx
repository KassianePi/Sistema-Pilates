import { useState } from 'react'
import { HeartPulse, FileCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCriarAvaliacao } from '../hooks/useAvaliacoes'

const CAMPOS_MEDIDAS: Array<{ key: string; label: string }> = [
  { key: 'cintura', label: 'Cintura (cm)' },
  { key: 'quadril', label: 'Quadril (cm)' },
  { key: 'bracoD', label: 'Braço direito (cm)' },
  { key: 'bracoE', label: 'Braço esquerdo (cm)' },
  { key: 'coxaD', label: 'Coxa direita (cm)' },
  { key: 'coxaE', label: 'Coxa esquerda (cm)' },
]

const FOTO_TIPOS_PERMITIDOS = 'image/jpeg,image/png,image/webp'

interface AvaliacaoFormModalProps {
  alunoId: string
  onClose: () => void
}

export function AvaliacaoFormModal({ alunoId, onClose }: AvaliacaoFormModalProps) {
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().slice(0, 10))
  const [peso, setPeso] = useState<number | undefined>()
  const [altura, setAltura] = useState<number | undefined>()
  const [medidas, setMedidas] = useState<Record<string, number>>({})
  const [queixaPrincipal, setQueixaPrincipal] = useState('')
  const [historicoMedico, setHistoricoMedico] = useState('')
  const [observacoesPostura, setObservacoesPostura] = useState('')
  const [observacoesGerais, setObservacoesGerais] = useState('')
  const [fotos, setFotos] = useState<Array<{ arquivo: string; tipoArquivo: string; nome: string }>>([])

  const criar = useCriarAvaliacao()

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = () =>
        setFotos((atual) => [...atual, { arquivo: reader.result as string, tipoArquivo: file.type, nome: file.name }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function submit() {
    criar.mutate(
      {
        alunoId,
        dataAvaliacao,
        peso: peso ?? null,
        altura: altura ?? null,
        medidas: Object.keys(medidas).length > 0 ? medidas : null,
        queixaPrincipal: queixaPrincipal.trim() || null,
        historicoMedico: historicoMedico.trim() || null,
        observacoesPostura: observacoesPostura.trim() || null,
        observacoesGerais: observacoesGerais.trim() || null,
        fotos: fotos.map(({ arquivo, tipoArquivo }) => ({ arquivo, tipoArquivo })),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rosa-vibrante" /> Nova Avaliação Corporal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label>Data *</Label>
              <Input type="date" value={dataAvaliacao} onChange={(e) => setDataAvaliacao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={peso ?? ''}
                onChange={(e) => setPeso(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Altura (m)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={altura ?? ''}
                onChange={(e) => setAltura(e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="Ex: 1,75"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-cinza-medio">Medidas (circunferências, opcional)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CAMPOS_MEDIDAS.map((campo) => (
                <div key={campo.key} className="space-y-1">
                  <Label className="text-xs">{campo.label}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={medidas[campo.key] ?? ''}
                    onChange={(e) => {
                      const valor = e.target.value
                      setMedidas((atual) => {
                        const copia = { ...atual }
                        if (valor === '') delete copia[campo.key]
                        else copia[campo.key] = Number(valor)
                        return copia
                      })
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Queixa principal</Label>
            <Textarea
              rows={2}
              value={queixaPrincipal}
              onChange={(e) => setQueixaPrincipal(e.target.value)}
              placeholder="O que o aluno relata..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Histórico médico / lesões</Label>
            <Textarea
              rows={2}
              value={historicoMedico}
              onChange={(e) => setHistoricoMedico(e.target.value)}
              placeholder="Cirurgias, lesões, condições prévias..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observações posturais</Label>
            <Textarea rows={2} value={observacoesPostura} onChange={(e) => setObservacoesPostura(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Observações gerais</Label>
            <Textarea rows={2} value={observacoesGerais} onChange={(e) => setObservacoesGerais(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Fotos <span className="text-cinza-medio text-xs">(opcional, máx. 5MB cada — JPG, PNG, WEBP)</span>
            </Label>
            <input
              type="file"
              accept={FOTO_TIPOS_PERMITIDOS}
              multiple
              onChange={handleFotos}
              className="block w-full text-sm text-cinza-texto file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-bege-cartao file:text-xs file:font-medium file:bg-branco-puro hover:file:bg-bege-cartao/50 cursor-pointer"
            />
            {fotos.length > 0 && (
              <ul className="text-xs text-green-700 space-y-0.5">
                {fotos.map((f, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" /> {f.nome}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={criar.isPending || !dataAvaliacao}>
              {criar.isPending ? 'Salvando...' : 'Salvar avaliação'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
