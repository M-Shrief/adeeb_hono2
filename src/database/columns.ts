/**
 * This module is used to contain shared schemas for Drizzle,
 * we store the schema as an object, then we insert it using destructuring.

* Note: Avoid assigning a column definition to a variable and reusing that variable directly
* in multiple table schemas. Always wrap shared columns in an object and spread them
*  to ensure safe, independent instances for every table. 
*/ 
import { sql } from "drizzle-orm"
import { timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";
/////
import { adeeb_table, poem_table, chosen_verses_table, prose_qoutes_table, user_table, order_table} from "./schemas.js"


export const id = {
  id: uuid().primaryKey().defaultRandom(),
}

export const verses = {
  verses: varchar({length: 256})
    .array()
    .notNull(),
    // .default(sql`'{}'::VARCHAR[]`), // to set an empty array
}
export const verses_optional = {
  verses: varchar({length: 256})
    .array(),
    // .default(sql`'{}'::VARCHAR[]`), // to set an empty array

}

export const is_couplet = {
  is_couplet: boolean().default(true).notNull()
}
export const is_couplet_optional = {
  is_couplet: boolean()
}

export const qoute = {
  qoute: varchar({ length: 512 }).notNull(),
}
export const qoute_optional = {
  qoute: varchar({ length: 512 }),
}

export const tags = {
  tags: varchar({length: 64})
    .array()
    .notNull()
    .default(sql`'{}'::VARCHAR[]`)
}

export const reviewed = {
  reviewed: boolean().default(false).notNull()
}

export const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
//   deleted_at: timestamp(),
}


// Relations
export const adeeb_id = {
  adeeb_id: uuid().references(() => adeeb_table.id).notNull(),
  // adeeb_id: uuid().references(() => adeeb_table.id, {onDelete: 'cascade', onUpdate: 'cascade'}).notNull(),
}
export const adeeb_id_optional = {
  adeeb_id: uuid().references(() => adeeb_table.id),
}


export const poem_id = {
  poem_id: uuid().references(() => poem_table.id).notNull(),
}
export const poem_id_optional = {
  poem_id: uuid().references(() => poem_table.id),
}

export const chosen_verses_id_optional = {
  chosen_verse_id: uuid().references(() => chosen_verses_table.id),
}

export const prose_qoute_id_optional = {
  prose_qoute_id: uuid().references(() => prose_qoutes_table.id),
}

export const user_id_optional = {
  user_id: uuid().references(() => user_table.id),
}

export const order_id = {
  order_id: uuid().references(() => order_table.id).notNull(),
}