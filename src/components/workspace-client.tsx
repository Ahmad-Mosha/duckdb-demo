'use client'

import dynamic from 'next/dynamic'

const Workspace = dynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-sm text-muted-foreground">Preparing local workspace…</div>
  ),
})

export function WorkspaceClient() {
  return <Workspace />
}
