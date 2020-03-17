'use strict';

import { writeFile, unlink } from 'fs-extra';
import request from 'request-promise';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

let log = require('log')('openscad');

const tmpDir = join(tmpdir(), '/hipcad/')

async function render (scad : string) : Promise<string> {
	const bin = `openscad`;
	const output = join(tmpDir, scad.replace('.scad', '.stl'));
	const args = [
		'-o', output,
		scad
	];
	let stdout : string = '';
	let stderr : string = '';

	return new Promise((resolve : Function, reject : Function) => {
		const child = spawn(bin, args);
	  	child.stderr.on('data', (data : any) => {
            const line : string = data.toString();
            stderr += line;
        });

        child.stdout.on('data', (data : any) => {
            const line : string = data.toString();
            stdout += line;
        });

		child.on('exit', (code : number) => {
			if (code === 0) {
				return resolve({ file : output, output : stdout });
			} else {
				return reject(stderr);
			}
		});
	});
};

const openscad : any = {};

openscad.render = async function (scad : string) {
	let data : any;

	try {
		data = await render(scad);
		log.info('Rendered ' + scad + ' to ' + data.file);
	} catch (err) {
		log.error(err);
	}
	return data;
			
};

openscad.toFile = async function (id : string, text : string) {
	const now : number = new Date().getTime();
	const fileName : string = now + '_' + id + '.scad';
	const filePath : string = join(tmpDir, fileName);

	try {
		await writeFile(filePath, text, 'utf8');
	} catch (err) {
		log.error(err);
		return null;
	}
	
	return filePath;
};

openscad.cleanTmp = async function (scad : string, stl : string) {
	try {
		await unlink(scad);
		await unlink(stl);
		log.info(`Removed ${scad} and ${stl}`);
	} catch (err) {
		log.error(err);
	}
};

openscad.service = async function openscad_service (username : string, object : any, source : string) {
	const query : any = {
		url : 'https://openscad.hipcad.com/openscad', 
		method : 'POST',
		form: {
			username : username,
			object : object,
			source : source,
			type : 'stl'
		}
	};
	let body : any;
	let res : any;

	try {
		res = await request(query);
	} catch (err) {
		log.error(err);
	}

	try {
		body = JSON.parse(res.body);
	} catch (err) {
		log.error('Invalid response');
		log.error(err);
		return null;
	}

	return body
};

openscad.progress = async function openscad_process (id : string) {
	const query : any = {
		url : `https://openscad.hipcad.com/progress?id=${id}`,
		method : 'GET'
	};
	let res : any;
	let status : any;

	try {
		res = await request(query);
	} catch (err) {
		log.error(err);
	}

	try {
		status = JSON.parse(res.body);
	} catch (err) {
		log.error('Invalid response');
		log.error(err);
		return null;
	}

	return status;
}

module.exports = function (pool : any) {
	return openscad;
};