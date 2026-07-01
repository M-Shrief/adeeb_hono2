import { GlideClient, GlideClientConfiguration } from "@valkey/valkey-glide"
/////
import { VALKEY_HOST, VALKEY_PASSWORD, VALKEY_PORT} from "../config.js"

export const cache = await GlideClient.createClient({
    addresses: [{host: VALKEY_HOST, port: VALKEY_PORT}],
    credentials: {
        password: VALKEY_PASSWORD
    },
    requestTimeout: 5000,
    useTls: false,
} as GlideClientConfiguration)

