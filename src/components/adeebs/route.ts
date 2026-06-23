import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { adeeb_table } from "../../database/schemas.js"
import { one_schema, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const adeeb_route = new Hono()  


adeeb_route.get(
    "/adeebs",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Adeebs", get_all_schema(one_schema)),
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
            let { created_at, updated_at, ...rest} = getTableColumns(adeeb_table) // select all columns, except created_at & updated_at.
            let [adeebs, counts] = await Promise.all([
                await db.select({...rest}).from(adeeb_table).limit(limit).offset(offset),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(adeeb_table)
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

            return c.json(
                {
                    data: adeebs,
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

adeeb_route.get(
    "/adeebs/:id",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Get One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get Adeeb", one_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "Adeeb's not Found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")
            let { created_at, updated_at, ...rest} = getTableColumns(adeeb_table) // select all columns, except created_at & updated_at.
            let adeeb = await db.query.adeeb_table.findFirst({
                columns: {
                    id: true,
                    name: true,
                    bio: true,
                    time_period: true,
                    reviewed: true,
                },
                where: (adeeb_table, { eq }) => eq(adeeb_table.id, id),
            })
            if (!adeeb) {
                return c.json({message: "Adeeb's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            return c.json(adeeb, HttpStatusCode.OK)

        } catch(e) {
            logger.error({error:e}, "Error getting Adeeb by ID")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.post(
    "/adeebs",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Create One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added Adeeb", create_one_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "Adeeb already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_one_req, "Invalid data for Adeeb"),
    async(c) => {
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
        tags: ["Adeebs"],
        summary: "Create Many",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    json_validator(create_many_req, "Invalid data, can't be used to create many Adeebs"),
    async (c) => {
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

adeeb_route.put(
    "/adeebs/:id",
    describeRoute({
        tags: ["Adeebs"],
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
            
            await db.update(adeeb_table).set({...data, updated_at: sql`NOW()`}).where(eq(adeeb_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Updating Adeeb")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.delete(
    "/adeebs/:id",
    describeRoute({
        tags: ["Adeebs"],
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
            
            await db.delete(adeeb_table).where(eq(adeeb_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Deleting Adeeb")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
