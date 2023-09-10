const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
const lab = (exports.lab = Lab.script());

var vows = require('vows');
var Promise = require('bluebird');
var dbmeta = require('db-meta');
var pg = require('pg');
var dataType = require('db-migrate-shared').dataType;
var driver = require('../');
var log = require('db-migrate-shared').log;
var config = Object.assign(
  {
    schema: 'test_schema'
  },
  require('./db.config.json').pg
);

var internals = {};
internals.mod = {
  log: log,
  type: dataType
};
internals.interfaces = {
  SeederInterface: {},
  MigratorInterface: {}
};
internals.migrationTable = 'migrations';

lab
  .experiment('pg', () => {
    let client;
    let db;
    lab.before(async () => {
      const con = await Promise.promisify(driver.connect)(config, internals);
      client = new pg.Client(config);
      await client.connect();
      db = con;
    });
    lab.experiment('create schema', () => {
lab.before(async () => {
      await client.query('CREATE SCHEMA "test_schema"');
    });

      // lab.test('which needs escaping and connect', async () => {
      //   const result = await client.query(
      //     "SELECT table_name FROM information_schema.tables WHERE table_schema = 'test_schema' AND table_name = 'migrations'");

      //   Code.expect(result).to.exist();
      //   Code.expect(result.rowCount).to.equal(1);
      // });



      lab.after(async () => {
await client.query('DROP SCHEMA "test_schema" CASCADE')
      })
    });
    lab.after(() => {
      client.end()
      db.close()
    })
  });

