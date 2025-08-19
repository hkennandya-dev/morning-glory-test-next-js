import { handleCreate, handleDelete } from "@/lib/handlers";
import { db } from "@/lib/db";
import { item } from "@/lib/schema";
import { schema } from "../config";

export const POST = handleCreate(db, item, schema, { bulk: true });
export const DELETE = handleDelete(db, item, { bulk: true });