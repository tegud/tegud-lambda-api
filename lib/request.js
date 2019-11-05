const { DateTime } = require("luxon");
const { parseArn } = require("./parse-arn");
const { getExectionEnvironmentInfo } = require("./execution-environment");

const eventMappings = {
  pathParameters: "params",
  queryStringParameters: "query",
  httpMethod: "method",
  resource: "route",
  path: "path",
  body: "body",
};

const getHeaders = ({ headers = {} }) => Object.entries(headers)
  .reduce((mappedHeaders, [key, value]) => {
    mappedHeaders[key.toLowerCase()] = value;
    return mappedHeaders;
  }, {});

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

const getFunctionInfo = (event, context) => {
  const contextInfo = context ? {
    name: context.functionName,
    version: context.functionVersion,
    arn: parseArn(context.invokedFunctionArn),
  } : {};

  const requestContextInfo = event && event.requestContext ? {
    stage: event.requestContext.stage,
  } : {};

  return {
    ...contextInfo,
    ...requestContextInfo,
  };
};

class Request {
  constructor(event, context) {
    const started = new Date().valueOf();

    this.executionEnvironment = getExectionEnvironmentInfo();
    this.timings = {
      started,
    };

    if (event) {
      Object.entries(eventMappings).forEach(([eventKey, mappedKey]) => {
        this[mappedKey] = event[eventKey];
      });

      this.ip = getIp(event);
      this.headers = getHeaders(event);

      if (event.requestContext) {
        if (event.requestContext.requestTime) {
          this.timings.received = DateTime.fromFormat(event.requestContext.requestTime, "dd/MMM/yyyy:HH:mm:ss ZZZ").valueOf();
        }
        this.auth = event.requestContext.authorizer;
        this.requestId = event.requestContext.requestId;
      }
    }

    this.function = getFunctionInfo(event, context);
  }
}

module.exports = Request;
