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
    Object.entries(rawConfig).forEach(([key, value]) => {
        const configPath = RUNTIME_CONFIG_MAP[key];

        if (configPath) {
            const coercedValue = coerceValue(key, value);
            set(config, configPath, coercedValue);
        } else {
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
    if (config.APP.disableRuntimeConfig) {
        return;
    }

    // Always fetch from server
    try {
        const startTime = performance.now();
        const response = await fetch('/fleetbase.config.json', {
            cache: 'no-store', // Force network fetch
        });

        if (!response.ok) {
            debug('[Runtime Config] No fleetbase.config.json found, using built-in config defaults');
            return;
        }

        const runtimeConfig = await response.json();
        const endTime = performance.now();

        debug(`[Runtime Config] Fetched from server in ${(endTime - startTime).toFixed(2)}ms`);

        // Apply config
        applyRuntimeConfig(runtimeConfig);
    } catch (e) {
        debug(`[Runtime Config] Failed to load runtime config: ${e.message}`);
    }
}
