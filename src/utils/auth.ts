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


const PERMISSIONS = {
    WRITE: "write",
    READ: "read"
} as const
type PERMISSION = typeof PERMISSIONS[keyof typeof PERMISSIONS];


type RoleEnumType = typeof RoleEnum[keyof typeof RoleEnum];

export function create_permission(role: RoleEnumType, op: PERMISSION = PERMISSIONS.READ): string {
    return role + ":" + op
}

export function create_permissions(roles: RoleEnumType[]) {
    let permissions: string[] = []

    for(let role of roles) {
        let read_permission = create_permission(role, PERMISSIONS.READ)
        permissions.push(read_permission)

        let write_permission = create_permission(role, PERMISSIONS.WRITE)
        permissions.push(write_permission)
    }

    return permissions
}


export const sign_token = async (id: string, username: string, roles: RoleEnumType[], exp_after_hours: number = 2) => {
    let user = {
        id,
        username,
        roles
    }
    let permissions = create_permissions(roles)

    return await sign(
        {
        ...user,
        permissions,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * exp_after_hours, // default is 2 Hours.
        iat: Math.floor(Date.now() / 1000),
        },
        JWT_PRIVATE_KEY,
        'RS256',
    );
};

export const verify_token = async (auth_header: string): Promise<JWTPayload | null> => {
    try {
        let token = auth_header.slice(7)

        let payload =  await verify(token, JWT_PUBLIC_KEY, "RS256") 

        return payload
    } catch(e) {
        console.error(e)
        return null
    }
}


