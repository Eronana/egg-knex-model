'use strict';

module.exports = function (agent) {
  if (agent.config.knex.agent) {
    require('./dist').loader(agent);
  }
};
