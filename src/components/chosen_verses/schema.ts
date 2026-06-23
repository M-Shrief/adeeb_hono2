import {
  pipe,
  optional,
  array,
  object,
  number,
} from 'valibot';
/////////////
// utils
import { uuid_schema, tags_schema, reviewed_schema, created_at, updated_at, verses_schema, is_couplet_schema } from '../../utils/schemas.js';



export const one_schema = object({
  id: uuid_schema,
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb_id: uuid_schema,
  poem_id: uuid_schema,
})

export const create_one_req = object({
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb_id: uuid_schema,
  poem_id: uuid_schema,
});

export const create_one_res = object({
  id: uuid_schema,
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb_id: uuid_schema,
  poem_id: uuid_schema,

  created_at, 
  updated_at,
});

export const create_many_req = array(create_one_req)
export const create_many_res = object({
  created_items: array(create_one_res),
  success_count: number(),
  failed_count: number(),
})
