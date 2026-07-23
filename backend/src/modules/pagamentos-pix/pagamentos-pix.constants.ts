// Usuário "de sistema" usado como `Pagamento.usuarioId` em baixas automáticas
// via gateway (o campo é obrigatório e referencia um Usuario, mas uma baixa
// automática não tem um humano por trás). Id fixo, mesmo padrão de
// `ConfiguracaoStudio.id = "studio"`. Fica INATIVO para nunca conseguir logar.
export const USUARIO_SISTEMA_ID = 'usuario-sistema-mercadopago'
export const USUARIO_SISTEMA_EMAIL = 'sistema.mercadopago@internal.pilates'

export const PAGAMENTOS_PIX_ERRORS = {
  MENSALIDADE_NOT_FOUND: 'Mensalidade não encontrada',
  MENSALIDADE_NAO_PERTENCE_ALUNO: 'Esta mensalidade não pertence a este aluno',
  MENSALIDADE_JA_PAGA: 'Esta mensalidade já está paga',
  COBRANCA_NOT_FOUND: 'Cobrança PIX não encontrada',
  FORA_DA_JANELA_COBRANCA:
    'Ainda não é possível gerar o QR Code para esta mensalidade — aguarde ficar mais perto do vencimento',
} as const

export const EXPIRACAO_COBRANCA_MINUTOS = 30
