import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { poem_table } from "../../database/schemas.js"
import { poem_schema, create_many_req, create_many_res, create_one_req, create_one_res } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const poem_route = new Hono()  


poem_route.get(
    "/poems",
    describeRoute({
        tags: ["Poem"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Poems", get_all_schema(poem_schema)),
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

poem_route.post(
    "/poems",
    describeRoute({
        tags: ["Poem"],
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
            
            if (new_poem.length === 0) {
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
        tags: ["Poem"],
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
