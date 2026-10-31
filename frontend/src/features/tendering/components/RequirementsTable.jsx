import React from 'react';
import { ShieldAlert, CircleDot } from 'lucide-react';
import { DataTable, DataTableColumnHeader } from '@/shared/ui/tenderrank/data-table';
import { Badge } from '@/shared/ui/tenderrank/badge';
import { cn } from '@/shared/ui/tenderrank/utils';

function buildColumns() {
  return [
    {
      id: 'index',
      header: () => <span>#</span>,
      cell: ({ row }) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {row.index + 1}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'display_label',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requirement" />,
      cell: ({ getValue }) => (
        <span className="text-foreground/90 font-medium leading-relaxed">{getValue()}</span>
      ),
      meta: { label: 'Requirement' },
    },
    {
      accessorKey: 'is_mandatory',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variant="destructive"><ShieldAlert size={10} /> Mandatory</Badge>
        ) : (
          <Badge variant="secondary"><CircleDot size={10} /> Optional</Badge>
        ),
      sortingFn: (a, b) => Number(a.original.is_mandatory) - Number(b.original.is_mandatory),
      meta: { label: 'Priority' },
    },
    {
      accessorKey: 'points',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Points" className="justify-end w-full" />,
      cell: ({ getValue }) => (
        <div className="text-right">
          <Badge>{getValue() ?? 0} pts</Badge>
        </div>
      ),
      meta: { label: 'Points' },
    },
  ];
}

const RequirementsTable = ({ requirements = [] }) => {
  const columns = React.useMemo(() => buildColumns(), []);
  const mandatoryCount = requirements.filter(r => r.is_mandatory).length;
  const totalPoints = requirements.reduce((sum, r) => sum + (r.points || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-muted/50 border border-border text-muted-foreground">
          <span className="text-foreground">{requirements.length}</span> total
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border',
          mandatoryCount > 0 ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-muted/50 border-border text-muted-foreground'
        )}>
          <span>{mandatoryCount}</span> mandatory
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/5 border border-primary/20 text-primary">
          <span>{totalPoints}</span> points possible
        </div>
      </div>

      <DataTable
        columns={columns}
        data={requirements}
        searchKey="display_label"
        searchPlaceholder="Search requirements..."
        pageSize={8}
        emptyMessage="No requirements extracted."
      />
    </div>
  );
};

export default RequirementsTable;
