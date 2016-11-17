let Promise = require('es6-promise').Promise;

// config values
const WAIT_FREQUENCY = 250;
const WAIT_TIMEOUT = 10000;

// returns a promise to be resolved by guidesLoaded event handler
let guidesMonitor = (function () {
  let eventHandlerRegistered = false;
  let deferreds = [];
  return function () {
    if (!eventHandlerRegistered) {
      registerEventHandler('guidesLoaded', function (pendo) {
        for (let deferred of deferreds) {
          deferred.resolve(pendo.guides);
        }
        deferreds = [];
      });
      eventHandlerRegistered = true;
    }
    return new Promise(function (resolve) {
      deferreds.push({resolve: resolve});
    });
  }
})();

// wrap pendo.findGuideById() in a promise
function findGuideById (id) {
  return getGuides()
  .then(function () {
    return window.pendo.findGuideById(id);
  });
}

// wrap pendo.findGuideByName() in a promise
function findGuideByName (name) {
  return getGuides()
  .then(function () {
    return window.pendo.findGuideByName(name);
  });
}

// resolve to guides on initial load, or after next guidesLoaded event
function getGuides () {
  return waitForPendo()
  .then(function (pendo) {
    if (pendo.guides && pendo.guides.length) {
      return pendo.guides;
    } else {
      return guidesMonitor();
    }
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

// wrap pendo.events API in a promise
function registerEventHandler (eventName, eventHandler) {
  return waitForPendo()
  .then(function (pendo) {
    pendo.events[eventName](function () {
      eventHandler(pendo);
    });
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

// resolve to Pendo library once it has loaded
function waitForPendo (elapsedTime = 0) {
  return new Promise(function (resolve, reject) {
    if (window.pendo && window.pendo.initialize) {
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
  registerEventHandler: registerEventHandler,
  showStep: showStep
}
