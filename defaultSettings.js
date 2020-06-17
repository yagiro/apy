import { requestTypes } from './apiConsts';

const defaultSettings = {
  isResponseOk: fetchResponse => fetchResponse.ok,
  extractResponseBody: response => response.json(),

  /**
   * "Bad" response <--- fetchResponse.ok = false (https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)
   *
   * When a "bad" response is received:
   *
   *        When rejectBadResponse = true
   *           resolve handler will NOT get invoked for bad response.
   *           reject handler WILL get invoked for bad response.
   *
   *        When rejectBadResponse = false
   *           resolve handler WILL get invoked for bad response.
   *           reject handler will NOT get invoked for bad response.
   * */

  rejectBadResponse: true,
  requestType: requestTypes.json,
};

export default defaultSettings;
