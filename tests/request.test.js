const Request = require("../lib/request");

describe("request", () => {
  it("params is set from event pathParameters", () => {
    const request = new Request({
      pathParameters: {
        x: 1,
        y: 2,
      },
    });

    expect(request.params).toEqual({ x: 1, y: 2 });
  });

  it("query is set from event queryStringParameters", () => {
    const request = new Request({
      queryStringParameters: {
        x: 1,
        y: 2,
      },
    });

    expect(request.query).toEqual({ x: 1, y: 2 });
  });

  it("method is set from event httpMethod", () => {
    const request = new Request({
      httpMethod: "POST",
    });

    expect(request.method).toEqual("POST");
  });

  it("route is set from event resource", () => {
    const request = new Request({
      resource: "/test/{param}",
    });

    expect(request.route).toEqual("/test/{param}");
  });

  it("path is set from event path", () => {
    const request = new Request({
      path: "/test/one",
    });

    expect(request.path).toEqual("/test/one");
  });

  describe("ip", () => {
    it("set to x-forwarded-for header value", () => {
      const request = new Request({
        headers: {
          "X-Forwarded-For": "127.0.0.1",
        },
      });

      expect(request.ip).toEqual("127.0.0.1");
    });

    it("set to first x-forwarded-for value when multiple values", () => {
      const request = new Request({
        headers: {
          "X-Forwarded-For": "127.0.0.1, 0.0.0.0",
        },
      });

      expect(request.ip).toEqual("127.0.0.1");
    });

    it("set to identity source ip if header not present", () => {
      const request = new Request({
        requestContext: {
          identity: {
            sourceIp: "127.0.0.1",
          },
        },
      });

      expect(request.ip).toEqual("127.0.0.1");
    });
  });

  describe("function info", () => {
    it("name is set", () => {
      const request = new Request({ }, {
        functionName: "myFunction",
      });

      expect(request.function.name).toEqual("myFunction");
    });

    it("version is set", () => {
      const request = new Request({ }, {
        functionVersion: "$LATEST",
      });

      expect(request.function.version).toEqual("$LATEST");
    });
  });
});
