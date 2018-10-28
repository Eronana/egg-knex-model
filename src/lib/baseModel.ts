import Knex = require('knex');
import { IModel } from 'egg';

export interface BaseEntity {
  id:number;
  created_at:Date;
  updated_at:Date;
}

export type PartialBaseEntity<T extends keyof BaseEntity> = {[k in Exclude<keyof BaseEntity, T>]:BaseEntity[k]};

type Rawify<T> = {[k in keyof T]:T[k] | Knex.Raw};

export interface KnexModel {
  knex:Knex;
  model:IModel;
}

type KeysOfType<T, TProp> = { [P in keyof T]: T[P] extends TProp? P : never}[keyof T];

export abstract class BaseModel<E extends {[name:string]:any}>  {
  protected abstract tableName:string;

  constructor(private km:KnexModel) { }

  protected db() {
    return this.km.knex(this.tableName);
  }

  protected raw(sql:string) {
    return this.km.knex.raw(sql);
  }

  protected model(name:keyof IModel) {
    return this.km.model[name];
  }

  async insert(...data:Partial<Rawify<E>>[]):Promise<number> {
    const [insertId] = await this.db().insert(data);
    return insertId;
  }

  async update(cond:Partial<Rawify<E>>, data:Partial<Rawify<E>>):Promise<number> {
    return this.db().update(data).where(cond);
  }

  getMany(cond:Partial<Rawify<E>>):Promise<E[]>;
  getMany<T extends keyof E>(cond:Partial<Rawify<E>>, ...fields:T[]):Promise<Pick<E, T>[]>;
  async getMany(cond:any, ...fields:any[]) {
    return this.db().select(fields).where(cond);
  }

  getOne(cond:Partial<Rawify<E>>):Promise<E|undefined>;
  getOne<T extends keyof E>(cond:Partial<Rawify<E>>, ...fields:T[]):Promise<Pick<E, T>|undefined>;
  async getOne(cond:any, ...fields:any[]) {
    this.db().select();
    const result = await this.db().select(fields).where(cond).limit(1);
    return result[0];
  }

  async exists(cond:Partial<Rawify<E>>) {
    const result = await this.db().select(this.raw('1')).where(cond);
    return !!result[0];
  }

  async increment(cond:Partial<Rawify<E>>, column:KeysOfType<E, number>, amount?:number):Promise<number> {
    return this.db().where(cond).increment(column as string, amount);
  }

  async decrement(cond:Partial<Rawify<E>>, column:KeysOfType<E, number>, amount?:number):Promise<number> {
    return this.db().where(cond).decrement(column as string, amount);
  }
}