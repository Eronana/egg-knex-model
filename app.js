'use strict';

module.exports = function (app) {
  if (app.config.knex.app) {
    require('./dist').loader(app);
  }
};
