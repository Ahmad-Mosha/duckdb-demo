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
  index,
  subtitle,
  description,
  aside,
  children,
  className,
}: {
  title: string
  index?: string
  subtitle?: string
  description?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('analysis-panel', className)}>
      <div className="panel-heading">
        <div className="panel-title-group">
          <div className="flex items-center gap-2">
            {index && (
              <span className="section-index" aria-hidden="true">
                {index}
              </span>
            )}
            <h2
              className={cn(
                'font-semibold tracking-[-0.02em]',
                index ? 'text-[19px]' : 'text-base',
              )}
            >
              {title}
            </h2>
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label={`About ${title}`}
                    className="rounded-sm p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2"
                  >
                    <Info className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-80 leading-relaxed">
                  {description}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {aside && <div className="text-[13px] text-muted-foreground">{aside}</div>}
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
    <div className="view-heading">
      <div>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em]">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {aside}
    </div>
  )
}
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-6 text-center">
      <Database className="mb-1 size-5 text-neutral-400" />
      <p className="text-sm text-neutral-300">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )
}
export function WorkspaceLoading({ message }: { message: string }) {
  return (
    <div className="space-y-6 p-7" role="status">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        {message}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-sm" />
    </div>
  )
}
export function TechnicalBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 rounded-sm px-2 py-1 font-mono text-[12px] font-normal text-muted-foreground"
    >
      {children}
    </Badge>
  )
}
