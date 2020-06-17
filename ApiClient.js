import { createApiAction } from './apiMiddlewareHelpers';

export default class ApiClient {
  constructor(baseUrl, defaults) {
     this.baseUrl = baseUrl;
     this.defaults = defaults || {};
  }

  createAction(type, relativeUrl, method, settings, meta) {
     const url = this.baseUrl + relativeUrl;
     const mergedSettings = this.mergeSettings(settings);
     return createApiAction(type, url, method, mergedSettings, meta);
  }

  setDefaultHeader(name, value) {
     this.defaults.headers = {
        ...this.defaults.headers,
        [name]: value,
     };
  }

  mergeSettings(requestSettings) {

     const { headers, ...otherSettings } = requestSettings || {};

     const mergedHeaders = {
        ...this.defaults.headers,
        ...headers,
     };

     return {
        headers: mergedHeaders,
        ...otherSettings,
     };
  }
}
