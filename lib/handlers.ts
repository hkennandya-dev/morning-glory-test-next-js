/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonBigInt } from "./json-bigint";

interface LeftJoinType {
  table: any;
  query: any;
}

const getParams = (url?: string) => {
  const splitUrl = url?.split("/") || [];
  return splitUrl[splitUrl.length - 1] || "";
}

export const handleRead = (db: any, table: any, options?: {
  single?: boolean;
  default?: {
    id?: string;
    order_by?: string;
    order_type?: string;
    raw_query?: string;
    where?: string;
    select?: any;
  };
  leftJoin?: LeftJoinType | LeftJoinType[];
}) => {
  return async (req: NextRequest) => {
    try {
      const single = options?.single ?? null;
      const id = single ? getParams(req.url) : null;

      const paginate = Number(req.nextUrl.searchParams.get("paginate")) || 10;
      const page = Number(req.nextUrl.searchParams.get("page")) || 1;
      const offset = (page - 1) * paginate;

      const order_by = req.nextUrl.searchParams.get("order_by") || (options?.default?.order_by ?? "created_at");
      const order_type = (req.nextUrl.searchParams.get("order_type") || "desc").toUpperCase() === "ASC" ? "ASC" : (options?.default?.order_type ?? "DESC");

      const search_key = req.nextUrl.searchParams.get("search_key");
      const search_value = req.nextUrl.searchParams.get("search_value");
      const equal_key = req.nextUrl.searchParams.get("equal_key");
      const equal_value = req.nextUrl.searchParams.get("equal_value");
      const raw_query = req.nextUrl.searchParams.get("raw_query");
      const notin_key = req.nextUrl.searchParams.get("notin_key");
      const notin_value = req.nextUrl.searchParams.get("notin_value");

      const searchColumns = search_key?.split(",").map((col: string) => sql.raw(col.trim())) ?? [];

      const where = sql`
        (${searchColumns.length && search_value ? sql`concat(${sql.join(searchColumns, sql`, `)}) LIKE ${`%${search_value}%`}` : sql`true`})
        AND (${equal_key && equal_value ? sql`${sql.raw(equal_key)} = ${equal_value}` : sql`true`})
        AND (${notin_key && notin_value ? sql`${sql.raw(notin_key)} NOT IN (${sql.raw(notin_value)})` : sql`true`})
        AND (${raw_query ? sql`${sql.raw(raw_query)}` : sql.raw(`${options?.default?.raw_query ?? "deleted_at IS NULL"}`)})
        AND (${options?.default?.where ? sql`${sql.raw(options?.default?.where)}` : sql`true`})
        AND (${id ? sql`${sql.raw(options?.default?.id ?? "id")} = ${id}` : sql`true`})
      `;

      let query = db.select(options?.default?.select ?? table).from(table).where(where);
      let countQuery = db.select({ count: sql`COUNT(*)`.as("count") }).from(table).where(where);

      if (options?.leftJoin) {
        if (Array.isArray(options?.leftJoin)) {
          options?.leftJoin.forEach((leftJoin: any) => {
            query = query.leftJoin(leftJoin.table, sql.raw(`${leftJoin.query}`));
            countQuery = countQuery.leftJoin(leftJoin.table, sql.raw(`${leftJoin.query}`));
          });
        } else {
          query = query.leftJoin(options?.leftJoin?.table, sql.raw(`${options?.leftJoin?.query}`));
          countQuery = countQuery.leftJoin(options?.leftJoin?.table, sql.raw(`${options?.leftJoin?.query}`));
        }
      }

      if (single || id) {
        const data = await query;
        if (data.length === 0) {
          return Response.json(jsonBigInt({ status: 404, message: "Data tidak ditemukan" }), { status: 404 });
        }
        return Response.json(jsonBigInt({ status: 200, message: "Data berhasil diambil", data: data[0] }));
      }

      const [{ count }] = await countQuery;
      const total = Number(count || 0);

      const data = await query
        .orderBy(sql`${sql.raw(order_by)} ${sql.raw(order_type)}`)
        .limit(paginate)
        .offset(offset);

      return Response.json(jsonBigInt({
        status: 200,
        message: "Data berhasil diambil",
        data,
        pagination: {
          page,
          paginate,
          is_prev: page > 1,
          is_next: offset + paginate < total,
          total,
        },
      }));
    } catch (error) {
      console.error(error);
      return Response.json(jsonBigInt({ status: 400, message: (error as Error).message || "Terjadi kesalahan saat mengambil data" }), { status: 400 });
    }
  };
};

