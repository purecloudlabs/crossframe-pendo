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
        processGuides(guides); // initial guides
        pendoActions.registerEventHandler('guidesLoaded', function (pendo) {
          processGuides(pendo.guides); // reloaded guides
        });
      });
    }
  }
})();

// loop through guides, resume if necessary & register callbacks
function processGuides (guides) {
  for (let guide of guides) {
    resumeGuide(guide);
    registerGuideCallbacks(guide);
  }
}

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

// attempt to resume in-progress guides that may have stalled
function resumeGuide (guide) {
  if (guide.isInProgress() && !guide.isShown()) {
    for (let step of guide.steps) {
      if (!step.seenState || !step.seenState === 'advanced') {
        step.show();
      }
    }
  }
}

// export public methods
module.exports = {
  findGuideById: pendoActions.findGuideById,
  findGuideByName: pendoActions.findGuideByName,
  getGuides: pendoActions.getGuides,
  initialize: initialize
}
