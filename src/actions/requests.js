function dispatchRequestAction(dispatch, type, readyState, opts={}) {
  return dispatch(Object.assign({ type, readyState }, opts));
}

function bindRequestAction(dispatch, type) {
  return dispatchRequestAction.bind(null, dispatch, type)
}

module.exports = {
  dispatchRequestAction,
  bindRequestAction,
}
