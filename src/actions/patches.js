const Immutable = require('immutable')
    , { bindRequestAction } = require('./requests')
    , { getBackendWithDataset } = require('./backends')
    , { makePatch } = require('../utils/patch')
    , { filterByHash } = require('../utils/patch_collection')


const {
  REQUEST_GENERATE_DATASET_PATCH
} = require('../types').actions

const {
  PENDING,
  SUCCESS,
  FAILURE,
} = require('../types').readyStates

const {
  PUSH,
  PULL,
} = require('../types').patchDirections

// push means going from a->b; pull from b->a
function generateDatasetPatch(originBackend, remoteBackend, action=PUSH) {
  if (action !== PUSH && action !== PULL) {
    throw new Error(`Action must either be ${PUSH} or ${PULL}.`);
  }

  if (!originBackend || !remoteBackend) {
    throw new Error('Must pass both origin and remote backend.');
  }

  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_GENERATE_DATASET_PATCH
    )

    dispatchReadyState(PENDING);

    const backendRequests = Promise.all([
      dispatch(getBackendWithDataset(originBackend)),
      dispatch(getBackendWithDataset(remoteBackend)),
    ])

    // FIXME: Handle errors in responses?
    return backendRequests
      .then(([originResp, remoteResp]) => {
        const push = action === PUSH
            , originID = originResp.responseData.backend.id
            , originDataset = originResp.responseData.dataset
            , remoteDataset = remoteResp.responseData.dataset
            , hashObjectStore = `${push ? 'forward' : 'backward'}Hashes`

        const filterHashes = hashes =>
          db.backendDatasetPatches
            .where(hashObjectStore)
            .anyOf(hashes.toArray())
            .and(({ backendID }) => backendID === originID)
            .uniqueKeys()

        // if PUSH, make remote look like origin.
        // if PULL, make origin look like remote.
        const rawPatch = Immutable.fromJS(
          push
            ? makePatch(remoteDataset.toJS(), originDataset.toJS())
            : makePatch(originDataset.toJS(), remoteDataset.toJS())
        )

        return filterByHash(rawPatch, push, filterHashes)
      })
      .then(patch => {
        dispatchReadyState(SUCCESS, { patch });

        return patch;
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { error, errorString: error.toString() })
      })
  }
}

module.exports = {
  generateDatasetPatch
}

/*
function IDBBackend(opts) {
  this.saveSubmittedPatch = function (patchObj) {
    return require('./db')(this.name).localPatches
      .put(patchObj)
      .then(() => patchObj.id)
  }

  this.markSubmittedPatchMerged = function (localPatchID, serverPatchObj) {
    const db = require('./db')(this.name)
      , prefixMatch = require('./utils/prefix_match')
      , serverURL = prefixMatch(serverPatchObj.created_from, serverPatchObj.url)

    const identifiers = Object.keys(serverPatchObj.identifier_map).map(localID => ({
      id: `${serverURL}|${localID}`,
      serverURL,
      localID,
      serverID: serverPatchObj.identifier_map[localID]
    }));

    // FIXME: We don't use ID maps anymore. instead, we should go ahead and
    // replace any mentions of the skolem ID with the new permanent identifier
    return db.transaction('rw', db.idMap, db.localPatches, () => {
      db.localPatches.update(localPatchID, { resolved: true, merged: true });
      identifiers.forEach(obj => db.idMap.put(obj));
    });
  }

  this.markSubmittedPatchNotMerged = function (localPatchID) {
    return require('./db')(this.name).localPatches.update(localPatchID, {
      resolved: true,
      merged: false
    });
  }

  this.getSubmittedPatch = function (id) {
    return require('./db')(this.name).localPatches.get(id);
  }


  this.getSubmittedPatches = function () {
    return require('./db')(this.name).localPatches.toArray()
  }
}
*/
