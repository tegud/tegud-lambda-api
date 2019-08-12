const eventMappings = {
  pathParameters: "params",
  queryStringParameters: "query",
  httpMethod: "method",
  resource: "route",
  path: "path",
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
    if (event) {
      Object.entries(eventMappings).forEach(([eventKey, mappedKey]) => {
        this[mappedKey] = event[eventKey];
      });

      this.ip = getIp(event);
    }

    if (context) {
      this.function = {
        name: context.functionName,
        version: context.functionVersion,
      };
    }
  }
}

module.exports = Request;
