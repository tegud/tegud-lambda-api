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
