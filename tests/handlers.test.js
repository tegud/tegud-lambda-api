const { createApplication } = require("../");

const wait = waitTime => new Promise(resolve => setTimeout(() => resolve(), waitTime));

describe("handler", () => {
  describe("calling ok", () => {
    describe("with no body", () => {
      it("returns 204 status", async () => {
        const app = createApplication();

        app.addHandler("test", async (req, res) => res.ok());

        const result = await app.export().test();

        expect(result.statusCode).toEqual(204);
      });
    });

    describe("with body", () => {
      it("returns 200 status", async () => {
        const app = createApplication();

        app.addHandler("test", async (req, res) => res.ok({}));

        const result = await app.export().test();

        expect(result.statusCode).toEqual(200);
      });

      it("returns the stringified body", async () => {
        const app = createApplication();

        app.addHandler("test", async (req, res) => res.ok({ x: 1 }));

        const result = await app.export().test();

        expect(result.body).toEqual(JSON.stringify({ x: 1 }));
      });
    });

    it("with headers", async () => {
      const app = createApplication();

      app.addHandler("test", async (req, res) => {
        res
          .set("X-Header", "1")
          .ok();
      });

      const result = await app.export().test();

      expect(result.headers).toEqual({
        "X-Header": "1",
      });
    });
  });

  describe("multiple handlers", () => {
    it("only calls the first handler that sets a response", async () => {
      const app = createApplication();

      app.addHandler(
        "test",
        async (req, res) => {
          await wait(10);

          res.forbidden();
        },
        (req, res) => res.ok(),
      );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(403);
    });

    it("calls the second handler if no response is set", async () => {
      const app = createApplication();

      app.addHandler(
        "test",
        async () => {},
        async (req, res) => res.ok(),
      );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(204);
    });
  });

  describe("request", () => {
    it("is passed to the handler with event", async () => {
      const app = createApplication();
      let request;

      app.addHandler("test", async (req, res) => {
        request = req;

        res.ok();
      });

      await app.export().test({ httpMethod: "POST" });

      expect(request.method).toEqual("POST");
    });

    it("is passed to the handler with context", async () => {
      const app = createApplication();
      let request;

      app.addHandler("test", async (req, res) => {
        request = req;

        res.ok();
      });

      await app.export().test({ }, { functionName: "test" });

      expect(request.function.name).toEqual("test");
    });
  });

  it("emits response end event", async () => {
    const app = createApplication();
    let completePromise;

    app.addHandler("test", async (req, res) => {
      completePromise = new Promise(resolve => res.on("end", () => {
        resolve();
      }));
      res.ok();
    });

    const result = await app.export().test();
    await completePromise;

    expect(result.statusCode).toEqual(204);
  });

  it("executes handleComplete handlers last", async () => {
    const executionOrder = [];
    const app = createApplication();

    app
      .use(async () => {
        executionOrder.push(1);
      })
      .addHandler("test", async (req, res) => {
        executionOrder.push(2);
        res.ok();
      })
      .handleComplete(async () => {
        executionOrder.push(3);
      });

    await app.export().test({ }, { functionName: "test" });
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it("executes exceptionHandler on handler exception", async () => {
    const app = createApplication();
    let loggedErrorMessage;

    app
      .addHandler("test", async () => {
        throw new Error("ERROR!");
      })
      .handleException(async (e) => {
        loggedErrorMessage = e.message;
      });

    await app.export().test({ }, { functionName: "test" });
    expect(loggedErrorMessage).toEqual("ERROR!");
  });

  it("executes exceptionHandler and sets correct respnse", async () => {
    const app = createApplication();

    app
      .addHandler("test", async () => {
        throw new Error("ERROR!");
      })
      .handleException(async (e, req, res) => {
        res.forbidden();
      });

    const result = await app.export().test();

    expect(result.statusCode).toEqual(403);
  });

  it("executes exceptionHandler and sets correct respnse", async () => {
    const app = createApplication();
    let completeCalled = false;

    app
      .addHandler("test", async () => {
        throw new Error("ERROR!");
      })
      .handleException((e, req, res) => {
        res.notFound();
      })
      .handleComplete(async () => {
        completeCalled = true;
      });

    await app.export().test();

    expect(completeCalled).toEqual(true);
  });
});
