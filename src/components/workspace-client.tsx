'use client'

import dynamic from 'next/dynamic'
import { WorkspaceLoading } from './workspace/primitives'

const Workspace = dynamic(() => import('./workspace/commerce-workspace'), {
  ssr: false,
  loading: () => <WorkspaceLoading message="Preparing local workspace" />,
})
export function WorkspaceClient() {
  return <Workspace />
}
