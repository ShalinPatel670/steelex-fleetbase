import config from '@fleetbase/console/config/environment';
import toBoolean from '@fleetbase/ember-core/utils/to-boolean';
import { set } from '@ember/object';
import { debug } from '@ember/debug';

/**
 * Maps allowed runtime keys to internal config paths.
 */
const RUNTIME_CONFIG_MAP = {
    API_HOST: 'API.host',
    API_NAMESPACE: 'API.namespace',
    SOCKETCLUSTER_PATH: 'socket.path',
    SOCKETCLUSTER_HOST: 'socket.hostname',
    SOCKETCLUSTER_SECURE: 'socket.secure',
    SOCKETCLUSTER_PORT: 'socket.port',
    OSRM_HOST: 'osrm.host',
    EXTENSIONS: 'APP.extensions',
};

/**
 * Cache key for localStorage
 */
const CACHE_KEY = 'fleetbase_runtime_config';
const CACHE_VERSION_KEY = 'fleetbase_runtime_config_version';
const CACHE_TTL = 0; // Disable cache

/**
 * Coerce and sanitize runtime config values based on key.
 *
 * @param {String} key
 * @param {*} value
 * @return {*}
 */
function coerceValue(key, value) {
    switch (key) {
        case 'SOCKETCLUSTER_PORT':
            return parseInt(value, 10);

        case 'SOCKETCLUSTER_SECURE':
            return toBoolean(value);

        case 'EXTENSIONS':
            return typeof value === 'string' ? value.split(',') : Array.from(value);

        default:
            return value;
    }
}

/**
 * Apply runtime config overrides based on strict allowlist mapping.
 *
 * @param {Object} rawConfig
 */
export function applyRuntimeConfig(rawConfig = {}) {
    console.log('[DEBUG] applyRuntimeConfig called with:', rawConfig);
    Object.entries(rawConfig).forEach(([key, value]) => {
        const configPath = RUNTIME_CONFIG_MAP[key];
        console.log('[DEBUG] Processing key:', key, '-> configPath:', configPath, 'value:', value);

        if (configPath) {
            const coercedValue = coerceValue(key, value);
            console.log('[DEBUG] Setting config path:', configPath, 'to:', coercedValue);
            set(config, configPath, coercedValue);
        } else {
            console.log('[DEBUG] Ignoring unknown key:', key);
            debug(`[Runtime Config] Ignored unknown key: ${key}`);
        }
    });
}

/**
 * Load and apply runtime config without caching.
 *
 * @export
 * @return {Promise<void>}
 */
export default async function loadRuntimeConfig() {
    console.log('[DEBUG] loadRuntimeConfig called, disableRuntimeConfig:', config.APP.disableRuntimeConfig);
    if (config.APP.disableRuntimeConfig) {
        console.log('[DEBUG] Runtime config disabled, returning');
        return;
    }

    // Always fetch from server
    try {
        const startTime = performance.now();
        console.log('[DEBUG] Fetching /fleetbase.config.json...');
        const response = await fetch('/fleetbase.config.json', {
            cache: 'no-store', // Force network fetch
        });

        console.log('[DEBUG] Fetch response status:', response.status, 'ok:', response.ok);

        if (!response.ok) {
            console.log('[DEBUG] Response not ok, using built-in config defaults');
            debug('[Runtime Config] No fleetbase.config.json found, using built-in config defaults');
            return;
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        console.log('[DEBUG] Content-Type:', contentType);
        if (!contentType || !contentType.includes('application/json')) {
            console.log('[DEBUG] Content type not JSON, ignoring');
            debug('[Runtime Config] Response is not JSON, ignoring...');
            return;
        }

        const runtimeConfig = await response.json();
        const endTime = performance.now();

        console.log('[DEBUG] Runtime config loaded successfully:', runtimeConfig);
        debug(`[Runtime Config] Fetched from server in ${(endTime - startTime).toFixed(2)}ms`);

        // Apply config
        applyRuntimeConfig(runtimeConfig);
        console.log('[DEBUG] Runtime config applied, new config.API.host:', config.API.host);
    } catch (e) {
        console.log('[DEBUG] Runtime config failed:', e.message);
        debug(`[Runtime Config] Failed to load runtime config: ${e.message}`);
    }
}
