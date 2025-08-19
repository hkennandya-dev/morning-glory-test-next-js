'use client'

import { useEffect, useState } from "react";
import { DataTable, OptionType } from "@/components/data-table";
import { toast } from "sonner";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Column, ColumnDef } from "@tanstack/react-table";
import { isAxiosError } from "axios";
import { fetch } from "@/lib/axios";
import { useQueryClient } from '@tanstack/react-query';
import { parseRawQuery } from "@/lib/query";
import { AnyZodObject } from "zod";
import { useSearchParams } from "next/navigation";

export type ReferencesType = {
    title: string,
    singleTitle?: string,
    description: string,
    path: string,
    url: {
        base: string,
        report?: string
    },
    searchKey: string
    primaryKey: string,
    formSchema: AnyZodObject,
    isPermanentDeleteDescription?: boolean
}

type AutoTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    options: OptionType<TData>;
    references: ReferencesType;
    colOf?: string
};

export default function AutoTable<TData, TValue>({ columns, options, references, colOf="0" }: AutoTableProps<TData, TValue>) {
    const [paginate, setPaginate] = useState<number>(options.paginate.find(pgnt => pgnt.default)?.value ?? 100);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q');
    const [search, setSearch] = useState<string>("");
    const [orderBy, setOrderBy] = useState<string>(
        options.orderBy.find(ordby => ordby.default)?.value ?? options.orderBy[0].value ?? ""
    );
    const [filter, setFilter] = useState<string[]>(
        options.filter ? options.filter.filter(opt => opt.default && opt.value).map(opt => opt.value).filter((v): v is string => v !== undefined) : []
    );
    const [queryVersion, setQueryVersion] = useState(0);
    const queryClient = useQueryClient();
    const [exportLoading, setExportLoading] = useState(false);
    const [columnVisible, setColumnVisible] = useState<Column<TData, unknown>[]>([]);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    useEffect(() => {
        return () => {
            queryClient.removeQueries({ queryKey: [options.queryKey] });
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setSearch(searchQuery);
            setQueryVersion(queryVersion + 1);
        } else {
            setSearch("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery])

    const fetchData = async ({ pageParam = 1 }) => {
        const api = fetch();
        try {
            toast.loading("Memuat data");
            const baseUrl = references.url.base;
            const connector = baseUrl.includes('?') ? '&' : '?';
            const finalUrl = `${baseUrl}${connector}${orderBy}`;
            const res = await api.get(finalUrl, {
                params: {
                    page: pageParam,
                    paginate: paginate,
                    search_key: references.searchKey,
                    search_value: search,
                    raw_query: options.filter && parseRawQuery(options.filter, filter)
                }
            });

            if (res.status === 200) {
                const data = (res.data?.data ?? []).map((dt: {
                    created_at: Date
                    updated_at?: Date
                    deleted_at?: Date
                }) => {
                    const defaultMapping = {
                        ...dt,
                        datetime: dt.deleted_at ?? dt.updated_at ?? dt.created_at,
                        last_action: dt.deleted_at
                            ? "Deleted"
                            : dt.updated_at
                                ? "Updated"
                                : "Created",
                    }
                    return (options.customMapping ? options.customMapping(defaultMapping as TData) : (defaultMapping as TData))
                });
                toast.dismiss();
                // toast.success(res.data?.message || "Data retrieved successfully");
                return {
                    data,
                    nextPage: res.data?.pagination?.is_next ? pageParam + 1 : undefined,
                    total: res.data?.pagination?.total ?? 0,
                };
            }


            throw new Error(res.data?.message || "Gagal memuat data");
        } catch (error) {
            toast.dismiss();
            let message = "Gagal memuat data";

            if (isAxiosError(error)) {
                const res = error.response?.data;
                if (res?.message) message = res.message;
            }

            throw new Error(message);
        }
    };

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
        queryKey: [options.queryKey, queryVersion],
        queryFn: fetchData,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    useEffect(() => {
        if (error) {
            toast.error(error.message);
        }
    }, [error]);

    const fetchReport = async (type?: string) => {
        const api = fetch();
        try {
            setExportLoading(true);
            const select = ["no", ...columnVisible.filter((col) => col.getIsVisible() &&
                "accessorKey" in col.columnDef && typeof (col.columnDef as { accessorKey: string }).accessorKey === "string"
            ).map((col) => (col.columnDef as { accessorKey: string }).accessorKey)].join(",");

            toast.loading(`Mengekspor ${total} data`);

            const baseUrl = references.url.report;
            const connector = baseUrl?.includes('?') ? '&' : '?';
            const finalUrl = `${baseUrl}${connector}${orderBy}`;
            const res = await api.get(finalUrl, {
                params: {
                    orientation: orientation,
                    select: select,
                    type: type,
                    search_key: references.searchKey,
                    search_value: search,
                    raw_query: options.filter && parseRawQuery(options.filter, filter)
                },
                responseType: 'blob',
            });

            if (res.status === 200) {
                const blob = new Blob([res.data]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;

                const contentDisposition = res.headers["content-disposition"];
                const match = contentDisposition?.match(/filename="?([^"]+)"?/);
                const filename = match ? match[1] : "report-download";

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                setExportLoading(false);
                toast.dismiss();
                toast.success("Data berhasil diekspor");
            } else {
                throw new Error(res.data?.message || "Gagal mengekspor data");
            }

        } catch (error) {
            setExportLoading(false);
            toast.dismiss();

            let message = "Gagal mengekspor data";

            if (isAxiosError(error)) {
                const data = error.response?.data;

                if (data instanceof Blob) {
                    try {
                        const text = await data.text();
                        const json = JSON.parse(text);
                        if (json?.message) message = json.message;
                    } catch {
                        message = "Gagal mengekspor data";
                    }
                } else if (typeof data === "object" && data?.message) {
                    message = data.message;
                }
            }

            toast.error(message);
            throw new Error(message);
        }
    };

    const flatData = data?.pages.flatMap(page => page.data) || [];
    const total = data?.pages[0]?.total || 0;

    return (
        <DataTable
            colOf={colOf}
            references={references}
            setColumnVisible={setColumnVisible}
            options={options}
            columns={columns}
            data={flatData}
            queryVersion={queryVersion}
            setQueryVersion={setQueryVersion}
            paginate={paginate}
            setPaginate={setPaginate}
            search={search}
            setSearch={setSearch}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
            filter={filter}
            setFilter={setFilter}
            fetchReport={fetchReport}
            total={total}
            loading={status === 'pending' || exportLoading}
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage}
            isFetchingMore={isFetchingNextPage}
            orientation={orientation}
            setOrientation={setOrientation}
        />
    );
}