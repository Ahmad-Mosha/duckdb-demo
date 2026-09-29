'use client'

import { useEffect, useRef, useState } from 'react'
import {
  importReport,
  initializeSession,
  readWorkspace,
  restoreDemo,
  type WorkspaceData,
} from '@/lib/commerce/session'
import type { Scope, Source } from '@/lib/commerce/types'

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function useCommerceWorkspace() {
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [scope, setScope] = useState<Scope>('All')
  const [busy, setBusy] = useState('Starting DuckDB')
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const operation = useRef(false)

  useEffect(() => {
    let active = true
    initializeSession()
      .then(() => readWorkspace(scope))
      .then((next) => {
        if (active) {
          setData(next)
          setBusy('')
        }
      })
      .catch((error) => {
        if (active) {
          setError(message(error))
          setBusy('')
        }
      })
    return () => {
      active = false
    }
  }, [scope, revision])

  async function perform(label: string, action: () => Promise<void>, nextScope: Scope) {
    if (operation.current) return
    operation.current = true
    setBusy(label)
    setError('')
    try {
      await action()
      setScope(nextScope)
      setRevision((value) => value + 1)
    } catch (error) {
      setError(message(error))
      setBusy('')
    } finally {
      operation.current = false
    }
  }
  return {
    data,
    scope,
    busy,
    error,
    revision,
    setScope: (next: Scope) => {
      if (!busy && next !== scope) {
        setBusy('Querying marketplace')
        setScope(next)
      }
    },
    dismissError: () => setError(''),
    loadDemo: () => perform('Loading demo reports', restoreDemo, 'All'),
    importFile: (source: Source, file: File) =>
      perform(
        `Importing ${source}`,
        async () => {
          await importReport(source, new Uint8Array(await file.arrayBuffer()))
        },
        data?.mode === 'Demo' ? source : scope,
      ),
  }
}
