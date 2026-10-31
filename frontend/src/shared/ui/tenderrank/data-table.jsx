import React, { useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useLegacyTable as useReactTable,
} from '@tanstack/react-table/legacy';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, SlidersHorizontal, Search } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/tenderrank/table';
import { Button } from '@/shared/ui/tenderrank/button';
import { Input } from '@/shared/ui/tenderrank/input';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from '@/shared/ui/tenderrank/dropdown-menu';
import { cn } from '@/shared/ui/tenderrank/utils';

/** Sortable column header — drop this in a column's `header` render fn. */
export function DataTableColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn('inline-flex items-center gap-1.5 hover:text-foreground transition-colors', className)}
    >
      {title}
      {sorted === 'asc' ? <ArrowUp size={12} /> : sorted === 'desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
    </button>
  );
}

/**
 * Generic sortable / filterable / paginated data table, built on TanStack Table
 * and this project's own <Table> primitives (shadcn data-table pattern).
 */
export function DataTable({
  columns, data, searchKey, searchPlaceholder = 'Filter...', pageSize = 8, emptyMessage = 'No results.',
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters, columnVisibility },
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="space-y-3">
      {(searchKey || true) && (
        <div className="flex items-center justify-between gap-3">
          {searchKey && (
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={table.getColumn(searchKey)?.getFilterValue() ?? ''}
                onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <SlidersHorizontal size={13} /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table.getAllColumns().filter(c => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  className="capitalize"
                >
                  {column.columnDef.meta?.label || column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {table.getFilteredRowModel().rows.length} row{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft size={13} /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
