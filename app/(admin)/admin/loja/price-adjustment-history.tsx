import type { StorePriceAdjustment, StoreItem } from '@prisma/client'

type AdjustmentRow = StorePriceAdjustment & { storeItem: Pick<StoreItem, 'label'> }

export function PriceAdjustmentHistory({ adjustments }: { adjustments: AdjustmentRow[] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-white">Histórico de reajuste de preço (mercado dinâmico)</h2>
      </div>
      {adjustments.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-neutral-600">
          Nenhum reajuste automático ainda — acontece quando muita gente cruza o preço do item mais caro.
        </p>
      ) : (
        <div className="divide-y divide-neutral-800">
          {adjustments.map((a) => (
            <div key={a.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-neutral-300">{a.storeItem.label}</span>
              <span className="text-neutral-500 tabular-nums">
                {a.oldPrice.toLocaleString('pt-BR')} → {a.newPrice.toLocaleString('pt-BR')}
              </span>
              <span className="text-neutral-600">{a.triggeredByCount} pessoas cruzaram o valor</span>
              <span className="text-neutral-600">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
