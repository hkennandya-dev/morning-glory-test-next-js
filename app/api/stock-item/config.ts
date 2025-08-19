import { stock_item, item, category_item } from "@/lib/schema";
import { z } from "zod";

export const schema = z.object({
  item_id: z.coerce.bigint({ required_error: "Item wajib diisi", invalid_type_error: "Item harus bernilai integer" }),
  stock: z.string().regex(/^\d+(\.\d{1,2})?$/, "Stock harus bernilai desimal").transform((val) => parseFloat(val)).optional(),
});

const select = {
  id: stock_item.id,
  item_id: item.id,
  item: {
    id: item.id,
    code: item.code,
    name: item.name,
    created_date: item.created_date,
    category_item_id: item.category_item_id,
    unit: item.unit,
    is_stock: item.is_stock
  },
  category_item_id: item.category_item_id,
  category_item: {
    id: category_item.id,
    code: category_item.code,
    name: category_item.name,
    description: category_item.description

  },
  stock: stock_item.stock,
  created_at: stock_item.created_at,
  updated_at: stock_item.updated_at,
  deleted_at: stock_item.deleted_at
}

export const setDefault = {
  id: "stock_item.id",
  order_by: "stock_item.created_at",
  order_type: "DESC",
  identifier: "stock_item.identifier",
  raw_query: "stock_item.deleted_at is null",
  where: "item.is_stock is true and item.deleted_at is null and category_item.deleted_at is null",
  select: select
}

export const leftJoin = [
  {
    table: stock_item,
    query: `stock_item.item_id = item.id AND item.is_stock is true`
  },
  {
    table: category_item,
    query: `item.category_item_id = category_item.id`
  },
];