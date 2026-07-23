/** Mesmo layout/dimensões do card de PENDING, para não causar layout shift ao carregar. */
export function PixSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" role="status" aria-label="Carregando cobrança PIX">
      <div className="flex justify-center">
        <div className="w-48 h-48 rounded-lg bg-bege-cartao" />
      </div>
      <div className="h-16 rounded-lg bg-bege-cartao" />
      <div className="h-3 w-28 mx-auto rounded bg-bege-cartao" />
    </div>
  )
}
