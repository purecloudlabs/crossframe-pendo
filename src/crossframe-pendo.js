let pendoActions = require('./utils/pendo-actions');
let Promise = require('es6-promise').Promise;
let rpc = require('./utils/rpc');

// default configuration options
let config = {
  errorCallback: function () {},
  stepAdvanceCallback: function () {}
}

// initial setup
let initialize = (function () {
  let initialized = false;
  return function (customConfig) {
    if (initialized) {
      return Promise.resolve();
    } else {
      for (let prop in customConfig) {
        config[prop] = customConfig[prop];
      }
      initialized = true;
      return pendoActions.getGuides()
      .then(function (guides) {
        guides.forEach(registerGuideCallbacks); // initial guides
        pendoActions.registerEventHandler('guidesLoaded', function (pendo) {
          pendo.guides.forEach(registerGuideCallbacks);  // reloaded guides
        });
      });
    }
  }
})();

// register callbacks to advance guide in another frame when necessary
function registerGuideCallbacks (guide) {
  guide.after('launch', function () {
    if (!guide.isShown()) {
      rpc.tryAdjacentFrames('launchGuide', [guide.id])
      .catch(function () {
        config.errorCallback({
          errorType: 'GUIDE.LAUNCH',
          guideId: guide.id
        });
      });
    }
  });
  for (let step of guide.steps) {
    let stepPosition = guide.getPositionOfStep(step); // 1-indexed
    let nextStep = guide.steps[stepPosition]; // same numeral b/c 0-indexed
    let handleStepAdvancement = function () {
      if (nextStep && !nextStep.isShown()) {
        rpc.tryAdjacentFrames('showStep', [guide.id, nextStep.id])
        .catch(function () {
          config.errorCallback({
            errorType: 'STEP.ADVANCE',
            guideId: guide.id,
            stepId: step.id
          });
        });
      }
      config.stepAdvanceCallback(step);
    }
    if (step.type === 'tooltip') {
      step.after('advance', function () {
        handleStepAdvancement();
      });
    } else { // lightbox & banner steps
      step.after('hide', function () {
        if (step.seenState === 'active') {
          setTimeout(function () {
            handleStepAdvancement();
          }, 0);
        }
      });
    }
  }
}

// export public methods
module.exports = {
  findGuideById: pendoActions.findGuideById,
  findGuideByName: pendoActions.findGuideByName,
  getGuides: pendoActions.getGuides,
  initialize: initialize,
  reloadGuides: pendoActions.reloadGuides
}
