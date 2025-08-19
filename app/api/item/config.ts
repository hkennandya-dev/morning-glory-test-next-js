import { category_item, item } from "@/lib/schema";
import { z } from "zod";

export const schema = z.object({
  code: z.string({ required_error: "Kode wajib diisi", invalid_type_error: "Kode harus bernilai string" }).nonempty("Kode wajib diisi"),
  name: z.string({ required_error: "Nama wajib diisi", invalid_type_error: "Nama harus bernilai string" }).nonempty("Nama wajib diisi"),
  created_date: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform((val) => (val ? new Date(val) : null)),
  category_item_id: z.union([z.coerce.bigint(), z.null()]).optional(),
  unit: z.string({ required_error: "Satuan wajib diisi", invalid_type_error: "Satuan harus bernilai string" }).nonempty("Satuan wajib diisi"),
  is_stock: z.boolean().default(true),
});

const select = {
  id: item.id,
  code: item.code,
  name: item.name,
  created_date: item.created_date,
  category_item_id: item.category_item_id,
  category_item: {
    id: category_item.id,
    code: category_item.code,
    name: category_item.name,
    description: category_item.description
  },
  unit: item.unit,
  is_stock: item.is_stock,
  created_at: item.created_at,
  updated_at: item.updated_at,
  deleted_at: item.deleted_at
}

export const setDefault = {
  id: "item.id",
  order_by: "item.created_at",
  order_type: "DESC",
  identifier: "item.identifier",
  raw_query: "item.deleted_at is null",
  where: " category_item.deleted_at is null",
  select: select
}

export const leftJoin = [
  {
    table: category_item,
    query: `item.category_item_id = category_item.id`
  },
];