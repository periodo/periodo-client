let _requestIDCounter = 0;

function bindRequestAction(dispatch, type) {
  const requestID = _requestIDCounter

  _requestIDCounter += 1;

  return (readyState, rest={}) => {
    dispatch(Object.assign({ requestID, type, readyState }, rest));
  }
}

module.exports = {
  bindRequestAction,
}
