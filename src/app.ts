import { Hono } from "hono";
// Middlewares
import { logger as loggerMiddleware } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';


const app = new Hono();



app.use(loggerMiddleware());
app.use(secureHeaders());
app.use(cors());
app.use(compress());


app.get(
  '/', 
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
  async (c) => {
  c.status(200)
  return c.json({message: 'pong'});
});


export { app }
