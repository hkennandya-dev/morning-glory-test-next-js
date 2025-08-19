import { handleCreate, handleDelete } from "@/lib/handlers";
import { db } from "@/lib/db";
import { category_item } from "@/lib/schema";
import { schema } from "../config";

export const POST = handleCreate(db, category_item, schema, { bulk: true });
export const DELETE = handleDelete(db, category_item, { bulk: true });