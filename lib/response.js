const EventEmitter = require("events");

const statusCodeMappings = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  internalServerError: 500,
  serviceUnavailable: 503,
};

const commonHeaderMappings = {
  contentType: "Content-Type",
};

const correctHeaderName = name => name
  .split("-")
  .map(([first, ...rest]) => `${first.toUpperCase()}${rest.join("").toLowerCase()}`)
  .join("-");

class Response extends EventEmitter {
  constructor() {
    super();
    this.headers = {};

    Object.entries(statusCodeMappings).forEach(([key, code]) => {
      this[key] = (body) => {
        this.statusCode = code;

        if (body) {
          this.body = JSON.stringify(body);
        }    
      };
    });

    Object.entries(commonHeaderMappings).forEach(([method, header]) => {
      this[method] = (value) => {
        this.headers[header] = value;
        return this;
      };
    });
  }

  setHeader(...args) {
    return this.set(...args);
  }

  set(name, value) {
    this.headers[correctHeaderName(name)] = value;

    return this;
  }

  ok(body) {
    this.statusCode = body ? 200 : 204;
    this.body = JSON.stringify(body);
  }

  result() {
    return {
      statusCode: this.statusCode,
      headers: this.headers,
      body: this.body,
    };
  }

  isFinalised() {
    return typeof this.statusCode !== "undefined";
  }
}

module.exports = Response;
