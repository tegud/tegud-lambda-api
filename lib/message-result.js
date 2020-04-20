const EventEmitter = require("events");

class MessageResult extends EventEmitter {
  constructor() {
    super();

    this.completed = false;
  }

  isFinalised() {
    return this.completed;
  }

  complete() {
    this.completed = true;
  }
}

module.exports = MessageResult;
