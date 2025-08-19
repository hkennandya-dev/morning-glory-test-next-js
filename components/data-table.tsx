"use client"

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  RowModel,
  Column,
  Table as TableType
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback, useEffect } from "react";
import { DataTableViewOptions } from "@/components/ui/column-toggle";
import { ArrowDown01, ArrowDownUp, CheckIcon, ChevronDownIcon, FileDown, Funnel, Plus, RefreshCw, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LoaderCircle } from "lucide-react";
import { MultiSelect } from "./multi-select";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from '@tanstack/react-query';
import { CustomSelect } from "./custom-select";
import { cn } from "@/lib/utils";
import { ColumnSheet, FormInputType } from "./ui/column-dropdown";
import { ReferencesType } from "./auto-table";
import { useRouter } from "next/navigation";
import SimpleBar from "simplebar-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "./ui/label";
import { FieldErrors, FieldValues, UseFormSetValue } from "react-hook-form";

export type SelectByType = {
  label: React.ReactNode
  tooltip?: React.ReactNode
  value?: string
  default?: boolean
  operator?: "OR" | "AND"
}

export type BulkActionsType<TData> = {
  asChild?: boolean
  cell: (rows: RowModel<TData>, refresh?: () => void) => React.ReactNode
  action?: (rows: RowModel<TData>) => void
  variant?: "default" | "destructive"
}

export type PaginateType = {
  label: React.ReactNode
  value: number
  default?: boolean
}

export type OptionType<TData> = {
  queryKey: string
  orderBy: SelectByType[]
  formInput: FormInputType[]
  filter?: SelectByType[]
  exports?: SelectByType[]
  paginate: PaginateType[]
  customMapping?: (data: TData) => void
  beforeSubmit?: (originalData: TData, submitData: TData, status: 'create' | 'edit') => void | Promise<void> | TData
  BulkActions?: (table: TableType<TData>, loading: boolean, refresh?: () => void) => React.ReactNode
  AdditionalToolbar?: (table: TableType<TData>) => React.ReactNode
  AdditionalInput?: (status: 'create' | 'read' | 'edit', data: FieldValues, setData: UseFormSetValue<FieldValues>, errors: FieldErrors<FieldValues>) => React.ReactNode
  defaultColumnVisibility?: {
    [id: string]: boolean
  }
  fullWidth?: boolean
  disabledBulkCreate?: boolean
  directAction?: boolean
  disabled?: {
    bulk?: boolean,
    create?: boolean,
    update?: boolean,
    duplicate?: boolean,
    delete?: boolean,
    export?: boolean,
    lastAction?: boolean
  }
}

interface DataTableProps<TData, TValue> {
  references: ReferencesType
  options: OptionType<TData>
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  queryVersion: number
  setQueryVersion: (queryVersion: number) => void
  paginate: number
  setPaginate: (page: number) => void
  search: string
  setSearch: (search: string) => void
  orderBy: string
  setOrderBy: (orderBy: string) => void
  filter: string[]
  setFilter: (filter: string[]) => void
  fetchReport: (type: string) => void
  total: number
  loading: boolean
  onLoadMore: () => void
  setColumnVisible: (columnVisible: Column<TData, unknown>[]) => void
  hasMore: boolean
  isFetchingMore: boolean
  orientation: 'portrait' | 'landscape'
  setOrientation: (orientation: 'portrait' | 'landscape') => void
  colOf?: string
}

