import { useEffect, useState } from 'react'
import { PIX_COUNTDOWN_TICK_MS } from '../constants/pagamentoPix'

interface UseCountdownResult {
  segundosRestantes: number
  formatado: string
  expirado: boolean
}

function formatar(segundos: number): string {
  const s = Math.max(0, segundos)
  const minutos = Math.floor(s / 60)
  const resto = s % 60
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
}

interface Leitura {
  alvo: number
  segundosRestantes: number
}

/** Contagem regressiva genérica até uma data-alvo (ISO ou Date). `null` desliga o hook. */
export function useCountdown(expiraEm: Date | string | null): UseCountdownResult {
  const alvo = expiraEm ? new Date(expiraEm).getTime() : null
  const [leitura, setLeitura] = useState<Leitura | null>(null)

  useEffect(() => {
    if (!alvo) return

    function atualizar() {
      setLeitura({ alvo: alvo!, segundosRestantes: Math.round((alvo! - Date.now()) / 1000) })
    }

    // Dispara uma primeira leitura já no próximo tick do event loop (evita
    // mostrar "00:00" por até 1s antes do primeiro disparo do intervalo) sem
    // chamar setState de forma síncrona dentro do corpo do efeito.
    const primeiraLeitura = setTimeout(atualizar, 0)
    const intervalo = setInterval(atualizar, PIX_COUNTDOWN_TICK_MS)
    return () => {
      clearTimeout(primeiraLeitura)
      clearInterval(intervalo)
    }
  }, [alvo])

  // `leitura` pode ser de um `alvo` anterior (ex.: countdown zerado e o aluno
  // gerou um PIX novo) até a primeira leitura do novo intervalo chegar — sem
  // essa checagem, `expirado` ficaria `true` por um instante com um prazo novo
  // de ~30min, escondendo o QR recém-gerado.
  const pronta = alvo !== null && leitura !== null && leitura.alvo === alvo
  const segundosRestantes = pronta ? Math.max(0, leitura!.segundosRestantes) : 0

  return {
    segundosRestantes,
    formatado: formatar(segundosRestantes),
    expirado: pronta && leitura!.segundosRestantes <= 0,
  }
}
