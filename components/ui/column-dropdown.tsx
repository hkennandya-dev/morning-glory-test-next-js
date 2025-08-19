"use client"

import React, { useEffect, useRef } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, EyeIcon, HistoryIcon, LoaderCircle, MoreHorizontal, Pencil, Trash, X, XIcon } from "lucide-react";
import { useForm, FieldValues, ControllerRenderProps, Path, ControllerFieldState, useWatch, Control, UseFormSetValue, UseFormGetValues, FieldErrors } from "react-hook-form";
import { AnyZodObject, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./select";
import { fetch } from "@/lib/axios";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Separator } from "./separator";
import { Badge } from "./badge";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReferencesType } from "../auto-table";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { InputImage } from "@/components/input-image";
import { DatePicker } from "@/components/ui/date-picker";
import { OptionType } from "@/components/data-table";
import DateTimePicker from "./datetime-picker";
import { TimePicker } from "./time-picker";
import { MultiSelect } from "../multi-select";
import { id as idLocale } from "date-fns/locale"

export interface ColumnDropdownProps<TData> {
    options: OptionType<TData>;
    render?: React.ReactNode;
    references: ReferencesType;
    table: Table<TData>;
    children?: React.ReactNode;
    description?: string;
    row: FormRowProps;
    formSchema: AnyZodObject;
    formInput: FormInputType[];
    directAction?: boolean
    fullWidth?: boolean,
}

export interface FormRowProps {
    index: number;
    original: ColumnDataProps;
}

export interface FormInputType extends React.ComponentProps<"input"> {
    type: string;
    key: string;
    label?: string | React.ReactNode;
    placeholder?: string;
    description?: string | React.ReactNode;
    disabled?: boolean;
    clearable?: boolean;
    hideOnCreate?: boolean;
    api?: SelectApiType;
    search?: boolean;
    updateValue?: (value: string | number | boolean | Date | null | Array<AnyZodObject>) => void
    onUpdateValue?: (
        value: string | number | boolean | Date | null | Array<AnyZodObject>,
        setFormValue: (field: string, value: string | number | boolean | Date | null | Array<AnyZodObject>) => void,
        fullValue?: FieldValues
    ) => Promise<void> | void
    options?: SelectOptionsType[]
    span?: boolean
}

export interface SelectOptionsType {
    value: string
    label: string | React.ReactNode
}

