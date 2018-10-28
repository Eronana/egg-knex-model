# egg-knex-model
a knex plugin for egg.js

## Usage
1. Run `npm i egg-knex-model`
2. Enable `egg-knex-model`
  ```js
  {
    knex: {
      enable: true,
      package: 'egg-knex-model',
    },
  }
  ```
3. Configure `egg-knex-model` in `config/config.default.ts`
  ```js
  {
    knex: {
      client: {
        // please put knex config here
        // https://knexjs.org/#Installation-client
        client: 'pg',
        version: '7.2',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        }
      },
      app: true,
      agent: false,
    },
  }
  ```
3. Configure `egg-ts-helper` in `package.json` (TypeScript ONLY)
  ```json
  {
    "egg": {
      "typescript": true,
      "tsHelper": {
        "watchDirs": {
          "model": {
            "pattern": "**/*.(ts|js)",
            "path": "app/model",
            "generator": "class",
            "interface": "IModel",
            "caseStyle": "lower",
            "trigger": [
              "add",
              "unlink"
            ],
            "interfaceHandle": false
          }
        }
      }
    }
  }
  ```
4. Add model in `app/model`
  ```ts
  // app/model/User.ts
  import { BaseModel, BaseEntity } from 'egg-knex-model';

  // or if you don't want `id`, `created_at` and `updated_at`,
  // you can directly define the interface of entity without `extends`
  // or you can use PartialBaseEntity<'id'> to get { id:number } and `extends` it
  interface E extends BaseEntity {
    username:string;
    points:number;
  }

  export default class extends BaseModel<E> {
    protected tableName = 'user';
  
    // you can add some method like this,
    // or just use methods in BaseModel
    getByUsername(username:string) {
      return this.getOne({username});
    }
  }
  ```
5. Use model
 ```ts
  // app/service/Test.ts
  export default class Test extends Service {
    public async test() {
      // transaction is easy to use
      // let's use it to add a new user and increment it's points
      await this.app.knex.trx(async model => {
        // must use `model` instead of `this.app.model` in a transaction
        await model.user.insert({
          username: '23333',
          points: 100,
        });
        await model.user.increment({ username: '23333'}, 'points');
      });

      // use getOne to get the user
      console.log(await this.app.model.user.getOne({
        username: '23333',
      }));
      /*
      {
        id: 5,
        username: '23333',
        points: 101,
        created_at: 2018-10-27T19:18:54.703Z,
        updated_at: 2018-10-27T19:18:54.703Z
      }
      */

      // it should auto rollback when an error occurred
      try {
        await this.app.knex.trx(async model => {
          await model.user.update({}, { username: '555555' });
          throw new Error('this transaction should be rolled back');
        });
      } catch (e) {
        console.error(e);
        /*
        Error: this transaction should be rolled back
            at app.knex.trx (/Users/erona/projects/bhdh/app/service/Test.ts:27:15)
            at <anonymous>
        From previous event:
            at /Users/erona/projects/egg-knex-model/node_modules/knex/lib/transaction.js:91:14
            at runCallback (timers.js:794:20)
        From previous event:
            at new Transaction (/Users/erona/projects/egg-knex-model/node_modules/knex/lib/transaction.js:63:41)
            at Client_PG.transaction (/Users/erona/projects/egg-knex-model/node_modules/knex/lib/client.js:152:12)
            at Function.transaction (/Users/erona/projects/egg-knex-model/node_modules/knex/lib/util/make-knex.js:65:21)
            at Object.createTrx (/Users/erona/projects/egg-knex-model/dist/lib/transaction.js:57:17)
            at Function.knexEx.trx (/Users/erona/projects/egg-knex-model/dist/lib/loader.js:90:60)
            at Test.test (/Users/erona/projects/bhdh/app/service/Test.ts:25:27)
            at <anonymous>
        */
      }
    }
  }
 ```
