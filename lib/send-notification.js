const AWS = require("aws-sdk");

const buildBody = (body, contentType) => {
  const seralisedBody = body && contentType === "application/json"
    ? JSON.stringify(body)
    : body;

  return seralisedBody;
};

const buildAttributes = (attributes) => {
  const attributeEntries = Object.entries(attributes);

  return Object.fromEntries(attributeEntries.map(([key, value]) => [
    key,
    {
      DataType: typeof value === "number" ? "Number" : "String",
      StringValue: value.toString(),
    },
  ]));
};

module.exports = function NotificationSender(region) {
  const sns = new AWS.SNS({ region });
  return ({
    accountId,
    topic,
    contentType = "application/json",
    body,
    frameworkVersion = 1,
    messageVersion = 1,
    ...rest
  }) => sns.publish({
    TopicArn: `arn:aws:sns:${region}:${accountId}:${topic}`,
    Message: buildBody(body, contentType),
    MessageAttributes: buildAttributes({
      ...rest,
      "content-type": contentType,
      frameworkVersion,
      messageVersion,
    }),
  }).promise();
};
