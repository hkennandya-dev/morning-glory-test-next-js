import { Table } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDownIcon, LoaderCircle, Trash, SquareCheckBig, Copy } from "lucide-react";
import { useState } from "react";
import { ReferencesType } from "./auto-table";
import { fetch } from "@/lib/axios";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { OptionType } from "./data-table";


export function BulkDeleteDialog<TData extends { id: number | string }>({ table, refresh, references, open, setOpen }: {
    table: Table<TData>,
    refresh?: () => void,
    references: ReferencesType,
    open: boolean,
    setOpen: (open: boolean) => void
}) {
    const path = references.url.base;
    const [loading, setLoading] = useState<boolean>(false);
    const apiOption = fetch();
    const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original) as TData[];
    const permanentDeleteCount = selectedRows.filter(item => typeof ((item as unknown as { deleted_at: Date | undefined })?.deleted_at) !== "undefined" && (item as unknown as { deleted_at: Date | undefined })?.deleted_at).length;
    const deleteCount = selectedRows.filter(item => typeof (item as unknown as { deleted_at: Date | undefined })?.deleted_at !== "undefined" && (item as unknown as { deleted_at: Date | undefined })?.deleted_at === null).length;


    const onAction = async () => {
        try {
            setLoading(true);
            const res = await apiOption.delete(`${path}/bulk`, { data: { id: selectedRows.map(row => row.id) } });

            if ((res.status === 200 || res.status === 201) && res.data) {
                let message = "Berhasil menghapus data";
                if (res.data?.message) {
                    message = res.data.message;
                }
                toast.success(message);
                if (refresh) {
                    refresh();
                }
                setOpen(false);
            } else {
                throw new Error(res.data?.message || "Gagal menghapus data");
            }
        } catch (error) {
            console.error(error);
            let message = "Gagal menghapus data";

            if (isAxiosError(error)) {
                const res = error.response?.data;

                if (res?.message) {
                    message = res.message;
                }
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="flex flex-col gap-6 max-w-[95%] lg:min-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                <AlertDialogHeader className="text-left">
                    <AlertDialogTitle>Apakah Anda benar-benar yakin ingin menghapus <span className="font-bold">{deleteCount + permanentDeleteCount}</span> data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {(permanentDeleteCount > 0 ||  references.isPermanentDeleteDescription) ?
                            "This action cannot be undone. It will permanently delete the selected data and completely remove it from our servers, making it unrecoverable."
                            :
                            "Tindakan ini tidak dapat dibatalkan. Tindakan ini akan menghapus data yang dipilih secara permanen dan menghapusnya sepenuhnya dari server kami, sehingga tidak dapat dipulihkan."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row items-center justify-end gap-6">
                    {loading && <LoaderCircle className="animate-spin" />}
                    <div className="flex gap-2">
                        <AlertDialogCancel onClick={() => setOpen(false)} disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction disabled={loading} onClick={(e) => { e.preventDefault(); onAction() }} variant="destructive">Hapus</AlertDialogAction>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function BulkActions<TData extends { id: number | string }>({ options, table, loading = false, children, refresh, references, render }: {
    table: Table<TData>, loading: boolean, refresh?: () => void, references: ReferencesType,
    children?: React.ReactNode, render?: React.ReactNode,
    options: OptionType<TData>
}
) {
    const [openDelete, setOpenDelete] = useState(false);

    if (options.disabled?.bulk) return;

    const api = fetch();
    const handleBulkDuplicate = async () => {
        try {
            toast.loading("Menduplikasi data");
            const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original) as TData[];
            const res = await api.post(`${references.url.base}/bulk`, { data: selectedRows, "_disable_notification": true });

            if (res.status === 201 || res.status === 200) {
                if (table.options.meta?.refreshData) {
                    table.options.meta.refreshData();
                }
                toast.success(res.data?.message || "Menduplikasi data dengan sukses");
            } else {
                toast.error(res.data?.message || "Gagal menduplikasi data");
            }
            toast.dismiss();
        } catch (error) {
            let message = "Gagal menduplikasi data";
            if (isAxiosError(error)) {
                const res = error.response?.data;

                if (res?.message) {
                    message = res.message;
                }
            }
            toast.dismiss();
            toast.error(message);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button disabled={loading || table.getFilteredSelectedRowModel().rows.length === 0} variant="outline" className="!bg-inherit hover:!bg-input/50 font-normal">
                        <SquareCheckBig className="text-muted-foreground" />
                        <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="font-normal text-muted-foreground px-2 py-2 text-xs sm:text-xs flex gap-8 justify-between">
                        <div>Aksi</div>
                        <div className="font-normal">{table.getFilteredSelectedRowModel().rows.length} data terpilih</div>
                    </DropdownMenuLabel>
                    {!options.disabled?.duplicate && (
                        <DropdownMenuItem onSelect={handleBulkDuplicate} className="cursor-pointer">Duplikasi<DropdownMenuShortcut><Copy /></DropdownMenuShortcut></DropdownMenuItem>
                    )}
                    {!options.disabled?.delete &&
                        <DropdownMenuItem variant="destructive" className="cursor-pointer" onSelect={() => { setOpenDelete(true) }}>
                            Hapus<DropdownMenuShortcut><Trash className="text-destructive" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                    }
                    {children}
                </DropdownMenuContent>
            </DropdownMenu>
            <BulkDeleteDialog open={openDelete} setOpen={setOpenDelete} references={references} table={table} refresh={refresh} />
            {render}
        </>
    )
}