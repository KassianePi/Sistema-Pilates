import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Sparkles,
  History,
  X,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { SectionCard } from "../../components/SectionCard";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { DetalheAulaModal } from "../../components/DetalheAulaModal";
import { useAlunoAgenda, type EscopoAgenda } from "../../hooks/useAlunoAgenda";
import { formatarDataLonga } from "../../utils/format";
import type { Aula, CategoriaAula } from "@/types/domain.types";

const ESCOPOS: {
  value: EscopoAgenda;
  label: string;
  Icon: React.ElementType;
}[] = [
  { value: "minhas", label: "Próximas", Icon: CalendarDays },
  { value: "gerais", label: "Aulas gerais", Icon: Sparkles },
  { value: "historico", label: "Histórico", Icon: History },
];

const CATEGORIA_TAG: Record<
  CategoriaAula,
  { label: string; className: string }
> = {
  GERAL: {
    label: "Grade regular",
    className: "bg-lilas-claro text-roxo-profundo border-lilas-medio/30",
  },
  SOB_DEMANDA: {
    label: "Sob demanda",
    className: "bg-rosa-vibrante/10 text-rosa-vibrante border-rosa-vibrante/30",
  },
};

const STATUS_FILTROS = [
  { value: "all", label: "Todas" },
  { value: "AGENDADA", label: "Agendadas" },
  { value: "REALIZADA", label: "Realizadas" },
  { value: "CANCELADA", label: "Canceladas" },
  { value: "SUSPENSA", label: "Suspensas" },
  { value: "REAGENDADA", label: "Reagendadas" },
];

const VAZIO: Record<EscopoAgenda, string> = {
  minhas: "Você não tem aulas que atendam ao filtro.",
  gerais: "Nenhuma aula geral disponível no momento.",
  historico: "Nenhuma aula no seu histórico ainda.",
};

function filtrar(
  aulas: Aula[],
  status: string,
  ini: string,
  fim: string,
): Aula[] {
  return aulas.filter((a) => {
    if (status === "REAGENDADA") {
      if (!a.dataHoraAnterior) return false;
    } else if (status !== "all" && a.status !== status) {
      return false;
    }
    if (ini && a.data < ini) return false;
    if (fim && a.data > fim) return false;
    return true;
  });
}

function AulaCard({ aula, onClick }: { aula: Aula; onClick: () => void }) {
  const tag = CATEGORIA_TAG[aula.categoria ?? "GERAL"];
  const alterada = ["CANCELADA", "SUSPENSA", "EXCLUIDA", "ADIADA"].includes(
    aula.status,
  );
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="hover:border-lilas-medio hover:shadow-sm transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-cinza-forte">{aula.titulo}</p>
              <p className="text-sm text-cinza-texto capitalize">
                {formatarDataLonga(aula.data)}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-cinza-texto flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {aula.horaInicio} – {aula.horaFim}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {aula.professor.usuario.nomeCompleto}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge domain="aula" status={aula.status} />
              {aula.matriculado && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium bg-lilas-claro text-roxo-profundo border-lilas-medio/30">
                  Matriculado
                </span>
              )}
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full border font-medium",
                  tag.className,
                )}
              >
                {tag.label}
              </span>
            </div>
          </div>

          {aula.dataHoraAnterior && (
            <p className="mt-3 text-xs text-amber-700 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" /> Reagendada — toque para
              ver as datas
            </p>
          )}
          {alterada && aula.justificativa && (
            <p className="mt-2 text-xs text-cinza-texto flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-rosa-vibrante shrink-0" />{" "}
              {aula.justificativa}
            </p>
          )}
          {aula.observacoes && (
            <p className="mt-2 text-xs text-cinza-texto line-clamp-2">
              Obs.: {aula.observacoes}
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  );
}

export function AlunoAgendaPage() {
  const [escopo, setEscopo] = useState<EscopoAgenda>("minhas");
  const [status, setStatus] = useState("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [detalhe, setDetalhe] = useState<Aula | null>(null);

  const { data, isLoading } = useAlunoAgenda(escopo);
  const aulas = useMemo(
    () => filtrar(data?.data ?? [], status, dataInicio, dataFim),
    [data, status, dataInicio, dataFim],
  );

  const temFiltro = status !== "all" || !!dataInicio || !!dataFim;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Aulas"
        subtitle="Agenda, grade aberta e histórico."
        icon={CalendarDays}
      />

      {/* Escopo */}
      <div className="flex flex-wrap gap-2">
        {ESCOPOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setEscopo(e.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
              escopo === e.value
                ? "bg-roxo-profundo text-branco-puro border-roxo-profundo"
                : "bg-branco-puro text-cinza-texto border-bege-cartao hover:bg-lilas-claro/40",
            )}
          >
            <e.Icon className="w-4 h-4" /> {e.label}
          </button>
        ))}
      </div>

      {/* Filtros status + período */}
      <SectionCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-cinza-texto">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTROS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-cinza-texto">De</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-cinza-texto">Até</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          {temFiltro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("all");
                setDataInicio("");
                setDataFim("");
              }}
            >
              <X className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
          <span className="text-sm text-cinza-texto ml-auto">
            {aulas.length} aula{aulas.length !== 1 ? "s" : ""}
          </span>
        </div>
      </SectionCard>

      {/* Lista */}
      {isLoading ? (
        <LoadingState />
      ) : aulas.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState icon={CalendarDays} message={VAZIO[escopo]} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {aulas.map((aula) => (
            <AulaCard
              key={aula.id}
              aula={aula}
              onClick={() => setDetalhe(aula)}
            />
          ))}
        </div>
      )}

      <DetalheAulaModal aula={detalhe} onClose={() => setDetalhe(null)} />

      {/* Legenda categorias */}
      <div className="flex flex-wrap gap-4 text-xs text-cinza-texto">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lilas-medio inline-block" />{" "}
          Grade regular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rosa-vibrante inline-block" />{" "}
          Sob demanda (particular/reposição)
        </span>
      </div>
    </div>
  );
}
