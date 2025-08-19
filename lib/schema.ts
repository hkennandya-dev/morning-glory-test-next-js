import { sql } from "drizzle-orm";
import { mysqlTable, bigint, text, datetime, boolean, decimal } from "drizzle-orm/mysql-core";

export const category_item = mysqlTable("category_item", {
  id: bigint({ mode: 'bigint' }).autoincrement().primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: datetime('created_at').default(sql`NOW()`),
  updated_at: datetime('updated_at').default(sql`NULL`),
  deleted_at: datetime('deleted_at').default(sql`NULL`)
});

export const item = mysqlTable("item", {
  id: bigint({ mode: 'bigint' }).autoincrement().primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  created_date: datetime('created_date').default(sql`NULL`),
  category_item_id: bigint({ mode: 'bigint' }).references(() => category_item.id, { onDelete: 'cascade' }).notNull(),
  unit: text('unit').notNull(),
  is_stock: boolean('is_stock').default(true),
  created_at: datetime('created_at').default(sql`NOW()`),
  updated_at: datetime('updated_at').default(sql`NULL`),
  deleted_at: datetime('deleted_at').default(sql`NULL`)
});

export const stock_item = mysqlTable("stock_item", {
  id: bigint({ mode: 'bigint' }).autoincrement().primaryKey(),
  item_id: bigint({ mode: 'bigint' }).references(() => item.id, { onDelete: 'cascade' }).notNull(),
  stock: decimal("stock", { precision: 10, scale: 2 }).default('0.00'),
  created_at: datetime('created_at').default(sql`NOW()`),
  updated_at: datetime('updated_at').default(sql`NULL`),
  deleted_at: datetime('deleted_at').default(sql`NULL`)
});