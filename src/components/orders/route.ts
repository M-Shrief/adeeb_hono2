import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { OrderStatusEnum, RoleEnum, order_table, prints_table } from "../../database/schemas.js"
import { one_order_schema, create_order_req, create_order_res } from './schema.js'
///// Utils
import { logger } from '../../utils/logger.js';
import { auth_header_validator, id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema, describe_jwt_security} from '../../utils/api.js';
import { verify_token, create_permission, PERMISSIONS, check_permission, RoleEnumType } from "../../utils/auth.js"


export const orders_route = new Hono() 


// GET /orders
// GET /orders/me
// GET /orders/:id

// POST /orders
orders_route.post(
    "/orders",
    describeRoute({
        tags: ["Orders"],
        summary: "Create Order",
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Order", create_order_req),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for order", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_order_req, "Invalid data for Order"),
    async(c) => {
        let data = await c.req.json()
        let delivery_schedule = new Date()
        delivery_schedule.setDate(delivery_schedule.getDate() + 7);

        let new_order = await db
            .insert(order_table)
            .values({ 
                name: data.name,
                phone: data.phone,
                address: data.address,
                reviewed: false,
                is_updateable: true,
                delivery_schedule: delivery_schedule,
                status: OrderStatusEnum.IN_PROGRESS,
                user_id: data.user_id
            })
            // .onConflictDoNothing()
            .returning()
            .then(res => res[0])

        let prints_data = data.prints.map((item: any) => { return {...item, user_id: new_order.user_id, order_id: new_order.id}})
        let new_prints = await db
            .insert(prints_table)
            .values([...prints_data])
            .onConflictDoNothing()
            .returning()


        return c.json({...new_order, prints: new_prints}, HttpStatusCode.CREATED)

    }
)
// POST /orders/many

// POST /orders/:order_id/prints

// PUT /orders/:id
// PUT /orders/:order_id/prints/:print_id

// DELETE /orders/:id
// DELETE /orders/:order_id/prints/:print_id
