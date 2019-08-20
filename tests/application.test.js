const { createApplication } = require("../");

describe("application", () => {
  describe("use", () => {
    it("adds handler to all endpoints", async () => {
      const app = createApplication();

      app.use((req) => {
        req.x = 1;
      });

      app.addHandler(
        "test",
        (req, res) => {
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
        .use(() => { })
        .addHandler(
          "test",
          (req, res) => {
            res.ok();
          },
        );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(204);
    });

    describe("nests applications", () => {
      it("executes parent and child handlers", async () => {
        const app = createApplication();
        const nestedApp = createApplication();
        const items = [];

        app
          .use(() => {
            items.push(1);
          })
          .handleComplete(() => {
            items.push(5);
          })
          .use(nestedApp);

        nestedApp
          .use(() => {
            items.push(2);
          })
          .handleComplete(() => {
            items.push(4);
          })
          .addHandler(
            "test",
            (req, res) => {
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
        .addHandler("testTwo", () => { })
        .addHandler(
          "test",
          (req, res) => {
            res.ok();
          },
        );

      const result = await app.export().test();

      expect(result.statusCode).toEqual(204);
    });
  });
});
