
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
const lab = (exports.lab = Lab.script());
var util = require('util');
var dbmeta = require('db-meta');
var dataType = require('db-migrate-shared').dataType;
const Promise = require('bluebird')
var driver = require('../');
var log = require('db-migrate-shared').log;


dbmeta = Promise.promisify(dbmeta);

var config = require('./db.config.json').pg;

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


const dbName = config.database;
let db;
let meta;

lab.experiment('pg', () => {
  lab.before(async () => {
    const con = await Promise.promisify(driver.connect)(config, internals);
    const _meta = await dbmeta('pg', { connection: con.connection });

    Promise.promisifyAll(_meta);
    meta = _meta;

    db = con;
  });

  lab.experiment('connections', () => {
    let con

    lab.test('default connection', async () => {
      con = await Promise.promisify(driver.connect)(config, internals)
      expect(con).to.exist();
    })

    lab.afterEach(async () => {
      con.close();
    })
  })

  lab.experiment('createTable', () => {
    let tables;

    lab.before(async () => {
      await db.createTable(
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
      );
      tables = await meta.getTablesAsync();
    });

    lab.test('has table metadata containing the event table', async () => {
      expect(tables.length).to.shallow.equal(1);
      expect(tables[0].getName()).to.shallow.equal('event');
    })

    lab.experiment('has column metadata for the event table', () => {
      let columns;
      lab.before(async () => (columns = await meta.getColumnsAsync('event')));

      lab.test('with 13 columns', async () => {
        expect(columns).to.exist();
        expect(columns.length).to.shallow.equal(13);
      });

      lab.test('that has integer id column that is primary key, non-nullable, and auto increments', async () => {
        const column = findByName(columns, 'id');
        expect(column.getDataType()).to.shallow.equal('INTEGER');
        expect(column.isPrimaryKey()).to.shallow.equal(true);
        expect(column.isNullable()).to.shallow.equal(false);
        expect(column.isAutoIncrementing()).to.shallow.equal(true);
      });

      lab.test('that has text str column that is unique', async () => {
        const column = findByName(columns, 'str');
        expect(column.getDataType()).to.shallow.equal('CHARACTER VARYING');
        expect(column.isUnique()).to.shallow.equal(true);
      })

      lab.test('that has text txt column that is non-nullable', async () => {
        const column = findByName(columns, 'txt');
        expect(column.getDataType()).to.shallow.equal('TEXT');
        expect(column.isNullable()).to.shallow.equal(false);
        // expect(column.getDefaultValue()).to.shallow.equal('foo');
      })

      lab.test('that has integer intg column', async () => {
        const column = findByName(columns, 'intg');
        expect(column.getDataType()).to.shallow.equal('INTEGER');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has real rel column', async () => {
        const column = findByName(columns, 'rel');
        expect(column.getDataType()).to.shallow.equal('REAL');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has integer dt column', async () => {
        const column = findByName(columns, 'dt');
        expect(column.getDataType()).to.shallow.equal('DATE');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has integer dti column', async () => {
        const column = findByName(columns, 'dti');
        expect(
          column.getDataType()).to.shallow.equal('TIMESTAMP WITHOUT TIME ZONE'
          );
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has timestamp with time zone column', async () => {
        const column = findByName(columns, 'dti_tz');
        expect(column.getDataType()).to.shallow.equal('TIMESTAMP WITH TIME ZONE');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has boolean bl column', async () => {
        const column = findByName(columns, 'bl');
        expect(column.getDataType()).to.shallow.equal('BOOLEAN');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has character chr column', async () => {
        const column = findByName(columns, 'chr');
        expect(column.getDataType()).to.shallow.equal('CHARACTER');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has small integer smalint column', async () => {
        const column = findByName(columns, 'smalint');
        expect(column.getDataType()).to.shallow.equal('SMALLINT');
        expect(column.isNullable()).to.shallow.equal(true);
      })

      lab.test('that has raw column', async () => {
        const column = findByName(columns, 'raw');
        expect(column.getDefaultValue()).to.shallow.equal('CURRENT_TIMESTAMP');
      })

      lab.test('that has special CURRENT_TIMESTAMP column', async () => {
        const column = findByName(columns, 'special');
        expect(column.getDefaultValue()).to.shallow.equal('CURRENT_TIMESTAMP');
      })
    })

    lab.after(() => db.dropTable('event'));

  })

  lab.experiment('autoIncrement',() => {
    let columns;


    lab.before(async () => {

      await db.createTable(
        'event',
        {
          id: {
            type: dataType.BIG_INTEGER,
            primaryKey: true,
            autoIncrement: true
          }
        },
      )

      columns = await meta.getColumnsAsync('event')
    });

    lab.test('has column metadata with auto increment column', async () => {
      const column = findByName(columns, 'id');
      expect(column.getDataType()).to.shallow.equal('BIGINT');
      expect(column.getDefaultValue()).to.shallow.equal("nextval('event_id_seq'::regclass)")
      expect(column.isPrimaryKey()).to.shallow.equal(true);
      expect(column.isNullable()).to.shallow.equal(false);
      expect(column.isAutoIncrementing()).to.shallow.equal(true);
    })


    lab.after(() => db.dropTable('event'));
  })


  lab.experiment('dropTable', () => {
    let tables;
    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        }
      });
      await db.dropTable('event');
      tables = await meta.getTablesAsync();
    });

    lab.test('has table metadata containing no tables', async () => {
      expect(tables).to.exist();
      expect(tables.length).to.shallow.equal(0);
    })
  })

