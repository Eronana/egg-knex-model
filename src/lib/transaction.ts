import { IModel, EggApplication } from 'egg';
import Knex = require('knex');
import Bluebird = require('bluebird');
import { KnexModel } from './baseModel';

const pool:KnexModel[] = [];

function createKM(model:IModel) {
  const km = { model: {} } as KnexModel;
  for (const name in model) {
    const Model = model[name].constructor;
    km.model[name] = new Model(km);
  }
  return km;
}

function alloc(knex:Knex, model:IModel) {
  const km = pool.pop() || createKM(model);
  km.knex = knex;
  return km;
}

function free(km:KnexModel) {
  pool.push(km);
}

export interface TrxCallback {
  (model:IModel):Promise<any>;
}

export function createTrx(app:EggApplication, knex:Knex, callback:TrxCallback) {
  return knex.transaction(async trx => {
    const km = alloc(trx, app.model);
    try {
      return await callback(km.model);
    } finally {
      free(km);
    }
  });
}
