'use strict';

import { createHash } from 'crypto';
import diff from 'diff';
import { v4 as uuid } from 'uuid';

const DB = require('db');
const log = require('log')('objects');
let objectsDB : any;

const objects : any = {};

objects.hash = function objects_hash (str : string) : string {
	//
	return createHash('sha256').update(str).digest('base64');
};
/**
 * Check whether object exists, using username and object id
 */
objects.exists = async function objects_exists (username : string, object : string) {
	const pathStr : string = `${username.toLowerCase()}/${object.toLowerCase()}`;
	const pathHash : string = objects.hash(pathStr);
	let exists : boolean = false;
	let res : any;

	try {
		res = await objectsDB.find(`pathhash = '${pathHash}' AND deleted = 0`);
	} catch (err) {
		log.error(err);
	}

	if (res && res.rows && res.rows.length === 1) {
		exists = true;
	}

	return exists;
};

objects.create = async function objects_create (user : any, object : string, source : string) {
	const pathStr : string = `${user.username.toLowerCase()}/${object.toLowerCase()}`;
	const pathHash : string = objects.hash(pathStr);
	const doc : any = {
		id : uuid(),
		username : user.username,
		userid : user.id,
		path : pathStr,
		pathhash : pathHash,
		created : new Date().getTime(),
		updated : new Date().getTime(),
		src : source,
		includes : JSON.stringify(objects.includes.parse(source)),
		rendered : 0
	};

	try {
		await objectsDB.insert(doc);
	} catch (err) {
		log.error(err);
		throw err;
	}

	return doc;
};

objects.index = async function objects_index (user : any) {
	let res : any;
	let rows : any[] = [];

	try {
		res = await objectsDB.find(`userid = '${user.id}' AND deleted = 0`);
	} catch (err) {
		log.error(err);
	}

	if (res && res.rows) {
		rows = res.rows;
	}

	return rows;
};

objects.update = async function objects_update (user : any, object : string, source : string) {
	const pathStr : string = `${user.username.toLowerCase()}/${object.toLowerCase()}`;
	const pathHash : string = objects.hash(pathStr);
	const update = {
		updated : new Date().getTime(),
		src : source,
		includes : JSON.stringify(objects.includes.parse(source)),
		rendered : 0
	};

	try {
		await objectsDB.update(`pathhash = '${pathHash}`, update);
	} catch (err) {
		log.error(err);
		throw err;
	}
	
	log.info('Updated object ' + user.username + '/' + object);
	return update;
};
/**
 * Retrieve an object, using username and object id
 */
objects.get = async function objects_get (username : string, object : string) {
	const pathStr : string = `${username.toLowerCase()}/${object.toLowerCase()}`;
	const pathHash : string = objects.hash(pathStr);
	let exists : boolean = false;
	let res : any;

	try {
		res = await objectsDB.find(`pathhash = '${pathHash}' AND deleted = 0`);
	} catch (err) {
		log.error(err);
	}

	if (res && res.rows && res.rows.length === 1) {
		return res.rows[0];
	}

	return null;
};

objects.destroy = async function objects_destroy (username : string, object : string) {
	const pathStr : string = `${username.toLowerCase()}/${object.toLowerCase()}`;
	const pathHash : string = objects.hash(pathStr);
	let success : boolean = false;

	try {
		await objects.update(`pathhash = '${pathHash}'`, { deleted : 1 });
		success = true;
	} catch (err) {
		log.error(err);
	}

	return success;
};

objects.includes = {};

objects.includes.process = async function objects_includes_process (source : string, includes : any[] ) {
	const paths : any[] = includes.map(function (obj : any) {
		return objects.includes.toPath(obj);
	});
	let count : number = 0;
	let parts : string[];
	let object : any;

	for (let path of paths) {
		parts = path.split('/');
		try {
			object = await objectsDB.get(parts[0], parts[1])
		} catch (err) {
			log.error(err);
		}
		if (object && object.src) {
			source = source.replace(includes[count], '//' + includes[count] + '\n' + object.src + '\n');
		}
		count++;
	}
	return source;
};

objects.includes.parse = function objects_includes_parse (source : string) : string[] {
	const lines : string[] = source.split('\n');
	const reInclude : RegExp = /(include <)+(.*)+(>;)/g;
	const inc : string[] = lines.filter(function (elem) {
		if (elem.indexOf('include') !== -1
		&& elem.indexOf('<') !== -1
		&& elem.indexOf('>') !== -1
		&& elem.indexOf(';') !== -1) {
			if (elem.split('<')[1].indexOf('/') !== -1){
				return elem;
			}
		}
	});
	return inc;
};

objects.includes.toPath =function objects_includes_toPath (str : string) : string {
	const re1 : RegExp = /(include)/g;
	const re2 : RegExp = /(include )/g;
	const re3 : RegExp = /([<>;])/g;
	let slashes : any;
	let output : string = str.replace(re1, '').replace(re2, '').replace(re3, '').trim();
	if (output[0] === '/') {
		output = output.substring(1);
	}
	if (output[output.length - 1] === '/') {
		output = output.slice(0, -1);
	}
	slashes = (output.match(new RegExp('/', 'g')) || []).length;
	if (slashes) {

	}
	return output.trim();
};

module.exports = async (pool : any) => {
	objectsDB = new DB('objects', pool);

	await objectsDB.connect();

	return objects;
};