lab.experiment('renameTable', () => {
    let tables;

    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        }
      });
      await db.renameTable('event', 'functions');
      tables = await meta.getTablesAsync();
    });

    lab.after(() => db.dropTable('functions'));

    lab.test('was executed successfully', () => {
      expect(tables).to.exist();
      expect(tables.length).to.equal(1);
      expect(tables[0].getName()).to.equal('functions');
    });
  });

lab.experiment('addColumn', () => {
    let columns;

    lab.before(async () => {
      await db.createTable('event', {
        title: {
          type: dataType.STRING
        }
      });
      await db.addColumn('event', 'date', {
        after: 'title',
        type: 'datetime'
      });
      await db.addColumn('event', 'id', {
        type: dataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
      });
      columns = await meta.getColumnsAsync('event');
    });

   

    lab.after(() => db.dropTable('event'));

    lab.test('with additional title column', () => {
      expect(columns).to.exist();
      expect(columns.length).to.shallow.equal(3);
      const column = findByName(columns, 'title');
      expect(column.getName()).to.shallow.equal('title');
      expect(column.getDataType()).to.shallow.equal('CHARACTER VARYING');


      // Testing the "after" constraint
      // mysql > 8 does not return the same way anymore,
      // results may be in random order, so we check explicitly
      // the element with ordinal position 2
      expect(
        columns.find((x) => x.meta.ordinal_position === 2).getName()
      ).to.equal('date');
    });
  });

  lab.after(() => db.close())
})






