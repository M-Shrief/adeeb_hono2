import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { prose_qoutes_table } from "../../database/schemas.js"
import { one_schema, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const prose_qoute_route = new Hono()  


prose_qoute_route.get(
    "/prose_qoutes",
    describeRoute({
        tags: ["ProseQoutes"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All ProseQoutes", get_all_schema(one_schema)),
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
            let { created_at, updated_at, ...rest} = getTableColumns(prose_qoutes_table) // select all columns, except created_at & updated_at.
            let [prose_qoutes, counts] = await Promise.all([
                await db.select({...rest}).from(prose_qoutes_table).limit(limit).offset(offset),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(prose_qoutes_table)
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

            return c.json(
                {
                    data: prose_qoutes,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )
        } catch(e) {
            logger.error({error:e}, "Error getting all ProseQoutes")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }

    }
)

prose_qoute_route.get(
    "/prose_qoutes/:id",
    describeRoute({
        tags: ["ProseQoutes"],
        summary: "Get One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get ProseQoute", one_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "ProseQoute's not Found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")
            let prose_qoute = await db.query.prose_qoutes_table.findFirst({
                columns: {
                    id: true,
                    qoute: true,
                    source: true,
                    tags: true,
                    adeeb_id: true,
                    reviewed: true,
                },
                where: (prose_qoutes_table, { eq }) => eq(prose_qoutes_table.id, id),
            })
            if (!prose_qoute) {
                return c.json({message: "ProseQoute's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            return c.json(prose_qoute, HttpStatusCode.OK)

        } catch(e) {
            logger.error({error:e}, "Error getting ProseQoute by ID")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

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

prose_qoute_route.put(
    "/prose_qoutes/:id",
    describeRoute({
        tags: ["ProseQoutes"],
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
            
            await db.update(prose_qoutes_table).set({...data, updated_at: sql`NOW()`}).where(eq(prose_qoutes_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Updating ProseQoute")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

prose_qoute_route.delete(
    "/prose_qoutes/:id",
    describeRoute({
        tags: ["ProseQoutes"],
        summary: "Delete One",
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Deleted Successfully"),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request, try again later.", base_response_schema),
        },
    }),
    id_param_validator(),
    async (c) => {
        try {
            let id = c.req.param("id")
            
            await db.delete(prose_qoutes_table).where(eq(prose_qoutes_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Deleting ProseQoute")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
