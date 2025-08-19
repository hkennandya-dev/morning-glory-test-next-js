import { handleRead, handleCreate } from "@/lib/handlers";
import { db } from "@/lib/db";
import { item } from "@/lib/schema";
import { leftJoin, schema, setDefault } from "./config";

export const GET = handleRead(db, item, { default: setDefault, leftJoin: leftJoin });
export const POST = handleCreate(db, item, schema);