//   .addBatch({
//     removeColumn: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             }
//           },
//           function () {
//             db.addColumn(
//               'event',
//               'title',
//               'string',
//               function (err) {
//                 expect(err).to.not.exist();
//                 db.removeColumn(
//                   'event',
//                   'title',
//                   this.callback.bind(this, null)
//                 );
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
// 
//       'has column metadata': {
//         topic: function () {
//           dbmeta(
//             'pg',
//             { connection: db.connection },
//             function (err, meta) {
//               if (err) {
//                 return this.callback(err);
//               }
//               meta.getColumns('event', this.callback);
//             }.bind(this)
//           );
//         },
// 
//         'without title column': function (err, columns) {
//           expect(err).to.not.exist();
//           expect(columns).to.exist();
//           expect(columns.length).to.shallow.equal(1);
//           expect(columns[0].getName()).to.not.shallow.equal('title');
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     renameColumn: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             }
//           },
//           function () {
//             db.addColumn(
//               'event',
//               'title',
//               'string',
//               function (err) {
//                 expect(err).to.not.exist();
//                 db.renameColumn(
//                   'event',
//                   'title',
//                   'new_title',
//                   this.callback.bind(this, null)
//                 );
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
// 
//       'has column metadata': {
//         topic: function () {
//           dbmeta(
//             'pg',
//             { connection: db.connection },
//             function (err, meta) {
//               if (err) {
//                 return this.callback(err);
//               }
//               meta.getColumns('event', this.callback);
//             }.bind(this)
//           );
//         },
// 
//         'with renamed title column': function (err, columns) {
//           expect(err).to.not.exist();
//           expect(columns).to.exist();
//           expect(columns.length).to.shallow.equal(2);
//           const column = findByName(columns, 'new_title');
//           expect(column.getName()).to.shallow.equal('new_title');
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     changeColumn: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             },
//             txt: {
//               type: dataType.TEXT,
//               notNull: true,
//               unique: true,
//               defaultValue: 'foo'
//             },
//             keep_id: { type: dataType.INTEGER, notNull: true, unique: true },
//             type_test: { type: dataType.BLOB, notNull: true },
//             type_length_test: {
//               type: dataType.STRING,
//               length: 50,
//               notNull: true
//             }
//           },
//           function () {
//             var spec = { notNull: false, defaultValue: 'foo2', unique: false };
//             var spec2 = { notNull: true, unsigned: true };
//             var spec3 = {
//               type: dataType.INTEGER,
//               using: util.format(
//                 'USING CAST(CAST("type_test" AS %s) AS %s)',
//                 dataType.TEXT,
//                 dataType.INTEGER
//               )
//             };
//             var spec4 = { type: dataType.STRING, length: 100 };
// 
//             db.changeColumn(
//               'event',
//               'txt',
//               spec,
//               function () {
//                 db.changeColumn(
//                   'event',
//                   'keep_id',
//                   spec2,
//                   function () {
//                     db.changeColumn(
//                       'event',
//                       'type_test',
//                       spec3,
//                       function () {
//                         db.changeColumn(
//                           'event',
//                           'type_length_test',
//                           spec4,
//                           this.callback.bind(this, null)
//                         );
//                       }.bind(this)
//                     );
//                   }.bind(this)
//                 );
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
//       'has column metadata': {
//         topic: function () {
//           dbmeta(
//             'pg',
//             { connection: db.connection },
//             function (err, meta) {
//               if (err) {
//                 return this.callback(err);
//               }
//               meta.getColumns('event', this.callback);
//             }.bind(this)
//           );
//         },
// 
//         'with changed title column': function (err, columns) {
//           expect(err).to.not.exist();
//           expect(columns).to.exist();
//           expect(columns.length).to.shallow.equal(5);
// 
//           const column = findByName(columns, 'txt');
//           expect(column.getName()).to.shallow.equal('txt');
//           expect(column.isNullable()).to.shallow.equal(true);
//           expect(column.getDefaultValue()).to.shallow.equal("'foo2'::text");
//           expect(column.isUnique()).to.shallow.equal(false);
// 
//           column = findByName(columns, 'keep_id');
//           expect(column.getName()).to.shallow.equal('keep_id');
//           expect(column.isNullable()).to.shallow.equal(false);
//           expect(column.isUnique()).to.shallow.equal(true);
// 
//           column = findByName(columns, 'type_test');
//           expect(column.getName()).to.shallow.equal('type_test');
//           expect(dataType[column.getDataType()]).to.shallow.equal(dataType.INTEGER);
// 
//           column = findByName(columns, 'type_length_test');
//           expect(column.getName()).to.shallow.equal('type_length_test');
//           expect(column.getDataType()).to.shallow.equal('CHARACTER VARYING');
//           expect(column.meta.character_maximum_length).to.shallow.equal(100);
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     addIndex: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             },
//             title: { type: dataType.STRING }
//           },
//           function () {
//             db.addIndex(
//               'event',
//               'event_title',
//               'title',
//               this.callback.bind(this, null)
//             );
//           }.bind(this)
//         );
//       },
// 
//       'has resulting index metadata': {
//         topic: function () {
//           dbmeta(
//             'pg',
//             { connection: db.connection },
//             function (err, meta) {
//               if (err) {
//                 return this.callback(err);
//               }
//               meta.getIndexes('event', this.callback);
//             }.bind(this)
//           );
//         },
// 
//         'with additional index': function (err, indexes) {
//           expect(err).to.not.exist();
//           expect(indexes).to.exist();
//           expect(indexes.length).to.shallow.equal(2);
//           var index = findByName(indexes, 'event_title');
//           expect(index.getName()).to.shallow.equal('event_title');
//           expect(index.getTableName()).to.shallow.equal('event');
//           expect(index.getColumnName()).to.shallow.equal('title');
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     addForeignKey: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             },
//             event_id: { type: dataType.INTEGER, notNull: true },
//             title: { type: dataType.STRING }
//           },
//           function () {
//             db.createTable(
//               'event_type',
//               {
//                 id: {
//                   type: dataType.INTEGER,
//                   primaryKey: true,
//                   autoIncrement: true
//                 },
//                 title: { type: dataType.STRING }
//               },
//               function () {
//                 // lowercase table names because they are quoted in the function
//                 // and pg uses lowercase internally
//                 db.addForeignKey(
//                   'event',
//                   'event_type',
//                   'fk_event_event_type',
//                   {
//                     event_id: 'id'
//                   },
//                   {
//                     onDelete: 'CASCADE'
//                   },
//                   this.callback
//                 );
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
// 
//       'sets usage and constraints': {
//         topic: function () {
//           var metaQuery = [
//             'SELECT',
//             ' tc.table_schema, tc.table_name as ortn, kcu.column_name orcn, ccu.table_name,',
//             '  ccu.column_name,',
//             '  cstr.update_rule,',
//             '  cstr.delete_rule',
//             'FROM',
//             '  information_schema.table_constraints AS tc',
//             'JOIN information_schema.key_column_usage AS kcu',
//             '  ON tc.constraint_name = kcu.constraint_name',
//             'JOIN information_schema.constraint_column_usage AS ccu',
//             '  ON ccu.constraint_name = tc.constraint_name',
//             'JOIN information_schema.referential_constraints AS cstr',
//             '  ON cstr.constraint_schema = tc.table_schema',
//             '    AND cstr.constraint_name = tc.constraint_name',
//             'WHERE',
//             '  tc.table_schema = ?',
//             '  AND tc.table_name = ?',
//             '  AND kcu.column_name = ?'
//           ].join('\n');
//           db.runSql(metaQuery, ['public', 'event', 'event_id'], this.callback);
//         },
// 
//         'with correct references': function (err, result) {
//           expect(err).to.not.exist();
//           var rows = result.rows;
//           expect(rows).to.exist();
//           expect(rows.length).to.shallow.equal(1);
//           var row = rows[0];
//           expect(row.table_name).to.shallow.equal('event_type');
//           expect(row.column_name).to.shallow.equal('id');
//         },
// 
//         'and correct rules': function (err, result) {
//           expect(err).to.not.exist();
//           var rows = result.rows;
//           expect(rows).to.exist();
//           expect(rows.length).to.shallow.equal(1);
//           var row = rows[0];
//           expect(row.update_rule).to.shallow.equal('NO ACTION');
//           expect(row.delete_rule).to.shallow.equal('CASCADE');
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('event')
//           .then(function () {
//             return db.dropTable('event_type');
//           })
//           .nodeify(this.callback);
//       }
//     }
//   })
//   .addBatch({
//     removeForeignKey: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             },
//             event_id: { type: dataType.INTEGER, notNull: true },
//             title: { type: dataType.STRING }
//           },
//           function () {
//             db.createTable(
//               'event_type',
//               {
//                 id: {
//                   type: dataType.INTEGER,
//                   primaryKey: true,
//                   autoIncrement: true
//                 },
//                 title: { type: dataType.STRING }
//               },
//               function () {
//                 db.addForeignKey(
//                   'event',
//                   'event_type',
//                   'fk_event_event_type',
//                   {
//                     event_id: 'id'
//                   },
//                   {
//                     onDelete: 'CASCADE'
//                   },
//                   function () {
//                     db.removeForeignKey(
//                       'event',
//                       'fk_event_event_type',
//                       this.callback.bind(this, null)
//                     );
//                   }.bind(this)
//                 );
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
// 
//       teardown: function () {
//         db.dropTable('event')
//           .then(function () {
//             return db.dropTable('event_type');
//           })
//           .nodeify(this.callback);
//       },
// 
//       'removes usage and constraints': {
//         topic: function () {
//           var metaQuery = [
//             'SELECT',
//             ' tc.table_schema, tc.table_name as ortn, kcu.column_name orcn, ccu.table_name,',
//             '  ccu.column_name,',
//             '  cstr.update_rule,',
//             '  cstr.delete_rule',
//             'FROM',
//             '  information_schema.table_constraints AS tc',
//             'JOIN information_schema.key_column_usage AS kcu',
//             '  ON tc.constraint_name = kcu.constraint_name',
//             'JOIN information_schema.constraint_column_usage AS ccu',
//             '  ON ccu.constraint_name = tc.constraint_name',
//             'JOIN information_schema.referential_constraints AS cstr',
//             '  ON cstr.constraint_schema = tc.table_schema',
//             '    AND cstr.constraint_name = tc.constraint_name',
//             'WHERE',
//             '  tc.table_schema = ?',
//             '  AND tc.table_name = ?',
//             '  AND kcu.column_name = ?'
//           ].join('\n');
//           db.runSql(metaQuery, ['public', 'event', 'event_id'], this.callback);
//         },
// 
//         completely: function (err, result) {
//           expect(err).to.not.exist();
//           expect(result.rows).to.exist();
//           expect(result.rows.length).to.shallow.equal(0);
//         }
//       }
//     }
//   })
//   .addBatch({
//     'addForeign by addcolumn with spec': {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             },
//             event_id: { type: dataType.INTEGER, notNull: true },
//             title: { type: dataType.STRING }
//           },
//           function () {
//             db.createTable(
//               'event_type',
//               {
//                 id: {
//                   type: dataType.INTEGER,
//                   primaryKey: true,
//                   autoIncrement: true
//                 },
//                 title: { type: dataType.STRING }
//               },
//               function () {
//                 db.addColumn(
//                   'event_type',
//                   'event_id',
//                   {
//                     type: dataType.INTEGER,
//                     notNull: true,
//                     foreignKey: {
//                       name: 'primary_event_id_fk',
//                       table: 'event',
//                       rules: {
//                         onDelete: 'CASCADE',
//                         onUpdate: 'RESTRICT'
//                       },
//                       mapping: 'id'
//                     }
//                   },
//                   this.callback.bind(this, null)
//                 );
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
// 
//       teardown: function () {
//         db.dropTable('event_type')
//           .then(function (data) {
//             return db.dropTable('event');
//           })
//           .nodeify(this.callback);
//       },
// 
//       'sets usage and constraints': {
//         topic: function () {
//           var metaQuery = [
//             'SELECT',
//             ' tc.table_schema, tc.table_name as ortn, kcu.column_name orcn, ccu.table_name,',
//             '  ccu.column_name,',
//             '  cstr.update_rule,',
//             '  cstr.delete_rule',
//             'FROM',
//             '  information_schema.table_constraints AS tc',
//             'JOIN information_schema.key_column_usage AS kcu',
//             '  ON tc.constraint_name = kcu.constraint_name',
//             'JOIN information_schema.constraint_column_usage AS ccu',
//             '  ON ccu.constraint_name = tc.constraint_name',
//             'JOIN information_schema.referential_constraints AS cstr',
//             '  ON cstr.constraint_schema = tc.table_schema',
//             '    AND cstr.constraint_name = tc.constraint_name',
//             'WHERE',
//             '  tc.table_schema = ?',
//             '  AND tc.table_name = ?',
//             '  AND kcu.column_name = ?'
//           ].join('\n');
//           db.runSql(
//             metaQuery,
//             ['public', 'event_type', 'event_id'],
//             this.callback
//           );
//         },
// 
//         'with correct references': function (err, result) {
//           expect(err).to.not.exist();
//           var rows = result.rows;
//           expect(rows).to.exist();
//           expect(rows.length).to.shallow.equal(1);
//           var row = rows[0];
//           expect(row.table_name).to.shallow.equal('event');
//           expect(row.column_name).to.shallow.equal('id');
//         },
// 
//         'and correct rules': function (err, result) {
//           expect(err).to.not.exist();
//           var rows = result.rows;
//           expect(rows).to.exist();
//           expect(rows.length).to.shallow.equal(1);
//           var row = rows[0];
//           expect(row.update_rule).to.shallow.equal('RESTRICT');
//           expect(row.delete_rule).to.shallow.equal('CASCADE');
//         }
//       }
//     }
//   })
//   .addBatch({
//     insert: {
//       topic: function () {
//         db.createTable('event', {
//           id: {
//             type: dataType.INTEGER,
//             primaryKey: true,
//             autoIncrement: true
//           },
//           title: { type: dataType.STRING }
//         })
//           .then(function () {
//             return db.insert('event', ['id', 'title'], [2, 'title']);
//           })
//           .then(function () {
//             return db.runSql('SELECT * from event');
//           })
//           .nodeify(this.callback);
//       },
// 
//       'with additional row': function (err, data) {
//         expect(err).to.not.exist();
//         expect(data.rowCount).to.shallow.equal(1);
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     insertWithSingleQuotes: {
//       topic: function () {
//         db.createTable('event', {
//           id: {
//             type: dataType.INTEGER,
//             primaryKey: true,
//             autoIncrement: true
//           },
//           title: { type: dataType.STRING }
//         })
//           .then(function () {
//             return db.insert(
//               'event',
//               ['id', 'title'],
//               [2, "Bill's Mother's House"]
//             );
//           })
//           .then(function () {
//             return db.runSql('SELECT * from event');
//           })
//           .nodeify(this.callback);
//       },
// 
//       'with additional row': function (err, data) {
//         expect(err).to.not.exist();
//         expect(data.rowCount).to.shallow.equal(1);
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     removeIndex: {
//       topic: function () {
//         db.createTable(
//           'event',
//           {
//             id: {
//               type: dataType.INTEGER,
//               primaryKey: true,
//               autoIncrement: true
//             },
//             title: {
//               type: dataType.STRING
//             }
//           },
//           function () {
//             db.addIndex(
//               'event',
//               'event_title',
//               'title',
//               function (err) {
//                 expect(err).to.not.exist();
//                 db.removeIndex('event_title', this.callback.bind(this, null));
//               }.bind(this)
//             );
//           }.bind(this)
//         );
//       },
// 
//       'has resulting index metadata': {
//         topic: function () {
//           dbmeta(
//             'pg',
//             { connection: db.connection },
//             function (err, meta) {
//               if (err) {
//                 return this.callback(err);
//               }
//               meta.getIndexes('event', this.callback);
//             }.bind(this)
//           );
//         },
// 
//         'without index': function (err, indexes) {
//           expect(err).to.not.exist();
//           expect(indexes).to.exist();
//           expect(indexes.length).to.shallow.equal(1); // first index is primary key
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('event', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     createMigrationsTable: {
//       topic: function () {
//         db.createMigrationsTable(this.callback.bind(this, null));
//       },
// 
//       'has migrations table': {
//         topic: function () {
//           dbmeta(
//             'pg',
//             { connection: db.connection },
//             function (err, meta) {
//               if (err) {
//                 return this.callback(err);
//               }
//               meta.getTables(this.callback);
//             }.bind(this)
//           );
//         },
// 
//         'has migrations table': function (err, tables) {
//           expect(err).to.not.exist();
//           expect(tables).to.exist();
//           expect(tables.length).to.shallow.equal(1);
//           expect(tables[0].getName()).to.shallow.equal('migrations');
//         },
// 
//         'that has columns': {
//           topic: function () {
//             dbmeta(
//               'pg',
//               { connection: db.connection },
//               function (err, meta) {
//                 if (err) {
//                   return this.callback(err);
//                 }
//                 meta.getColumns('migrations', this.callback);
//               }.bind(this)
//             );
//           },
// 
//           'with names': function (err, columns) {
//             expect(err).to.not.exist();
//             expect(columns).to.exist();
//             expect(columns.length).to.shallow.equal(3);
//             const column = findByName(columns, 'id');
//             expect(column.getName()).to.shallow.equal('id');
//             expect(column.getDataType()).to.shallow.equal('INTEGER');
//             column = findByName(columns, 'name');
//             expect(column.getName()).to.shallow.equal('name');
//             expect(column.getDataType()).to.shallow.equal('CHARACTER VARYING');
//             column = findByName(columns, 'run_on');
//             expect(column.getName()).to.shallow.equal('run_on');
//             expect(
//               column.getDataType()).to.shallow.equal(
//               'TIMESTAMP WITHOUT TIME ZONE'
//             );
//           }
//         }
//       },
// 
//       teardown: function () {
//         db.dropTable('migrations', this.callback);
//       }
//     }
//   })
//   .addBatch({
//     switchDatabase: {
//       topic: function () {
//         db.switchDatabase({ schema: 'test_schema2' }, this.callback);
//       },
// 
//       'has search path': {
//         topic: function () {
//           db.runSql('SHOW search_path', this.callback);
//         },
// 
//         'containing the new schema': function (err, result) {
//           expect(err).to.not.exist();
//           var rows = result.rows;
//           expect(rows).to.exist();
//           expect(rows.length).to.shallow.equal(1);
//           var row = rows[0];
//           expect(row.search_path).to.shallow.equal('test_schema2');
//         }
//       },
// 
//       teardown: function () {
//         db.switchDatabase({ schema: config.schema }, this.callback);
//       }
//     }
//   })
//   .export(module);

function findByName (columns, name) {
  for (var i = 0; i < columns.length; i++) {
    if (columns[i].getName() === name) {
      return columns[i];
    }
  }
  return null;
}
