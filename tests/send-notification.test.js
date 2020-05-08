const AWS = require("aws-sdk-mock");

const { createNotificationHandler } = require("../");

describe("sendNotification", () => {
  afterEach(() => {
    AWS.restore();
  });

  it("Sends message to the target topic", async () => {
    let notificationOptions;

    AWS.mock("SNS", "publish", (options, callback) => {
      notificationOptions = options;
      callback();
    });

    const sendNotification = createNotificationHandler("us-east-1");

    await sendNotification({ accountId: "12345678", body: {}, topic: "test" });

    expect(notificationOptions.TopicArn).toBe("arn:aws:sns:us-east-1:12345678:test");
  });

  describe("tegud api message format version 1", () => {
    describe("sets body", () => {
      it("when no contentType set serialises to JSON", async () => {
        let notificationOptions;

        AWS.mock("SNS", "publish", (options, callback) => {
          notificationOptions = options;
          callback();
        });

        const sendNotification = createNotificationHandler();

        await sendNotification({ body: { a: 1 } });

        expect(notificationOptions.Message).toBe("{\"a\":1}");
      });

      it("when contentType is plain/text it sets body as text", async () => {
        let notificationOptions;

        AWS.mock("SNS", "publish", (options, callback) => {
          notificationOptions = options;
          callback();
        });

        const sendNotification = createNotificationHandler();

        await sendNotification({ body: "12345", contentType: "text/plain" });

        expect(notificationOptions.Message).toBe("12345");
      });
    });

    it("sets frameworkVersion", async () => {
      let notificationOptions;

      AWS.mock("SNS", "publish", (options, callback) => {
        notificationOptions = options;
        callback();
      });

      const sendNotification = createNotificationHandler();

      await sendNotification({ body: "1", contentType: "text/plain" });

      expect(notificationOptions.MessageAttributes.frameworkVersion).toEqual({
        DataType: "Number",
        StringValue: "1",
      });
    });

    describe("sets messageVersion", () => {
      it("to 1 by default", async () => {
        let notificationOptions;

        AWS.mock("SNS", "publish", (options, callback) => {
          notificationOptions = options;
          callback();
        });

        const sendNotification = createNotificationHandler();

        await sendNotification({ body: "1", contentType: "text/plain" });

        expect(notificationOptions.MessageAttributes.messageVersion).toEqual({
          DataType: "Number",
          StringValue: "1",
        });
      });

      it("to specified value", async () => {
        let notificationOptions;

        AWS.mock("SNS", "publish", (options, callback) => {
          notificationOptions = options;
          callback();
        });

        const sendNotification = createNotificationHandler();

        await sendNotification({ messageVersion: 2, body: "1", contentType: "text/plain" });

        expect(notificationOptions.MessageAttributes.messageVersion).toEqual({
          DataType: "Number",
          StringValue: "2",
        });
      });
    });

    it("sets requestId", async () => {
      let notificationOptions;

      AWS.mock("SNS", "publish", (options, callback) => {
        notificationOptions = options;
        callback();
      });

      const sendNotification = createNotificationHandler();

      await sendNotification({ requestId: "123456", body: "1", contentType: "text/plain" });

      expect(notificationOptions.MessageAttributes.requestId).toEqual({
        DataType: "String",
        StringValue: "123456",
      });
    });
  });
});
