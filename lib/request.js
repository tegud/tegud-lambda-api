const { DateTime } = require("luxon");
const { parseArn } = require("./parse-arn");

const eventMappings = {
  pathParameters: "params",
  queryStringParameters: "query",
  httpMethod: "method",
  resource: "route",
  path: "path",
  body: "body",
};

const getIp = ({ headers, requestContext }) => {
  if (headers && headers["X-Forwarded-For"]) {
    const [ip] = headers["X-Forwarded-For"].split(", ");
    return ip;
  }

  if (requestContext && requestContext.identity) {
    return requestContext.identity.sourceIp;
  }

  return undefined;
};

class Request {
  constructor(event, context) {
    const started = new Date().valueOf();

    this.timings = {
      started,
    };

    if (event) {
      Object.entries(eventMappings).forEach(([eventKey, mappedKey]) => {
        this[mappedKey] = event[eventKey];
      });

      this.ip = getIp(event);

      if (event.requestContext && event.requestContext.requestTime) {
        this.timings.received = DateTime.fromFormat(event.requestContext.requestTime, "dd/MMM/yyyy:HH:mm:ss ZZZ").valueOf();
      }
    }

    if (context) {
      this.function = {
        name: context.functionName,
        version: context.functionVersion,
        arn: parseArn(context.invokedFunctionArn),
      };
    }
  }
}

module.exports = Request;
