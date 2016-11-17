let pendoActions = require('./pendo-actions');
let Promise = require('es6-promise').Promise;

// config values
const PROTOCOL = 'crossframe-pendo';
const RPC_TIMEOUT = 5000;

// resolve/reject methods for promises to be fulfilled by RPC responses
let responseCallbacks = []

// keep track of unfulfilled RPC requests
let activeRequests = []

// build list of all immediate parent and/or child frames
function getAdjacentFrames () {
  let adjacentFrames = [];
  if (window !== window.parent) {
    adjacentFrames.push(window.parent);
  }
  let childFrames = document.getElementsByTagName('iframe');
  if (childFrames.length) {
    for (let frame of childFrames) {
      adjacentFrames.push(frame.contentWindow);
    }
  }
  return adjacentFrames;
}

// handle incoming messages
function handleMessage (messageEvent) {
  if (messageEvent.data.protocol === PROTOCOL) {
    switch (messageEvent.data.type) {
      case "rpc:request":
        handleRpcRequest(messageEvent);
        break;
      case "rpc:response":
        handleRpcResponse(messageEvent);
        break;
    }
  }
}

// handle incoming RPC request
function handleRpcRequest (messageEvent) {
  let messageData = messageEvent.data;
  let thisRequest = {
    source: messageEvent.source,
    method: messageData.method,
    args: messageData.args
  }
  activeRequests.push(thisRequest);
  pendoActions[messageData.method].apply(null, messageData.args)
  .then(function (result) {
    sendRpcResponse(messageEvent.source, messageData.id, true);
    activeRequests = activeRequests.filter(function (request) {
      return request !== thisRequest;
    });
  })
  .catch(function (error) {
    sendRpcResponse(messageEvent.source, messageData.id, false);
    activeRequests = activeRequests.filter(function (request) {
      return request !== thisRequest;
    });
  });
}

// handle incoming RPC response
function handleRpcResponse (messageEvent) {
  let messageData = messageEvent.data;
  if (messageData.success) {
    responseCallbacks[messageData.id].resolve();
  } else {
    responseCallbacks[messageData.id].reject();
  }
}

// send an RPC request
function sendRpcRequest (frame, method, args) {
  let response = new Promise(function (resolve, reject) {
    responseCallbacks.push({
      resolve: resolve,
      reject: reject
    });
    window.setTimeout(reject, RPC_TIMEOUT);
  });
  let callbackId = responseCallbacks.length - 1;
  let message = {
    protocol: PROTOCOL,
    type: 'rpc:request',
    id: callbackId,
    method: method,
    args: args
  }
  try {
    frame.postMessage(message, frame.location.origin);
  } catch (e) {
    responseCallbacks[callbackId].reject('UNABLE_TO_POSTMESSAGE');
  }
  return response;
}

// send an RPC response
function sendRpcResponse (frame, respondingTo, didSucceed) {
  let message = {
    protocol: PROTOCOL,
    type: 'rpc:response',
    id: respondingTo,
    success: didSucceed
  }
  frame.postMessage(message, frame.location.origin);
}

// attempt rpc in all adjacent frames, resolve on any successful attempt
function tryAdjacentFrames (method, args) {
  return new Promise(function (resolve, reject) {
    let failedAttempts = 0;
    let adjacentFrames = getAdjacentFrames().filter(function (frame) {

      // prevent sending same request back to original window
      for (let activeRequest of activeRequests) {
        if (activeRequest.source === frame) {
          if (activeRequest.method === method) {
            if (activeRequest.args.length === args.length) {
              let argsMatch = false;
              for (let i = 0; i < args.length; i++) {
                if (activeRequests.args[i] === args[i]) {
                  argsMatch = true;
                }
              }
              if (argsMatch) {
                return false;
              }
            }
          }
        }
      }

      return true;
    });
    if (!adjacentFrames.length) {
      reject();
    }
    adjacentFrames.forEach(function (frame) {
      sendRpcRequest(frame, method, args)
      .then(function (response) {
        resolve();
      })
      .catch(function () {
        failedAttempts += 1;
        if (failedAttempts = adjacentFrames.length) {
          reject();
        }
      });
    });
  });
}

// start listening for messages from adjacent frames
window.addEventListener('message', handleMessage);

// export public methods
module.exports = {
  tryAdjacentFrames: tryAdjacentFrames
}
