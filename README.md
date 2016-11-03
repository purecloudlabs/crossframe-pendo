# crossframe-pendo

This library works alongside the standard [Pendo](http://pendo.io) client library to add support for walkthroughs that need to display guides in multiple iframes.

The minified build is just 13KB, and requires very little configuration, so it should be easy to get it added to your project!

# Installation

The simplest way to get crossframe-pendo is with [Bower](http://bower.io). Just run `bower install crossframe-pendo` to add it to your project. Be sure to include the script on all pages of your application, across all iframes.

# Configuration

## Initialization

The crossframe-pendo module will be accessible via `window.crossframePendo`. Use the `initialize()` method to have it bootstrap itself. Do this in each iframe, and you'll be ready to go!

## Options

If desired, you can specify a callback function to run after the user advances any guide, to allow for custom logic. To do this, pass in a configuration object as the first argument to the `initialize()` method, with your callback on the `stepAdvanceCallback` property:

```javascript
window.crossframePendo.initialize({
  stepAdvanceCallback: function (step) {
    var guide = step.getGuide();
    // the world's your oyster...
  }
});
```
This callback will receive a Pendo step object corresponding to the guide the user has just advanced.

## Contributing

Pull requests are welcome! Just clone the repo and use `npm install` to get all the devDependencies. All the source files are in `/src`. Running `grunt` will build everything to `/dist`, and will continue to monitor for changes to automatically update the build as you work.
