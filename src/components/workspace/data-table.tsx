'use client'

import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type DataColumn<T> = {
  key: string & keyof T
  title: string
  numeric?: boolean
  cell?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  rows,
  columns,
  sortKey,
  maxHeight = 420,
}: {
  rows: T[]
  columns: DataColumn<T>[]
  sortKey?: string
  maxHeight?: number
}) {
  const [sorting, setSorting] = useState<SortingState>(sortKey ? [{ id: sortKey, desc: true }] : [])
  const definitions = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorKey: column.key,
        header: column.title,
        cell: ({ row }) =>
          column.cell ? column.cell(row.original) : String(row.original[column.key] ?? '—'),
      })),
    [columns],
  )
  // TanStack owns its mutable table instance; this component is not React-compiler memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: definitions,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  return (
    <div className="data-table-scroll overflow-auto" style={{ maxHeight }}>
      <Table className="text-xs">
        <TableHeader className="sticky top-0 z-10 bg-[#151515]">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              <TableHead className="w-10 pl-5 font-mono text-[10px] text-neutral-600">#</TableHead>
              {group.headers.map((header, i) => (
                <TableHead
                  key={header.id}
                  aria-sort={
                    header.column.getIsSorted() === 'desc'
                      ? 'descending'
                      : header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : 'none'
                  }
                  className={cn(
                    'h-10 px-3 text-[11px] font-normal text-muted-foreground last:pr-5',
                    columns[i].numeric && 'text-right',
                  )}
                >
                  <button
                    className={cn(
                      'inline-flex items-center gap-1.5 hover:text-white',
                      columns[i].numeric && 'justify-end',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'desc' ? (
                      <ArrowDown className="size-3 text-white" />
                    ) : header.column.getIsSorted() === 'asc' ? (
                      <ArrowUp className="size-3 text-white" />
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30" />
                    )}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-white/[0.055] hover:bg-white/[0.035]">
                <TableCell className="h-10 pl-5 font-mono text-[10px] text-neutral-600">
                  {String(row.index + 1).padStart(2, '0')}
                </TableCell>
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'h-10 px-3 text-neutral-300 last:pr-5',
                      columns[i].numeric && 'text-right font-mono text-[11px] tabular-nums',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="h-28 text-center text-muted-foreground"
              >
                No rows match this view.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
