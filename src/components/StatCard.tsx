import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string
  value: string | number
  delta?: { value: string; positive?: boolean }
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="card group p-5 transition-shadow duration-200 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-accent-100">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-ink-900">{value}</span>
        {delta && (
          <span
            className={`mb-1 text-xs font-semibold ${
              delta.positive ? 'text-accent-600' : 'text-rose-500'
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
