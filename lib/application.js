const Request = require("./request");
const Response = require("./response");

class HandlerCollection {
  constructor(handlers) {
    this.preHandlers = [];
    this.handlers = [...handlers];
    this.postHandlers = [];
  }

  appendPreHandlers(handlers) {
    handlers.forEach(handler => this.preHandlers.push(handler));
  }

  appendPostHandlers(handlers) {
    handlers.forEach(handler => this.postHandlers.unshift(handler));
  }

  async process(req, res) {
    const remainingHandlers = [
      ...this.preHandlers,
      ...this.handlers,
    ];

    while (!res.isFinalised() && remainingHandlers.length) {
      const handler = remainingHandlers.shift();

      await handler(req, res); // eslint-disable-line no-await-in-loop
    }

    res.emit("end");

    const remainingCompleteHandlers = [...this.postHandlers];
    while (remainingCompleteHandlers.length) {
      const handler = remainingCompleteHandlers.shift();

      await handler(req, res); // eslint-disable-line no-await-in-loop
    }

    return res;
  }
}

class Application {
  constructor() {
    this.globalHandlers = [];
    this.endpoints = {};
    this.completedHandlers = [];
    this.childApplications = [];
  }

  appendHandlersToCollection(collection) {
    if (this.parent) {
      this.parent.appendHandlersToCollection(collection);
    }

    collection.appendPreHandlers(this.globalHandlers);
    collection.appendPostHandlers(this.completedHandlers);
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
