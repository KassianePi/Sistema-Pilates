import { useState, useCallback } from 'react'

interface UseClipboardResult {
  copiar: (texto: string) => Promise<boolean>
  copiado: boolean
  erro: boolean
}

/** Copia texto para a área de transferência, com fallback para navegadores sem Clipboard API. */
function copiarComFallback(texto: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = texto
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  return ok
}

async function tentarCopiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
      return true
    }
    return copiarComFallback(texto)
  } catch {
    return copiarComFallback(texto)
  }
}

/** Hook genérico de copiar texto, reutilizável em qualquer parte do sistema. */
export function useClipboard(resetAposMs = 2000): UseClipboardResult {
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState(false)

  const copiar = useCallback(
    async (texto: string) => {
      const sucesso = await tentarCopiar(texto)
      setCopiado(sucesso)
      setErro(!sucesso)
      if (sucesso) {
        setTimeout(() => setCopiado(false), resetAposMs)
      }
      return sucesso
    },
    [resetAposMs],
  )

  return { copiar, copiado, erro }
}
