"use client"

import { CellContext, ColumnDef, Table } from "@tanstack/react-table";
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
import { fetch } from "@/lib/axios";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { id } from "date-fns/locale"

export type TableType = {
  id: string
  item_id: string
  item: {
    id: string
    code: string
    name: string
    created_date?: Date | null
    category_item_id: string,
    unit: string
    is_stock: boolean,
    created_at: Date
    updated_at?: Date
  }
  category_item_id: string,
  category_item: {
    id: string
    code: string
    name: string
    description?: string
  }
  stock?: string

  created_at?: Date
  updated_at?: Date
  deleted_at?: Date

  datetime?: Date
  last_action?: string
}

const formSchema = z.object({
  item_id: z.string().nonempty("Barang wajib diisi").transform((val) => (val === "" ? null : val)),
  stock: z.union([z.string(), z.number()])
})

const formInput: FormInputType[] = [
  {
    type: "select",
    api: {
      base: "/api/item?notin_key=item.id&notin_value=SELECT item_id FROM stock_item where deleted_at is null",
      label: "name",
      key: "id",
      searchKey: "item.code,item.name,item.unit",
    },
    disabled: true,
    key: "item_id",
    label: "Barang",
    placeholder: "Barang",
    onUpdateValue: async (value, setFormValue) => {
      if (value) {
        const api = fetch();
        try {
          const res = await api.get(`/api/item/${value}`);
          if (res.data?.data) {
            const item = res.data?.data;
            if (item) {
              setFormValue("category_item_id", item.category_item_id);
            }
          } else {
            throw new Error(res.data?.message || "Gagal mendapatkan Kategori Barang");
          }
        } catch (error) {
          let message = "Gagal mendapatkan Kategori Barang";

          if (isAxiosError(error)) {
            const res = error.response?.data;
            if (res?.message) message = res.message;
          }

          toast.error(message);
        }
      } else {
        setFormValue("category_item_id", "");
      }
    },
  },
  {
    type: "select",
    api: {
      base: "/api/category-item",
      label: "name",
      key: "id",
      searchKey: "category_item.code,category_item.name",
    },
    disabled: true,
    key: "category_item_id",
    label: "Kategori Barang",
    placeholder: "Kategori Barang"
  },
  {
    type: "number",
    key: "stock",
    label: "Stok",
    placeholder: "Stok",
    required: true
  },
]

export const references: ReferencesType = {
  title: "Stok Barang",
  description: "Mengatur dan memantau jumlah persediaan barang.",
  path: "/",
  url: {
    base: "/api/stock-item"
  },
  searchKey: "item.code,item.name,category_item.code,category_item.name,item.unit,stock_item.stock",
  primaryKey: "item_name",
  formSchema: formSchema,
}

export const options: OptionType<TableType> = {
  disabled: {
    bulk: true,
    create: true,
    duplicate: true,
    delete: true,
    lastAction: true
  },
  customMapping: (data) => ({ ...data, item_name: data.item.name, stock: data.stock || "0.00" }),
  queryKey: "stock_item",
  fullWidth: false,
  BulkActions: BulkActionsDropdown,
  formInput: formInput,
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
      label: "Barang",
      tooltip: "A - Z",
      value: "order_by=item.name&order_type=asc",
    },
    {
      label: "Barang",
      tooltip: "Z - A",
      value: "order_by=item.name&order_type=desc"
    },
    {
      label: "Kategori Barang",
      tooltip: "A - Z",
      value: "order_by=category_item.name&order_type=asc",
    },
    {
      label: "Kategori Barang",
      tooltip: "Z - A",
      value: "order_by=category_item.name&order_type=desc"
    },
    {
      label: "Stok",
      tooltip: "0 - 9",
      value: "order_by=stock_item.stock&order_type=asc"
    },
    {
      label: "Stok",
      tooltip: "9 - 0",
      value: "order_by=stock_item.stock&order_type=desc"
    },
    {
      label: "Tanggal",
      tooltip: "Terlama",
      value: "order_by=coalesce(stock_item.updated_at,stock_item.created_at,item.updated_at,item.created_at)&order_type=asc"
    },
    {
      label: "Tanggal",
      tooltip: "Terbaru",
      value: "order_by=coalesce(stock_item.updated_at,stock_item.created_at,item.updated_at,item.created_at)&order_type=desc",
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
    id: "Barang%item.name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Barang" />
    ),
    cell({ row }) {
      const data = row.original as TableType;

      return <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-nowrap">
              {data.item.name}
            </TooltipTrigger>
            <TooltipContent className="flex gap-1.5">
              {data.item.code}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>;
    }
  },
  {
    id: "Kategori Barang%category_item.name",
    accessorKey: "category_item",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kategori Barang" />
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
    id: "Stok%stock_item.stock",
    accessorKey: "stock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stok" />
    ),
    cell: ({ row }) => {
      const stock = row.original?.stock || "0.00"
      return stock;
    }
  },
  {
    id: "Tanggal%coalesce(stock_item.updated_at,stock_item.created_at,item.updated_at,item.created_at)",
    accessorKey: "datetime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" badge={{ asc: 'Terlama', desc: 'Terbaru' }} />
    ),
    cell({ row }) {
      const data = row.original as TableType;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const rawDate = new Date(data.datetime || data.item?.updated_at || data.item.created_at);
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