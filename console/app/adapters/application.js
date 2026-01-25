import CoreApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import AdapterError from '@ember-data/adapter/error';

export default class ApplicationAdapter extends CoreApplicationAdapter {
    /**
     * Handles the response from an AJAX request.
     * Checks if the response body is HTML (often a 404 or misconfiguration) and throws a readable error.
     *
     * @param {number} status - HTTP status code of the response.
     * @param {object} headers - Response headers.
     * @param {object} payload - Response payload.
     * @param {object} requestData - Original request data.
     * @return {Object | AdapterError} - The response object or an AdapterError in case of errors.
     */
    handleResponse(status, headers, payload, requestData) {
        // Debug: Log the actual URL being requested
        console.log('[DEBUG] API Request URL:', requestData?.url);
        console.log('[DEBUG] API Host config:', this.host);
        console.log('[DEBUG] Response status:', status);
        console.log('[DEBUG] Response type:', typeof payload);
        console.log('[DEBUG] Response headers:', headers);
        console.log('[DEBUG] Response payload preview:', typeof payload === 'string' ? payload.substring(0, 200) : payload);

        // Check for HTML response which usually indicates a misconfiguration or 404 from a web server
        if (typeof payload === 'string' && (payload.startsWith('<!DOCTYPE html>') || payload.startsWith('<html'))) {
            console.error('[DEBUG] HTML response detected - likely routing to console instead of API');
            console.error('[DEBUG] Full HTML response:', payload);
            return new AdapterError([{
                title: 'Invalid API Response',
                detail: 'The API returned an HTML response instead of JSON. This usually indicates that the API_HOST is misconfigured or the endpoint does not exist. Check browser console for debug logs.'
            }]);
        }

        return super.handleResponse(...arguments);
    }
}
