const MockDate = require("mockdate");

const Request = require("../lib/request");

describe("request", () => {
  afterEach(() => {
    MockDate.reset();
  });

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

  it("body is set from event body", () => {
    const request = new Request({
      body: {
        x: 1,
        y: 2,
      },
    });

    expect(request.body).toEqual({ x: 1, y: 2 });
  });

  describe("headers are set", () => {
    it("sets headers to specfied values", () => {
      const request = new Request({
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      });

      expect(request.headers["x-forwarded-for"]).toEqual("127.0.0.1");
    });

    it("sets header keys to lowercase", () => {
      const request = new Request({
        headers: {
          "X-Forwarded-For": "127.0.0.1",
        },
      });

      expect(request.headers["x-forwarded-for"]).toEqual("127.0.0.1");
    });
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

  describe("timing info", () => {
    it("sets received timestamp", () => {
      const request = new Request({
        requestContext: {
          requestTime: "11/Aug/2019:21:42:37 +0000",
        },
      });

      expect(request.timings.received).toEqual(1565559757000);
    });

    it("sets started timestamp", () => {
      MockDate.set(1565559757000);

      const request = new Request({});

      expect(request.timings.started).toEqual(1565559757000);
    });
  });

  it("sets auth", () => {
    const request = new Request({
      requestContext: {
        authorizer: { claims: { a: 1 } },
      },
    });

    expect(request.auth.claims.a).toEqual(1);
  });

  it("sets requestId", () => {
    const request = new Request({
      requestContext: {
        requestId: "12345abcde",
      },
    });

    expect(request.requestId).toEqual("12345abcde");
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

    it("sets stage", () => {
      const request = new Request({
        requestContext: {
          stage: "dev",
        },
      });

      expect(request.function.stage).toEqual("dev");
    });

    it("arn is set", () => {
      const request = new Request({ }, {
        invokedFunctionArn: "arn:aws:lambda:eu-west-2:123456:function:my-function",
      });

      expect(request.function.arn).toEqual({
        full: "arn:aws:lambda:eu-west-2:123456:function:my-function",
        resource: "lambda",
        region: "eu-west-2",
        accountId: "123456",
        resourceType: "function",
        functionName: "my-function",
      });
    });
  });
});
