import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Send,
  Upload,
  RotateCcw,
  Zap,
  FileCheck,
  XCircle,
  History,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../../components/PageHeader";
import { KpiCard, type KpiTone } from "../../components/KpiCard";
import { SectionCard } from "../../components/SectionCard";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { PixCard } from "../../components/PixCard";
import { TimelineFinanceira } from "../../components/TimelineFinanceira";
import { EnviarComprovanteModal } from "../../components/EnviarComprovanteModal";
import { ReembolsoModal } from "../../components/ReembolsoModal";
import { NotificarPagamentoModal } from "../../components/NotificarPagamentoModal";
import { SolicitarAvulsaModal } from "../../components/SolicitarAvulsaModal";
import {
  useMinhasMensalidades,
  useMeusComprovantes,
  useMeusEstornos,
  useConfiguracaoStudio,
} from "../../hooks/useAlunoFinanceiro";
import { getStatusMeta } from "../../constants/status";
import { formatarValor, formatarData } from "../../utils/format";
import { montarTimelineFinanceira } from "../../utils/timelineFinanceira";
import type { MensalidadeAluno, ComprovanteAluno } from "../../utils/tipos";
import type { Estorno } from "@/services/estornos.service";

type Aba = "resumo" | "comprovantes" | "reembolsos" | "avulsa";

const ABAS: { key: Aba; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "comprovantes", label: "Comprovantes" },
  { key: "reembolsos", label: "Reembolsos" },
  { key: "avulsa", label: "Aula Avulsa" },
];

function toneFromVariant(v: string): KpiTone {
  if (v === "success") return "success";
  if (v === "warning") return "warning";
  if (v === "destructive") return "danger";
  return "default";
}

