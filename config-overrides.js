const { removeModuleScopePlugin } = require('customize-cra')

// module.exports = function override(config, env) {
//     //do stuff with the webpack config...
//     return config;
//   }


  module.exports = removeModuleScopePlugin()
