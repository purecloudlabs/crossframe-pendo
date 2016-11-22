let IncomingRequest = require('./incoming-request');
let OutgoingRequest = require('./outgoing-request');
let pendoActions = require('./pendo-actions');
let Promise = require('es6-promise').Promise;
let RequestList = require('./request-list');

// config values
const PROTOCOL = 'crossframe-pendo';

// keep track of incoming & outgoing requests
let incomingRequests = new RequestList();
let outgoingRequests = new RequestList();

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
  let requestAttrs = {method: messageData.method, args: messageData.args};
  let incomingRequest = new IncomingRequest(requestAttrs, messageEvent.source);
  incomingRequests.add(incomingRequest);
  pendoActions[messageData.method].apply(null, messageData.args);
}

// handle incoming RPC response
function handleRpcResponse (messageEvent) {
  let messageData = messageEvent.data;
  let requestAttrs = {method: messageData.method, args: messageData.args};
  if (messageData.success) {
    resolveRequest(messageData.method, messageData.args);
  }
}

// try/catch wrapper for window.postMessage
function postMessage (frame, message) {
  try {
    frame.postMessage(message, frame.location.origin);
    return true;
  } catch (e) {
    return false;
  }
}

// post message and/or resolve promise as needed to resolve oustanding requests
function resolveRequest (method, args) {
  let requestAttrs = {method: method, args: args};
  if (incomingRequest = incomingRequests.find(requestAttrs)) {
    sendRpcResponse(incomingRequest.contentWindow, method, args, true);
    incomingRequests.remove(incomingRequest);
  }
  if (outgoingRequest = outgoingRequests.find(requestAttrs)) {
    outgoingRequest.resolve();
    outgoingRequests.remove(outgoingRequest);
  }
}

// send an RPC request
function sendRpcRequest (frame, method, args) {
  let message = {
    protocol: PROTOCOL,
    type: 'rpc:request',
    method: method,
    args: args
  }
  postMessage(frame, message);
}

// send an RPC response
function sendRpcResponse (frame, method, args, didSucceed) {
  let message = {
    protocol: PROTOCOL,
    type: 'rpc:response',
    method: method,
    args: args,
    success: didSucceed
  }
  postMessage(frame, message);
}

// attempt rpc in all adjacent frames, resolve on any successful attempt
function tryAdjacentFrames (method, args, timeout) {
  let requestAttrs = {method: method, args: args};
  let originalIncomingRequest = incomingRequests.find(requestAttrs);
  let frames = getAdjacentFrames().filter(function (adjacentFrame) {
    if (originalIncomingRequest) {
      return originalIncomingRequest.contentWindow !== adjacentFrame;
    } else {
      return true;
    }
  });
  let outgoingRequest = new OutgoingRequest(requestAttrs, timeout);
  outgoingRequests.add(outgoingRequest);
  frames.forEach(function (frame) {
    sendRpcRequest(frame, method, args);
  });
  return outgoingRequest.promise;
}

// start listening for messages from adjacent frames
window.addEventListener('message', handleMessage);

// export public methods
module.exports = {
  resolveRequest: resolveRequest,
  tryAdjacentFrames: tryAdjacentFrames
}
