import { Database, Info, LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Source } from '@/lib/commerce/types'

export function SourceMark({ source }: { source: Source }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          'size-1.5 rounded-full',
          source === 'Amazon' ? 'bg-white' : 'border border-neutral-400 bg-transparent',
        )}
      />
      {source}
    </span>
  )
}
export function Panel({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string
  description?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('min-w-0 border border-border bg-card', className)}>
      <div className="flex min-h-13 items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-medium tracking-[0.01em]">{title}</h2>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={`About ${title}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8} className="max-w-72 leading-relaxed">
                {description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {aside && <div className="text-[10px] text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  )
}
export function ViewHeading({
  title,
  description,
  aside,
}: {
  title: string
  description: string
  aside?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium tracking-[-0.035em]">{title}</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {aside}
    </div>
  )
}
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-6 text-center">
      <Database className="mb-1 size-5 text-neutral-600" />
      <p className="text-sm text-neutral-300">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )
}
export function WorkspaceLoading({ message }: { message: string }) {
  return (
    <div className="space-y-6 p-7" role="status">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" />
        {message}
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-sm" />
      <Skeleton className="h-40 rounded-sm" />
    </div>
  )
}
export function TechnicalBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 rounded-sm px-2 py-1 font-mono text-[10px] font-normal text-muted-foreground"
    >
      {children}
    </Badge>
  )
}
