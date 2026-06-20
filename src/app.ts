import { Hono } from "hono";
import {
  resolver,
  describeRoute,
  openAPIRouteHandler
} from "hono-openapi";
import * as v from "valibot";
import { Scalar } from '@scalar/hono-api-reference'
// Middlewares
import { structuredLogger } from '@hono/structured-logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
// utils
import  {logger} from "./utils/logger.js"

const app = new Hono();


const base_response = v.object({message: v.string()})

app.use(
  structuredLogger({
    createLogger: () => logger,
  })
)
app.use(secureHeaders());
app.use(cors());
app.use(compress());


app.get(
  '/', 
  describeRoute({
    operationId: "index",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(v.object({
              title: v.string(),
              description: v.string(),
              version: v.string(),
              docs: v.string(),
              openapi: v.string()
            })),
          },
        },
      },
    },
  }),
  (c) => {
  var project_metadata = {
    title: "Adeeb Hono",
    description: "Adeeb's Backend iteration in JS & TS, using Hono",
    version: "0.1.0",
    docs: "/docs",
    openapi: "/openapi.json"
  }
  c.status(200)
  return c.json(project_metadata);
});

app.get(
  '/ping', 
  describeRoute({
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(base_response),
          },
        },
      },
    },
  }),
  async (c) => {
  c.status(200)
  return c.json({message: 'pong'});
});



app.get(
  "/openapi.json",
  describeRoute({
    responses: {
      200: {
        description: "Get OpenAPI spec",
      },
    },
  }),
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Adeeb Hono",
        description: "Adeeb's Backend iteration in JS & TS, using Hono",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      }
    },
    includeEmptyPaths: true
  }),
);

app.get(
  '/docs',
  describeRoute({
    responses: {
      200: {
        description: "Scalar docs",
      },
    },
  }),
  Scalar({
    title: "Adeeb Hono",
    url:   "/openapi.json",
    // theme: 'purple',
    darkMode: true
  })
)

export { app }