export function AlunoFinanceiroPage() {
  const [params, setParams] = useSearchParams();
  const abaParam = params.get("tab");
  const abaInicial: Aba =
    abaParam === "comprovantes" ||
    abaParam === "reembolsos" ||
    abaParam === "avulsa"
      ? abaParam
      : "resumo";
  const [aba, setAba] = useState<Aba>(abaInicial);

  const [comprovanteModal, setComprovanteModal] = useState<{
    id: string;
    nomePlano: string;
  } | null>(null);
  const [reembolsoId, setReembolsoId] = useState<string | null>(null);
  const [notificarModal, setNotificarModal] = useState<{
    id: string;
    nomePlano: string;
  } | null>(null);
  const [modalAvulso, setModalAvulso] = useState(false);

  const { data: mensData, isLoading } = useMinhasMensalidades(50);
  const { data: comprovantesData } = useMeusComprovantes();
  const { data: estornosData } = useMeusEstornos();
  const { data: config } = useConfiguracaoStudio();

  const mensalidades: MensalidadeAluno[] = useMemo(
    () => mensData?.data ?? [],
    [mensData],
  );
  const comprovantes: ComprovanteAluno[] = useMemo(
    () => comprovantesData ?? [],
    [comprovantesData],
  );
  const estornos: Estorno[] = useMemo(
    () => estornosData?.estornos ?? [],
    [estornosData],
  );

  const comComprovante = useMemo(
    () =>
      new Set(
        comprovantes
          .filter((c) => c.status === "PENDENTE" || c.status === "APROVADO")
          .map((c) => c.mensalidadeId),
      ),
    [comprovantes],
  );
  const comEstorno = useMemo(
    () =>
      new Set(
        estornos
          .filter((e) => e.status !== "NEGADO")
          .map((e) => e.mensalidadeId),
      ),
    [estornos],
  );

  const pendentes = mensalidades.filter(
    (m) => m.status === "PENDENTE" || m.status === "VENCIDO",
  );
  const elegiveisReembolso = mensalidades.filter(
    (m) =>
      (m.status === "PAGO" || m.status === "PARCIAL") && !comEstorno.has(m.id),
  );
  const valorPendente = pendentes.reduce((acc, m) => acc + Number(m.valor), 0);
  const totalPago = mensalidades.reduce(
    (acc, m) => (m.status === "PAGO" ? acc + Number(m.valor) : acc),
    0,
  );
  const mensalidadeAtual =
    pendentes
      .slice()
      .sort(
        (a, b) =>
          new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime(),
      )[0] ??
    mensalidades[0] ??
    null;
  const proximaCobranca =
    pendentes
      .slice()
      .sort(
        (a, b) =>
          new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime(),
      )[0] ?? null;
  const temPix = !!(config?.chavePix || config?.qrCodeBase64);
  const timeline = useMemo(
    () => montarTimelineFinanceira({ mensalidades, comprovantes }),
    [mensalidades, comprovantes],
  );
  const mensStatus = mensalidadeAtual
    ? getStatusMeta("mensalidade", mensalidadeAtual.status)
    : null;

  function trocarAba(nova: Aba) {
    setAba(nova);
    setParams(nova === "resumo" ? {} : { tab: nova }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Financeiro"
        subtitle="Mensalidades, comprovantes, reembolsos e aula avulsa."
        icon={Wallet}
      />

      {/* Abas */}
      <div className="flex gap-1 bg-bege-suave p-1 rounded-lg w-fit flex-wrap">
        {ABAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => trocarAba(key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              aba === key
                ? "bg-branco-puro text-cinza-forte shadow-sm"
                : "text-cinza-texto hover:text-cinza-forte",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : aba === "resumo" ? (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Mensalidade atual"
              icon={Receipt}
              tone={
                mensStatus ? toneFromVariant(mensStatus.variant) : "default"
              }
              value={mensStatus ? mensStatus.label : "Em dia"}
            />
            <KpiCard
              label="Próximo vencimento"
              icon={Wallet}
              tone={proximaCobranca ? "warning" : "default"}
              value={
                proximaCobranca ? formatarData(proximaCobranca.vencimento) : "—"
              }
              hint={
                proximaCobranca
                  ? formatarValor(proximaCobranca.valor)
                  : "Nada em aberto"
              }
            />
            <KpiCard
              label="Valor em aberto"
              icon={AlertTriangle}
              tone={valorPendente > 0 ? "danger" : "default"}
              value={formatarValor(valorPendente)}
            />
            <KpiCard
              label="Total pago"
              icon={CheckCircle2}
              tone="success"
              value={formatarValor(totalPago)}
            />
          </div>

          {pendentes.length > 0 && temPix && (
            <PixCard
              chavePix={config?.chavePix}
              tipoChavePix={config?.tipoChavePix}
              nomeRecebedor={config?.nomeRecebedor}
              qrCodeBase64={config?.qrCodeBase64}
            />
          )}

          {/* Histórico de mensalidades */}
          <SectionCard
            title="Histórico de mensalidades"
            icon={CreditCard}
            noPadding
          >
            {mensalidades.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                message="Nenhuma mensalidade encontrada."
              />
            ) : (
              <ul className="divide-y divide-bege-cartao">
                {mensalidades.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cinza-forte">
                        {m.plano?.nome ?? "Avulso"}
                      </p>
                      <p className="text-xs text-cinza-texto">
                        Vencimento: {formatarData(m.vencimento)}
                      </p>
                      {m.status === "PAGO" &&
                        m.pagamentos &&
                        m.pagamentos.length > 0 && (
                          <p className="text-xs text-green-700">
                            Pago em{" "}
                            {formatarData(
                              m.pagamentos[m.pagamentos.length - 1]
                                .dataPagamento,
                            )}
                          </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-cinza-forte text-sm">
                        {formatarValor(m.valor)}
                      </span>
                      <StatusBadge domain="mensalidade" status={m.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Timeline financeira */}
          <SectionCard title="Linha do tempo financeira" icon={History}>
            <TimelineFinanceira eventos={timeline} />
          </SectionCard>
        </div>
      ) : aba === "comprovantes" ? (
        <div className="space-y-6">
          {/* Cobranças em aberto para enviar comprovante */}
          <SectionCard title="Cobranças em aberto" icon={Upload} noPadding>
            {pendentes.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                message="Nenhuma cobrança em aberto. Tudo certo!"
              />
            ) : (
              <>
                <p className="text-xs text-cinza-texto px-6 pt-4">
                  Pague via PIX e <strong>envie o comprovante</strong> para o
                  studio confirmar. Sem o arquivo em mãos? Use{" "}
                  <strong>Avisar que paguei</strong> só para sinalizar o
                  pagamento.
                </p>
                <ul className="divide-y divide-bege-cartao mt-2">
                  {pendentes.map((m) => {
                    const jaEnviou = comComprovante.has(m.id);
                    const nomePlano = m.plano?.nome ?? "Avulso";
                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-cinza-forte">
                            {nomePlano}
                          </p>
                          <p className="text-xs text-cinza-texto">
                            {formatarValor(m.valor)} · vence{" "}
                            {formatarData(m.vencimento)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-roxo-profundo border-roxo-profundo/30 hover:bg-roxo-profundo/5"
                            onClick={() =>
                              setNotificarModal({ id: m.id, nomePlano })
                            }
                          >
                            <Send className="w-3 h-3 mr-1" /> Avisar que paguei
                          </Button>
                          {jaEnviou ? (
                            <span className="text-xs text-amber-600 italic">
                              Comprovante enviado
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              className="text-xs bg-roxo-profundo text-branco-puro hover:bg-roxo-profundo/90"
                              onClick={() =>
                                setComprovanteModal({ id: m.id, nomePlano })
                              }
                            >
                              <Upload className="w-3 h-3 mr-1" /> Enviar
                              comprovante
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </SectionCard>

          {/* Comprovantes enviados */}
          <SectionCard title="Comprovantes enviados" icon={FileCheck} noPadding>
            {comprovantes.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                message="Você ainda não enviou comprovantes."
              />
            ) : (
              <ul className="divide-y divide-bege-cartao">
                {comprovantes.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-3 px-6 py-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cinza-forte">
                        {c.mensalidade?.plano?.nome ?? "Avulso"}
                      </p>
                      <p className="text-xs text-cinza-texto">
                        {c.nomeArquivo}
                      </p>
                      <p className="text-xs text-cinza-texto">
                        Enviado em {formatarData(c.dataEnvio)}
                      </p>
                      {c.status === "REJEITADO" && c.observacoes && (
                        <p className="text-xs text-rosa-vibrante flex items-center gap-1 mt-0.5">
                          <XCircle className="w-3 h-3" /> {c.observacoes}
                        </p>
                      )}
                    </div>
                    <StatusBadge domain="comprovante" status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      ) : aba === "reembolsos" ? (
        <div className="space-y-6">
          {/* Mensalidades elegíveis */}
          <SectionCard title="Solicitar reembolso" icon={RotateCcw} noPadding>
            {elegiveisReembolso.length === 0 ? (
              <EmptyState
                icon={RotateCcw}
                message="Nenhuma mensalidade elegível para reembolso no momento."
              />
            ) : (
              <ul className="divide-y divide-bege-cartao">
                {elegiveisReembolso.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cinza-forte">
                        {m.plano?.nome ?? "Avulso"}
                      </p>
                      <p className="text-xs text-cinza-texto">
                        {formatarValor(m.valor)} · {formatarData(m.vencimento)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-rosa-vibrante border-rosa-vibrante/30 hover:bg-rosa-vibrante/5"
                      onClick={() => setReembolsoId(m.id)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Solicitar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Minhas solicitações */}
          <SectionCard title="Minhas solicitações" icon={History} noPadding>
            {estornos.length === 0 ? (
              <EmptyState
                icon={RotateCcw}
                message="Você não tem solicitações de reembolso."
              />
            ) : (
              <ul className="divide-y divide-bege-cartao">
                {estornos.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-3 px-6 py-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cinza-forte">
                        {e.mensalidade?.plano?.nome ?? "Avulso"}
                      </p>
                      <p className="text-xs text-cinza-texto">
                        {e.diasComparecidos} de {e.diasContratados} aulas
                        comparecidas
                        {e.motivo ? ` · ${e.motivo}` : ""}
                      </p>
                      <p className="text-xs text-cinza-texto">
                        Solicitado em {formatarData(e.criadoEm)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-cinza-forte text-sm">
                        {formatarValor(Number(e.valorEstorno))}
                      </span>
                      <StatusBadge domain="estorno" status={e.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      ) : (
        /* Aula Avulsa */
        <SectionCard title="Aula Avulsa" icon={Zap}>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-cinza-texto">
              Sem plano mensal ou quer uma aula extra? Solicite uma aula avulsa
              ao studio. O administrador criará a cobrança e confirmará a data
              com você.
            </p>
            <Button
              className="bg-lilas-medio hover:bg-roxo-profundo text-branco-puro"
              onClick={() => setModalAvulso(true)}
            >
              <Zap className="w-4 h-4 mr-1" /> Solicitar aula avulsa
            </Button>
          </div>
        </SectionCard>
      )}

      {/* Modais */}
      {comprovanteModal && (
        <EnviarComprovanteModal
          mensalidadeId={comprovanteModal.id}
          nomePlano={comprovanteModal.nomePlano}
          onClose={() => setComprovanteModal(null)}
        />
      )}
      {reembolsoId && (
        <ReembolsoModal
          mensalidadeId={reembolsoId}
          onClose={() => setReembolsoId(null)}
        />
      )}
      {notificarModal && (
        <NotificarPagamentoModal
          mensalidadeId={notificarModal.id}
          nomePlano={notificarModal.nomePlano}
          onClose={() => setNotificarModal(null)}
        />
      )}
      {modalAvulso && (
        <SolicitarAvulsaModal onClose={() => setModalAvulso(false)} />
      )}
    </div>
  );
}
