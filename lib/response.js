const statusCodeMappings = {
  unauthorized: 401,
  forbidden: 403,
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

class Response {
  constructor() {
    this.headers = {};

    Object.entries(statusCodeMappings).forEach(([key, code]) => {
      this[key] = () => {
        this.statusCode = code;
      };
    });

    Object.entries(commonHeaderMappings).forEach(([method, header]) => {
      this[method] = (value) => {
        this.headers[header] = value;
        return this;
      };
    });
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
