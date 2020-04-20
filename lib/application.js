const { createNamespace } = require("cls-hooked");

const Request = require("./request");
const Response = require("./response");
const MessageResult = require("./message-result");
const Message = require("./message");

const createCallbackHandler = () => {
  let promiseResolver;
  const promise = new Promise((resolve) => {
    promiseResolver = resolve;
  });

  return {
    callback: () => {
      promiseResolver();
    },
    promise: () => promise,
  };
};

const handleException = async (exceptionHandlers, e, req, res) => {
  const remainingHandlers = [...exceptionHandlers];

  while (!res.isFinalised() && remainingHandlers.length) {
    try {
      const handler = remainingHandlers.shift();

      const callbackHandler = createCallbackHandler();
      const result = handler(e, req, res, callbackHandler.callback);

      if (result && result.then) {
        await result; // eslint-disable-line no-await-in-loop
      } else {
        await callbackHandler.promise(); // eslint-disable-line no-await-in-loop
      }
    } catch (error) { } // eslint-disable-line no-empty
  }
};

class HandlerCollection {
  constructor(handlers) {
    this.preHandlers = [];
    this.handlers = [...handlers];
    this.postHandlers = [];
    this.exceptionHandlers = [];
  }

  appendPreHandlers(handlers) {
    handlers.forEach(handler => this.preHandlers.push(handler));
  }

  appendPostHandlers(handlers) {
    handlers.forEach(handler => this.postHandlers.unshift(handler));
  }

  appendExceptionHandlers(handlers) {
    handlers.forEach(handler => this.exceptionHandlers.unshift(handler));
  }

  async process(req, res) {
    const remainingHandlers = [
      ...this.preHandlers,
      ...this.handlers,
    ];

    const requestContext = createNamespace("request_context");

    return requestContext.runAndReturn(async () => {
      while (!res.isFinalised() && remainingHandlers.length) {
        try {
          const handler = remainingHandlers.shift();

          const callbackHandler = createCallbackHandler();
          const result = handler(req, res, callbackHandler.callback);

          if (result && result.then) {
            await result; // eslint-disable-line no-await-in-loop
          } else {
            await callbackHandler.promise(); // eslint-disable-line no-await-in-loop
          }
        } catch (e) {
          await handleException( // eslint-disable-line no-await-in-loop
            this.exceptionHandlers,
            e,
            req,
            res,
          );

          break;
        }
      }

      res.emit("end");

      const remainingCompleteHandlers = [...this.postHandlers];
      while (remainingCompleteHandlers.length) {
        const handler = remainingCompleteHandlers.shift();

        await handler(req, res); // eslint-disable-line no-await-in-loop
      }

      return res;
    });
  }
}

class Application {
  constructor() {
    this.globalHandlers = [];
    this.endpoints = {};
    this.completedHandlers = [];
    this.childApplications = [];
    this.exceptionHandlers = [];
  }

  appendHandlersToCollection(collection) {
    if (this.parent) {
      this.parent.appendHandlersToCollection(collection);
    }

    collection.appendPreHandlers(this.globalHandlers);
    collection.appendPostHandlers(this.completedHandlers);
    collection.appendExceptionHandlers(this.exceptionHandlers);
  }

  createHandler(handlers) {
    return async (event, context) => {
      const request = new Request(event, context);
      const response = new Response();

      const handlerCollection = new HandlerCollection(handlers);

      this.appendHandlersToCollection(handlerCollection);

      await handlerCollection.process(request, response);

      return response.result();
    };
  }

  createNotificationHandler(handlers) {
    return async (event) => {
      const message = new Message(event);
      const result = new MessageResult();

      const handlerCollection = new HandlerCollection(handlers);

      this.appendHandlersToCollection(handlerCollection);

      await handlerCollection.process(message, result);
    };
  }

  use(handlerOrApplication) {
    if (handlerOrApplication instanceof Application) {
      this.childApplications.push(handlerOrApplication);
      handlerOrApplication.parent = this;
      return this;
    }

    this.globalHandlers.push(handlerOrApplication);
    return this;
  }

  handleComplete(handler) {
    this.completedHandlers.push(handler);

    return this;
  }

  addHandler(endpoint, ...endpointHandlers) {
    this.endpoints[endpoint] = this.createHandler(endpointHandlers);

    return this;
  }

  addNotificationHandler(endpoint, ...endpointHandlers) {
    this.endpoints[endpoint] = this.createNotificationHandler(endpointHandlers);

    return this;
  }

  handleException(handler) {
    this.exceptionHandlers.push(handler);

    return this;
  }

  export() {
    return [
      ...Object.entries(this.endpoints),
      ...this.childApplications.reduce((all, child) => [
        ...all,
        ...Object.entries(child.export()),
      ], []),
    ].reduce((all, [key, value]) => {
      all[key] = value;

      return all;
    }, {});
  }
}

module.exports = Application;
