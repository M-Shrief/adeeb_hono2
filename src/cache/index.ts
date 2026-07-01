import { GlideClient, GlideClientConfiguration, TimeUnit } from "@valkey/valkey-glide"
/////
import { VALKEY_HOST, VALKEY_PASSWORD, VALKEY_PORT} from "../config.js"
import { logger } from "../utils/logger.js"

export const cache = await GlideClient.createClient({
    addresses: [{host: VALKEY_HOST, port: VALKEY_PORT}],
    credentials: {
        password: VALKEY_PASSWORD
    },
    requestTimeout: 5000,
    useTls: false,
} as GlideClientConfiguration)


export const cache_get = async(key: string): Promise<{} | null> => {
    try {
        let cache_str = await cache.get(key)
        if (!cache_str) {
            return null
        }
        let obj = await JSON.parse(String(cache_str))
        return obj
    } catch(e) {
        logger.error({error: e}, `Cache get error for ${key} key`)
        return null
    }
}

export const cache_set = async(key: string, value: any) => {
    try {
        await cache.set(
            key, 
            JSON.stringify(value), 
            {
                expiry: {type: TimeUnit.Seconds, count: 60 * 15}
            }
        )
    } catch(e) {
        logger.error({error: e}, `Cache set error for ${key} key`)
    }
}



export const format_key_by_id = (prefix: string, id: string) => prefix + ":" + id 