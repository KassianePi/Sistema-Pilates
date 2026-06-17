import { useMemo } from "react";
import { useAlunoAgenda } from "./useAlunoAgenda";
import {
  useMinhasMensalidades,
  useMeusComprovantes,
  useMeusEstornos,
} from "./useAlunoFinanceiro";
import { useAlunoFrequencia } from "./useAlunoFrequencia";
import { useAlunoPerfil } from "./useAlunoPerfil";
import { useNotificacoes } from "./useAlunoNotificacoes";
import {
  calcularAulasDisponiveis,
  type AulasDisponiveisResult,
} from "../utils/aulasDisponiveis";
import type { Aula } from "@/types/domain.types";

/** Agrega os dados das demais queries e calcula os KPIs do dashboard do aluno. */
export function useAlunoDashboard() {
  const agenda = useAlunoAgenda("minhas");
  const mensalidades = useMinhasMensalidades(50);
  const comprovantes = useMeusComprovantes();
  const estornos = useMeusEstornos();
  const frequencia = useAlunoFrequencia();
  const perfil = useAlunoPerfil();
  const notificacoes = useNotificacoes();

  const dados = useMemo(() => {
    // O escopo 'minhas' já vem do backend apenas com aulas futuras, ordenadas por data.
    const aulas = agenda.data?.data ?? [];
    const agendadas = aulas.filter((a) => a.status === "AGENDADA");
    // Matriculadas: aulas em que o aluno está inscrito. Grade geral: GERAL não-matriculadas.
    const minhasAulas = agendadas.filter((a) => a.matriculado);
    const gradeGeral = agendadas.filter(
      (a) => !a.matriculado && (a.categoria ?? "GERAL") === "GERAL",
    );
    // Próxima aula prioriza a matriculada; se não houver, a próxima da grade.
    const proximaAula: Aula | null = minhasAulas[0] ?? agendadas[0] ?? null;

    const presencas = frequencia.data ?? [];
    const aulasDisponiveis: AulasDisponiveisResult = calcularAulasDisponiveis({
      aulasPlano: perfil.data?.aulasPlano,
      presencas,
    });

    const mens = mensalidades.data?.data ?? [];
    const emAberto = mens
      .filter((m) => m.status === "PENDENTE" || m.status === "VENCIDO")
      .sort(
        (a, b) =>
          new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime(),
      );
    const mensalidadeAtual = emAberto[0] ?? mens[0] ?? null;
    const proximaCobranca = emAberto[0] ?? null;
    const totalEmAberto = emAberto.reduce((acc, m) => acc + Number(m.valor), 0);
    const qtdEmAberto = emAberto.length;
    const temVencido = emAberto.some((m) => m.status === "VENCIDO");

    const comps = comprovantes.data ?? [];
    const ests = estornos.data?.estornos ?? [];
    const solicitacoesPendentes =
      comps.filter((c) => c.status === "PENDENTE").length +
      ests.filter((e) => e.status === "SOLICITADO").length;

    const ultimasNotificacoes = (notificacoes.data?.data ?? [])
      .filter((n) => !n.arquivada)
      .slice(0, 5);

    return {
      proximaAula,
      minhasAulas,
      gradeGeral,
      aulasRealizadasMes: aulasDisponiveis.realizadas,
      aulasDisponiveis,
      mensalidadeAtual,
      proximaCobranca,
      totalEmAberto,
      qtdEmAberto,
      temVencido,
      solicitacoesPendentes,
      ultimasNotificacoes,
    };
  }, [
    agenda.data,
    mensalidades.data,
    comprovantes.data,
    estornos.data,
    frequencia.data,
    perfil.data,
    notificacoes.data,
  ]);

  const isLoading =
    agenda.isLoading ||
    mensalidades.isLoading ||
    frequencia.isLoading ||
    perfil.isLoading;

  return { ...dados, perfil: perfil.data, isLoading };
}
