const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
const lab = (exports.lab = Lab.script());
const util = require('util');
let dbmeta = require('db-meta');
const dataType = require('db-migrate-shared').dataType;
const Promise = require('bluebird');
const driver = require('../');
const log = require('db-migrate-shared').log;

dbmeta = Promise.promisify(dbmeta);

const config = require('./db.config.json').pg;

const internals = {};
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
    let con;

    lab.test('default connection', async () => {
      con = await Promise.promisify(driver.connect)(config, internals);
      expect(con).to.exist();
    });

    lab.afterEach(async () => {
      con.close();
    });
  });

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
        }
      );
      tables = await meta.getTablesAsync();
    });

    lab.test('has table metadata containing the event table', async () => {
      expect(tables.length).to.shallow.equal(1);
      expect(tables[0].getName()).to.shallow.equal('event');
    });

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
      });

      lab.test('that has text txt column that is non-nullable', async () => {
        const column = findByName(columns, 'txt');
        expect(column.getDataType()).to.shallow.equal('TEXT');
        expect(column.isNullable()).to.shallow.equal(false);
        // expect(column.getDefaultValue()).to.shallow.equal('foo');
      });

      lab.test('that has integer intg column', async () => {
        const column = findByName(columns, 'intg');
        expect(column.getDataType()).to.shallow.equal('INTEGER');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has real rel column', async () => {
        const column = findByName(columns, 'rel');
        expect(column.getDataType()).to.shallow.equal('REAL');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has integer dt column', async () => {
        const column = findByName(columns, 'dt');
        expect(column.getDataType()).to.shallow.equal('DATE');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has integer dti column', async () => {
        const column = findByName(columns, 'dti');
        expect(
          column.getDataType()).to.shallow.equal('TIMESTAMP WITHOUT TIME ZONE'
        );
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has timestamp with time zone column', async () => {
        const column = findByName(columns, 'dti_tz');
        expect(column.getDataType()).to.shallow.equal('TIMESTAMP WITH TIME ZONE');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has boolean bl column', async () => {
        const column = findByName(columns, 'bl');
        expect(column.getDataType()).to.shallow.equal('BOOLEAN');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has character chr column', async () => {
        const column = findByName(columns, 'chr');
        expect(column.getDataType()).to.shallow.equal('CHARACTER');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has small integer smalint column', async () => {
        const column = findByName(columns, 'smalint');
        expect(column.getDataType()).to.shallow.equal('SMALLINT');
        expect(column.isNullable()).to.shallow.equal(true);
      });

      lab.test('that has raw column', async () => {
        const column = findByName(columns, 'raw');
        expect(column.getDefaultValue()).to.shallow.equal('CURRENT_TIMESTAMP');
      });

      lab.test('that has special CURRENT_TIMESTAMP column', async () => {
        const column = findByName(columns, 'special');
        expect(column.getDefaultValue()).to.shallow.equal('CURRENT_TIMESTAMP');
      });
    });

    lab.after(() => db.dropTable('event'));
  });

  lab.experiment('autoIncrement', () => {
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
        }
      );

      columns = await meta.getColumnsAsync('event');
    });

    lab.test('has column metadata with auto increment column', async () => {
      const column = findByName(columns, 'id');
      expect(column.getDataType()).to.shallow.equal('BIGINT');
      expect(column.getDefaultValue()).to.shallow.equal("nextval('event_id_seq'::regclass)");
      expect(column.isPrimaryKey()).to.shallow.equal(true);
      expect(column.isNullable()).to.shallow.equal(false);
      expect(column.isAutoIncrementing()).to.shallow.equal(true);
    });

    lab.after(() => db.dropTable('event'));
  });

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
    });
  });

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

  lab.experiment('removeColumn', () => {
    let columns;

    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });
      await db.removeColumn('event', 'title');
      columns = await meta.getColumnsAsync('event');
    });

    lab.after(() => db.dropTable('event'));
    lab.test('without title column', () => {
      expect(columns).to.exist();
      expect(columns.length).to.equal(1);
      expect(columns[0].getName()).to.not.equal('title');
    });
  });

  lab.experiment('renameColumn', () => {
    let columns;

    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });
      await db.renameColumn('event', 'title', 'new_title');
      columns = await meta.getColumnsAsync('event');
    });

    lab.after(() => db.dropTable('event'));

    lab.test('with renamed title column', () => {
      expect(columns).to.exist();
      expect(columns.length).to.equal(2);
      const column = findByName(columns, 'new_title');
      expect(column).to.exist();
      expect(column.getName()).to.equal('new_title');
    });
  });

  lab.experiment('changeColumn', () => {
    let columns;

    lab.before(async () => {
      await db.createTable(
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
        });

      const spec = { notNull: false, defaultValue: 'foo2', unique: false };
      const spec2 = { notNull: true, unsigned: true };
      const spec3 = {
        type: dataType.INTEGER,
        using: util.format(
          'USING CAST(CAST("type_test" AS %s) AS %s)',
          dataType.TEXT,
          dataType.INTEGER
        )
      };
      const spec4 = { type: dataType.STRING, length: 100 };

      await db.changeColumn(
        'event',
        'txt',
        spec);
      await db.changeColumn(
        'event',
        'keep_id',
        spec2);
      await db.changeColumn(
        'event',
        'type_test',
        spec3);
      await db.changeColumn(
        'event',
        'type_length_test',
        spec4);

      columns = await meta.getColumnsAsync('event');
    });

    lab.after(() => db.dropTable('event'));

    lab.test('with changed title column', () => {
      expect(columns).to.exist();
      expect(columns.length).to.shallow.equal(5);

      let column = findByName(columns, 'txt');
      expect(column.getName()).to.shallow.equal('txt');
      expect(column.isNullable()).to.shallow.equal(true);
      expect(column.getDefaultValue()).to.shallow.equal("'foo2'::text");
      expect(column.isUnique()).to.shallow.equal(false);

      column = findByName(columns, 'keep_id');
      expect(column.getName()).to.shallow.equal('keep_id');
      expect(column.isNullable()).to.shallow.equal(false);
      expect(column.isUnique()).to.shallow.equal(true);

      column = findByName(columns, 'type_test');
      expect(column.getName()).to.shallow.equal('type_test');
      expect(dataType[column.getDataType()]).to.shallow.equal(dataType.INTEGER);

      column = findByName(columns, 'type_length_test');
      expect(column.getName()).to.shallow.equal('type_length_test');
      expect(column.getDataType()).to.shallow.equal('CHARACTER VARYING');
      expect(column.meta.character_maximum_length).to.shallow.equal(100);
    });
  });

  lab.experiment('columnForeignKeySpec', () => {
    let rows;

    lab.before(async () => {
      await db.createTable('event_type', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        event_id: {
          type: dataType.INTEGER,
          notNull: true,
          foreignKey: {
            name: 'fk_event_event_type',
            table: 'event_type',
            mapping: 'id',
            rules: {
              onDelete: 'CASCADE'
            }
          }
        },
        title: {
          type: dataType.STRING
        }
      });

      const metaQuery = [
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

      ({ rows } = await db.runSql(
        metaQuery,
        ['public', 'event', 'event_id']
      ));
    });

    lab.after(async () => {
      await db.dropTable('event');
      await db.dropTable('event_type');
    });

    lab.experiment('sets usage and constraints', () => {
      lab.test('with correct references', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(1);
        const row = rows[0];
        expect(row.table_name).to.equal('event_type');
        expect(row.column_name).to.equal('id');
      });

      lab.test('and correct rules', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(1);
        const row = rows[0];
        expect(row.update_rule).to.shallow.equal('NO ACTION');
        expect(row.delete_rule).to.shallow.equal('CASCADE');
      });
    });
  });

  lab.experiment('explicitColumnForeignKeySpec', () => {
    let rows;

    lab.before(async () => {
      await db.createTable('event_type', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        event_id: {
          type: dataType.INTEGER,
          notNull: true,
          foreignKey: {
            name: 'fk_event_event_type',
            table: 'event_type',
            mapping: 'id',
            rules: {
              onDelete: 'CASCADE'
            }
          }
        },
        event_id2: {
          type: dataType.INTEGER,
          notNull: true,
          foreignKey: {
            name: 'fk_event_event2_type',
            table: 'event_type',
            mapping: 'id',
            rules: {
              onDelete: 'CASCADE'
            }
          }
        },
        title: {
          type: dataType.STRING
        }
      });

      const metaQuery = [
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
        '  AND (kcu.column_name = ? OR kcu.column_name = ?)'
      ].join('\n');

      ({ rows } = await db.runSql(
        metaQuery,
        ['public', 'event', 'event_id', 'event_id2']
      ));
    });

    lab.after(async () => {
      await db.dropTable('event');
      await db.dropTable('event_type');
    });

    lab.experiment('sets usage and constraints', () => {
      lab.test('with correct references', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(2);
        let row = rows[0];
        expect(row.table_name).to.shallow.equal('event_type');
        expect(row.column_name).to.shallow.equal('id');

        row = rows[1];
        expect(row.table_name).to.shallow.equal('event_type');
        expect(row.column_name).to.shallow.equal('id');
        row = rows[1];
        expect(row.update_rule).to.shallow.equal('NO ACTION');
        expect(row.delete_rule).to.shallow.equal('CASCADE');
      });

      lab.test('and correct rules', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(2);
        let row = rows[0];
        expect(row.update_rule).to.shallow.equal('NO ACTION');
        expect(row.delete_rule).to.shallow.equal('CASCADE');

        row = rows[1];
        expect(row.table_name).to.shallow.equal('event_type');
        expect(row.column_name).to.shallow.equal('id');
        row = rows[1];
        expect(row.update_rule).to.shallow.equal('NO ACTION');
        expect(row.delete_rule).to.shallow.equal('CASCADE');
      });
    });
  });

  lab.experiment('addForeignKey', () => {
    let rows;

    lab.before(async () => {
      await db.createTable('event_type', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        event_id: {
          type: dataType.INTEGER,
          notNull: true
        },
        title: {
          type: dataType.STRING
        }
      });
      await db.addForeignKey(
        'event',
        'event_type',
        'fk_event_event_type',
        {
          event_id: 'id'
        },
        {
          onDelete: 'CASCADE'
        }
      );

      const metaQuery = [
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
      ({ rows } = await db.runSql(metaQuery, ['public', 'event', 'event_id']));
    });

    lab.after(async () => {
      await db.dropTable('event');
      await db.dropTable('event_type');
    });

    lab.experiment('sets usage and constraints', () => {
      lab.test('with correct references', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(1);
        const row = rows[0];
        expect(row.table_name).to.shallow.equal('event_type');
        expect(row.column_name).to.shallow.equal('id');
      });

      lab.test('and correct rules', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(1);
        const row = rows[0];
        expect(row.update_rule).to.shallow.equal('NO ACTION');
        expect(row.delete_rule).to.shallow.equal('CASCADE');
      });
    });
  });

  lab.experiment('removeForeignKey', () => {
    let rows;

    lab.before(async () => {
      await db.createTable('event_type', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        event_id: {
          type: dataType.INTEGER,
          notNull: true
        },
        title: {
          type: dataType.STRING
        }
      });
      await db.addForeignKey(
        'event',
        'event_type',
        'fk_event_event_type',
        {
          event_id: 'id'
        },
        {
          onDelete: 'CASCADE'
        }
      );
      await db.removeForeignKey('event', 'fk_event_event_type');

      const metaQuery = [
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
      ({ rows } = await db.runSql(metaQuery, ['public', 'event', 'event_id']));
    });

    lab.after(async () => {
      await db.dropTable('event');
      await db.dropTable('event_type');
    });

    lab.experiment('sets usage and constraints', () => {
      lab.test('removes usage and constraints', () => {
        expect(rows).to.exist();
        expect(rows.length).to.equal(0);
      });
    });
  });

  lab.experiment('insert', () => {
    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });

      await db.insert('event', ['id', 'title'], [2, 'title']);
    });

    lab.after(() => db.dropTable('event'));

    lab.test('with additional row', async () => {
      const { rows } = await db.runSql('SELECT * from event');
      expect(rows.length).to.equal(1);
    });
  });

  lab.experiment('insertWithSingleQuotes', () => {
    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });

      await db.insert('event', ['id', 'title'], [2, "Bill's Mother's House"]);
    });

    lab.after(() => db.dropTable('event'));

    lab.test('with additional row', async () => {
      const { rows } = await db.runSql('SELECT * from event');
      expect(rows.length).to.equal(1);
    });
  });

  lab.experiment('addIndex', () => {
    let tables;
    let indexes;

    lab.before(async () => {
      await db.createTable('event', {
        id: {
          type: dataType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: { type: dataType.STRING }
      });

      await db.addIndex('event', 'event_title', 'title');
      tables = await meta.getTablesAsync();
      indexes = await meta.getIndexesAsync('event');
    });

    lab.after(() => db.dropTable('event'));

    lab.test('preserves case of the functions original table', () => {
      expect(tables).to.exist();
      expect(tables.length).to.equal(1);
      expect(tables[0].getName()).to.equal('event');
    });

    lab.test('has table with additional indexes', () => {
      expect(indexes).to.exist();
      expect(indexes.length).to.equal(2);

      const index = findByName(indexes, 'event_title');
      expect(index.getName()).to.equal('event_title');
      expect(index.getTableName()).to.equal('event');
      expect(index.getColumnName()).to.equal('title');
    });
  });

  lab.experiment('createMigrationsTable', () => {
    let tables;
    let columns;

    lab.before(async () => {
      await Promise.promisify(db.createMigrationsTable.bind(db))();

      columns = await meta.getColumnsAsync('migrations');
      tables = await meta.getTablesAsync();
    });

    lab.after(() => db.dropTable('migrations'));

    lab.test('has migrations table', () => {
      expect(tables).to.exist();
      expect(tables.length).to.equal(1);
      expect(tables[0].getName()).to.equal('migrations');
    });

    lab.test('with names', () => {
      expect(columns).to.exist();
      expect(columns.length).to.equal(3);
      let column = findByName(columns, 'id');
      expect(column.getName()).to.equal('id');
      expect(column.getDataType()).to.equal('INTEGER');
      column = findByName(columns, 'name');
      expect(column.getName()).to.equal('name');
      expect(column.getDataType()).to.equal('CHARACTER VARYING');
      column = findByName(columns, 'run_on');
      expect(column.getName()).to.equal('run_on');
      expect(column.getDataType()).to.equal('TIMESTAMP WITHOUT TIME ZONE');
    });
  });

  lab.experiment('switchDatabase', () => {
    let rows;

    lab.before(async () => {
      await db.switchDatabase({ schema: 'test_schema2' });

      ({ rows } = await db.runSql('SHOW search_path'));
    });

    lab.test('has search path containing the new schema', async () => {
      expect(rows).to.exist();
      expect(rows.length).to.shallow.equal(1);
      const row = rows[0];
      expect(row.search_path).to.shallow.equal('test_schema2');
    });

    lab.after(() => db.switchDatabase({ schema: config.schema }));
  });

  lab.experiment('createDatabase', () => {
    let rows;

    lab.before(async () => {
      await db.createDatabase('test2');
    });

    // this seems to not work currently, the code was temporarily removed
    lab.test.skip('create already existing db with ifNotExist flag', async () => {
      await db.createDatabase('test2', { ifNotExists: true });
    });

    lab.after(() => db.dropDatabase('test2'));
  });

  lab.experiment('searchPath', () => {
    let rows;

    lab.before(async () => {
      await db.runSql('SET search_path TO "$user",public,"something-with-quotes";');
    });

    lab.test('create already existing db with ifNotExist flag', async () => {
      await db.createMigrationsTable();
    });

    lab.after(async () => {
      await db.dropTable('migrations');
      await db.switchDatabase({ schema: config.schema });
    });
  });

  lab.after(() => db.close());
});

function findByName (columns, name) {
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].getName() === name) {
      return columns[i];
    }
  }
  return null;
}
