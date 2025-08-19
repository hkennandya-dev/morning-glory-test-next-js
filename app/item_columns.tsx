"use client"

import { CellContext, ColumnDef, Table } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DataTableColumnHeader } from "@/components/ui/column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { OptionType } from "@/components/data-table";
import { ReferencesType } from "@/components/auto-table";
import ColumnDropdown, { FormInputType } from "@/components/ui/column-dropdown";
import { z } from "zod"
import BulkActions from "@/components/bulk-actions";
import { Badge } from "@/components/ui/badge";
import { id } from "date-fns/locale"

export type TableType = {
  id: string
  code: string
  name: string
  created_date?: Date | null
  category_item_id: string
  category_item: {
    id: string
    code: string
    name: string
    description?: string
  }
  unit: string
  is_stock: boolean

  created_at: Date
  updated_at?: Date
  deleted_at?: Date

  datetime: Date
  last_action: string
}

const formSchema = z.object({
  code: z.string({ required_error: "Kode wajib diisi", invalid_type_error: "Kode harus bernilai string" }).nonempty("Kode wajib diisi"),
  name: z.string({ required_error: "Nama wajib diisi", invalid_type_error: "Nama harus bernilai string" }).nonempty("Nama wajib diisi"),
  created_date: z.union([z.date(), z.string(), z.undefined(), z.null()]).transform((val) => {
    if (!val || val === "") return null;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  category_item_id: z.string().nonempty("Kategori Barang wajib diisi").transform((val) => (val === "" ? null : val)),
  unit: z.string({ required_error: "Satuan wajib diisi", invalid_type_error: "Satuan harus bernilai string" }).nonempty("Satuan wajib diisi"),
  is_stock: z.string({
    required_error: "Attendance is required", invalid_type_error: "Attendance is required",
  }).nonempty("Attendance is required").transform((val) => (val === "true" ? true : false)),
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
    type: "date",
    key: "created_date",
    label: "Tanggal Pembuatan",
    clearable: true,
    placeholder: "Tanggal Pembuatan",
    updateValue: (value) => (value === "" || value === undefined || !value) ? null : value
  },
  {
    type: "select",
    required: true,
    api: {
      base: "/api/category-item",
      label: "name",
      key: "id",
      searchKey: "category_item.code,category_item.name",
    },
    search: true,
    clearable: false,
    key: "category_item_id",
    label: "Kategori",
    placeholder: "Kategori"
  },
  {
    type: "text",
    key: "unit",
    label: "Satuan",
    placeholder: "Satuan",
    required: true,
  },
  {
    type: "select",
    key: "is_stock",
    label: "Ada Stock",
    placeholder: "Ada Stock",
    required: true,
    updateValue: (value) => (value === true) ? "true" : (value === false) ? "false" : "true",
    options: [{
      value: "true",
      label: "Ya"
    }, {
      value: "false",
      label: "Tidak"
    }]
  },
]

export const references: ReferencesType = {
  title: "Master Barang",
  description: "Mengelola data detail setiap barang.",
  path: "/",
  url: {
    base: "/api/item"
  },
  searchKey: "item.code,item.name,category_item.code,category_item.name,item.unit",
  primaryKey: "name",
  formSchema: formSchema
}

export const options: OptionType<TableType> = {
  queryKey: "item",
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
      value: "order_by=item.code&order_type=asc"
    },
    {
      label: "Kode",
      tooltip: "Z - A",
      value: "order_by=item.code&order_type=desc"
    },
    {
      label: "Nama",
      tooltip: "A - Z",
      value: "order_by=item.name&order_type=asc",
    },
    {
      label: "Nama",
      tooltip: "Z - A",
      value: "order_by=item.name&order_type=desc"
    },
    {
      label: "Tanggal Pembuatan",
      tooltip: "Terlama",
      value: "order_by=item.created_date&order_type=asc",
    },
    {
      label: "Tanggal Pembuatan",
      tooltip: "Terbaru",
      value: "order_by=item.created_date&order_type=desc"
    },
    {
      label: "Kategori",
      tooltip: "A - Z",
      value: "order_by=category_item.name&order_type=asc",
    },
    {
      label: "Kategori",
      tooltip: "Z - A",
      value: "order_by=category_item.name&order_type=desc"
    },
    {
      label: "Satuan",
      tooltip: "A - Z",
      value: "order_by=item.unit&order_type=asc"
    },
    {
      label: "Satuan",
      tooltip: "Z - A",
      value: "order_by=item.unit&order_type=desc"
    },
    {
      label: "Ada Stock",
      tooltip: "A - Z",
      value: "order_by=item.is_stock&order_type=asc"
    },
    {
      label: "Ada Stock",
      tooltip: "Z - A",
      value: "order_by=item.is_stock&order_type=desc"
    },
    {
      label: "Tanggal",
      tooltip: "Terlama",
      value: "order_by=coalesce(item.updated_at,item.created_at)&order_type=asc"
    },
    {
      label: "Tanggal",
      tooltip: "Terbaru",
      value: "order_by=coalesce(item.updated_at,item.created_at)&order_type=desc",
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
    id: "Kode%item.code",
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kode" />
    ),
  },
  {
    id: "Nama%item.name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
  },
  {
    id: "Tanggal Pembuatan%item.created_date",
    accessorKey: "created_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal Pembuatan" badge={{ asc: "Terlama", desc: "Terbaru" }} />
    ),
    cell({ row }) {
      const data = row.original as TableType;
      if (data.created_date) {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const rawDate = new Date(data.created_date);
        const date = toZonedTime(rawDate, timeZone);

        return format(date, "EEEE, dd MMMM yyyy", { locale: id });
      } else {
        return data.created_date;
      }
    }
  },
  {
    id: "Kategori%category_item.name",
    accessorKey: "category_item",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kategori" />
    ),
    cell({ row }) {
      const data = row.original as TableType;

      return <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-nowrap">
              {data.category_item.name}
            </TooltipTrigger>
            <TooltipContent className="flex gap-1.5">
              {data.category_item.code}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>;
    }
  },
  {
    id: "Satuan%item.unit",
    accessorKey: "unit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Satuan" />
    ),
  },
  {
    id: "Ada Stock%item.is_stock",
    accessorKey: "is_stock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ada Stock" flip={true} />
    ),
    cell({ row }) {
      const data = row.original as TableType;
      const value = <Badge variant="outline"> {
        data.is_stock ?
          <><Check className="text-green-700 dark:text-green-400" /> Ya</> :
          <><X className="text-destructive" /> Tidak</>}
      </Badge>;
      return value;
    }

  },
  {
    id: "Tanggal%coalesce(item.updated_at,item.created_at)",
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