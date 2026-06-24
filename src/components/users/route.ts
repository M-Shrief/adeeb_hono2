import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { user_table } from "../../database/schemas.js"
import { one_schema, signup_req, user_authorized_res } from './schema.js'
///// Utils
import { logger } from '../../utils/logger.js';
import { id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema } from '../../utils/api.js';
import { compare_password, hash_password, sign_token } from "../../utils/auth.js"

export const users_route = new Hono() 




// GET /users
// GET /users/me
// GET /users/:id

users_route.post(
    "/users/signup",
    describeRoute({
        tags: ["Users"],
        summary: "Signup",
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful signup", user_authorized_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "User already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(signup_req, "Invalid data for User"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let hashed_pass = await hash_password(new_data.password)
            let new_user = await db
                .insert(user_table)
                .values({username: new_data.username, password: hashed_pass, roles: new_data.roles})
                .onConflictDoNothing({ target: [user_table.username] })
                .returning()
                .then(res => res[0])
            if (!new_user) {
                return c.json({ message: "User already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }

            let access_token = await sign_token(new_user.id, new_user.username, new_user.roles)

            return c.json({user: {id: new_user.id, username: new_user.username, roles: new_user.roles}, access_token}, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error in signup req")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

// POST /users/login

// PUT /users/me
// PUT /users/:id

// DELETE /users/me
// DELETE /users/:id
