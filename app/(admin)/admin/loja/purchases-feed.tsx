import type { StorePurchase, StoreItem, User } from '@prisma/client'

type PurchaseRow = StorePurchase & {
  storeItem: Pick<StoreItem, 'label'>
  user: Pick<User, 'email' | 'name' | 'handle'>
}

const STATUS_LABEL: Record<string, string> = {
  AWAITING_USE: 'Aguardando uso',
  ACTIVE: 'Ativo',
  USED: 'Usado',
  EXPIRED: 'Expirado',
  REFUNDED: 'Reembolsado',
}

export function PurchasesFeed({ purchases }: { purchases: PurchaseRow[] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-white">Compras e usos (últimos 7 dias)</h2>
      </div>
      {purchases.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-neutral-600">Nenhuma compra nos últimos 7 dias.</p>
      ) : (
        <div className="divide-y divide-neutral-800 max-h-96 overflow-y-auto">
          {purchases.map((p) => (
            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
              <div>
                <p className="text-neutral-300">
                  <span className="font-medium">{p.user.name || p.user.handle || p.user.email}</span>
                  {' — '}
                  {p.storeItem.label}
                  {p.isGift && <span className="ml-1.5 text-amber-400">(presente)</span>}
                </p>
                <p className="text-neutral-600">
                  Comprado {new Date(p.purchasedAt).toLocaleString('pt-BR')}
                  {p.usedAt && ` · Usado ${new Date(p.usedAt).toLocaleString('pt-BR')}`}
                </p>
              </div>
              <span className="text-neutral-500">{STATUS_LABEL[p.status] ?? p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
