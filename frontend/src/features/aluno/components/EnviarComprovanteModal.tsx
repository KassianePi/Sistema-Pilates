import { useState } from 'react'
import { Upload, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEnviarComprovante } from '../hooks/useAlunoFinanceiro'

interface EnviarComprovanteModalProps {
  mensalidadeId: string
  nomePlano: string
  onClose: () => void
}

export function EnviarComprovanteModal({ mensalidadeId, nomePlano, onClose }: EnviarComprovanteModalProps) {
  const [arquivo, setArquivo] = useState<{ base64: string; nome: string; tipo: string } | null>(null)
  const enviar = useEnviarComprovante()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setArquivo({ base64: reader.result as string, nome: file.name, tipo: file.type })
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!arquivo) return
    enviar.mutate(
      { mensalidadeId, arquivo: arquivo.base64, nomeArquivo: arquivo.nome, tipoArquivo: arquivo.tipo },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-roxo-profundo" /> Enviar Comprovante
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-lilas-claro/40 border border-lilas-medio/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-cinza-forte">{nomePlano}</p>
            <p className="text-cinza-texto mt-0.5">
              Envie a foto ou PDF do comprovante do pagamento PIX desta cobrança.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>
              Arquivo <span className="text-cinza-texto text-xs">(máx. 5MB — JPG, PNG, PDF)</span>
            </Label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFile}
              className="block w-full text-sm text-cinza-texto file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-bege-cartao file:text-xs file:font-medium file:bg-branco-puro hover:file:bg-bege-cartao/50 cursor-pointer"
            />
            {arquivo && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> {arquivo.nome}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={enviar.isPending || !arquivo}
              className="bg-roxo-profundo hover:bg-roxo-profundo/90"
            >
              {enviar.isPending ? 'Enviando...' : 'Enviar comprovante'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
