import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { chosen_verses_table } from "../../database/schemas.js"
import { one_schema, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
///// Utils
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';

export const chosen_verses_route = new Hono()  


chosen_verses_route.get(
    "/chosen_verses",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All ChosenVerses", get_all_schema(one_schema)),
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
            let { created_at, updated_at, ...rest} = getTableColumns(chosen_verses_table) // select all columns, except created_at & updated_at.
            let [chosen_verses, counts] = await Promise.all([
                await db.select({...rest}).from(chosen_verses_table).limit(limit).offset(offset),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(chosen_verses_table)
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

            return c.json(
                {
                    data: chosen_verses,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )
        } catch(e) {
            logger.error({error:e}, "Error getting all ChosenVerses")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }

    }
)

chosen_verses_route.get(
    "/chosen_verses/:id",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Get One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get ChosenVerse", one_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "ChosenVerse's not Found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")
            let { created_at, updated_at, ...rest} = getTableColumns(chosen_verses_table) // select all columns, except created_at & updated_at.
            let chosen_verse = await db.query.chosen_verses_table.findFirst({
                columns: {
                    id: true,
                    adeeb_id: true,
                    poem_id: true,
                    tags: true,
                    verses: true,
                    is_couplet: true,
                    reviewed: true,
                },
                where: (chosen_verses_table, { eq }) => eq(chosen_verses_table.id, id),
            })
            if (!chosen_verse) {
                return c.json({message: "ChosenVerse's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            return c.json(chosen_verse, HttpStatusCode.OK)

        } catch(e) {
            logger.error({error:e}, "Error getting ChosenVerse by ID")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

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

chosen_verses_route.put(
    "/chosen_verses/:id",
    describeRoute({
        tags: ["ChosenVerses"],
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
            
            await db.update(chosen_verses_table).set({...data, updated_at: sql`NOW()`}).where(eq(chosen_verses_table.id, id))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Updating ChosenVerse")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
