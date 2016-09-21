let Promise = require('es6-promise').Promise;

// config values
const WAIT_FREQUENCY = 250;
const WAIT_TIMEOUT = 10000;

// wrap pendo.findGuideById() in a promise
function findGuideById (id) {
  return waitForPendo()
  .then(function (pendo) {
    return pendo.findGuideById(id);
  });
}

// wrap pendo.findGuideByName() in a promise
function findGuideByName (name) {
  return waitForPendo()
  .then(function (pendo) {
    return pendo.findGuideByName(name);
  });
}

// resolve to pendo.guides once it's defined
function getGuides () {
  return waitForPendo()
  .then(function (pendo) {
    return pendo.guides;
  });
}

// attempt to launch a guide
function launchGuide (guideId) {
  return findGuideById(guideId)
  .then(function (guide) {
    guide.launch();
    if (guide.isShown()) {
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Unable to launch guide'));
    }
  });
}

// attempt to show a step
function showStep (guideId, stepId) {
  return findGuideById(guideId)
  .then(function (guide) {
    let step = guide.findStepById(stepId);
    step.show();
    if (step.isShown()) {
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Unable to show step'));
    }
  });
}

// resolve to Pendo library once it has loaded (along with available guides)
function waitForPendo (elapsedTime = 0) {
  return new Promise(function (resolve, reject) {
    if (window.pendo && window.pendo.guides) {
      resolve(window.pendo);
    } else {
      if (elapsedTime >= WAIT_TIMEOUT) {
        reject(new Error('Timed out waiting for Pendo'));
      } else {
        window.setTimeout(function () {
          resolve(waitForPendo(elapsedTime + WAIT_FREQUENCY));
        }, WAIT_FREQUENCY);
      }
    }
  });
}

// export public methods
module.exports = {
  findGuideById: findGuideById,
  findGuideByName: findGuideByName,
  getGuides: getGuides,
  launchGuide: launchGuide,
  showStep: showStep
}
