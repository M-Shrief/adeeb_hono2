import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
/////
import { db } from "../../database/index.js"
import { adeeb_table } from "../../database/schemas.js"
import { create_one_req, create_one_res } from './schema.js'
///// Utils
import { json_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema , get_described_route } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const adeeb_route = new Hono()  

adeeb_route.post(
    "/",
    describeRoute({
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
