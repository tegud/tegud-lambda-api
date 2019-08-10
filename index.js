const Response = require("./lib/response");

module.exports = {
  createApplication: () => {
    const createHandler = handlers => async () => {
      const response = new Response();
      const remainingHandlers = [...handlers];

      while (!response.isFinalised() && remainingHandlers.length) {
        const handler = remainingHandlers.shift();

        await handler(undefined, response); // eslint-disable-line no-await-in-loop
      }

      return response.result();
    };

    const handlers = {};

    return {
      addHandler: (name, ...endpointHandlers) => {
        handlers[name] = createHandler(endpointHandlers);
      },
      export: () => ({ ...handlers }),
    };
  },
};
