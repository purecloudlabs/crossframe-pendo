let Request = require('./request');

class RequestList {

  constructor () {
    this.requests = [];
  }

  add (request) {
    if (request instanceof Request) {
      return this.requests.push(request);
    } else {
      throw new Error('Argument must be of type \'Request\'');
    }
  }

  find (request) {
    for (let thisRequest of this.requests) {
      let methodsMatch = thisRequest.method === request.method;
      let argsMatch = thisRequest.argsMatch(request.args);
      if (methodsMatch && argsMatch) {
        return thisRequest;
      }
    }
  }

  remove (request) {
    this.requests = this.requests.filter(function (thisRequest) {
      return thisRequest !== request;
    });
  }

}

module.exports = RequestList;
