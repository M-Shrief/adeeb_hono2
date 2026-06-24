import { decode, sign, verify } from 'hono/jwt'
import { JWTPayload } from 'hono/utils/jwt/types';
import bcrypt from "bcrypt"
// import { createMiddleware } from 'hono/factory';
////
import { JWT_PRIVATE_KEY, JWT_PUBLIC_KEY } from '../config.js'
import { RoleEnum } from '../database/schemas.js';

export const hash_password = async (password: string) => {
  const salt = bcrypt.genSaltSync(); // default 10
  return await bcrypt.hash(password, salt);
};

export const compare_password = async (password: string, pass_hash: string) =>
  await bcrypt.compare(password, pass_hash);


