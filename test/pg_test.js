var util = require('util');
var vows = require('vows');
var assert = require('assert');
var dbmeta = require('db-meta');
var dataType = require('db-migrate-shared').dataType;
var driver = require('../');
var log = require('db-migrate-shared').log;

var config = require('./db.config.json').pg;
var db;

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
log.silence(true);

vows
  .describe('pg')
  .addBatch({
    'default connection': {
      topic: function () {
        driver.connect({}, internals, this.callback);
      },

      'is connected': function (err, _db) {
        assert.isNull(err);
      }
    }
  })
  .addBatch({
    connect: {
      topic: function () {
        driver.connect(config, internals, this.callback);
      },

      'is connected': function (err, _db) {
        assert.isNull(err);
        db = _db;
      }
    }
  })
  .addBatch({
    'connect error': {
      topic: function () {
        driver.connect({ host: 'fakehost' }, internals, this.callback);
      },

      'shows connection error': function (err, _db) {
        assert.isNotNull(err);
      }
    }
  })
  .addBatch({
    createTable: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            str: { type: dataType.STRING, unique: true },
            txt: { type: dataType.TEXT, notNull: true, defaultValue: 'foo' },
            chr: dataType.CHAR,
            intg: dataType.INTEGER,
            rel: dataType.REAL,
            smalint: dataType.SMALLINT,
            dt: dataType.DATE,
            dti: dataType.DATE_TIME,
            dti_tz: { type: dataType.DATE_TIME, timezone: true },
            bl: dataType.BOOLEAN,
            raw: {
              type: 'TIMESTAMP',
              defaultValue: {
                raw: 'CURRENT_TIMESTAMP'
              }
            },
            special: {
              type: 'TIMESTAMP',
              defaultValue: {
                special: 'CURRENT_TIMESTAMP'
              }
            }
          },
          this.callback.bind(this)
        );
      },

      'has table metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getTables(this.callback);
            }.bind(this)
          );
        },

        'containing the event table': function (err, tables) {
          assert.isNull(err);
          assert.strictEqual(tables.length, 1);
          assert.strictEqual(tables[0].getName(), 'event');
        }
      },

      'has column metadata for the event table': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getColumns('event', this.callback);
            }.bind(this)
          );
        },

        'with 13 columns': function (err, columns) {
          assert.isNull(err);
          assert.isNotNull(columns);
          assert.strictEqual(columns.length, 13);
        },

        'that has integer id column that is primary key, non-nullable, and auto increments': function (
          err,
          columns
        ) {
          assert.isNull(err);
          var column = findByName(columns, 'id');
          assert.strictEqual(column.getDataType(), 'INTEGER');
          assert.strictEqual(column.isPrimaryKey(), true);
          assert.strictEqual(column.isNullable(), false);
          assert.strictEqual(column.isAutoIncrementing(), true);
        },

        'that has text str column that is unique': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'str');
          assert.strictEqual(column.getDataType(), 'CHARACTER VARYING');
          assert.strictEqual(column.isUnique(), true);
        },

        'that has text txt column that is non-nullable': function (
          err,
          columns
        ) {
          assert.isNull(err);
          var column = findByName(columns, 'txt');
          assert.strictEqual(column.getDataType(), 'TEXT');
          assert.strictEqual(column.isNullable(), false);
          // assert.strictEqual(column.getDefaultValue(), 'foo');
        },

        'that has integer intg column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'intg');
          assert.strictEqual(column.getDataType(), 'INTEGER');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has real rel column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'rel');
          assert.strictEqual(column.getDataType(), 'REAL');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has integer dt column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'dt');
          assert.strictEqual(column.getDataType(), 'DATE');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has integer dti column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'dti');
          assert.strictEqual(
            column.getDataType(),
            'TIMESTAMP WITHOUT TIME ZONE'
          );
          assert.strictEqual(column.isNullable(), true);
        },

        'that has timestamp with time zone column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'dti_tz');
          assert.strictEqual(column.getDataType(), 'TIMESTAMP WITH TIME ZONE');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has boolean bl column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'bl');
          assert.strictEqual(column.getDataType(), 'BOOLEAN');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has character chr column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'chr');
          assert.strictEqual(column.getDataType(), 'CHARACTER');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has small integer smalint column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'smalint');
          assert.strictEqual(column.getDataType(), 'SMALLINT');
          assert.strictEqual(column.isNullable(), true);
        },

        'that has raw column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'raw');
          assert.strictEqual(column.getDefaultValue(), 'now()');
        },

        'that has special CURRENT_TIMESTAMP column': function (err, columns) {
          assert.isNull(err);
          var column = findByName(columns, 'special');
          assert.strictEqual(column.getDefaultValue(), 'now()');
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    dropTable: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            }
          },
          function (err) {
            if (err) {
              return this.callback(err);
            }
            db.dropTable('event', this.callback.bind(this, null));
          }.bind(this)
        );
      },

      'has table metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getTables(this.callback);
            }.bind(this)
          );
        },

        'containing no tables': function (err, tables) {
          assert.isNull(err);
          assert.isNotNull(tables);
          assert.strictEqual(tables.length, 0);
        }
      }
    }
  })
  .addBatch({
    renameTable: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            }
          },
          function () {
            db.renameTable(
              'event',
              'functions',
              this.callback.bind(this, null)
            );
          }.bind(this)
        );
      },

      'has table metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getTables(this.callback);
            }.bind(this)
          );
        },

        'containing the functions table': function (err, tables) {
          assert.isNull(err);
          assert.isNotNull(tables);
          assert.strictEqual(tables.length, 1);
          assert.strictEqual(tables[0].getName(), 'functions');
        }
      },

      teardown: function () {
        db.dropTable('functions', this.callback);
      }
    }
  })
  .addBatch({
    addColumn: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            }
          },
          function () {
            db.addColumn(
              'event',
              'title',
              'string',
              this.callback.bind(this, null)
            );
          }.bind(this)
        );
      },

      'has column metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getColumns('event', this.callback);
            }.bind(this)
          );
        },

        'with additional title column': function (err, columns) {
          assert.isNull(err);
          assert.isNotNull(columns);
          assert.strictEqual(columns.length, 2);
          var column = findByName(columns, 'title');
          assert.strictEqual(column.getName(), 'title');
          assert.strictEqual(column.getDataType(), 'CHARACTER VARYING');
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    removeColumn: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            }
          },
          function () {
            db.addColumn(
              'event',
              'title',
              'string',
              function (err) {
                assert.isNull(err);
                db.removeColumn(
                  'event',
                  'title',
                  this.callback.bind(this, null)
                );
              }.bind(this)
            );
          }.bind(this)
        );
      },

      'has column metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getColumns('event', this.callback);
            }.bind(this)
          );
        },

        'without title column': function (err, columns) {
          assert.isNull(err);
          assert.isNotNull(columns);
          assert.strictEqual(columns.length, 1);
          assert.notStrictEqual(columns[0].getName(), 'title');
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    renameColumn: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            }
          },
          function () {
            db.addColumn(
              'event',
              'title',
              'string',
              function (err) {
                assert.isNull(err);
                db.renameColumn(
                  'event',
                  'title',
                  'new_title',
                  this.callback.bind(this, null)
                );
              }.bind(this)
            );
          }.bind(this)
        );
      },

      'has column metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getColumns('event', this.callback);
            }.bind(this)
          );
        },

        'with renamed title column': function (err, columns) {
          assert.isNull(err);
          assert.isNotNull(columns);
          assert.strictEqual(columns.length, 2);
          var column = findByName(columns, 'new_title');
          assert.strictEqual(column.getName(), 'new_title');
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    changeColumn: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            txt: {
              type: dataType.TEXT,
              notNull: true,
              unique: true,
              defaultValue: 'foo'
            },
            keep_id: { type: dataType.INTEGER, notNull: true, unique: true },
            type_test: { type: dataType.BLOB, notNull: true },
            type_length_test: {
              type: dataType.STRING,
              length: 50,
              notNull: true
            }
          },
          function () {
            var spec = { notNull: false, defaultValue: 'foo2', unique: false };
            var spec2 = { notNull: true, unsigned: true };
            var spec3 = {
              type: dataType.INTEGER,
              using: util.format(
                'USING CAST(CAST("type_test" AS %s) AS %s)',
                dataType.TEXT,
                dataType.INTEGER
              )
            };
            var spec4 = { type: dataType.STRING, length: 100 };

            db.changeColumn(
              'event',
              'txt',
              spec,
              function () {
                db.changeColumn(
                  'event',
                  'keep_id',
                  spec2,
                  function () {
                    db.changeColumn(
                      'event',
                      'type_test',
                      spec3,
                      function () {
                        db.changeColumn(
                          'event',
                          'type_length_test',
                          spec4,
                          this.callback.bind(this, null)
                        );
                      }.bind(this)
                    );
                  }.bind(this)
                );
              }.bind(this)
            );
          }.bind(this)
        );
      },
      'has column metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getColumns('event', this.callback);
            }.bind(this)
          );
        },

        'with changed title column': function (err, columns) {
          assert.isNull(err);
          assert.isNotNull(columns);
          assert.strictEqual(columns.length, 5);

          var column = findByName(columns, 'txt');
          assert.strictEqual(column.getName(), 'txt');
          assert.strictEqual(column.isNullable(), true);
          assert.strictEqual(column.getDefaultValue(), "'foo2'::text");
          assert.strictEqual(column.isUnique(), false);

          column = findByName(columns, 'keep_id');
          assert.strictEqual(column.getName(), 'keep_id');
          assert.strictEqual(column.isNullable(), false);
          assert.strictEqual(column.isUnique(), true);

          column = findByName(columns, 'type_test');
          assert.strictEqual(column.getName(), 'type_test');
          assert.strictEqual(dataType[column.getDataType()], dataType.INTEGER);

          column = findByName(columns, 'type_length_test');
          assert.strictEqual(column.getName(), 'type_length_test');
          assert.strictEqual(column.getDataType(), 'CHARACTER VARYING');
          assert.strictEqual(column.meta.character_maximum_length, 100);
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    addIndex: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            title: { type: dataType.STRING }
          },
          function () {
            db.addIndex(
              'event',
              'event_title',
              'title',
              this.callback.bind(this, null)
            );
          }.bind(this)
        );
      },

      'has resulting index metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getIndexes('event', this.callback);
            }.bind(this)
          );
        },

        'with additional index': function (err, indexes) {
          assert.isNull(err);
          assert.isNotNull(indexes);
          assert.strictEqual(indexes.length, 2);
          var index = findByName(indexes, 'event_title');
          assert.strictEqual(index.getName(), 'event_title');
          assert.strictEqual(index.getTableName(), 'event');
          assert.strictEqual(index.getColumnName(), 'title');
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    addForeignKey: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            event_id: { type: dataType.INTEGER, notNull: true },
            title: { type: dataType.STRING }
          },
          function () {
            db.createTable(
              'event_type',
              {
                id: {
                  type: dataType.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
                },
                title: { type: dataType.STRING }
              },
              function () {
                // lowercase table names because they are quoted in the function
                // and pg uses lowercase internally
                db.addForeignKey(
                  'event',
                  'event_type',
                  'fk_event_event_type',
                  {
                    event_id: 'id'
                  },
                  {
                    onDelete: 'CASCADE'
                  },
                  this.callback
                );
              }.bind(this)
            );
          }.bind(this)
        );
      },

      'sets usage and constraints': {
        topic: function () {
          var metaQuery = [
            'SELECT',
            ' tc.table_schema, tc.table_name as ortn, kcu.column_name orcn, ccu.table_name,',
            '  ccu.column_name,',
            '  cstr.update_rule,',
            '  cstr.delete_rule',
            'FROM',
            '  information_schema.table_constraints AS tc',
            'JOIN information_schema.key_column_usage AS kcu',
            '  ON tc.constraint_name = kcu.constraint_name',
            'JOIN information_schema.constraint_column_usage AS ccu',
            '  ON ccu.constraint_name = tc.constraint_name',
            'JOIN information_schema.referential_constraints AS cstr',
            '  ON cstr.constraint_schema = tc.table_schema',
            '    AND cstr.constraint_name = tc.constraint_name',
            'WHERE',
            '  tc.table_schema = ?',
            '  AND tc.table_name = ?',
            '  AND kcu.column_name = ?'
          ].join('\n');
          db.runSql(metaQuery, ['public', 'event', 'event_id'], this.callback);
        },

        'with correct references': function (err, result) {
          assert.isNull(err);
          var rows = result.rows;
          assert.isNotNull(rows);
          assert.strictEqual(rows.length, 1);
          var row = rows[0];
          assert.strictEqual(row.table_name, 'event_type');
          assert.strictEqual(row.column_name, 'id');
        },

        'and correct rules': function (err, result) {
          assert.isNull(err);
          var rows = result.rows;
          assert.isNotNull(rows);
          assert.strictEqual(rows.length, 1);
          var row = rows[0];
          assert.strictEqual(row.update_rule, 'NO ACTION');
          assert.strictEqual(row.delete_rule, 'CASCADE');
        }
      },

      teardown: function () {
        db.dropTable('event')
          .then(function () {
            return db.dropTable('event_type');
          })
          .nodeify(this.callback);
      }
    }
  })
  .addBatch({
    removeForeignKey: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            event_id: { type: dataType.INTEGER, notNull: true },
            title: { type: dataType.STRING }
          },
          function () {
            db.createTable(
              'event_type',
              {
                id: {
                  type: dataType.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
                },
                title: { type: dataType.STRING }
              },
              function () {
                db.addForeignKey(
                  'event',
                  'event_type',
                  'fk_event_event_type',
                  {
                    event_id: 'id'
                  },
                  {
                    onDelete: 'CASCADE'
                  },
                  function () {
                    db.removeForeignKey(
                      'event',
                      'fk_event_event_type',
                      this.callback.bind(this, null)
                    );
                  }.bind(this)
                );
              }.bind(this)
            );
          }.bind(this)
        );
      },

      teardown: function () {
        db.dropTable('event')
          .then(function () {
            return db.dropTable('event_type');
          })
          .nodeify(this.callback);
      },

      'removes usage and constraints': {
        topic: function () {
          var metaQuery = [
            'SELECT',
            ' tc.table_schema, tc.table_name as ortn, kcu.column_name orcn, ccu.table_name,',
            '  ccu.column_name,',
            '  cstr.update_rule,',
            '  cstr.delete_rule',
            'FROM',
            '  information_schema.table_constraints AS tc',
            'JOIN information_schema.key_column_usage AS kcu',
            '  ON tc.constraint_name = kcu.constraint_name',
            'JOIN information_schema.constraint_column_usage AS ccu',
            '  ON ccu.constraint_name = tc.constraint_name',
            'JOIN information_schema.referential_constraints AS cstr',
            '  ON cstr.constraint_schema = tc.table_schema',
            '    AND cstr.constraint_name = tc.constraint_name',
            'WHERE',
            '  tc.table_schema = ?',
            '  AND tc.table_name = ?',
            '  AND kcu.column_name = ?'
          ].join('\n');
          db.runSql(metaQuery, ['public', 'event', 'event_id'], this.callback);
        },

        completely: function (err, result) {
          assert.isNull(err);
          assert.isNotNull(result.rows);
          assert.strictEqual(result.rows.length, 0);
        }
      }
    }
  })
  .addBatch({
    'addForeign by addcolumn with spec': {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            event_id: { type: dataType.INTEGER, notNull: true },
            title: { type: dataType.STRING }
          },
          function () {
            db.createTable(
              'event_type',
              {
                id: {
                  type: dataType.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
                },
                title: { type: dataType.STRING }
              },
              function () {
                db.addColumn(
                  'event_type',
                  'event_id',
                  {
                    type: dataType.INTEGER,
                    notNull: true,
                    foreignKey: {
                      name: 'primary_event_id_fk',
                      table: 'event',
                      rules: {
                        onDelete: 'CASCADE',
                        onUpdate: 'RESTRICT'
                      },
                      mapping: 'id'
                    }
                  },
                  this.callback.bind(this, null)
                );
              }.bind(this)
            );
          }.bind(this)
        );
      },

      teardown: function () {
        db.dropTable('event_type')
          .then(function (data) {
            return db.dropTable('event');
          })
          .nodeify(this.callback);
      },

      'sets usage and constraints': {
        topic: function () {
          var metaQuery = [
            'SELECT',
            ' tc.table_schema, tc.table_name as ortn, kcu.column_name orcn, ccu.table_name,',
            '  ccu.column_name,',
            '  cstr.update_rule,',
            '  cstr.delete_rule',
            'FROM',
            '  information_schema.table_constraints AS tc',
            'JOIN information_schema.key_column_usage AS kcu',
            '  ON tc.constraint_name = kcu.constraint_name',
            'JOIN information_schema.constraint_column_usage AS ccu',
            '  ON ccu.constraint_name = tc.constraint_name',
            'JOIN information_schema.referential_constraints AS cstr',
            '  ON cstr.constraint_schema = tc.table_schema',
            '    AND cstr.constraint_name = tc.constraint_name',
            'WHERE',
            '  tc.table_schema = ?',
            '  AND tc.table_name = ?',
            '  AND kcu.column_name = ?'
          ].join('\n');
          db.runSql(
            metaQuery,
            ['public', 'event_type', 'event_id'],
            this.callback
          );
        },

        'with correct references': function (err, result) {
          assert.isNull(err);
          var rows = result.rows;
          assert.isNotNull(rows);
          assert.strictEqual(rows.length, 1);
          var row = rows[0];
          assert.strictEqual(row.table_name, 'event');
          assert.strictEqual(row.column_name, 'id');
        },

        'and correct rules': function (err, result) {
          assert.isNull(err);
          var rows = result.rows;
          assert.isNotNull(rows);
          assert.strictEqual(rows.length, 1);
          var row = rows[0];
          assert.strictEqual(row.update_rule, 'RESTRICT');
          assert.strictEqual(row.delete_rule, 'CASCADE');
        }
      }
    }
  })
  .addBatch({
    insert: {
      topic: function () {
        db.createTable('event', {
          id: {
            type: dataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          title: { type: dataType.STRING }
        })
          .then(function () {
            return db.insert('event', ['id', 'title'], [2, 'title']);
          })
          .then(function () {
            return db.runSql('SELECT * from event');
          })
          .nodeify(this.callback);
      },

      'with additional row': function (err, data) {
        assert.isNull(err);
        assert.strictEqual(data.rowCount, 1);
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    insertWithSingleQuotes: {
      topic: function () {
        db.createTable('event', {
          id: {
            type: dataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          title: { type: dataType.STRING }
        })
          .then(function () {
            return db.insert(
              'event',
              ['id', 'title'],
              [2, "Bill's Mother's House"]
            );
          })
          .then(function () {
            return db.runSql('SELECT * from event');
          })
          .nodeify(this.callback);
      },

      'with additional row': function (err, data) {
        assert.isNull(err);
        assert.strictEqual(data.rowCount, 1);
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    removeIndex: {
      topic: function () {
        db.createTable(
          'event',
          {
            id: {
              type: dataType.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            title: {
              type: dataType.STRING
            }
          },
          function () {
            db.addIndex(
              'event',
              'event_title',
              'title',
              function (err) {
                assert.isNull(err);
                db.removeIndex('event_title', this.callback.bind(this, null));
              }.bind(this)
            );
          }.bind(this)
        );
      },

      'has resulting index metadata': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getIndexes('event', this.callback);
            }.bind(this)
          );
        },

        'without index': function (err, indexes) {
          assert.isNull(err);
          assert.isNotNull(indexes);
          assert.strictEqual(indexes.length, 1); // first index is primary key
        }
      },

      teardown: function () {
        db.dropTable('event', this.callback);
      }
    }
  })
  .addBatch({
    createMigrationsTable: {
      topic: function () {
        db.createMigrationsTable(this.callback.bind(this, null));
      },

      'has migrations table': {
        topic: function () {
          dbmeta(
            'pg',
            { connection: db.connection },
            function (err, meta) {
              if (err) {
                return this.callback(err);
              }
              meta.getTables(this.callback);
            }.bind(this)
          );
        },

        'has migrations table': function (err, tables) {
          assert.isNull(err);
          assert.isNotNull(tables);
          assert.strictEqual(tables.length, 1);
          assert.strictEqual(tables[0].getName(), 'migrations');
        },

        'that has columns': {
          topic: function () {
            dbmeta(
              'pg',
              { connection: db.connection },
              function (err, meta) {
                if (err) {
                  return this.callback(err);
                }
                meta.getColumns('migrations', this.callback);
              }.bind(this)
            );
          },

          'with names': function (err, columns) {
            assert.isNull(err);
            assert.isNotNull(columns);
            assert.strictEqual(columns.length, 3);
            var column = findByName(columns, 'id');
            assert.strictEqual(column.getName(), 'id');
            assert.strictEqual(column.getDataType(), 'INTEGER');
            column = findByName(columns, 'name');
            assert.strictEqual(column.getName(), 'name');
            assert.strictEqual(column.getDataType(), 'CHARACTER VARYING');
            column = findByName(columns, 'run_on');
            assert.strictEqual(column.getName(), 'run_on');
            assert.strictEqual(
              column.getDataType(),
              'TIMESTAMP WITHOUT TIME ZONE'
            );
          }
        }
      },

      teardown: function () {
        db.dropTable('migrations', this.callback);
      }
    }
  })
  .addBatch({
    switchDatabase: {
      topic: function () {
        db.switchDatabase({ schema: 'test_schema2' }, this.callback);
      },

      'has search path': {
        topic: function () {
          db.runSql('SHOW search_path', this.callback);
        },

        'containing the new schema': function (err, result) {
          assert.isNull(err);
          var rows = result.rows;
          assert.isNotNull(rows);
          assert.strictEqual(rows.length, 1);
          var row = rows[0];
          assert.strictEqual(row.search_path, 'test_schema2');
        }
      },

      teardown: function () {
        db.switchDatabase({ schema: config.schema }, this.callback);
      }
    }
  })
  .export(module);

function findByName (columns, name) {
  for (var i = 0; i < columns.length; i++) {
    if (columns[i].getName() === name) {
      return columns[i];
    }
  }
  return null;
}
