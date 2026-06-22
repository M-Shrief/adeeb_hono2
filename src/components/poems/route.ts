import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { poem_table } from "../../database/schemas.js"
import { create_many_req, create_many_res, create_one_req, create_one_res } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const poem_route = new Hono()  


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
