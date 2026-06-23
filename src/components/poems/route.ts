import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { poem_table } from "../../database/schemas.js"
import { one_schema, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const poem_route = new Hono()  


poem_route.get(
    "/poems",
    describeRoute({
        tags: ["Poems"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Poems", get_all_schema(one_schema)),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    async(c) => {
        try {
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0
            // We make 2 seperate queries, to get the data & the total_count of rows.
            // we can make 1 query, but we'll need to make manual transformation
            // so that we remove the count field from every item in the array.
            let { created_at, updated_at, ...rest} = getTableColumns(poem_table) // select all columns, except created_at & updated_at.
            let [poems, counts] = await Promise.all([
                await db.select({...rest}).from(poem_table).limit(limit).offset(offset),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(poem_table)
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

            return c.json(
                {
                    data: poems,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )
        } catch(e) {
            logger.error({error:e}, "Error getting all Adeebs")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

poem_route.get(
    "/poems/:id",
    describeRoute({
        tags: ["Poems"],
        summary: "Get One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get Poem", one_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "Poem's not Found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")
            let { created_at, updated_at, ...rest} = getTableColumns(poem_table) // select all columns, except created_at & updated_at.
            let poem = await db.query.poem_table.findFirst({
                columns: {
                    id: true,
                    intro: true,
                    verses: true,
                    is_couplet: true,
                    reviewed: true,

                    adeeb_id: true,
                },
                where: (poem_table, { eq }) => eq(poem_table.id, id),
            })
            if (!poem) {
                return c.json({message: "Poem's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            return c.json(poem, HttpStatusCode.OK)
        } catch(e) {
            logger.error({error:e}, "Error getting all Adeebs")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

poem_route.post(
    "/poems",
    describeRoute({
        tags: ["Poems"],
        summary: "Create One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added Poem", create_one_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "Poem already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_one_req, "Invalid data for Poem"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let new_poem = await db
                .insert(poem_table)
                .values(new_data)
                .onConflictDoNothing({ target: [poem_table.intro]})
                .returning()
                .then(res => res[0])
            
            // if the first item in res[0] is undefined,
            // then there was a conflict and it already exists
            if (!new_poem) {
                return c.json({ message: "Poem already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }
            return c.json(new_poem, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: create Poem")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

poem_route.post(
    "/poems/many",
    describeRoute({
        tags: ["Poems"],
        summary: "Create Many",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    json_validator(create_many_req, "Invalid data, can't be used to create many Poems"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let new_poems = await db
                .insert(poem_table)
                .values(new_data)
                .onConflictDoNothing({ target: [poem_table.intro]})
                .returning()

            return c.json({created_items: new_poems, success_count: new_poems.length, failed_count: new_data.length - new_poems.length}, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: creating multiple Poems")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

poem_route.put(
    "/poems/:id",
    describeRoute({
        tags: ["Poems"],
        summary: "Update One",
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Updated Successfully"),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request, try again later.", base_response_schema),
        },
    }),
    id_param_validator(),
    json_validator(update_req, "Invalid data for update"),
    async(c) => {
        try {
            let id = c.req.param("id")
            let data = await c.req.json()
            
            await db.update(poem_table).set({...data, updated_at: sql`NOW()`}).where(eq(poem_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Updating Poem")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

poem_route.delete(
    "/poems/:id",
    describeRoute({
        tags: ["Poems"],
        summary: "Delete One",
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Deleted Successfully"),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request, try again later.", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")
            
            await db.delete(poem_table).where(eq(poem_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Deleting Poem")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
