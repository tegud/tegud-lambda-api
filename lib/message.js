const { getExectionEnvironmentInfo } = require("./execution-environment");
const { parseArn } = require("./parse-arn");

const parseMessage = (event) => {
  if (!event || !event.Records) {
    return undefined;
  }

  return JSON.parse(event.Records[0].Sns.Message);
};

const stageFromFunctionName = (functionName, regex) => {
  if (!functionName || !regex) {
    return undefined;
  }

  const matches = new RegExp(regex).exec(functionName);

  return matches.groups.stage;
};

const parseBody = (message) => {
  if (message.body && (!message["content-type"] || message["content-type"] === "application/json")) {
    return JSON.parse(message.body);
  }

  return message.body;
};

class Message {
  constructor(event, context) {
    const started = new Date().valueOf();
    this.executionEnvironment = getExectionEnvironmentInfo();
    this.timings = {
      started,
    };
    this.function = context ? {
      name: context.functionName,
      version: context.functionVersion,
      arn: parseArn(context.invokedFunctionArn),
      stage: stageFromFunctionName(context.functionName, process.env.LOGGING_FUNCTION_NAME_REGEX),
    } : {};
    const message = parseMessage(event);

    if (message) {
      this.body = parseBody(message);
      this.frameworkVersion = message.frameworkVersion;
      this.messageVersion = message.messageVersion;
      this.requestId = message.requestId;
    }
  }
}

module.exports = Message;
