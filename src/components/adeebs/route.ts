import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { adeeb_table } from "../../database/schemas.js"
import { adeeb_schema, create_many_req, create_many_res, create_one_req, create_one_res } from './schema.js'
///// Utils
import { json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const adeeb_route = new Hono()  


adeeb_route.get(
    "/adeebs",
    describeRoute({
        tags: ["Adeeb"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Adeebs", get_all_schema(adeeb_schema)),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    async function get_all(c) {
        let limit = Number(c.req.query('limit')) || 100
        let offset = Number(c.req.query('offset')) || 0
        // We make 2 seperate queries, to get the data & the total_count of rows.
        // we can make 1 query, but we'll need to make manual transformation
        // so that we remove the count field from every item in the array.
        let { created_at, updated_at, ...rest} = getTableColumns(adeeb_table) // select all columns, except created_at & updated_at.
        let [adeebs, counts] = await Promise.all([
            await db.select({...rest}).from(adeeb_table).limit(limit).offset(offset),
            await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(adeeb_table)
        ])

        return c.json(
            {
                data: adeebs,
                limit, 
                offset, 
                total_count: counts[0].total_count
            },
            HttpStatusCode.OK
        )
    }
)

adeeb_route.post(
    "/adeebs",
    describeRoute({
        tags: ["Adeeb"],
        summary: "Create One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added Adeeb", create_one_res),
           ...get_described_route(HttpStatusCode.NOT_ACCEPTABLE, "Adeeb already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_one_req, "Invalid data for Adeeb"),
    async function create_one_adeeb(c) {
        try {
            let new_data = await c.req.json()
            let new_adeeb = await db
                .insert(adeeb_table)
                .values(new_data)
                .onConflictDoNothing({ target: [adeeb_table.name]})
                .returning()
            
            if (new_adeeb.length === 0) {
                return c.json({ message: "Adeeb already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }
            return c.json(new_adeeb, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: create Adeeb")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.post(
    "/adeebs/many",
    describeRoute({
        tags: ["Adeeb"],
        summary: "Create Many",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    json_validator(create_many_req, "Invalid data, can't be used to create many Adeebs"),
    async function create_many_adeeb(c) {
        try {
            let new_data = await c.req.json()
            let new_adeebs = await db
                .insert(adeeb_table)
                .values(new_data)
                .onConflictDoNothing({ target: [adeeb_table.name]})
                .returning()

            return c.json({created_items: new_adeebs, success_count: new_adeebs.length, failed_count: new_data.length - new_adeebs.length}, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: creating multiple Adeebs")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
