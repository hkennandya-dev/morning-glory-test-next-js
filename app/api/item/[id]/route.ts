import { handleRead, handleUpdate, handleDelete } from "@/lib/handlers";
import { db } from "@/lib/db";
import { item } from "@/lib/schema";
import { leftJoin, schema, setDefault } from "../config";

export const GET = handleRead(db, item, { default: setDefault, leftJoin: leftJoin, single: true });
export const PUT = handleUpdate(db, item, schema);
export const DELETE = handleDelete(db, item);