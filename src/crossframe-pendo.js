let pendoActions = require('./lib/pendo-actions');
let Promise = require('es6-promise').Promise;
let rpc = require('./lib/rpc');

// default configuration options
let config = {
  errorCallback: function () {},
  stepAdvanceCallback: function () {},
  timeout: 10 * 1000
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

  // resolve outstanding requests for guides/steps already visible
  if (guide.isShown()) {
    for (let step of guide.steps) {
      if (step.isShown()) {
        rpc.resolveRequest('showStep', [guide.id, step.id]);
        let stepPosition = guide.getPositionOfStep(step);
        if (stepPosition === 1) {
          rpc.resolveRequest('launchGuide', [guide.id]);
        } else {
          let prevStep = guide.steps[stepPosition - 2]; // -2 b/c array 0-based
          config.stepAdvanceCallback(prevStep);
        }
      }
    }
  }

  guide.after('launch', function () {
    if (guide.isShown()) {
      rpc.resolveRequest('launchGuide', [guide.id]);
    } else {
      rpc.tryAdjacentFrames('launchGuide', [guide.id], config.timeout)
      .catch(function () {
        config.errorCallback({
          errorType: 'GUIDE.LAUNCH',
          guideId: guide.id
        });
      });
    }
  });
  for (let step of guide.steps) {
    step.after('show', function () {
      if (step.isShown()) {
        rpc.resolveRequest('showStep', [guide.id, step.id]);
      } else {
        rpc.tryAdjacentFrames('showStep', [guide.id, step.id], config.timeout)
        .catch(function () {
          config.errorCallback({
            errorType: 'STEP.ADVANCE',
            guideId: guide.id,
            stepId: step.id
          });
        });
      }
    });
    if (step.type === 'tooltip') {
      step.after('advance', function () {
        config.stepAdvanceCallback(step);
      });
    } else { // lightbox & banner steps
      step.after('hide', function () {
        if (step.seenState === 'active') {
          setTimeout(function () {
            config.stepAdvanceCallback(step);
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
