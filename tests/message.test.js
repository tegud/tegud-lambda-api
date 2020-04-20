const MockDate = require("mockdate");

const Message = require("../lib/message");

const createSnsEnvelope = message => ({
  Records: [
    { Sns: { Message: JSON.stringify(message) } },
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

  describe("tegud-api message format v1", () => {
    it("sets framework version", async () => {
      const request = new Message(createSnsEnvelope({ frameworkVersion: 1 }));

      expect(request.frameworkVersion).toEqual(1);
    });

    it("sets message version", async () => {
      const request = new Message(createSnsEnvelope({ messageVersion: 2 }));

      expect(request.messageVersion).toEqual(2);
    });

    it("sets requestId", async () => {
      const request = new Message(createSnsEnvelope({ requestId: "abcd1234" }));

      expect(request.requestId).toEqual("abcd1234");
    });

    describe("body", () => {
      it("with no content-type parses json", async () => {
        const request = new Message(createSnsEnvelope({ body: JSON.stringify({ a: 12345 }) }));

        expect(request.body).toEqual({ a: 12345 });
      });

      it("json content type parse json", async () => {
        const request = new Message(createSnsEnvelope({ "content-type": "application/json", body: JSON.stringify({ a: 12345 }) }));

        expect(request.body).toEqual({ a: 12345 });
      });

      it("plain content type sets body to text", async () => {
        const request = new Message(createSnsEnvelope({ "content-type": "text/plain", body: "12345" }));

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
