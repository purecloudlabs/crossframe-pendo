class Request {

  constructor (request) {
    this.method = request.method;
    this.args = request.args;
  }

  argsMatch (args) {
    if (this.args.length !== args.length) {
      return false;
    }
    for (let i=0; i < this.args.length; i++) {
      if (this.args[i] !== args[i]) {
        return false;
      }
    }
    return true;
  }

}

module.exports = Request;
