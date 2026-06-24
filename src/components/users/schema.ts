import {
  pipe,
  optional,
  array,
  object,
  string,
  trim,
  enum as enum_schema,
  maxLength,
  minLength,
} from 'valibot';
/////////////
import { RoleEnum } from "../../database/schemas.js"
// utils
import { uuid_schema, created_at, updated_at } from '../../utils/schemas.js';


const username_schema = pipe(string(), trim(), minLength(4), maxLength(256));
const password_schema = pipe(string(), trim(), minLength(4), maxLength(256));
const roles_schema = array(enum_schema(RoleEnum));



export const one_schema = object({
  id: uuid_schema,
  username: username_schema,
  roles: roles_schema
})

export const signup_req = object({
  username: username_schema,
  password: password_schema,
  roles: roles_schema
});

export const user_authorized_res = object({
  user: one_schema,
  access_token: string(),  
});
