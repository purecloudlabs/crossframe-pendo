let Request = require('./request');

class IncomingRequest extends Request {

  constructor (request, contentWindow) {
    super(request);
    this.contentWindow = contentWindow;
  }

}

module.exports = IncomingRequest;