export interface ColumnDataProps {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

export interface ColumnSheetProps<TData> {
    title: string;
    singleTitle?: string;
    table: Table<TData>
    path: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    isCreate?: boolean;
    isEdit?: boolean;
    description?: string;
    formSchema: AnyZodObject;
    row?: FormRowProps;
    formInput: FormInputType[];
    fullWidth?: boolean;
    disableLastAction?: boolean;
    beforeSubmit?: (originalData: TData, submitData: TData, status: 'create' | 'edit') => void | Promise<void> | TData
    AdditionalInput?: (status: 'create' | 'read' | 'edit', data: FieldValues, setData: UseFormSetValue<FieldValues>, errors: FieldErrors<FieldValues>) => React.ReactNode
}

export interface SelectApiType {
    base: string;
    searchKey?: string,
    label: string;
    key: string
}

export type FormWatcherType = {
    control: Control<FieldValues, string | number | boolean | Date | null | Array<AnyZodObject>, FieldValues>
    setValue: UseFormSetValue<FieldValues>
    getValues: UseFormGetValues<FieldValues>
    name: string
    onUpdateValue?: (
        value: string | number | boolean | Date | null | Array<AnyZodObject>,
        setFormValue: (field: string, value: string | number | boolean | Date | null | Array<AnyZodObject>) => void,
        fullValue?: FieldValues
    ) => Promise<void> | void
    children?: React.ReactNode
}

export function SelectAPI<T extends FieldValues>({
    disabled,
    clearable = false,
    readOnly,
    useSearch = false,
    field,
    fieldState,
    api,
    label,
    placeholder,
    manualOptions,
}: {
    disabled: boolean,
    clearable?: boolean,
    readOnly: boolean,
    useSearch?: boolean,
    field: ControllerRenderProps<T, Path<T>>,
    fieldState: ControllerFieldState,
    api?: SelectApiType,
    label?: string | React.ReactNode,
    placeholder?: string,
    manualOptions?: SelectOptionsType[],
}) {
    const apiOption = fetch();
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [options, setOptions] = useState<SelectOptionsType[]>([]);
    const [fetchPage, setFetchPage] = useState(1);
    const [isNext, setIsNext] = useState(true);

    const [visibleCount, setVisibleCount] = useState(25);
    const [paginatedOptions, setPaginatedOptions] = useState<SelectOptionsType[]>([]);
    const isFetching = useRef(false);
    const [search, setSearch] = useState("");
    const [filteredManualOptions, setFilteredManualOptions] = useState<SelectOptionsType[] | null>(null);
    const [searchPage, setSearchPage] = useState(1);
    const isSearch = useSearch ? (manualOptions ? true : api?.searchKey ? true : false) : false;

    const fetchOptions = async (page: number) => {
        if (isFetching.current) return;
        try {
            isFetching.current = true;
            setFetchLoading(true);
            setFetchError(null);

            const res = await apiOption.get(api!.base, {
                params: {
                    paginate: 25,
                    page,
                    search_key: api?.searchKey,
                    search_value: search,
                },
            });

            if (res.status === 200) {
                const data = res.data?.data.map((dt: { [key: string]: string }) => ({
                    value: dt[api!.key],
                    label: dt[api!.label],
                }));

                const isInclude = data.filter((dt: { [key: string]: string }) => dt.value === field.value).length > 0;

                if (api?.key === 'id' && field.value && !isInclude) {
                    const single_url = api.base.split("?")[0];
                    const singleRes = await apiOption.get(`${single_url}/${field.value}`);
                    if (singleRes.status === 200) {
                        const singleData = singleRes.data?.data;
                        const getSingleData = {
                            value: singleData[api!.key],
                            label: singleData[api!.label],
                        }
                        data.unshift(getSingleData);
                    }
                }

                const unique: SelectOptionsType[] = data.filter(
                    (item: SelectOptionsType, index: number, self: SelectOptionsType[]) =>
                        index === self.findIndex((t) => t.value === item.value && t.label === item.label),
                );

                const selectedExists = unique.some(opt => opt.value === field.value);
                if (!selectedExists && field.value) {
                    const savedLabel = options.find(opt => opt.value === field.value)?.label ?? `${field.value}`;
                    unique.unshift({ value: field.value, label: savedLabel });
                }

                setIsNext(res.data?.pagination?.is_next ?? false);
                setFetchLoading(false);
                isFetching.current = false;
                return unique;
            }

            throw new Error(res.data?.message || "Failed retrieving data");
        } catch (error) {
            setFetchLoading(false);
            isFetching.current = false;
            let message = "Failed to retrieving data";

            if (isAxiosError(error)) {
                const res = error.response?.data;
                if (res?.message) message = res.message;
            }

            setFetchError(message);
            throw new Error(message);
        }
    };

    useEffect(() => {
        if (manualOptions) {
            setOptions(manualOptions);
        } else if (api) {
            (async () => {
                const data = await fetchOptions(1);
                if (data) {
                    setOptions(data);
                    setFetchPage(1);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api?.base]);

    useEffect(() => {
        if (manualOptions) {
            let visible = manualOptions.slice(0, visibleCount);
            const selectedItem = manualOptions.find((opt) => opt.value === field.value);
            if (selectedItem && !visible.some((opt) => opt.value === selectedItem.value)) {
                visible = [selectedItem, ...visible];
            }
            setPaginatedOptions(visible);
        }
    }, [manualOptions, visibleCount, field.value]);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (manualOptions) {
                const searchLower = search.toLowerCase();

                const filtered = manualOptions
                    .filter((opt) =>
                        `${opt.label}`.toLowerCase().includes(searchLower) ||
                        `${opt.value}`.toLowerCase().includes(searchLower)
                    )
                    .sort((a, b) => {
                        const aMatch = `${a.value}`.toLowerCase().includes(searchLower) ? 0 : 1;
                        const bMatch = `${b.value}`.toLowerCase().includes(searchLower) ? 0 : 1;
                        return aMatch - bMatch;
                    });

                setFilteredManualOptions(filtered);
                setSearchPage(1);
                const paginated = filtered.slice(0, 25);
                // setPaginatedOptions(ensureUniqueSelected(paginated));
                setPaginatedOptions(paginated);
            } else if (api) {
                fetchOptions(1).then((data) => {
                    if (data) {
                        setOptions(data);
                        setFetchPage(1);
                    }
                });
            }
        }, 300);

        return () => clearTimeout(delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);



    useEffect(() => {
        if (!manualOptions && field.value) {
            const exists = options.some((opt) => opt.value === field.value);
            if (!exists) {
                const current = { value: field.value, label: `${field.value}` };
                setOptions((prev) => [current, ...prev]);
            }
        }

        if (manualOptions && field.value) {
            const exists = paginatedOptions.some((opt) => opt.value === field.value);
            const current = manualOptions.find((opt) => opt.value === field.value);
            if (current && !exists) {
                setPaginatedOptions((prev) => [current, ...prev]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, paginatedOptions, field.value]);



    const handleClear = () => field.onChange("");

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const threshold = 10;
        const isBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;

        if (!isBottom || isFetching.current) return;

        if (manualOptions) {
            const base = filteredManualOptions || manualOptions;
            const nextPage = (filteredManualOptions ? searchPage : visibleCount / 25) + 1;
            const newSlice = base.slice(0, nextPage * 25);
            // setPaginatedOptions(ensureUniqueSelected(newSlice));
            setPaginatedOptions(newSlice);

            if (filteredManualOptions) setSearchPage(nextPage);
            else setVisibleCount((prev) => Math.min(prev + 25, manualOptions.length));
        } else if (isNext && !fetchLoading) {
            const nextPage = fetchPage + 1;
            const newData = await fetchOptions(nextPage);
            if (newData) {
                setOptions((prev) => {
                    const combined = [...prev, ...newData];
                    return combined.filter(
                        (item, idx, self) =>
                            idx === self.findIndex((t) => t.value === item.value)
                    );
                });
                setFetchPage(nextPage);
            }
        }
    };

    return (
        <Select
            disabled={fetchLoading || disabled || readOnly}
            defaultValue={field.value}
            onValueChange={field.onChange}
            {...field}
        >
            <div className="relative flex items-center justify-between w-full gap-2.5">
                <SelectTrigger
                    arrow="hidden"
                    aria-invalid={fieldState.invalid}
                    className="w-full text-foreground disabled:opacity-75 disabled:cursor-default"
                >
                    {fetchLoading ? (
                        <div className="flex items-center gap-2.5">
                            <LoaderCircle className="animate-spin" /> Loading...
                        </div>
                    ) : fetchError ? (
                        <div className="flex items-center gap-2.5 text-destructive">
                            <X className="text-destructive" />
                            {fetchError}
                        </div>
                    ) : (
                        <SelectValue placeholder={placeholder} />
                    )}
                </SelectTrigger>
                <div className="absolute right-3 flex items-center gap-2">
                    {clearable && field.value && !readOnly && (
                        <>
                            <XIcon
                                className={cn(
                                    "relative z-20 h-4 cursor-pointer text-muted-foreground",
                                    fetchLoading || disabled || readOnly
                                        ? "hover:text-muted-foreground"
                                        : "hover:text-foreground",
                                )}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (fetchLoading || disabled || readOnly) return;
                                    handleClear();
                                }}
                            />
                            <Separator orientation="vertical" className="flex min-h-6 h-full" />
                        </>
                    )}
                    <ChevronDown className="size-4 text-muted-foreground opacity-50" />
                </div>
            </div>

            <SelectContent onCloseAutoFocus={isSearch ? (e) => e.preventDefault() : undefined} onEscapeKeyDown={isSearch ? (e) => e.preventDefault() : undefined} aria-autocomplete={isSearch ? "none" : undefined} autoFocus={isSearch ? false : undefined} onScroll={handleScroll}>
                <SelectGroup aria-autocomplete={isSearch ? "none" : undefined} autoFocus={isSearch ? false : undefined}>
                    {(((!manualOptions && api?.searchKey) || manualOptions) && isSearch) &&
                        <div className="px-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                                autoComplete="off"
                                className="border-0 border-b focus:ring-0 mb-1 focus:outline-0 rounded-none focus-visible:ring-0 focus-visible:outline-0 sm:text-xs px-0"
                                type="text"
                                placeholder="Search..."
                                onKeyDown={(e) => e.stopPropagation()}
                            />

                        </div>
                    }
                    {label && <SelectLabel aria-autocomplete={isSearch ? "none" : undefined} autoFocus={isSearch ? false : undefined}>{label}</SelectLabel>}
                    {(manualOptions ? paginatedOptions : options).map((opt, key) => (
                        <SelectItem
                            key={`${opt.value}-${key}`}
                            value={opt.value}
                            autoFocus={isSearch ? false : undefined}
                            aria-selected="false"
                            aria-autocomplete={isSearch ? "none" : undefined}
                        >
                            {opt.label}
                        </SelectItem>

                    ))}

                    {!manualOptions && isNext && (
                        <SelectLabel aria-autocomplete={isSearch ? "none" : undefined} autoFocus={isSearch ? false : undefined} className="text-center text-xs text-muted-foreground py-2">
                            Loading more...
                        </SelectLabel>
                    )}

                    {(manualOptions ? paginatedOptions : options).length === 0 && (
                        <SelectLabel aria-autocomplete={isSearch ? "none" : undefined} autoFocus={isSearch ? false : undefined} className="pt-0 font-normal text-xs sm:text-sm">
                            No items to select
                        </SelectLabel>
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
export function MultiSelectAPI<T extends FieldValues>({
    disabled,
    clearable,
    readOnly,
    useSearch = false,
    field,
    fieldState,
    api,
    label,
    placeholder,
    manualOptions,
}: {
    disabled: boolean;
    clearable?: boolean;
    readOnly: boolean;
    useSearch?: boolean;
    field: ControllerRenderProps<T, Path<T>>;
    fieldState: ControllerFieldState;
    api?: SelectApiType;
    label?: string | React.ReactNode;
    placeholder?: string;
    manualOptions?: SelectOptionsType[];
}) {
    const apiOption = fetch();
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [options, setOptions] = useState<SelectOptionsType[]>([]);
    const [fetchPage, setFetchPage] = useState(1);
    const [isNext, setIsNext] = useState(true);
    const [visibleCount, setVisibleCount] = useState(25);
    const [paginatedOptions, setPaginatedOptions] = useState<SelectOptionsType[]>([]);
    const isFetching = useRef(false);
    const [search, setSearch] = useState("");
    const [filteredManualOptions, setFilteredManualOptions] = useState<SelectOptionsType[] | null>(null);
    const [searchPage, setSearchPage] = useState(1);

    useEffect(() => {
        if (!Array.isArray(field.value)) {
            field.onChange([]);
        }
    }, [field.value, field]);

    const fetchOptions = async (page: number) => {
        if (isFetching.current) return;
        try {
            isFetching.current = true;
            setFetchLoading(true);
            setFetchError(null);

            const res = await apiOption.get(api!.base, {
                params: {
                    paginate: 25,
                    page,
                    search_key: api?.searchKey,
                    search_value: search,
                },
            });

            if (res.status === 200) {
                const data: SelectOptionsType[] = res.data?.data.map((dt: Record<string, string>) => ({
                    value: dt[api!.key],
                    label: dt[api!.label],
                }));

                const unique = data.filter(
                    (item, idx, self) => idx === self.findIndex((t) => t.value === item.value)
                );

                setIsNext(res.data?.pagination?.is_next ?? false);
                setFetchLoading(false);
                isFetching.current = false;
                return unique;
            }

            throw new Error(res.data?.message || "Failed retrieving data");
        } catch (error) {
            setFetchLoading(false);
            isFetching.current = false;
            let message = "Failed retrieving data";

            if (isAxiosError(error)) {
                const res = error.response?.data;
                if (res?.message) message = res.message;
            }

            setFetchError(message);
            throw new Error(message);
        }
    };

    useEffect(() => {
        if (manualOptions) {
            setOptions(manualOptions);
        } else if (api) {
            (async () => {
                const data = await fetchOptions(1);
                if (data) {
                    setOptions(data);
                    setFetchPage(1);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api?.base]);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (manualOptions) {
                const searchLower = search.toLowerCase();
                const filtered = manualOptions.filter(
                    (opt) =>
                        `${opt.label}`.toLowerCase().includes(searchLower) ||
                        `${opt.value}`.toLowerCase().includes(searchLower)
                );
                setFilteredManualOptions(filtered);
                setSearchPage(1);
                setPaginatedOptions(filtered.slice(0, 25));
            } else if (api) {
                (async () => {
                    const data = await fetchOptions(1);
                    if (data) {
                        setOptions(data);
                        setFetchPage(1);
                    }
                })();
            }
        }, 300);
        return () => clearTimeout(delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleScroll = async (e: React.UIEvent) => {
        const target = e.currentTarget;
        const threshold = 10;
        const isBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;

        if (!isBottom || isFetching.current) return;

        if (manualOptions) {
            const base = filteredManualOptions || manualOptions;
            const nextPage = (filteredManualOptions ? searchPage : visibleCount / 25) + 1;
            const newSlice = base.slice(0, nextPage * 25);
            setPaginatedOptions(newSlice);
            if (filteredManualOptions) setSearchPage(nextPage);
            else setVisibleCount((prev) => Math.min(prev + 25, manualOptions.length));
        } else if (isNext && !fetchLoading) {
            const nextPage = fetchPage + 1;
            const newData = await fetchOptions(nextPage);
            if (newData) {
                setOptions((prev) => {
                    const combined = [...prev, ...newData];
                    return combined.filter(
                        (item, idx, self) => idx === self.findIndex((t) => t.value === item.value)
                    );
                });
                setFetchPage(nextPage);
            }
        }
    };

    return (
        <MultiSelect
            className="pr-2.5 pl-1.5 py-1.5"
            hideRefresh={true}
            icon={false}
            options={manualOptions ? paginatedOptions : options}
            onValueChange={field.onChange}
            defaultValue={field.value || []}
            placeholder={fetchError || placeholder}
            disabled={disabled || readOnly}
            autoClose={false}
            invalid={fieldState.invalid}
            searchable={useSearch}
            searchValue={useSearch ? search : undefined}
            onSearchChange={useSearch ? setSearch : undefined}
            onScroll={handleScroll}
            clearable={clearable}
            label={label}
            loading={fetchLoading}
            error={fetchError}
        />
    );
}

export function FormWatcher({ control, setValue, getValues, name, onUpdateValue }: FormWatcherType) {
    const watchedValue = useWatch({ control, name })

    useEffect(() => {
        if (onUpdateValue) {
            (async () => {
                const allValues = getValues();
                await onUpdateValue(watchedValue, setValue, allValues);
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedValue, onUpdateValue, setValue])

    return null;
}

export function ColumnSheet<TData>({ fullWidth, title, singleTitle, table, path, open, setOpen, isCreate = false, isEdit, description, formSchema, row, formInput, disableLastAction, beforeSubmit, AdditionalInput }: ColumnSheetProps<TData>) {
    const [loading, setLoading] = useState<boolean>(false);
    const [originalData, setOriginalData] = useState();
    const apiOption = fetch();
    const data = row ? row.original : {
        id: null,
        created_at: null,
        updated_at: null,
        deleted_at: null,
    };
    const id = row ? row.original.id : null;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ref = useRef<HTMLDivElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        values: Object.fromEntries(
            formInput.map(input => {
                if (!row) {
                    return [input.key, input.updateValue ? input.updateValue("") : ""];
                }
                const val = row.original[input.key as keyof typeof row.original] ?? "";
                return [input.key, input.updateValue ? input.updateValue(val) : val];
            })
        )
    });

    useEffect(() => {
        if (open) {
            form.reset();
            setOriginalData(data as unknown as undefined);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function getUpdatedData(id: string | null, path: string) {
        try {
            const res = await apiOption.get(`${path}/${id}`);
            if (res.status === 200 && res.data.data) {
                return res.data.data;
            } else {
                throw new Error(res.data?.message || "Failed to read updated data");
            }
        } catch (error) {
            let message = "Failed to read updated data";

            if (isAxiosError(error)) {
                const data = error.response?.data;

                if (data instanceof Blob) {
                    try {
                        const text = await data.text();
                        const json = JSON.parse(text);
                        if (json?.message) message = json.message;
                    } catch {
                        message = "Failed to read updated data";
                    }
                } else if (typeof data === "object" && data?.message) {
                    message = data.message;
                }
            }
            throw new Error(message);
        }
    }


    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            form.clearErrors();
            setLoading(true);
            const getSubmitData = { ...data, "_disable_notification": true };
            let payload;
            if (beforeSubmit) {
                payload = await beforeSubmit(originalData as TData, getSubmitData as TData, isCreate ? 'create' : 'edit');
            } else {
                payload = getSubmitData;
            }
            const res = (isCreate || !row?.original?.id) ? await apiOption.post(`${path}`, payload) : await apiOption.put(`${path}/${id}`, data);

            if ((res.status === 200 || res.status === 201) && res.data) {
                let message = isCreate ? "Berhasil membuat data" : "Berhasil memperbarui data";
                if (res.data?.message) {
                    message = res.data.message;
                }
                toast.success(message);
                try {
                    if (isCreate && !row?.original?.id) {
                        if (table.options.meta?.refreshData) {
                            table.options.meta.refreshData();
                        }
                    } else {
                        const getId = res.data.data.id;
                        const updatedData = await getUpdatedData(id || getId, path);
                        if (table.options.meta?.updateRow) {
                            table.options.meta.updateRow(updatedData);
                        }
                    }
                    setOpen(false);
                } catch (error) {
                    if (error instanceof Error) {
                        toast.error(error.message);
                    } else {
                        toast.error(isCreate ? "Terjadi kesalahan tidak diketahui setelah membuat data" : "Terjadi kesalahan tidak diketahui setelah memperbarui data");
                    }
                }
            } else {
                throw new Error(res.data?.message || (isCreate ? "Gagal membuat data" : "Gagal memperbarui data"));
            }
        } catch (error) {
            console.error(error);
            let message = isCreate ? "Gagal membuat data" : "Gagal memperbarui data";

            if (isAxiosError(error)) {
                const res = error.response?.data;

                if (res?.message) {
                    message = res.message;
                }

                if (Array.isArray(res?.errors)) {
                    res.errors.forEach((err: { path: string; message: string }) => {
                        form.setError(err.path, {
                            type: "server",
                            message: err.message,
                        });
                    });
                }
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent ref={ref} className={cn("focus:outline-none max-md:w-[calc(100%+1px)] flex flex-col gap-6", fullWidth && "min-w-[75svw]")} side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="space-y-2">
                    <SheetTitle className="text-base sm:text-lg flex gap-2 sm:gap-3 items-center">{singleTitle || title} <Badge variant="outline">{isCreate ? "Tambah" : isEdit ? "Ubah" : "Lihat"}</Badge></SheetTitle>
                    {description && <SheetDescription>{description}</SheetDescription>
                    }
                </div>
                <Separator />
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className={cn("gap-6 items-start", fullWidth ? "grid grid-cols-1 md:grid-cols-2" : "grid grid-cols-1")}>
                            {formInput.filter(input => input.type !== 'hidden').map((input, key) => (
                                (isCreate && input.hideOnCreate) ? null :
                                    <FormField key={key} control={form.control} name={input.key}
                                        render={({ field, fieldState }) => (
                                            <FormItem className={cn("flex flex-col col-span-2 md:col-span-1", input.span && "md:col-span-2")}>
                                                <FormLabel className={input.disabled || input.readOnly ? "opacity-50" : undefined}>{input.label}{input.required && <span className="text-destructive">*</span>}</FormLabel>
                                                <FormControl>
                                                    {
                                                        input.type === 'multi-select' ?
                                                            <MultiSelectAPI
                                                                useSearch={input.search}
                                                                manualOptions={input.options}
                                                                clearable={input.clearable}
                                                                disabled={input.disabled || loading}
                                                                readOnly={!isCreate && !isEdit}
                                                                api={input.api}
                                                                label={input.label}
                                                                placeholder={input.placeholder}
                                                                field={field}
                                                                fieldState={fieldState}
                                                            />
                                                            :
                                                            input.type === 'datetime' ?
                                                                <DateTimePicker className="disabled:opacity-75" disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} placeholder={input.placeholder} date={field.value} setDate={field.onChange} />
                                                                :
                                                                input.type === 'date' ?
                                                                    <DatePicker className="disabled:opacity-75" disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} placeholder={input.placeholder} date={field.value} setDate={field.onChange} />
                                                                    : input.type === 'time' ?
                                                                        <TimePicker aria-readonly={input.readOnly} className="disabled:opacity-75" required={false} disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} type={input.type} placeholder={input.placeholder} {...field} /> :
                                                                        input.type === "select" ?
                                                                            <SelectAPI useSearch={input.search} manualOptions={input.options} clearable={input.clearable} disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} api={input.api} label={input.label} placeholder={input.placeholder} field={field} fieldState={fieldState} />
                                                                            : input.type === "textarea" ?
                                                                                <Textarea aria-readonly={input.readOnly} className="disabled:opacity-75" required={false} disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} placeholder={input.placeholder} {...field} />

                                                                                : input.type === "image" ?
                                                                                    <InputImage aria-readonly={input.readOnly} className="disabled:opacity-75" disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} placeholder={input.placeholder} {...field} />
                                                                                    :
                                                                                    <Input aria-readonly={input.readOnly} className="disabled:opacity-75" required={false} disabled={input.disabled || loading} readOnly={!isCreate && !isEdit} type={input.type} placeholder={input.placeholder} {...field} />
                                                    }
                                                </FormControl>
                                                <FormMessage />
                                                {input?.description && <FormDescription>{input.description}</FormDescription>}
                                                {input?.onUpdateValue &&
                                                    <FormWatcher control={form.control} setValue={form.setValue} getValues={form.getValues} name={input.key} onUpdateValue={input.onUpdateValue} />
                                                }
                                            </FormItem>
                                        )} />
                            ))}
                            {AdditionalInput?.((isCreate ? 'create' : isEdit ? 'edit' : 'read'), form.getValues(), form.setValue, form.formState.errors)}
                        </div>
                        {(isCreate || isEdit) &&
                            <div className="flex gap-6 items-center">
                                <Button disabled={loading} type="submit">{isCreate ? "Tambah" : "Ubah"}</Button>
                                {loading && <LoaderCircle className="animate-spin" />}
                            </div>
                        }
                    </form>
                </Form>
                {(!isCreate && !disableLastAction) &&
                    <>
                        <div className="space-y-2">
                            <SheetTitle>Last Action</SheetTitle>
                            <SheetDescription>Shows the latest action on the data.</SheetDescription>
                        </div>
                        <div className={cn("text-xs gap-4", fullWidth ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col")}>
                            {data.deleted_at &&
                                <div className="flex justify-between rounded-md gap-2 border border-destructive p-4 text-destructive">
                                    <div className="flex flex-col gap-2">
                                        <div className="font-semibold">Deleted</div>
                                        <span>Data has been deleted</span>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span>{format(toZonedTime(new Date(data.deleted_at), timeZone), "EEEE, dd MMMM yyyy", { locale: idLocale })}</span>
                                        <div className="flex gap-2 items-center">
                                            <span>{format(toZonedTime(new Date(data.deleted_at), timeZone), "HH:mm:ss", { locale: idLocale })}</span>
                                            <Badge className="text-destructive border-destructive font-normal" variant="outline">{timeZone}</Badge>
                                        </div>
                                    </div>
                                </div>
                            }
                            {data.updated_at &&
                                <div className="flex justify-between rounded-md gap-2 border p-4 text-foreground">
                                    <div className="flex flex-col gap-2">
                                        <div className="font-semibold">Updated</div>
                                        <span>Data has been updated</span>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span>{format(toZonedTime(new Date(data.updated_at), timeZone), "EEEE, dd MMMM yyyy", { locale: idLocale })}</span>
                                        <div className="flex gap-2 items-center">
                                            <span>{format(toZonedTime(new Date(data.updated_at), timeZone), "HH:mm:ss", { locale: idLocale })}</span>
                                            <Badge className="font-normal" variant="outline">{timeZone}</Badge>
                                        </div>
                                    </div>
                                </div>
                            }
                            {data.created_at &&
                                <div className="flex justify-between rounded-md gap-2 border p-4 text-muted-foreground">
                                    <div className="flex flex-col gap-2">
                                        <div className="font-semibold">Created</div>
                                        <span>Data has been created</span>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span>{format(toZonedTime(new Date(data.created_at), timeZone), "EEEE, dd MMMM yyyy", { locale: idLocale })}</span>
                                        <div className="flex gap-2 items-center">
                                            <span>{format(toZonedTime(new Date(data.created_at), timeZone), "HH:mm:ss", { locale: idLocale })}</span>
                                            <Badge className="text-muted-foreground font-normal" variant="outline">{timeZone}</Badge>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </>
                }
            </SheetContent>
        </Sheet>
    );
}

export function ColumnDialog<TData>({ isRecovery, table, references, data, open, setOpen }: {
    table: Table<TData>, references: ReferencesType, data: ColumnDataProps, open: boolean, setOpen: (open: boolean) => void, isRecovery: boolean
}) {
    const primaryKey = references.primaryKey as keyof typeof data;
    const primaryKeyValue = data[primaryKey];
    const path = references.url.base;
    const [loading, setLoading] = useState<boolean>(false);
    const apiOption = fetch();

    const onAction = async () => {
        const id = data.id;

        try {
            setLoading(true);
            const res = isRecovery ? await apiOption.put(`${path}/${id}/recovery`) : await apiOption.delete(`${path}/${id}`);

            if ((res.status === 200 || res.status === 201) && res.data) {
                let message = isRecovery ? "Success to recovery data" : "Success to delete data";
                if (res.data?.message) {
                    message = res.data.message;
                }
                toast.success(message);
                if (table.options.meta?.refreshData) {
                    table.options.meta.refreshData();
                }
                setOpen(false);
            } else {
                throw new Error(res.data?.message || (isRecovery ? "Failed to recovery data" : "Failed to delete data"));
            }
        } catch (error) {
            console.error(error);
            let message = isRecovery ? "Failed to recovery data" : "Failed to delete data";

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
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="flex flex-col gap-6 max-w-[95%] lg:min-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                <AlertDialogHeader className="text-left">
                    <AlertDialogTitle>{
                        isRecovery ?
                            <>Are you absolutely sure you want to recover {typeof primaryKeyValue === "string" && primaryKeyValue}?</>
                            :
                            <>Apakah Anda benar-benar yakin ingin menghapus <span className="font-bold">{typeof primaryKeyValue === "string" && primaryKeyValue}</span>{data.deleted_at && " permanently"}?</>
                    }</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isRecovery ?
                            "This action will undo the deletion and restore the selected data to its active state in our system."
                            : ((data.deleted_at || references.isPermanentDeleteDescription) ?
                                "This action cannot be undone. It will permanently delete the selected data and completely remove it from our servers, making it unrecoverable."
                                :
                                "Tindakan ini tidak dapat dibatalkan. Tindakan ini akan menghapus data yang dipilih secara permanen dan menghapusnya sepenuhnya dari server kami, sehingga tidak dapat dipulihkan.")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-6 items-center justify-end">
                    {loading && <LoaderCircle className="animate-spin" />}
                    <div className="flex gap-2">
                        <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction disabled={loading} onClick={(e) => { e.preventDefault(); onAction() }} variant={isRecovery ? "default" : "destructive"}>{isRecovery ? "Recovery" : (data.deleted_at ? "Permanent Delete" : "Hapus")}</AlertDialogAction>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function ColumnDropdown<TData>({ options, fullWidth, render, directAction, references, table, children, description, row, formSchema, formInput }: ColumnDropdownProps<TData>) {
    const data: ColumnDataProps = row.original;
    const router = useRouter();
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [sheetOpen, setSheetOpen] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [isRecovery, setIsRecovery] = useState<boolean>(false);
    const api = fetch();

    const handleDuplicate = async () => {
        try {
            toast.loading("Menduplikasi data");
            const res = await api.post(references.url.base, { ...data, "_disable_notification": true });

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
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 focus-visible:ring-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs sm:text-xs font-normal">Aksi</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => {
                        if (directAction) {
                            router.push(`${references.path}/${data.id}`)
                        } else {
                            setIsEdit(false); setSheetOpen(true);
                        }
                    }} className="cursor-pointer">Lihat<DropdownMenuShortcut><EyeIcon /></DropdownMenuShortcut></DropdownMenuItem>
                    {!options.disabled?.update && (data.deleted_at ?
                        <DropdownMenuItem onSelect={() => { setIsRecovery(true); setDialogOpen(true) }} className="cursor-pointer">Pulihkan<DropdownMenuShortcut><HistoryIcon /></DropdownMenuShortcut></DropdownMenuItem>
                        :
                        <DropdownMenuItem onSelect={() => {
                            if (directAction) {
                                router.push(`${references.path}/${data.id}/edit`)
                            } else {
                                setIsEdit(true); setSheetOpen(true);
                            }
                        }} className="cursor-pointer">Ubah<DropdownMenuShortcut><Pencil /></DropdownMenuShortcut></DropdownMenuItem>
                    )}
                    {!options.disabled?.duplicate && (
                        <DropdownMenuItem onSelect={handleDuplicate} className="cursor-pointer">Duplikasi<DropdownMenuShortcut><Copy /></DropdownMenuShortcut></DropdownMenuItem>
                    )}
                    {!options.disabled?.delete && (
                        <DropdownMenuItem onSelect={() => { setIsRecovery(false); setDialogOpen(true) }} className="cursor-pointer" variant="destructive">{data.deleted_at ? "Hapus Selamanya" : "Hapus"}<DropdownMenuShortcut><Trash className="text-destructive" /></DropdownMenuShortcut></DropdownMenuItem>
                    )}
                    {children}
                </DropdownMenuContent>
            </DropdownMenu>
            <ColumnSheet fullWidth={fullWidth} title={references.title} singleTitle={references.singleTitle} table={table} path={references.url.base} open={sheetOpen} setOpen={setSheetOpen} isEdit={isEdit} description={description} formSchema={formSchema} row={row} formInput={formInput} disableLastAction={options.disabled?.lastAction} beforeSubmit={options.beforeSubmit} AdditionalInput={options.AdditionalInput} />
            <ColumnDialog isRecovery={isRecovery} table={table} references={references} data={data} open={dialogOpen} setOpen={setDialogOpen} />
            {render}
        </>
    )
}