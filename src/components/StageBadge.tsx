import type { PipelineStage } from '../types'
import { stageStyles } from '../lib/pipeline'

export function StageBadge({ stage }: { stage: PipelineStage }) {
  const s = stageStyles[stage]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 90
      ? 'bg-accent-50 text-accent-700 ring-accent-200'
      : score >= 80
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : score >= 70
          ? 'bg-amber-50 text-amber-700 ring-amber-200'
          : 'bg-ink-100 text-ink-600 ring-ink-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {score}
      <span className="text-[10px] font-medium opacity-70">fit</span>
    </span>
  )
}
