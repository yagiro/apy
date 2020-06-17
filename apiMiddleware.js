import {
  createFailureAction,
  createRequestAction,
  handleFetchResponse,
  isApiAction,
  sendRequest,
} from './apiMiddlewareHelpers';

const apiMiddleware = store => next => apiAction => {

  if (!isApiAction(apiAction)) return next(apiAction);

  // console.log('api middleware: handling api action', apiAction);

  next(createRequestAction(apiAction));

  return sendRequest(apiAction)
     .then(fetchResponse => {
        // console.log('api middleware: received fetch response', fetchResponse);
        return handleFetchResponse(fetchResponse, { apiAction, next });
     })
     .catch((apiError) => {
        // console.log('api middleware: caught api error', apiError);
        next(createFailureAction(apiAction, apiError));
        throw apiError;
     });
};

export default apiMiddleware;

/*
    TODO: there is a bug where a successfull response promise resolves with ok: undefined
*/
