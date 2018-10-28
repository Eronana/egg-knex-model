import { EggApplication, IModel } from 'egg';
import path = require('path');
import Knex = require('knex');
import Bluebird = require('bluebird');
import { BaseModel } from './baseModel';
import { TrxCallback, createTrx } from './transaction';

interface KnexEx extends Knex {
  trx:(trx:TrxCallback) => Bluebird<any>;
}

declare module 'egg' {
  interface IModel { }
  interface EggApplication {
    knex:KnexEx;
    model:IModel;
  }
}

function injectModel(app:EggApplication, knex:Knex) {
  const logger = app.logger;
  const directory = path.join(app.config.baseDir, 'app/model');
  const model = app['model'] = {} as IModel;
  const knexModel = { knex, model };
  const opt = {
    directory,
    target: model,
    inject: app,
    caseStyle: 'lower',
    call: false,
    filter(model) {
      return model instanceof BaseModel;
    },
    initializer(model, opt) {
      if (typeof model === 'function' && model.prototype instanceof BaseModel) {
        logger.info(`[egg-knex-model] load model: [${path.basename(opt.path)}]`);
        return new model(knexModel);
      }
    },
  };
  const { FileLoader } = app.loader;
  const timingKey = `Load "model" to Application`;
  app.loader.timing.start(timingKey);
  new FileLoader(opt).load();
  app.loader.timing.end(timingKey);
}

let count = 0;
export function loader(app:EggApplication) {
  app.addSingleton('knex', (config:Knex.Config, app:EggApplication) => {
    const logger = app.logger;
    const knex = Knex(config);
    const index = ++count;
    app.beforeStart(() => injectModel(app, knex));
    (app as any).beforeClose(async () => {
      await knex.destroy();
      logger.info(`[egg-knex-model] instance[${index}] has been destroyed`);
    });
    logger.info(`[egg-knex-model] instance[${index}] start successfully`);

    const knexEx:KnexEx = Object.create(knex);
    knexEx.trx = trx => createTrx(app, knex, trx);
    return knexEx;
  });
}
