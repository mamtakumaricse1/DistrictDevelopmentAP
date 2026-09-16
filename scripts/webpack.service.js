const path = require('path');

module.exports = function serviceWebpack(options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve && options.resolve.alias ? options.resolve.alias : {}),
        '@ddwmd/common': path.resolve(__dirname, '../packages/common/src'),
      },
    },
  };
};
