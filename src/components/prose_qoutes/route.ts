import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { prose_qoutes_table } from "../../database/schemas.js"
import { create_many_req, create_many_res, create_one_req, create_one_res } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const prose_qoute_route = new Hono()  


prose_qoute_route.post(
    "/prose_qoutes",
    describeRoute({
        tags: ["ProseQoutes"],
        summary: "Create One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added ProseQoute", create_one_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "ProseQoute already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_one_req, "Invalid data for ProseQoute"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let new_prose_qoute = await db
                .insert(prose_qoutes_table)
                .values(new_data)
                // .onConflictDoNothing()
                .returning()
                .then(res => res[0])
            
            // if the first item in res[0] is undefined,
            // then there was a conflict and it already exists
            if (!new_prose_qoute) {
                return c.json({ message: "ProseQoute already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }
            return c.json(new_prose_qoute, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: create ProseQoute")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

prose_qoute_route.post(
    "/prose_qoutes/many",
    describeRoute({
        tags: ["ProseQoutes"],
        summary: "Create Many",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    json_validator(create_many_req, "Invalid data, can't be used to create many ProseQoutes"),
    async (c) => {
        try {
            let new_data = await c.req.json()
            let new_prose_qoutes = await db
                .insert(prose_qoutes_table)
                .values(new_data)
                // .onConflictDoNothing()
                .returning()

            return c.json({created_items: new_prose_qoutes, success_count: new_prose_qoutes.length, failed_count: new_data.length - new_prose_qoutes.length}, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: creating multiple ProseQoutes")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)