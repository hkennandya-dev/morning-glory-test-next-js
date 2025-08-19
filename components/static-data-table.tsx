"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  Table as TableType
} from "@tanstack/react-table";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, SearchIcon, ArrowDownUp, SquareCheckBig, ChevronDownIcon } from "lucide-react";
import { MultiSelect } from "./multi-select";
import { CustomSelect } from "./custom-select";
import { DropdownMenu, DropdownMenuContentWithoutPortal, DropdownMenuItem, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import SimpleBar from "simplebar-react";

export type FilterOption<TData> = {
  label: string;
  key?: keyof TData;
  value?: string;
  default?: boolean;
};

type OrderByOption = {
  label: string;
  tooltip?: string;
  value?: string;
  default?: boolean;
};
type StaticTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
  filters?: FilterOption<TData>[];
  orderBy?: OrderByOption[];
  AdditionalToolbar?: (table: TableType<TData>) => React.ReactNode;
  hideBulk?: boolean;
};

function flattenValues(obj: unknown): string[] {
  let values: string[] = [];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      values = values.concat(flattenValues(item));
    }
  } else if (obj !== null && typeof obj === "object") {
    for (const key in obj as Record<string, unknown>) {
      values = values.concat(flattenValues((obj as Record<string, unknown>)[key]));
    }
  } else {
    values.push(String(obj ?? ""));
  }

  return values;
}



export function StaticDataTable<
  TData extends Record<string, unknown>,
  TValue
