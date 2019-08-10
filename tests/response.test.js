const Response = require("../lib/response");

describe("response", () => {
  describe("status codes", () => {
    [
      { method: "ok", expectedStatusCode: 204 },
      { method: "ok", args: [{ }], expectedStatusCode: 200 },
      { method: "unauthorized", expectedStatusCode: 401 },
      { method: "forbidden", expectedStatusCode: 403 },
      { method: "serviceUnavailable", expectedStatusCode: 503 },
    ].forEach(({ method, args = [], expectedStatusCode }) => {
      it(`${method} with ${!args.length ? "no arguments" : JSON.stringify(args)} returns ${expectedStatusCode} Status Code`, () => {
        const response = new Response();

        response[method](...args);

        const { statusCode } = response.result();
        expect(statusCode).toBe(expectedStatusCode);
      });
    });
  });

  describe("headers", () => {
    describe("set", () => {
      it("Sets header to specified value", () => {
        const response = new Response();

        response
          .set("X-Header", "123")
          .ok();

        const { headers } = response.result();
        expect(headers["X-Header"]).toBe("123");
      });

      it("Sets header to be capital case", () => {
        const response = new Response();

        response
          .set("x-header", "123")
          .ok();

        const { headers } = response.result();
        expect(headers["X-Header"]).toBe("123");
      });
    });

    describe("common headers", () => {
      [
        { method: "contentType", header: "Content-Type", value: "application/json" },
      ].forEach(({ method, header, value }) => it(`${method} Sets ${header} to ${value}`, () => {
        const response = new Response();

        response[method](value)
          .ok();

        const { headers } = response.result();
        expect(headers[header]).toBe(value);
      }));
    });
  });
});
