import { handleRead, handleUpdate, handleDelete } from "@/lib/handlers";
import { db } from "@/lib/db";
import { category_item } from "@/lib/schema";
import { schema } from "../config";

export const GET = handleRead(db, category_item, { default: { id: "id" }, single: true });
export const PUT = handleUpdate(db, category_item, schema);
export const DELETE = handleDelete(db, category_item);