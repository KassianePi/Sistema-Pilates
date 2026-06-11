import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, ChevronLeft, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────────────────────
// Árvore de decisão
// ────────────────────────────────────────────────────────────────────────────

type NodeId = string

interface AnswerNode {
  id: NodeId
  pergunta: string
  opcoes?: { label: string; next: NodeId }[]
  resposta?: string   // folha da árvore — exibe resposta final
}

const NODES: Record<NodeId, AnswerNode> = {
  inicio: {
    id: 'inicio',
    pergunta: 'Olá! Em que posso ajudar?',
    opcoes: [
      { label: '💰 Mensalidade e pagamento', next: 'mensalidade' },
      { label: '📅 Minhas aulas', next: 'aulas' },
      { label: '📋 Presença', next: 'presenca' },
      { label: '🔧 Problema técnico / Outra dúvida', next: 'outras' },
    ],
  },

  // ── Mensalidade ──────────────────────────────────────────────────────────
  mensalidade: {
    id: 'mensalidade',
    pergunta: 'Qual é a sua dúvida sobre mensalidade?',
    opcoes: [
      { label: 'Como pagar minha mensalidade?', next: 'mens_comoPagar' },
      { label: 'Paguei mas ainda aparece como pendente', next: 'mens_jaPagei' },
      { label: 'Quero solicitar reembolso', next: 'mens_reembolso' },
      { label: 'Outra dúvida financeira', next: 'mens_outra' },
    ],
  },
  mens_comoPagar: {
    id: 'mens_comoPagar',
    pergunta: 'Como pagar minha mensalidade?',
    resposta:
      '**Para pagar sua mensalidade:**\n\n1. Acesse a aba **Financeiro** no menu.\n2. Você verá a chave PIX e o QR Code do studio.\n3. Realize o pagamento pelo seu banco.\n4. Clique em **Comprovante** ao lado da mensalidade e envie a foto ou PDF do comprovante.\n5. Aguarde a confirmação — o studio analisará em até 1 dia útil.',
  },
  mens_jaPagei: {
    id: 'mens_jaPagei',
    pergunta: 'Paguei mas o status ainda não mudou',
    resposta:
      '**O pagamento é confirmado manualmente pelo studio.**\n\nSe você ainda não enviou o comprovante:\n→ Acesse **Financeiro**, clique em **Comprovante** e envie o arquivo.\n\nSe já enviou e o status não mudou em 1 dia útil, entre em contato com o studio pelo WhatsApp para verificar.',
  },
  mens_reembolso: {
    id: 'mens_reembolso',
    pergunta: 'Solicitar reembolso',
    resposta:
      '**Para solicitar reembolso proporcional:**\n\n1. Acesse a aba **Financeiro**.\n2. Localize a mensalidade desejada (status Pago).\n3. Clique em **Reembolso**.\n\nO valor é calculado com base nas aulas não comparecidas no mês. O studio analisará sua solicitação.',
  },
  mens_outra: {
    id: 'mens_outra',
    pergunta: 'Outra dúvida financeira',
    resposta:
      'Para outras dúvidas sobre pagamentos, entre em contato direto com o studio.\n\nVocê pode acessar os dados de contato na recepção ou perguntar diretamente ao seu professor.',
  },

  // ── Aulas ────────────────────────────────────────────────────────────────
  aulas: {
    id: 'aulas',
    pergunta: 'Qual é a sua dúvida sobre aulas?',
    opcoes: [
      { label: 'Como faço para repor uma aula faltada?', next: 'aulas_reposicao' },
      { label: 'Minha aula foi cancelada', next: 'aulas_cancelada' },
      { label: 'Quero trocar de horário ou plano', next: 'aulas_troca' },
      { label: 'Não consigo ver minha agenda', next: 'aulas_agenda' },
    ],
  },
  aulas_reposicao: {
    id: 'aulas_reposicao',
    pergunta: 'Reposição de aula',
    resposta:
      '**Para repor uma aula:**\n\nEntre em contato com o studio (recepção ou WhatsApp) informando:\n- A data da aula que você perdeu\n- Sua disponibilidade\n\nO professor ou a recepção agendará a reposição conforme a disponibilidade.',
  },
  aulas_cancelada: {
    id: 'aulas_cancelada',
    pergunta: 'Aula cancelada',
    resposta:
      'Quando uma aula é cancelada, você receberá uma **notificação** no sistema.\n\nO studio entrará em contato para oferecer uma reposição. Se não recebeu aviso, verifique a aba **Notificações** ou fale diretamente com o studio.',
  },
  aulas_troca: {
    id: 'aulas_troca',
    pergunta: 'Trocar de horário ou plano',
    resposta:
      'Para solicitar troca de horário ou mudança de plano, fale diretamente com a recepção ou com o seu professor.\n\nO studio analisará a disponibilidade e fará o ajuste no sistema.',
  },
  aulas_agenda: {
    id: 'aulas_agenda',
    pergunta: 'Não consigo ver minha agenda',
    resposta:
      '**Para ver suas aulas:**\n\n1. Acesse a aba **Minhas Aulas** no menu.\n2. As aulas agendadas para você aparecerão listadas.\n\nSe não aparecer nenhuma aula, pode ser que ainda não haja aulas vinculadas ao seu cadastro. Fale com o studio.',
  },

  // ── Presença ─────────────────────────────────────────────────────────────
  presenca: {
    id: 'presenca',
    pergunta: 'Qual é a sua dúvida sobre presença?',
    opcoes: [
      { label: 'Como verificar minhas presenças?', next: 'pres_verificar' },
      { label: 'Minha presença não foi registrada', next: 'pres_naoRegistrada' },
    ],
  },
  pres_verificar: {
    id: 'pres_verificar',
    pergunta: 'Como verificar minhas presenças?',
    resposta:
      'Acesse a aba **Presença** no menu principal.\n\nLá você encontra o histórico completo das suas aulas: presentes, ausências e faltas justificadas.',
  },
  pres_naoRegistrada: {
    id: 'pres_naoRegistrada',
    pergunta: 'Presença não registrada',
    resposta:
      'Se você compareceu a uma aula e ela não aparece como presente:\n\n1. Verifique se a aula ainda não foi encerrada (professores registram ao final).\n2. Se já passou do horário, informe ao professor ou à recepção para corrigir o registro.',
  },

  // ── Outras ───────────────────────────────────────────────────────────────
  outras: {
    id: 'outras',
    pergunta: 'Problema técnico ou outra dúvida',
    opcoes: [
      { label: 'Não consigo fazer login', next: 'tec_login' },
      { label: 'Recebi uma notificação que não entendo', next: 'tec_notif' },
      { label: 'Outra situação', next: 'tec_outra' },
    ],
  },
  tec_login: {
    id: 'tec_login',
    pergunta: 'Problema ao fazer login',
    resposta:
      '**Dicas para problemas de login:**\n\n- Certifique-se de usar o e-mail cadastrado no studio.\n- Se esqueceu a senha, solicite ao studio que redefina.\n- Evite salvar a senha no navegador — isso pode causar incompatibilidade.\n- Se o erro persistir, entre em contato com o studio.',
  },
  tec_notif: {
    id: 'tec_notif',
    pergunta: 'Notificação não compreendida',
    resposta:
      'Acesse a aba **Notificações** no menu para ver todas as suas mensagens do studio.\n\nSe tiver dúvidas sobre o conteúdo de uma notificação específica, fale diretamente com a recepção.',
  },
  tec_outra: {
    id: 'tec_outra',
    pergunta: 'Outra situação',
    resposta:
      'Para dúvidas não cobertas aqui, entre em contato diretamente com o studio:\n\n- Fale com a recepcionista\n- Acesse pelo WhatsApp do studio\n- Envie e-mail para o contato cadastrado\n\nEstamos sempre à disposição!',
  },
}

