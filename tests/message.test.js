const MockDate = require("mockdate");

const Message = require("../lib/message");

const createSnsEnvelope = (message, attributes = {}) => ({
  Records: [
    {
      Sns: {
        Message: message,
        MessageAttributes: attributes,
      },
    },
  ],
});

describe("message", () => {
  afterEach(() => {
    MockDate.reset();
    delete process.env.LOGGING_FUNCTION_NAME_REGEX;
  });

  describe("timing info", () => {
    it("sets started timestamp", () => {
      MockDate.set(1565559757000);

      const request = new Message({});

      expect(request.timings.started).toEqual(1565559757000);
    });
  });

  it("sets awsRequestId", async () => {
    const request = new Message(createSnsEnvelope(""), { awsRequestId: "1234567" });

    expect(request.awsRequestId).toEqual("1234567");
  });

  describe("tegud-api message format v1", () => {
    it("sets framework version", async () => {
      const request = new Message(createSnsEnvelope("", { frameworkVersion: { Type: "Number", Value: "1" } }));

      expect(request.frameworkVersion).toEqual(1);
    });

    it("sets message version", async () => {
      const request = new Message(createSnsEnvelope("", { messageVersion: { Type: "Number", Value: "2" } }));

      expect(request.messageVersion).toEqual(2);
    });

    it("sets requestId", async () => {
      const request = new Message(createSnsEnvelope("", { requestId: { Type: "String", Value: "abcd1234" } }));

      expect(request.requestId).toEqual("abcd1234");
    });

    it("sets requestId to awsRequestId if requestId not set", async () => {
      const request = new Message(createSnsEnvelope(""), { awsRequestId: "1234567" });

      expect(request.requestId).toEqual("1234567");
    });

    describe("body", () => {
      it("with no content-type parses json", async () => {
        const request = new Message(createSnsEnvelope(JSON.stringify({ a: 12345 })));

        expect(request.body).toEqual({ a: 12345 });
      });

      it("json content type parse json", async () => {
        const request = new Message(createSnsEnvelope(JSON.stringify({ a: 12345 }), { "content-type": { Type: "String", Value: "application/json" } }));

        expect(request.body).toEqual({ a: 12345 });
      });

      it("plain content type sets body to text", async () => {
        const request = new Message(createSnsEnvelope("12345", { "content-type": { Type: "String", Value: "text/plain" } }));

        expect(request.body).toEqual("12345");
      });
    });
  });

  describe("function info", () => {
    it("name is set", () => {
      const request = new Message({ }, {
        functionName: "myFunction",
      });

      expect(request.function.name).toEqual("myFunction");
    });

    it("version is set", () => {
      const request = new Message({ }, {
        functionVersion: "$LATEST",
      });

      expect(request.function.version).toEqual("$LATEST");
    });

    it("sets stage using environment variable regex", () => {
      process.env.LOGGING_FUNCTION_NAME_REGEX = "(?<stage>[^-]+)-(?<functionName>[^-]+)$";

      const request = new Message({ }, {
        functionName: "my-app-dev-myFunction",
      });

      expect(request.function.stage).toEqual("dev");
    });

    it("arn is set", () => {
      const request = new Message({ }, {
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
