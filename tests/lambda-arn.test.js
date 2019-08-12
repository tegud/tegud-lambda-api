const { parseArn } = require("../lib/parse-arn");

describe("lambda-arn", () => {
  it("sets the full arn", () => expect(parseArn("arn:aws:lambda").full)
    .toBe("arn:aws:lambda"));

  describe("splits a valid arn", () => {
    it("sets the resource", () => expect(parseArn("arn:aws:lambda").resource)
      .toBe("lambda"));

    it("sets the region", () => expect(parseArn("arn:aws:lambda:eu-west-2").region)
      .toBe("eu-west-2"));

    it("sets the accountId", () => expect(parseArn("arn:aws:lambda:eu-west-2:123456").accountId)
      .toBe("123456"));

    it("sets the resourceType", () => expect(parseArn("arn:aws:lambda:eu-west-2:123456:function").resourceType)
      .toBe("function"));

    it("sets the functionName", () => expect(parseArn("arn:aws:lambda:eu-west-2:123456:function:my-function").functionName)
      .toBe("my-function"));
  });
});
