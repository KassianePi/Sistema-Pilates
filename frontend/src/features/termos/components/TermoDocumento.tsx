import { Fragment, type ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { parseTermoMarkdown, segmentosNegrito } from '../lib/termoMarkdown'
import { CLINICA, POLITICA_REEMBOLSO } from '../lib/termoConstantes'
import type { TermoUso } from '@/services/termos.service'

function Inline({ texto }: { texto: string }) {
  return (
    <>
      {segmentosNegrito(texto).map((s, i) =>
        s.negrito ? (
          <strong key={i} className="font-semibold text-cinza-forte">
            {s.texto}
          </strong>
        ) : (
          <Fragment key={i}>{s.texto}</Fragment>
        ),
      )}
    </>
  )
}

/** Renderiza os blocos do markdown, agrupando itens de lista consecutivos em <ul>. */
function Corpo({ conteudo }: { conteudo: string }) {
  const blocos = parseTermoMarkdown(conteudo)
  const elementos: ReactNode[] = []
  let lista: string[] = []

  const fecharLista = (key: string) => {
    if (lista.length === 0) return
    elementos.push(
      <ul key={key} className="list-disc pl-5 space-y-1 text-sm text-cinza-texto leading-relaxed">
        {lista.map((item, i) => (
          <li key={i}>
            <Inline texto={item} />
          </li>
        ))}
      </ul>,
    )
    lista = []
  }

  blocos.forEach((b, i) => {
    if (b.tipo === 'li') {
      lista.push(b.texto)
      return
    }
    fecharLista(`ul-${i}`)
    if (b.tipo === 'h2') {
      elementos.push(
        <h2 key={i} className="text-base font-bold text-roxo-profundo mt-5 mb-1.5">
          {b.texto}
        </h2>,
      )
    } else if (b.tipo === 'h3') {
      elementos.push(
        <h3 key={i} className="text-sm font-semibold text-cinza-forte mt-4 mb-1">
          {b.texto}
        </h3>,
      )
    } else {
      elementos.push(
        <p key={i} className="text-sm text-cinza-texto leading-relaxed">
          <Inline texto={b.texto} />
        </p>,
      )
    }
  })
  fecharLista('ul-final')

  return <div className="space-y-2">{elementos}</div>
}

/**
 * Documento institucional formatado dos Termos de Uso.
 * Reutilizado na página do aluno, no gate de aceite e na pré-visualização do admin.
 */
export function TermoDocumento({ termo }: { termo: TermoUso }) {
  const publicado = termo.publicadoEm ? new Date(termo.publicadoEm).toLocaleDateString('pt-BR') : null

  return (
    <article className="bg-branco-puro">
      {/* Cabeçalho institucional */}
      <header className="flex items-center gap-4 pb-4 border-b-2 border-ouro-clinica">
        <img
          src={CLINICA.logo}
          alt={`Logo ${CLINICA.nome}`}
          className="w-16 h-16 rounded-full object-cover border-2 border-ouro-clinica shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-cinza-forte leading-tight">{CLINICA.nome}</h1>
          <p className="text-xs text-cinza-texto uppercase tracking-wider">{CLINICA.subtitulo}</p>
          <p className="text-xs text-cinza-texto mt-0.5">Proprietária: {CLINICA.proprietaria}</p>
        </div>
      </header>

      {/* Título + metadados da versão */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-cinza-forte">{termo.titulo}</h2>
        <p className="text-xs text-cinza-texto mt-1">
          Versão {termo.versao}
          {publicado ? ` · Publicado em ${publicado}` : ' · Rascunho'}
        </p>
      </div>

      {/* Política de reembolso em destaque */}
      <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">{POLITICA_REEMBOLSO.titulo}</p>
          <p className="text-sm text-amber-800/90 mt-0.5 leading-relaxed">{POLITICA_REEMBOLSO.texto}</p>
        </div>
      </div>

      {/* Corpo do termo */}
      <div className="mt-5">
        <Corpo conteudo={termo.conteudo} />
      </div>
    </article>
  )
}
