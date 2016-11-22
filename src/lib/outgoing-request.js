let Promise = require('es6-promise').Promise;
let Request = require('./request');

class OutgoingRequest extends Request {

  constructor (request, timeout) {
    super(request);
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      window.setTimeout(reject, 5000);
    });
  }

}

module.exports = OutgoingRequest;