// ────────────────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────────────────

function renderMd(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return `<p key="${i}">${bold}</p>`
    })
    .join('')
}

export function ChatSuporte() {
  const [aberto, setAberto] = useState(false)
  const [historico, setHistorico] = useState<NodeId[]>(['inicio'])
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentId = historico[historico.length - 1]
  const current = NODES[currentId]

  useEffect(() => {
    if (aberto && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [aberto, historico])

  function avancar(next: NodeId) {
    setHistorico((h) => [...h, next])
  }

  function voltar() {
    if (historico.length > 1) {
      setHistorico((h) => h.slice(0, -1))
    }
  }

  function reiniciar() {
    setHistorico(['inicio'])
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto((o) => !o)}
        aria-label="Abrir suporte"
        className={cn(
          'fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all',
          'bg-roxo-profundo text-branco-puro hover:bg-roxo-profundo/90 active:scale-95',
        )}
      >
        {aberto ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Painel do chat */}
      {aberto && (
        <div className="fixed bottom-24 right-5 z-50 w-80 max-h-[520px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-bege-cartao bg-branco-puro">
          {/* Cabeçalho */}
          <div className="bg-roxo-profundo text-branco-puro px-4 py-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Suporte Rápido</p>
              <p className="text-white/60 text-xs">Respostas instantâneas</p>
            </div>
            {historico.length > 1 && (
              <button onClick={voltar} className="hover:bg-white/10 p-1 rounded-lg transition-colors" aria-label="Voltar">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Corpo */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Pergunta atual */}
            <div className="bg-creme-fundo rounded-xl rounded-tl-none px-3 py-2.5 text-sm text-cinza-forte max-w-[90%]">
              {current.pergunta}
            </div>

            {/* Resposta final */}
            {current.resposta && (
              <div className="bg-lilas-claro/60 rounded-xl rounded-tl-none px-3 py-2.5 text-sm text-cinza-forte max-w-[95%]">
                <div
                  className="space-y-1.5 [&_p]:leading-snug [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: renderMd(current.resposta) }}
                />
              </div>
            )}

            {/* Opções */}
            {current.opcoes && (
              <div className="space-y-2 pt-1">
                {current.opcoes.map((op) => (
                  <button
                    key={op.next}
                    onClick={() => avancar(op.next)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-bege-cartao bg-branco-puro hover:bg-lilas-claro/40 text-sm text-cinza-forte transition-colors"
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            )}

            {/* Botão de reiniciar (somente em folhas) */}
            {current.resposta && (
              <button
                onClick={reiniciar}
                className="w-full text-xs text-cinza-medio hover:text-roxo-profundo py-2 transition-colors"
              >
                ← Voltar ao início
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
