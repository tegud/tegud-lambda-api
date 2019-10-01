const { createApplication } = require("../");

describe("application", () => {
  describe("use", () => {
    it("adds handler to all endpoints", async () => {
      const app = createApplication();

      app.use(async (req) => {
        req.x = 1;
      });

      app.addHandler(
        "test",
        async (req, res) => {
          if (req.x === 1) {
            res.ok();
          }
        },
      );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(204);
    });

    it("is chainable", async () => {
      const app = createApplication();

      app
        .use(async () => { })
        .addHandler(
          "test",
          async (req, res) => {
            res.ok();
          },
        );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(204);
    });

    it("handles callback", async () => {
      const app = createApplication();
      let callbackAsyncCalled = false;

      app
        .use((req, res, next) => {
          setTimeout(() => {
            callbackAsyncCalled = true;
            next();
          }, 10);
        })
        .addHandler(
          "test",
          async (req, res) => {
            res.ok();
          },
        );

      await app.export().test();

      expect(callbackAsyncCalled).toEqual(true);
    });

    describe("nests applications", () => {
      it("executes parent and child handlers", async () => {
        const app = createApplication();
        const nestedApp = createApplication();
        const items = [];

        app
          .use(async () => {
            items.push(1);
          })
          .handleComplete(async () => {
            items.push(5);
          })
          .use(nestedApp);

        nestedApp
          .use(async () => {
            items.push(2);
          })
          .handleComplete(async () => {
            items.push(4);
          })
          .addHandler(
            "test",
            async (req, res) => {
              items.push(3);
              res.ok();
            },
          );

        await app.export().test();

        expect(items).toEqual([1, 2, 3, 4, 5]);
      });
    });
  });

  describe("addHandler", () => {
    it("is chainable", async () => {
      const app = createApplication();

      app
        .addHandler("testTwo", async () => { })
        .addHandler(
          "test",
          async (req, res) => {
            res.ok();
          },
        );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(204);
    });
  });
});
