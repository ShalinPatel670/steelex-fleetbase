import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import removeBootLoader from '../utils/remove-boot-loader';
import '@fleetbase/leaflet-routing-machine';

export default class ConsoleRoute extends Route {
    @service('universe/hook-service') hookService;
    @service store;
    @service session;
    @service router;
    @service currentUser;
    @service intl;

    /**
     * Require authentication to access all `console` routes.
     *
     * @param {Transition} transition
     * @return {Promise}
     * @memberof ConsoleRoute
     */
    async beforeModel(transition) {
        console.log('[DEBUG] Console route beforeModel, session.isAuthenticated:', this.session.isAuthenticated);
        await this.session.requireAuthentication(transition, 'auth.login');
        console.log('[DEBUG] requireAuthentication passed, session.isAuthenticated:', this.session.isAuthenticated);

        this.hookService.execute('console:before-model', this.session, this.router, transition);

        if (this.session.isAuthenticated) {
            console.log('[DEBUG] Loading current user...');
            console.log('[DEBUG] Session data before user load:', this.session.data);

            try {
                const result = await this.session.promiseCurrentUser(transition);
                console.log('[DEBUG] Current user loaded successfully:', result);
                return result;
            } catch (error) {
                console.log('[DEBUG] Current user loading failed with error:', error);
                console.log('[DEBUG] Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    fullError: error
                });
                throw error;
            }
        } else {
            console.log('[DEBUG] Session not authenticated, skipping current user load');
        }
    }

    /**
     * Register after model hook.
     *
     * @param {DS.Model} model
     * @param {Transition} transition
     * @memberof ConsoleRoute
     */
    async afterModel(model, transition) {
        this.hookService.execute('console:after-model', this.session, this.router, model, transition);
        removeBootLoader();
    }

    /**
     * Route did complete transition.
     *
     * @memberof ConsoleRoute
     */
    @action didTransition() {
        this.hookService.execute('console:did-transition', this.session, this.router);
    }

    /**
     * Get the branding settings.
     *
     * @return {BrandModel}
     * @memberof ConsoleRoute
     */
    model() {
        return this.store.findRecord('brand', 1);
    }
}
