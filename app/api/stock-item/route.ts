import { handleRead, handleCreate } from "@/lib/handlers";
import { db } from "@/lib/db";
import { stock_item, item } from "@/lib/schema";
import { leftJoin, schema, setDefault } from "./config";

export const GET = handleRead(db, item, { default: setDefault, leftJoin: leftJoin });
export const POST = handleCreate(db, stock_item, schema);