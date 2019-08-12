module.exports = {
  parseArn: (arn) => {
    if (!arn) {
      return { };
    }

    const [
      ,, // eslint-disable-line comma-style
      resource,
      region,
      accountId,
      resourceType,
      functionName,
    ] = arn.split(":");

    return {
      full: arn,
      resource,
      region,
      accountId,
      resourceType,
      functionName,
    };
  },
};
