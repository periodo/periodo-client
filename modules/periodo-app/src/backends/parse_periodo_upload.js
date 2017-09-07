"use strict";

// Read a File object representing a PeriodO dataset. Return a promise that
// resolves to the dataset as an object if successful, else reject with the
// reason for failure. A valid PeriodO dataset must have a periodCollection
// key at the very least.
//
// TODO: make a better check for validity of dataset. Maybe run it through a
// few of the helper functions?

module.exports = function (file) {
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onload = upload => {
      let data

      try {
        data = JSON.parse(upload.target.result);

        if (typeof data !== 'object') {
          throw new Error(`${file.name} is not a JSON document.`);
        } else if (!data.periodCollections) {
          throw new Error(`${file.name} does not seem to be a valid PeriodO dataset.`);
        }
      } catch (err) {
        reject(err);
      }

      resolve(data);
    }

    reader.readAsText(file);
  });
}
