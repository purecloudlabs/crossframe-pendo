# crossframe-pendo

This library works alongside the standard [Pendo](http://pendo.io) client library to add support for walkthroughs that need to display guides in multiple iframes.

The minified build is just 13KB, and requires very little configuration, so it should be easy to get it added to your project!

# Installation

The simplest way to get crossframe-pendo is with [Bower](http://bower.io). Just run `bower install crossframe-pendo` to add it to your project. Be sure to include the script on all pages of your application, across all iframes. Any configuration of iframes should be supported (parent-child, deeply nested, siblings with shared parent, etc.), so long as crossframe-pendo is initialized in every window.

# Configuration

## Initialization

The crossframe-pendo module will be accessible via `window.crossframePendo`. Use the `initialize()` method to have it bootstrap itself. Do this in each iframe, and you'll be ready to go!

The `initialize()` method returns a promise, which will resolve once the Pendo client library loads and crossframe-pendo has completed setup.

## Options

You may optionally supply a configuration object when initializing crossframe-pendo, with one or more of the following options:

### errorCallback

This function will be executed when crossframe-pendo is unable to launch or advance a guide in any available iframe. An error object will be passed in as the first argument.

Example:

```javascript
window.crossframePendo.initialize({
  errorCallback: function (error) {
  	// handle error
  }
});
```

The error object will have an `errorType` property of either `"GUIDE.LAUNCH"` or `"STEP.ADVANCE"`, as well as `guideId` and `stepId` properties, as appropriate for the error type.

### stepAdvanceCallback

This function will be executed after the user advances each step in any walkthrough. The Pendo step object corresponding to the just-advanced guide will be passed in as the first argument.

Example:

```javascript
window.crossframePendo.initialize({
  stepAdvanceCallback: function (step) {
    var guide = step.getGuide();
    // the world's your oyster...
  }
});
```

## Asynchronous Guide Lookup

Included in crossframe-pendo are some useful helper functions which allow for looking up Pendo guides asynchronously. Each of these functions return a promise, greatly simplifying the process of programmatically acccessing Pendo guides when the load state of the client library cannot be guaranteed.

### findGuideById

```javascript
window.crossframePendo.findGuideById("24601").then(function (guide) {
  // here's your guide
});
```

### findGuideByName

```javascript
window.crossframePendo.findGuideByName("Jean Valjean").then(function (guide) {
  // here's your guide
});
```

### getGuides

```javascript
window.crossframePendo.getGuides().then(function (guides) {
  // here's an array of all available guides
});
```

## Contributing

Pull requests are welcome! Just clone the repo and use `npm install` to get all the devDependencies. All the source files are in `/src`. Running `grunt` will build everything to `/dist`, and will continue to monitor for changes to automatically update the build as you work.
