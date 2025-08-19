import { handleRead, handleCreate } from "@/lib/handlers";
import { db } from "@/lib/db";
import { category_item } from "@/lib/schema";
import { schema } from "./config";

export const GET = handleRead(db, category_item, { default: { id: "id" } });
export const POST = handleCreate(db, category_item, schema);