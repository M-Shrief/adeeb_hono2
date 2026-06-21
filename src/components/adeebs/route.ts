import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
/////
import { db } from "../../database/index.js"
import { adeeb_table } from "../../database/schemas.js"
import { create_many_req, create_many_res, create_one_req, create_one_res } from './schema.js'
///// Utils
import { json_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema , get_described_route } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const adeeb_route = new Hono()  

adeeb_route.post(
    "/",
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
    "/many",
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
