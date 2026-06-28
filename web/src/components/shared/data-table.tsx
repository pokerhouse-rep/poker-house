'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Column<T> = {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  total?: number
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            {columns.map((col, i) => (
              <TableHead key={i} className={`text-zinc-500 ${col.className || ''}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="border-zinc-800">
              <TableCell colSpan={columns.length} className="py-8 text-center text-zinc-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={`border-zinc-800 ${onRowClick ? 'cursor-pointer hover:bg-zinc-800/50' : 'hover:bg-transparent'}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, i) => (
                  <TableCell key={i} className={`text-zinc-300 ${col.className || ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-500">
            {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
