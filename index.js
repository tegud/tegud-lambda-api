const Application = require("./lib/application");
const NotificationSender = require("./lib/send-notification");

module.exports = {
  createApplication: () => new Application(),
  createNotificationHandler: (...args) => new NotificationSender(...args),
};