export function DataTable<TData extends { id: string, deleted_at?: Date }, TValue>({
  references,
  options,
  columns,
  data,
  queryVersion,
  setQueryVersion,
  paginate,
  setPaginate,
  search,
  setSearch,
  orderBy,
  setOrderBy,
  setColumnVisible,
  filter,
  setFilter,
  fetchReport,
  total,
  loading,
  onLoadMore,
  hasMore,
  isFetchingMore,
  orientation,
  setOrientation,
  colOf="0"
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const enterPressedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({});
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [openCreate, setCreateOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(options.defaultColumnVisibility || {});
  const isMobile = useIsMobile();

  const table = useReactTable({
    data,
    columns,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    enableSorting: !loading,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility
    },
    meta: {
      updateRow: updateRow,
      refreshData: refreshData
    },
  });

  const visibleColumns = table.getVisibleFlatColumns();
  const queryClient = useQueryClient();

  function refreshData() {
    table.resetRowSelection();
    setQueryVersion(queryVersion + 1);
  }

  function updateRow(updatedItem: TData) {
    const getData = queryClient.getQueryData([options.queryKey, queryVersion]);
    if (!getData) refreshData();

    queryClient.setQueryData([options.queryKey, queryVersion], (oldData: {
      pages: {
        data: TData[]
      }[]
    }) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((item: TData) => {
            const defaultData = {
              ...updatedItem,
              datetime:
                (updatedItem as TData & { deleted_at?: string; updated_at?: string; created_at?: string }).deleted_at ??
                (updatedItem as TData & { deleted_at?: string; updated_at?: string; created_at?: string }).updated_at ??
                (updatedItem as TData & { deleted_at?: string; updated_at?: string; created_at?: string }).created_at,
              last_action: (updatedItem as TData & { deleted_at?: string; updated_at?: string; created_at?: string }).deleted_at
                ? "Deleted"
                : (updatedItem as TData & { deleted_at?: string; updated_at?: string; created_at?: string }).updated_at
                  ? "Updated"
                  : "Created",
            }
            type injectName = {
              item_id: string
            }
            const idCondition = item.id ? (item.id === updatedItem.id) : (item as unknown as injectName)?.item_id === (updatedItem as unknown as injectName)?.item_id;
            return idCondition ? options.customMapping ? options.customMapping(defaultData) : defaultData : item
          }
          ),
        })),
      };
    });
  }

  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    const scrollBottom = scrollHeight - (scrollTop + clientHeight);

    if (scrollBottom < 200 && hasMore && !isFetchingMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, isFetchingMore, onLoadMore, loading]);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      return () => tableContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (enterPressedRef.current || loading) return;

    timeoutRef.current = window.setTimeout(() => {
      setQueryVersion(queryVersion + 1);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      enterPressedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setQueryVersion(queryVersion + 1);
      setTimeout(() => {
        enterPressedRef.current = false;
      }, 0);
    }
  };

  useEffect(() => {
    if (sorting.length > 0) {
      const key = sorting[0].id.split("%")[1];
      if (key) {
        const isDesc = sorting[0].desc;
        setOrderBy(`order_by=${key}&order_type=${isDesc ? "desc" : "asc"}`);
        setQueryVersion(queryVersion + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  useEffect(() => {
    setColumnVisible(visibleColumns);
  }, [visibleColumns, setColumnVisible])

  return (
    <>
      <div className="flex flex-col w-full">
        {isMobile ?
          <div className="flex flex-col gap-1.5 sm:gap-2 justify-between pb-1.5 sm:pb-2">
            <div className="flex flex-row gap-1.5 sm:gap-2">
              <div className="relative w-full sm:min-w-[230px]">
                <SearchIcon className={cn("absolute left-2 top-1/2 -translate-y-1/2 h-4 text-muted-foreground", loading && "opacity-50")} />
                <Input disabled={loading} className="pl-9 w-full focus-visible:ring-0 focus-visible:outline-0" type="text" placeholder="Cari..." value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <Button disabled={loading} onClick={() => setQueryVersion(queryVersion + 1)} className="!bg-inherit hover:!bg-input/50 h-full font-normal" size="sm" variant="outline">
                <RefreshCw className="text-muted-foreground" />
              </Button>
              <Sheet>
                <SheetTrigger asChild disabled={loading}>
                  <Button className="!bg-inherit hover:!bg-input/50 h-full font-normal" size="sm" variant="outline">
                    <Funnel className="text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="focus:outline-none flex flex-col gap-6">
                  <SheetTitle className="text-base sm:text-lg flex gap-2 sm:gap-3 items-center">Options</SheetTitle>
                  <div className="flex flex-col gap-3">
                    <Label>Urutkan Berdasarkan</Label>
                    <CustomSelect
                      className="w-full"
                      icon={<ArrowDownUp className="absolute left-3" />}
                      key={`sorting-${queryVersion}`}
                      value={orderBy}
                      disabled={loading}
                      options={options.orderBy}
                      placeholder="Urutkan Berdasaran"
                      onChange={(value) => { table.resetSorting(); setOrderBy(value); refreshData() }}
                      onReset={() => table.resetSorting()}
                    />
                  </div>
                  {options.filter &&
                    <div className="flex flex-col gap-3">
                      <Label>Filter</Label>
                      <MultiSelect
                        modalPopover={true}
                        key={`filter-${queryVersion}`} autoClose disabled={loading} className="py-1.5" placeholder="Filter" options={options.filter} onValueChange={(value) => { setFilter(value); refreshData() }} defaultValue={filter} />
                    </div>
                  }

                  <div className="flex flex-col gap-3">
                    <Label>Paginasi</Label>
                    <CustomSelect
                      className="w-full"
                      disabled={loading} icon={<ArrowDown01 className="absolute left-3" />} onChange={(value) => { setPaginate(parseInt(value)); refreshData() }} value={paginate.toString()}
                      options={[{ label: "Paginasi" }, ...options.paginate.map(opt => ({ ...opt, value: opt.value.toString() }))]} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label>Visibilitas Kolom</Label>
                    <DataTableViewOptions buttonSize="default" buttonClassName="text-xs sm:text-sm relative flex py-2.5 px-1 rounded-md border border-input h-full items-center justify-between bg-inherit hover:bg-inherit dark:hover:bg-input/50 [&_svg]:pointer-events-auto" showValue={true} table={table} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex justify-between gap-1.5 sm:gap-2">
              <div className="flex gap-1.5 sm:gap-2">
                {options.AdditionalToolbar && options.AdditionalToolbar(table)}
                {!options.disabled?.create &&
                  <Button onClick={() => options.directAction ? router.push(`${references.path}/create`) : setCreateOpen(true)} disabled={loading} className="font-normal">
                    <Plus /><span>Tambah</span>
                  </Button>
                }
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {options?.BulkActions?.(table, loading, refreshData)}
                {!options.disabled?.export && options?.exports &&
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={loading} variant="outline" className="!bg-inherit hover:!bg-input/50">
                        <FileDown className="text-muted-foreground" />
                        <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs">Orientation</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOrientation("portrait") }} className="cursor-pointer justify-between">
                        <div className="flex items-center gap-2">Portrait<Badge variant="outline" >PDF</Badge></div>
                        {orientation === "portrait" && <CheckIcon className="size-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOrientation("landscape") }} className="cursor-pointer justify-between">
                        <div className="flex items-center gap-2">Landscape<Badge variant="outline" >PDF</Badge></div>
                        {orientation === "landscape" && <CheckIcon className="size-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs">Export</DropdownMenuLabel>
                      {references.url.report && (options.exports.map((opt, key) => (
                        <DropdownMenuItem key={key} onClick={() => fetchReport(opt.value ?? "")} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>{opt.label}</span>
                            {opt?.tooltip ? <Badge variant="outline" >{opt.tooltip}</Badge> : null}
                          </div>
                        </DropdownMenuItem>
                      )))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              </div>
            </div>
          </div>
          :
          <SimpleBar className="z-50 pb-1.5 sm:pb-2">
            <div className="flex flex-row gap-1.5 sm:gap-2 justify-between">
              <div className="flex flex-row gap-1.5 sm:gap-2">
                <div className="relative w-full sm:min-w-[230px]">
                  <SearchIcon className={cn("absolute left-2 top-1/2 -translate-y-1/2 h-4 text-muted-foreground", loading && "opacity-50")} />
                  <Input disabled={loading} className="pl-9 w-full focus-visible:ring-0 focus-visible:outline-0" type="text" placeholder="Cari..." value={search}
                    onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown} />
                </div>
                <CustomSelect
                  valueQuery="only screen and (min-width: 1024px)"
                  icon={<ArrowDownUp className="absolute left-3" />}
                  key={`sorting-${queryVersion}`}
                  value={orderBy}
                  disabled={loading}
                  options={options.orderBy}
                  placeholder="Order by"
                  onChange={(value) => { table.resetSorting(); setOrderBy(value); refreshData() }}
                  onReset={() => table.resetSorting()}
                />
                {options.filter &&
                  <MultiSelect
                    modalPopover={true}
                    valueQuery="only screen and (min-width: 1024px)"
                    key={`filter-${queryVersion}`} autoClose disabled={loading} className="max-w-[200px]" placeholder="Filter" options={options.filter} onValueChange={(value) => { setFilter(value); refreshData() }} defaultValue={filter} />
                }
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {options.AdditionalToolbar && options.AdditionalToolbar(table)}
                {!options.disabled?.create &&
                  <Button onClick={() => options.directAction ? router.push(`${references.path}/create`) : setCreateOpen(true)} disabled={loading} className="font-normal">
                    <Plus />Tambah
                  </Button>
                }
                {options?.BulkActions?.(table, loading, refreshData)}
                <CustomSelect
                  align="end" disabled={loading} icon={<ArrowDown01 className="absolute left-3" />} onChange={(value) => { setPaginate(parseInt(value)); refreshData() }} value={paginate.toString()}
                  options={[{ label: "Paginasi" }, ...options.paginate.map(opt => ({ ...opt, value: opt.value.toString() }))]} />

                <DataTableViewOptions table={table} />
                {!options.disabled?.export && options?.exports &&
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={loading} variant="outline" className="!bg-inherit hover:!bg-input/50">
                        <FileDown className="text-muted-foreground" />
                        <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs">Orientation</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOrientation("portrait") }} className="cursor-pointer justify-between">
                        <div className="flex items-center gap-2">Portrait<Badge variant="outline" >PDF</Badge></div>
                        {orientation === "portrait" && <CheckIcon className="size-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOrientation("landscape") }} className="cursor-pointer justify-between">
                        <div className="flex items-center gap-2">Landscape<Badge variant="outline" >PDF</Badge></div>
                        {orientation === "landscape" && <CheckIcon className="size-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs">Export</DropdownMenuLabel>
                      {references.url.report && (options.exports.map((opt, key) => (
                        <DropdownMenuItem key={key} onClick={() => fetchReport(opt.value ?? "")} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>{opt.label}</span>
                            {opt?.tooltip ? <Badge variant="outline" >{opt.tooltip}</Badge> : null}
                          </div>
                        </DropdownMenuItem>
                      )))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }

                <Button disabled={loading} onClick={() => setQueryVersion(queryVersion + 1)} className="!bg-inherit hover:!bg-input/50 h-full font-normal" size="sm" variant="outline">
                  <RefreshCw className="text-muted-foreground" />
                </Button>
              </div>
            </div>
          </SimpleBar>
        }
        <div className="rounded-md border overflow-hidden h-[56svh] sm:h-[57svh] md:h-[64.5svh] lg:h-[64.5svh] xl:h-[64.5svh] max-h-[800px] relative mt-[2px]">
          <Table key={queryVersion} ref={tableContainerRef}
            className={loading || table.getRowCount() === 0 ? "h-full" : "h-fit"}>
            <TableHeader className="sticky top-0 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
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
              {(table.getRowModel().rows.length > 0) && !loading ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow className={row.original?.deleted_at && "bg-destructive/10 hover:bg-destructive/15 border-b-destructive/10"} key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
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
                      {loading ? <LoaderCircle className="animate-spin" /> : "Tidak ada data yang tersedia."}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-1.5 sm:pt-2">
          <div className="flex flex-wrap h-5 items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
            Menampilkan 1 - {table.getRowCount()} dari total {total} data pada kolom {colOf} dari 3 kolom
          </div>
        </div>
      </div>
      <ColumnSheet fullWidth={options.fullWidth} isCreate title={references.title} singleTitle={references.singleTitle} table={table} path={references.url.base} open={openCreate} setOpen={setCreateOpen} description={references.description} formSchema={references.formSchema} formInput={options.formInput} AdditionalInput={options.AdditionalInput} />
    </>
  )
}