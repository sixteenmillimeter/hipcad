'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/** @module db */
/** General purpose SQL db library for PostgreSQL. Used for prototyping and then deployment. */
const pg_1 = require("pg");
const path_1 = require("path");
const squelRaw = __importStar(require("squel"));
const log = require('log')('db');
/** Class representing a database connection */
class DB {
    /**
     * Initialized connection to database and create client.
     *
     * 	@constructor
     *  @param 	{String}  	name 	Table name to connect to
     *  @param 	{Object}	pool 	Pool to connect to, optional.
     */
    constructor(name, pool) {
        const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/sandbox';
        this._tableName = name;
        this.squel = squelRaw.useFlavour('postgres');
        if (!pool) {
            this._pool = new pg_1.Pool({ connectionString: DATABASE_URL });
        }
        else {
            this._pool = pool;
        }
    }
    /**
     * Create table if it does not exist. If it does, update table to latest schema.
     *
     */
    async connect() {
        try {
            await this._createTable();
        }
        catch (err) {
            //
        }
    }
    /**
     * Create an empty, column-less table and invoke this._describeTable().
     *
     */
    async _createTable(silent = true) {
        const fn = `${this._tableName}._createTable`;
        const create = `CREATE TABLE IF NOT EXISTS ${this._tableName} ();`;
        let res;
        if (!silent)
            log.info('DB._createTable', create);
        try {
            res = await this.query(create);
        }
        catch (err) {
            if (err.code === '42P07') {
                if (!silent)
                    log.info(fn, `TABLE ${this._tableName} already exists`);
            }
            else {
                log.error(fn, err);
            }
        }
        if (!silent && res)
            log.info(fn, `Created TABLE ${this._tableName}`);
        await this._describeTable();
    }
    /**
     * Query the table description and build an array of columns to alter.
     *
     */
    async _describeTable() {
        const fn = `${this._tableName}._describeTable`;
        const describe = `SElECT column_name, data_type, character_maximum_length FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '${this._tableName}';`;
        const fullPath = path_1.join(process.cwd(), `./table/${this._tableName}.json`);
        const fields = require(fullPath);
        let alterFields = [];
        let res;
        try {
            res = await this.query(describe);
        }
        catch (err) {
            log.error(fn, err);
        }
        if (res) {
            alterFields = this._compareFields(fields, res);
            await this._alterTable(alterFields);
        }
    }
    /**
     * Query the table description and build an array of columns to alter.
     *
     *  @param 	{Array}  mast 		Array of columns to compare
     *  @param 	{Object} current 	Response from query
     */
    _compareFields(mast, current) {
        let currentMap = {};
        let masterCols = Object.keys(mast);
        let currentCols = current.rows.map((elem) => {
            return elem.column_name;
        });
        let inMaster = [];
        let inCurrent = [];
        let toChange = [];
        let alterFields = [];
        for (let col of masterCols) {
            if (currentCols.indexOf(col) === -1) {
                inMaster.push(col);
            }
        }
        for (let col of currentCols) {
            if (masterCols.indexOf(col) === -1) {
                inCurrent.push(col);
            }
        }
        for (let col of inMaster) {
            alterFields.push({ add: true, col, str: mast[col] });
        }
        for (let col of inCurrent) {
            alterFields.push({ drop: true, col });
        }
        return alterFields;
    }
    /**
     * Generate ALTER statement to either ADD or DROP column.
     *
     *  @param 	{Object}  obj 	Object containing alter information
     *
     *  @param 	{String} 	Alter table query
     */
    _alterField(obj) {
        let str;
        if (obj.add) {
            str = `ALTER TABLE ${this._tableName} ADD COLUMN ${obj.col} ${obj.str}; `;
        }
        else if (obj.drop) {
            str = `ALTER TABLE ${this._tableName} DROP COLUMN ${obj.col}; `;
        }
        return str;
    }
    /**
     * Generate and combine all ALTER statements and apply to the
     * table with query.
     *
     *  @param 	{Array}  fields 	Array of objects from comparing current to master.
     */
    async _alterTable(fields, silent = true) {
        const fn = `${this._tableName}._alterTable`;
        let alter = '';
        let res;
        for (let col of fields) {
            alter += this._alterField(col);
        }
        if (alter === '') {
            if (!silent)
                log.info(fn, `TABLE ${this._tableName} is up to date`);
            return;
        }
        if (!silent)
            log.info(fn, alter);
        try {
            res = await this.query(alter);
        }
        catch (err) {
            log.error(fn, err);
        }
        let f = fields.map((elem) => { return elem.col; });
        log.info(fn, `TABLE ${this._tableName} updated columns ${f.join(',')}`);
    }
    /**
     * Drop the table associated with the class.
     */
    async _wipeTable() {
        const fn = `${this._tableName}._wipeTable`;
        const query = `DROP TABLE ${this._tableName};`;
        let res;
        try {
            await this.query(query);
            log.info(fn, `TABLE ${this._tableName} wiped`);
        }
        catch (err) {
            log.error(fn, err);
        }
    }
    /**
     * Insert record into table associated with class. Returns a promise.
     *
     *  @param 	{Object}  obj 	All values to insert
     *
     *  @return {Function}  Promise of query
     */
    insert(obj, silent = true) {
        const fn = `${this._tableName}.insert`;
        const query = this.squel.insert() //{ replaceSingleQuotes: true }
            .into(this._tableName)
            .setFields(obj)
            .toString();
        if (!silent) {
            log.info(fn, query);
        }
        return this.query(query);
    }
    /**
     * Insert record into table associated with class. Returns a promise.
     *
     *  @param  {String}  where WHERE statement to select rows to update
     *  @param 	{Object}  obj 	All values to update in row
     *
     *  @return {Function}  Promise of query
     */
    update(where, obj, silent = true) {
        const fn = `${this._tableName}.update`;
        const query = this.squel.update() //{ replaceSingleQuotes: true }
            .table(this._tableName)
            .where(where)
            .setFields(obj)
            .toString();
        if (!silent) {
            log.info(fn, query);
        }
        return this.query(query);
    }
    /**
     * List all records from table associated with the class.
     *
     *  @return {Function}  Promise of query
     */
    list(silent = true) {
        const fn = `${this._tableName}.list`;
        const query = this.squel.select()
            .from(this._tableName)
            .toString();
        if (!silent) {
            log.info(fn, query);
        }
        return this.query(query);
    }
    /**
     * List all records from table associated with the class that match
     * the supplied WHERE statement.
     *
     *  @param  {String}  where 	WHERE statement of rows to return
     *
     *  @return {Function}  Promise of query
     */
    find(where, silent = true) {
        const fn = `${this._tableName}.find`;
        const query = this.squel.select()
            .from(this._tableName)
            .where(where)
            .toString();
        if (!silent) {
            log.info(fn, query);
        }
        return this.query(query);
    }
    /**
     * Open-ended query statment.
     *
     *  @param  {String}  query 	Query statement to run
     *
     *  @return {Function}  Promise of query
     */
    query(query) {
        const fn = `${this._tableName}.query`;
        return new Promise(async (resolve, reject) => {
            let client;
            let res;
            let pos;
            try {
                client = await this._pool.connect();
            }
            catch (err) {
                return reject(err);
            }
            try {
                res = await client.query(query);
            }
            catch (err) {
                try {
                    await client.release(err);
                } catch (err) {
                    //
                }
                if (err.code && err.code === '42601') {
                    pos = parseInt(err.position);
                    err.positionFailure = query.slice( pos - 10, pos + 10);
                    err.query = query;
                }
                return reject(err);
            }
            try {
                await client.release();
            }
            catch (err) {
                return reject(err);
            }
            return resolve(res);
        });
    }
}
exports.DB = DB;
module.exports = DB;
