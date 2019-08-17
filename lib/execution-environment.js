const uuidv4 = require("uuid/v4");

const environmentId = uuidv4();
let invocationCount = 0;

module.exports = {
  getExectionEnvironmentInfo: () => {
    invocationCount += 1;

    return {
      environmentId,
      invocationCount,
      firstRun: invocationCount === 1,
    };
  },
};
