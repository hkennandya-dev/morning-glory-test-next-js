'use client'

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { references as category_references, columns as category_columns, options as category_options } from "./category_columns";
import { references as item_references, columns as item_columns, options as item_options } from "./item_columns";
import { references as stock_item_references, columns as stock_item_columns, options as stock_item_options } from "./stock_item_columns";
import AutoTable from "@/components/auto-table";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from "react";

const queryClient = new QueryClient({});

export default function Page() {
  const [toggle, setToggle] = useState("category-item");
  return (
    <Suspense fallback={null}>
      <div className="flex flex-col items-center gap-10 p-8 max-w-6xl mx-auto w-full">
        <ToggleGroup type="single" value={toggle} onValueChange={setToggle} className="w-full md:w-[70%]">
          <ToggleGroupItem value="category-item" aria-label="Toggle bold" variant="outline">
            Master Kategori Barang
          </ToggleGroupItem>
          <ToggleGroupItem value="item" aria-label="Toggle italic" variant="outline">
            Master Barang
          </ToggleGroupItem>
          <ToggleGroupItem value="stock-item" aria-label="Toggle strikethrough" variant="outline">
            Stok Barang
          </ToggleGroupItem>
        </ToggleGroup>
        <QueryClientProvider client={queryClient}>
          {toggle === 'category-item' ?
            <AutoTable
              key={toggle}
              colOf="1"
              columns={category_columns}
              options={category_options}
              references={category_references}
            />
            : toggle === 'item' ?
              <AutoTable
                key={toggle}
                colOf="2"
                columns={item_columns}
                options={item_options}
                references={item_references}
              />
              :
              <AutoTable
                key={toggle}
                colOf="3"
                columns={stock_item_columns}
                options={stock_item_options}
                references={stock_item_references}
              />
          }
        </QueryClientProvider>
      </div>
    </Suspense>
  );
}