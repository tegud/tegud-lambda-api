const { createApplication } = require("..");

describe("notification-handler", () => {
  it("executes handler", async () => {
    const app = createApplication();
    let handled;

    app.addNotificationHandler("test", async () => {
      handled = true;
    });

    await app.export().test({
      Records: [
        { Sns: { Message: "{}" } },
      ],
    });

    expect(handled).toBeTruthy();
  });

  it("executes 2nd handler if first does not complete", async () => {
    const app = createApplication();
    let handled;

    app.addNotificationHandler(
      "test",
      async () => {
      },
      async () => {
        handled = true;
      },
    );

    await app.export().test({
      Records: [
        { Sns: { Message: "{}" } },
      ],
    });

    expect(handled).toBeTruthy();
  });

  it("executes 2nd handler if first does not complete", async () => {
    const app = createApplication();
    let handledCount = 0;

    app.addNotificationHandler(
      "test",
      async (req, res) => {
        handledCount += 1;
        res.complete();
      },
      async () => {
        handledCount += 1;
      },
    )
      .handleException(async () => {
        handledCount += 10;
      });

    await app.export().test({
      Records: [
        { Sns: { Message: "{}" } },
      ],
    });

    expect(handledCount).toBe(1);
  });

  it("executes error handler on error", async () => {
    const app = createApplication();
    let loggedErrorMessage;

    app
      .addNotificationHandler("test", async () => {
        throw new Error("ERROR!");
      })
      .handleException(async (e) => {
        loggedErrorMessage = e.message;
      });

    await app.export().test({
      Records: [
        { Sns: { Message: "{}" } },
      ],
    });

    expect(loggedErrorMessage).toBe("ERROR!");
  });
});
