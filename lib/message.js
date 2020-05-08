const { getExectionEnvironmentInfo } = require("./execution-environment");
const { parseArn } = require("./parse-arn");

const parseAttributeNumber = value => (value.indexOf(".") > -1 ? parseFloat(value) : parseInt(value, 10));

const parseAttributeValue = value => (value.Type === "Number" ? parseAttributeNumber(value.Value) : value.Value);

const hasRecord = event => event && event.Records && event.Records.length && event.Records[0].Sns;

const parseAttributes = (event) => {
  if (!hasRecord(event) || !event.Records[0].Sns.MessageAttributes) {
    return {};
  }

  const attributes = Object.entries(event.Records[0].Sns.MessageAttributes);

  return Object.fromEntries(attributes.map(([key, value]) => [key, parseAttributeValue(value)]));
};

const parseMessage = (event, attributes) => {
  if (!hasRecord(event) || !event.Records[0].Sns.Message) {
    return undefined;
  }

  console.log(JSON.stringify(event.Records[0].Sns, null, 2));

  if (event.Records[0].Sns.Message && (!attributes["content-type"] || attributes["content-type"] === "application/json")) {
    return JSON.parse(event.Records[0].Sns.Message);
  }

  return event.Records[0].Sns.Message;
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
    const attributes = parseAttributes(event);

    if (context) {
      this.requestId = context.awsRequestId;
      this.awsRequestId = context.awsRequestId;
    }

    this.body = parseMessage(event, attributes);
    this.frameworkVersion = attributes.frameworkVersion;
    this.messageVersion = attributes.messageVersion;
    if (attributes.requestId) {
      this.requestId = attributes.requestId;
    }
  }
}

module.exports = Message;
