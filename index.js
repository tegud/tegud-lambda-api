const Request = require("./lib/request");
const Response = require("./lib/response");

module.exports = {
  createApplication: () => {
    const endpoints = {};
    const globalHandlers = [];

    const createHandler = handlers => async (event, context) => {
      const request = new Request(event, context);
      const response = new Response();
      const remainingHandlers = [
        ...globalHandlers,
        ...handlers,
      ];

      while (!response.isFinalised() && remainingHandlers.length) {
        const handler = remainingHandlers.shift();

        await handler(request, response); // eslint-disable-line no-await-in-loop
      }

      response.emit("end");

      return response.result();
    };

    const application = {
      use: (handler) => {
        globalHandlers.push(handler);

        return application;
      },
      addHandler: (name, ...endpointHandlers) => {
        endpoints[name] = createHandler(endpointHandlers);

        return application;
      },
      export: () => ({ ...endpoints }),
    };

    return application;
  },
};
