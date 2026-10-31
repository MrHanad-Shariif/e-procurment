import React from 'react';
import { Link } from 'react-router-dom';
import { Award, FileDown, Eye, ShieldX } from 'lucide-react';
import { DataTable, DataTableColumnHeader } from '@/shared/ui/tenderrank/data-table';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { cn } from '@/shared/ui/tenderrank/utils';
import { downloadDocument } from '@/features/tendering/services/api';

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background font-bold text-xs shadow-sm">1</span>;
  if (rank === 2) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>;
  if (rank === 3) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs">3</span>;
  return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs border border-border">{rank}</span>;
};

const scoreTone = (s) => {
  if (s >= 70) return 'text-primary bg-primary/10';
  if (s >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-destructive bg-destructive/10';
};

function buildColumns(API_URL) {
  return [
    {
      accessorKey: 'rank',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rank" />,
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-7">
          <RankBadge rank={row.original.rank} />
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'supplier_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {row.original.rank === 1 && <Award className="h-4 w-4 text-amber-500 shrink-0" />}
          {row.original.supplier_name}
        </div>
      ),
    },
    {
      accessorKey: 'submitted_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
      cell: ({ getValue }) => <span className="text-muted-foreground">{new Date(getValue()).toLocaleDateString()}</span>,
      meta: { label: 'Submitted' },
    },
    {
      accessorKey: 'score',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => {
        const score = row.original.score ?? 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className={cn('font-bold text-sm px-2.5 py-1 rounded-lg', scoreTone(score))}>
              {score.toFixed(0)}%
            </span>
            {row.original.disqualified && (
              <Badge variant="destructive" title={row.original.disq_reasons?.join('; ')}>
                <ShieldX size={10} /> DISQ
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/proposal/${row.original.proposal_id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-primary"
          >
            <Eye size={13} /> View Audit
          </Link>
          {row.original.pdf_path && (
            <a
              href={`${API_URL}/${row.original.pdf_path}`}
              onClick={event => { event.preventDefault(); void downloadDocument(row.original.pdf_path); }}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary no-underline transition-colors hover:bg-primary/20"
            >
              <FileDown size={13} /> PDF
            </a>
          )}
        </div>
      ),
    },
  ];
}

const RankingTable = ({ rankings = [] }) => {
  const API_URL = '/api/v1/tendering/documents';
  const columns = React.useMemo(() => buildColumns(API_URL), [API_URL]);

  return (
    <DataTable
      columns={columns}
      data={rankings}
      searchKey="supplier_name"
      searchPlaceholder="Filter by supplier..."
      pageSize={10}
      emptyMessage="No supplier submissions found for this tender."
    />
  );
};

export default RankingTable;
