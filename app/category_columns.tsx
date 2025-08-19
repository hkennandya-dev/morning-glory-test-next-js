"use client"

import { CellContext, ColumnDef, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionType } from "@/components/data-table";
import { ReferencesType } from "@/components/auto-table";
import ColumnDropdown, { FormInputType } from "@/components/ui/column-dropdown";
import { z } from "zod"
import BulkActions from "@/components/bulk-actions";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { id } from "date-fns/locale"

export type TableType = {
  id: string
  code: string
  name: string
  description?: string

  created_at: Date
  updated_at?: Date
  deleted_at?: Date

  datetime: Date
  last_action: string
}

const formSchema = z.object({
  code: z.string({
    required_error: "Kode wajib diisi", invalid_type_error: "Kode harus bernilai string",
  }).nonempty("Kode wajib diisi"),
  name: z.string({
    required_error: "Nama wajib diisi", invalid_type_error: "Nama harus bernilai string",
  }).nonempty("Nama wajib diisi"),
  description: z.string().optional()
})

const formInput: FormInputType[] = [
  {
    type: "text",
    key: "code",
    label: "Kode",
    placeholder: "Kode",
    required: true,
  },
  {
    type: "text",
    key: "name",
    label: "Nama",
    placeholder: "Nama",
    required: true,
  },
  {
    type: "textarea",
    key: "description",
    label: "Keterangan",
    placeholder: "Keterangan"
  }
]

export const references: ReferencesType = {
  title: "Master Kategori Barang",
  description: "Mengelola kategori untuk pengelompokan barang.",
  path: "/",
  url: {
    base: "/api/category-item"
  },
  searchKey: "category_item.code,category_item.name,category_item.description",
  primaryKey: "name",
  formSchema: formSchema
}

export const options: OptionType<TableType> = {
  queryKey: "category_item",
  fullWidth: false,
  BulkActions: BulkActionsDropdown,
  formInput: formInput,
  disabled: {
    lastAction: true
  },
  paginate: [
    {
      label: "10",
      value: 10,
      default: true
    },
    {
      label: "25",
      value: 25
    },
    {
      label: "50",
      value: 50
    },
    {
      label: "100",
      value: 100
    },
    {
      label: "250",
      value: 250
    },
    {
      label: "500",
      value: 500
    }
  ],
  orderBy: [
    {
      label: "Kolom"
    },
    {
      label: "Kode",
      tooltip: "A - Z",
      value: "order_by=category_item.code&order_type=asc"
    },
    {
      label: "Kode",
      tooltip: "Z - A",
      value: "order_by=category_item.code&order_type=desc"
    },
    {
      label: "Nama",
      tooltip: "A - Z",
      value: "order_by=category_item.name&order_type=asc",
    },
    {
      label: "Nama",
      tooltip: "Z - A",
      value: "order_by=category_item.name&order_type=desc"
    },
    {
      label: "Keterangan",
      tooltip: "A - Z",
      value: "order_by=category_item.description&order_type=asc"
    },
    {
      label: "Keterangan",
      tooltip: "Z - A",
      value: "order_by=category_item.description&order_type=desc"
    },
    {
      label: "Tanggal",
      tooltip: "Terlama",
      value: "order_by=coalesce(category_item.updated_at,category_item.created_at)&order_type=asc"
    },
    {
      label: "Tanggal",
      tooltip: "Terbaru",
      value: "order_by=coalesce(category_item.updated_at,category_item.created_at)&order_type=desc",
      default: true
    }
  ]
};

export const columns: ColumnDef<TableType>[] = [
  {
    id: "id",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div className="pr-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select items"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "Kode%category_item.code",
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kode" />
    ),
  },
  {
    id: "Nama%category_item.name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
  },
  {
    id: "Keterangan%category_item.description",
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Keterangan" />
    ),
  },
  {
    id: "Tanggal%coalesce(category_item.updated_at,category_item.created_at)",
    accessorKey: "datetime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" badge={{ asc: 'Terlama', desc: 'Terbaru' }} />
    ),
    cell({ row }) {
      const data = row.original as TableType;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const rawDate = new Date(data.datetime);
      const date = toZonedTime(rawDate, timeZone);

      return <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-nowrap">
              {format(date, "EEEE, dd MMMM yyyy", { locale: id })}
            </TooltipTrigger>
            <TooltipContent className="flex gap-1.5">
              {format(date, "HH:mm:ss", { locale: id })} ({timeZone})
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>;
    }
  },
  {
    id: "action",
    enableHiding: false,
    cell: ActionCell
  },
]

function ActionCell({ row, table }: CellContext<TableType, unknown>) {
  return (
    <ColumnDropdown
      fullWidth={options.fullWidth}
      options={options}
      references={references}
      table={table}
      description={references.description}
      row={row}
      formSchema={formSchema}
      formInput={formInput} />
  );
}

function BulkActionsDropdown(table: Table<TableType>, loading: boolean, refresh?: () => void) {
  return <BulkActions options={options} references={references} table={table} loading={loading} refresh={refresh} />
}