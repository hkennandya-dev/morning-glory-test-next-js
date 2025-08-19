import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends object = unknown> {
    updateRow?: (data: TData) => void;
    refreshData?: () => void;
  }
}
