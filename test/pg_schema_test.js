var vows = require('vows');
var Promise = require('bluebird');
var assert = require('assert');
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

vows
  .describe('pg')
  .addBatch({
    'create schema which needs escaping and connect': {
      topic: function() {
        var callback = this.callback;
        var client = new pg.Client(config);

        client.connect(function(err) {
          if (err) {
            return callback(err);
          }
          client.query('CREATE SCHEMA "test_schema"', function(err) {
            driver.connect(
              config,
              internals,
              function(err, db) {
                callback(err, db, client);
              }
            );
          });
        });
      },

      migrations: {
        topic: function(db, client) {
          var callback = this.callback;

          db.createMigrationsTable(function() {
            client.query(
              "SELECT table_name FROM information_schema.tables WHERE table_schema = 'test_schema' AND table_name = 'migrations'",
              function(err, result) {
                callback(err, result, client);
              }
            );
          });
        },

        'is in test_schema': function(err, result) {
          assert.isNull(err);
          assert.isNotNull(result);
          assert.equal(result.rowCount, 1);
        }
      },

      teardown: function(db, client) {
        var callback = this.callback;
        client.query('DROP SCHEMA "test_schema" CASCADE', function(err) {
          if (err) {
            return callback(err);
          }
          client.end();
          callback();
        });
      }
    }
  })
  .addBatch({
    'create schema and a public.migrations table and connect': {
      topic: function() {
        var callback = this.callback;
        var client = new pg.Client(config);
        var query = Promise.promisify(client.query).bind(client);

        client.connect(function(err) {
          if (err) {
            return callback(err);
          }
          Promise.all([
            query('CREATE SCHEMA test_schema'),
            query('CREATE TABLE migrations ()')
          ])
            .then(function() {
              driver.connect(
                config,
                internals,
                function(err, db) {
                  callback(err, db, client);
                }
              );
            })
            .catch(function(err) {
              callback(err);
            });
        });
      },

      'migrations table': {
        topic: function(db, client) {
          var callback = this.callback;

          db.createMigrationsTable(function() {
            client.query(
              "SELECT table_name FROM information_schema.tables WHERE table_schema = 'test_schema' AND table_name = 'migrations'",
              function(err, result) {
                callback(err, result, client);
              }
            );
          });
        },

        'is in test_schema': function(err, result) {
          assert.isNull(err);
          assert.isNotNull(result);
          assert.equal(result.rowCount, 1);
        }
      },

      teardown: function(db, client) {
        var callback = this.callback;
        var query = Promise.promisify(client.query).bind(client);

        Promise.all([
          query('DROP SCHEMA test_schema CASCADE'),
          query('DROP TABLE migrations')
        ])
          .then(function(err) {
            client.end();
            callback();
          })
          .catch(function(err) {
            callback(err);
          });
      }
    }
  })
  .addBatch({
    'create schema and connect': {
      topic: function() {
        var callback = this.callback;
        var client = new pg.Client(config);

        client.connect(function(err) {
          if (err) {
            return callback(err);
          }
          client.query('CREATE SCHEMA test_schema', function(err) {
            driver.connect(
              config,
              internals,
              function(err, db) {
                callback(err, db, client);
              }
            );
          });
        });
      },

      'migrations table': {
        topic: function(db, client) {
          var callback = this.callback;

          db.createMigrationsTable(function() {
            client.query(
              "SELECT table_name FROM information_schema.tables WHERE table_schema = 'test_schema' AND table_name = 'migrations'",
              function(err, result) {
                callback(err, result, client);
              }
            );
          });
        },

        'is in test_schema': function(err, result) {
          assert.isNull(err);
          assert.isNotNull(result);
          assert.equal(result.rowCount, 1);
        }
      },

      teardown: function(db, client) {
        var callback = this.callback;
        client.query('DROP SCHEMA test_schema CASCADE', function(err) {
          if (err) {
            return callback(err);
          }
          client.end();
          callback();
        });
      }
    }
  })
  .export(module);
