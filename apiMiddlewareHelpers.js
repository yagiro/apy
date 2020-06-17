import defaultSettings from './defaultSettings';
import ApiError from './ApiError';
import { contentTypes, headerNames, httpMethods, requestTypes } from './apiConsts';

const API_ACTION_FLAG = '@@API_ACTION';

const REQUEST_SUFFIX = '_REQUEST';
const REQUEST_FLAG = '@@API_REQUEST';

const SUCCESS_SUFFIX = '_SUCCESS';
const SUCCESS_FLAG = '@@API_RESPONSE_SUCCESS';

const FAIL_SUFFIX = '_FAIL';
const FAIL_FLAG = '@@API_RESPONSE_FAIL';


const hasMetaFlag = (action, flag) => action.meta && action.meta[flag];

export const isApiAction = action => hasMetaFlag(action, API_ACTION_FLAG);

export const isRequestApiAction = action => hasMetaFlag(action, REQUEST_FLAG);
export const isSuccessApiAction = action => hasMetaFlag(action, SUCCESS_FLAG);
export const isFailureApiAction = action => hasMetaFlag(action, FAIL_FLAG);

export const getOrigAction = apiAction => apiAction.meta.origAction;
export const getOrigActionType = apiAction => getOrigAction(apiAction).type;

function buildFetchParams(apiAction) {
  const { payload } = apiAction;
  const { request } = payload;
  const { url, options } = request;
  return {
     url,
     options,
  };
}

export const sendRequest = apiAction => {
  const { url, options } = buildFetchParams(apiAction);
  return fetch(url, options);
};

export function createResponse(fetchResponse, parsedResponseBody) {
  const parsedHeaders = extractResponseHeaders(fetchResponse);
  return {
     ...fetchResponse,
     headers: parsedHeaders,
     body: parsedResponseBody,
  };
}

export function extractResponseHeaders(fetchResponse) {
  const headers = {};
  const headerEntries = [ ...fetchResponse.headers.entries() ];
  headerEntries.forEach(([ name, value ]) => {
     headers[name] = value;
  });
  return headers;
}

export const handleFetchResponse = (fetchResponse, context) => {

  const { apiAction, next } = context;

  const {
     meta: {
        settings: {
           extractResponseBody = defaultSettings.extractResponseBody,
           rejectBadResponse = defaultSettings.rejectBadResponse,
           isResponseOk = defaultSettings.isResponseOk,
           normalize = identityFunc,
        }
     },
  } = apiAction;

  if (isResponseOk(fetchResponse)) {
     return extractResponseBody(fetchResponse)
        .then(normalize)
        .then(parsedResponseBody => {
           const response = createResponse(fetchResponse, parsedResponseBody);
           next(createResponseAction(apiAction, response));
           return {
              ok: response.ok,
              response,
           };
        });
  }
  else {
     const apiError = new ApiError(fetchResponse);

     if (!rejectBadResponse) {
        next(createFailureAction(apiAction, apiError));
     }

     return rejectBadResponse
        ? Promise.reject(apiError)
        : Promise.resolve(apiError);
  }
};

export const createRequestActionType = type => `${ type }${ REQUEST_SUFFIX }`;
export const createSuccessActionType = type => `${ type }${ SUCCESS_SUFFIX }`;
export const createFailureActionType = type => `${ type }${ FAIL_SUFFIX }`;

export const createRequestAction = (origAction) => {
  return {
     type: createRequestActionType(origAction.type),
     meta: {
        [REQUEST_FLAG]: true,
        origAction,
     },
  };
};

export const createResponseAction = (origAction, parsedResponse) => {
  return {
     type: createSuccessActionType(origAction.type),
     payload: {
        response: parsedResponse,
     },
     meta: {
        [SUCCESS_FLAG]: true,
        origAction,
     },
  };
};
export const createFailureAction = (origAction, apiError) => {
  return {
     type: createFailureActionType(origAction.type),
     error: true,
     payload: apiError,
     meta: {
        [FAIL_FLAG]: true,
        origAction,
     },
  };
};

const identityFunc = x => x;

const settingsByRequestType = {
  [requestTypes.json]: {
     contentType: contentTypes.json,
     stringifyBody: body => JSON.stringify(body),
  },
  [requestTypes.formUrlEncoded]: {
     contentType: contentTypes.formUrlEncoded,
     stringifyBody: form =>
        Object.entries(form)
           .map(([ name, value ]) => `${ name }=${ value }`)
           .join('&')
  },
};

const createSettingsByRequestType = (requestType, settings) => {

  let { headers, body } = settings;

  const requestTypeConfig = settingsByRequestType[requestType];

  if (requestTypeConfig) {
     headers = {
        [headerNames.contentType]: requestTypeConfig.contentType,
        ...headers,
     };
     body = body && requestTypeConfig.stringifyBody(body);
  }

  return {
     headers,
     body,
  };
};

export const createApiAction = (type, url, method = httpMethods.GET, settings = {}, meta) => {

  const {
     options,
     normalize,
     extractResponseBody,
     rejectBadResponse,
     requestType = defaultSettings.requestType,
  } = settings;

  const { body, headers } = createSettingsByRequestType(requestType, settings);

  return {
     type,
     meta: {
        [API_ACTION_FLAG]: true,
        settings: {
           normalize,
           extractResponseBody,
           rejectBadResponse,
        },
        ...meta,
     },
     payload: {
        request: {
           url,
           options: {
              method,
              body,
              headers,
              ...options
           },
        },
     },
  };
};

export const getResponseFromApiAction = apiAction => apiAction.payload && apiAction.payload.response;

export const getResponseBodyFromApiAction = apiAction => getResponseFromApiAction && apiAction.payload.response.body;

export const getBodyFromResponseAction = responseAction => responseAction.response.body;

export const extractEmptyResponseBody = response => response.text();

export const isErrorResponse = response => response.error;