>({
  columns,
  data,
  setData,
  filters = [],
  orderBy = [],
  AdditionalToolbar,
  hideBulk = false,
}: StaticTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [search, setSearch] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [orderByValue, setOrderByValue] = React.useState<string>(() => {
    const def = orderBy.find(dt => dt.default === true);
    return def?.value || "";
  });

  const [filterValues, setFilterValues] = React.useState<string[]>(() => {
    return filters
      .filter(f => f.default && f.key && "value" in f)
      .map(f => f.value ?? "")
      .filter((v): v is string => v !== undefined);
  });

  const table = useReactTable({
    data: React.useMemo(() => {
      let filtered = [...data];

      if (search) {
        filtered = filtered.filter(row =>
          flattenValues(row).some(val =>
            val.toLowerCase().includes(search.toLowerCase())
          )
        );
      }

      if (filterValues.length > 0) {
        filtered = filtered.filter(row => {
          return filters.some(f => {
            if (!f.key || !("value" in f)) return false;
            if (typeof f.value !== "string" || !filterValues.includes(f.value)) return false;

            let filterValue: string | boolean | undefined | null = f.value;
            if (f.value === "true") filterValue = true;
            else if (f.value === "false") filterValue = false;
            else if (f.value === "null") filterValue = null;

            const rowValue = row[f.key];

            if (filterValue === null) {
              return rowValue === null || rowValue === undefined;
            }
            if (typeof filterValue === "boolean") {
              return rowValue === filterValue;
            }
            return String(rowValue ?? "").toLowerCase() === String(filterValue).toLowerCase();
          });
        });
      }


      return filtered;
    }, [data, search, filterValues, filters]),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility
    }
  });

  React.useEffect(() => {
    if (orderByValue) {
      const [columnId, dir] = orderByValue.split("=");
      table.setSorting([{ id: columnId, desc: dir === "desc" }]);
    }
  }, [orderByValue, table]);

  const handleOrderByChange = (value: string) => {
    setOrderByValue(value);
    table.resetSorting();

    if (!value) return;
    const [columnId, dir] = value.split("=");
    table.setSorting([{ id: columnId, desc: dir === "desc" }]);
  };

  const handleDeleteRows = () => {
    const selectedOriginals = table
      .getSelectedRowModel()
      .rows.map(r => r.original);

    setData(prev => prev.filter(row => !selectedOriginals.includes(row)));
    setRowSelection({});
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {isMobile ?
        <div className="flex flex-col items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="relative w-full">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full focus-visible:ring-0 focus-visible:outline-0"
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {orderBy.length > 0 && (
              <CustomSelect
                valueQuery="only screen and (min-width: 1024px)"
                icon={<ArrowDownUp className="absolute left-3" />}
                value={orderByValue}
                options={orderBy}
                placeholder="Order by"
                onChange={handleOrderByChange}
                onReset={() => {
                  setOrderByValue("");
                  table.resetSorting();
                }}
              />
            )}
          </div>

          <div className="flex justify-between items-center gap-2 h-full w-full">
            {AdditionalToolbar?.(table)}
            <div className="flex items-center gap-2 h-full">
              {!hideBulk &&
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                      variant="outline"
                      className="!bg-inherit hover:!bg-input/50 font-normal"
                    >
                      <SquareCheckBig className="text-muted-foreground" />
                      <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContentWithoutPortal side="bottom" align="end" className="text-left origin-bottom w-auto pointer-events-auto data-[side=bottom]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-right-0 slide-in-from-bottom-2 slide-in-from-right-0 p-1">
                    <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs flex gap-8 justify-between">
                      <div>Bulk Actions</div>
                      <div className="font-normal">
                        {table.getFilteredSelectedRowModel().rows.length} Items
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onSelect={handleDeleteRows}
                    >
                      Delete
                      <DropdownMenuShortcut>
                        <Trash className="text-destructive" />
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContentWithoutPortal>
                </DropdownMenu>
              }
              {filters.length > 0 && (
                <MultiSelect
                  valueQuery="only screen and (min-width: 1024px)"
                  modalPopover
                  autoClose
                  className="max-w-[200px]"
                  placeholder="Filter"
                  options={filters}
                  onValueChange={(values) => setFilterValues(values)}
                  defaultValue={filterValues}
                />
              )}
            </div>
          </div>
        </div>
        :
        <SimpleBar className="z-50 pb-1.5 sm:pb-2 pr-px">
          <div className="flex flex-row justify-between gap-2 h-full">
            <div className="flex flex-row gap-2">
              <div className="relative w-full sm:min-w-[230px]">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-full focus-visible:ring-0 focus-visible:outline-0"
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {orderBy.length > 0 && (
                <CustomSelect
                  valueQuery="only screen and (min-width: 1024px)"
                  icon={<ArrowDownUp className="absolute left-3" />}
                  value={orderByValue}
                  options={orderBy}
                  placeholder="Order by"
                  onChange={handleOrderByChange}
                  onReset={() => {
                    setOrderByValue("");
                    table.resetSorting();
                  }}
                />
              )}

              {filters.length > 0 && (
                <MultiSelect
                  valueQuery="only screen and (min-width: 1024px)"
                  modalPopover
                  autoClose
                  className="max-w-[200px]"
                  placeholder="Filter"
                  options={filters}
                  onValueChange={(values) => setFilterValues(values)}
                  defaultValue={filterValues}
                />
              )}
            </div>

            <div className="flex gap-2 h-auto">
              {AdditionalToolbar?.(table)}
              {!hideBulk &&
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                      variant="outline"
                      className="!bg-inherit hover:!bg-input/50 font-normal"
                    >
                      <SquareCheckBig className="text-muted-foreground" />
                      <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContentWithoutPortal side="bottom" align="end" className="text-left origin-bottom w-auto pointer-events-auto data-[side=bottom]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-right-0 slide-in-from-bottom-2 slide-in-from-right-0 p-1">
                    <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs flex gap-8 justify-between">
                      <div>Bulk Actions</div>
                      <div className="font-normal">
                        {table.getFilteredSelectedRowModel().rows.length} Items
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onSelect={handleDeleteRows}
                    >
                      Delete
                      <DropdownMenuShortcut>
                        <Trash className="text-destructive" />
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContentWithoutPortal>
                </DropdownMenu>
              }
            </div>
          </div>
        </SimpleBar>
      }
      <div className="rounded-md border overflow-hidden h-[66svh] relative mt-[2px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-full text-center">
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    Tidak ada pilihan yang tersedia.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
