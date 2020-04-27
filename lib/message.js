const { getExectionEnvironmentInfo } = require("./execution-environment");
const { parseArn } = require("./parse-arn");

const parseMessage = (event) => {
  if (!event || !event.Records) {
    return undefined;
  }

  return JSON.parse(event.Records[0].Sns.Message);
};

const splitFunctionName = (functionName, regex) => {
  if (!functionName || !regex) {
    return { name: functionName };
  }

  const matches = new RegExp(regex).exec(functionName);

  if (!matches || !matches.groups) {
    return { name: functionName };
  }

  return {
    name: matches.groups.name,
    stage: matches.groups.stage,
  };
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
      ...splitFunctionName(context.functionName, process.env.LOGGING_FUNCTION_NAME_REGEX),
      version: context.functionVersion,
      arn: parseArn(context.invokedFunctionArn),
    } : {};
    const message = parseMessage(event);

    if (context) {
      this.requestId = context.awsRequestId;
      this.awsRequestId = context.awsRequestId;
    }

    if (message) {
      this.body = parseBody(message);
      this.frameworkVersion = message.frameworkVersion;
      this.messageVersion = message.messageVersion;
      if (message.requestId) {
        this.requestId = message.requestId;
      }
    }
  }
}

module.exports = Message;