export const handleCreate = (db: any, table: any, schema: any, options?: { bulk?: boolean; transformData?: (body: any) => Promise<any> }) => {
  return async (req: NextRequest) => {
    try {
      const body = await (req as unknown as Request).json();
      const bulk = options?.bulk ?? false;

      if (bulk && Array.isArray(body.data)) {
        let insertData = body.data.map((item: any) => schema.parse(item));
        if (typeof options?.transformData === "function") {
          insertData = await Promise.all(insertData.map(options.transformData));
        }

        const result = await db.insert(table).values(insertData).$returningId();
        return Response.json(jsonBigInt({ status: 201, message: `${result.length} Data berhasil dibuat`, data: result }), { status: 201 });
      } else {
        let insertData = schema.parse(body);
        if (typeof options?.transformData === "function") {
          insertData = await options.transformData(insertData);
        }

        const result = await db.insert(table).values(insertData).$returningId();
        return Response.json(jsonBigInt({ status: 201, message: "Data berhasil dibuat", data: result[0] }), { status: 201 });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(jsonBigInt({ status: 400, message: "Beberapa bidang tidak valid", errors: error.errors }), { status: 400 });
      }
      console.error(error);
      return Response.json(jsonBigInt({ status: 400, message: (error as Error).message || "Gagal membuat data" }), { status: 400 });
    }
  };
};

export const handleUpdate = (db: any, table: any, schema: any, options?: { recovery?: boolean; transformData?: (body: any) => Promise<any> }) => {
  return async (req: NextRequest) => {
    try {
      const id = getParams(req.url);
      if (!id) {
        return Response.json(jsonBigInt({ status: 400, message: "ID harus dikirim" }), { status: 400 });
      }

      if (options?.recovery) {
        const existingData = await db.select().from(table).where(sql`id = ${id}`).limit(1);
        if (!existingData[0] || !existingData[0]?.deleted_at) {
          return Response.json(jsonBigInt({ status: 404, message: "Data tidak ditemukan atau tidak dihapus" }), { status: 404 });
        }

        const result = await db.update(table).set({ deleted_at: null, updated_at: sql`CURRENT_TIMESTAMP` }).where(sql`id = ${id}`);
        return Response.json(jsonBigInt({ status: 200, message: "Data berhasil dipulihkan", data: result[0] }));
      }

      const body = await (req as unknown as Request).json();
      let updateData = schema.parse(body);
      if (typeof options?.transformData === "function") {
        updateData = await options.transformData(updateData);
      }

      const result = await db.update(table).set({ ...updateData, updated_at: sql`CURRENT_TIMESTAMP` }).where(sql`id = ${id}`);
      return Response.json(jsonBigInt({ status: 200, message: "Data berhasil diperbarui", data: result[0] }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(jsonBigInt({ status: 400, message: "Beberapa bidang tidak valid", errors: error.errors }), { status: 400 });
      }
      console.error(error);
      return Response.json(jsonBigInt({ status: 500, message: (error as Error).message || "Gagal memperbarui data" }), { status: 500 });
    }
  };
};

export const handleDelete = (db: any, table: any, options?: { bulk?: boolean }) => {
  return async (req: NextRequest) => {
    try {
      let ids: number[] = [];

      if (options?.bulk) {
        const body = await (req as unknown as Request).json();
        ids = body.id;
        if (!Array.isArray(ids) || ids.length === 0) {
          return Response.json(jsonBigInt({ status: 400, message: "ID harus dikirim dan harus berupa array" }), { status: 400 });
        }
      } else {
        const id = getParams(req.url);
        if (!id) {
          return Response.json(jsonBigInt({ status: 400, message: "ID harus dikirim" }), { status: 400 });
        }
        ids = [Number(id)];
      }

      const existingData = await db.select().from(table).where(sql`id IN (${sql.raw(ids.join(","))})`);
      if (existingData.length === 0) {
        return Response.json(jsonBigInt({ status: 404, message: "Data tidak ditemukan atau sudah dihapus" }), { status: 404 });
      }

      const softDeleteData: number[] = [];
      const permanentDeleteData: number[] = [];

      for (const data of existingData) {
        if (data.deleted_at) permanentDeleteData.push(data.id);
        else softDeleteData.push(data.id);
      }

      if (softDeleteData.length > 0) {
        await db.update(table).set({ deleted_at: sql`CURRENT_TIMESTAMP` }).where(sql`id IN (${sql.raw(softDeleteData.join(","))})`);
      }
      if (permanentDeleteData.length > 0) {
        await db.delete(table).where(sql`id IN (${sql.raw(permanentDeleteData.join(","))})`);
      }

      return Response.json(jsonBigInt({
        status: 200,
        message: `${options?.bulk ? `${softDeleteData.length + permanentDeleteData.length} ` : ""}Data berhasil dihapus`,
      }));
    } catch (error) {
      console.error(error);
      return Response.json(jsonBigInt({ status: 500, message: (error as Error).message || "Gagal menghapus data" }), { status: 500 });
    }
  };
};