import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { chosen_verses_table } from "../../database/schemas.js"
import { create_many_req, create_many_res, create_one_req, create_one_res } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const chosen_verses_route = new Hono()  


chosen_verses_route.post(
    "/chosen_verses",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Create One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added ChosenVerse", create_one_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "ChosenVerse already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_one_req, "Invalid data for ChosenVerse"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let new_chosen_verse = await db
                .insert(chosen_verses_table)
                .values(new_data)
                // .onConflictDoNothing()
                .returning()
                .then(res => res[0])
            
            // if the first item in res[0] is undefined,
            // then there was a conflict and it already exists
            if (!new_chosen_verse) {
                return c.json({ message: "ChosenVerse already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }
            return c.json(new_chosen_verse, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: create ChosenVerse")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

chosen_verses_route.post(
    "/chosen_verses/many",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Create Many",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    json_validator(create_many_req, "Invalid data, can't be used to create many ChosenVerses"),
    async (c) => {
        try {
            let new_data = await c.req.json()
            let new_chosen_verses = await db
                .insert(chosen_verses_table)
                .values(new_data)
                // .onConflictDoNothing()
                .returning()

            return c.json({created_items: new_chosen_verses, success_count: new_chosen_verses.length, failed_count: new_data.length - new_chosen_verses.length}, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error: creating multiple ChosenVerses")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
