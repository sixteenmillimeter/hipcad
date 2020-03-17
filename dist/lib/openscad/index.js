'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const request_promise_1 = __importDefault(require("request-promise"));
const child_process_1 = require("child_process");
const os_1 = require("os");
const path_1 = require("path");
let log = require('log')('openscad');
const tmpDir = path_1.join(os_1.tmpdir(), '/hipcad/');
async function render(scad) {
    const bin = `openscad`;
    const output = path_1.join(tmpDir, scad.replace('.scad', '.stl'));
    const args = [
        '-o', output,
        scad
    ];
    let stdout = '';
    let stderr = '';
    return new Promise((resolve, reject) => {
        const child = child_process_1.spawn(bin, args);
        child.stderr.on('data', (data) => {
            const line = data.toString();
            stderr += line;
        });
        child.stdout.on('data', (data) => {
            const line = data.toString();
            stdout += line;
        });
        child.on('exit', (code) => {
            if (code === 0) {
                return resolve({ file: output, output: stdout });
            }
            else {
                return reject(stderr);
            }
        });
    });
}
;
const openscad = {};
openscad.render = async function (scad) {
    let data;
    try {
        data = await render(scad);
        log.info('Rendered ' + scad + ' to ' + data.file);
    }
    catch (err) {
        log.error(err);
    }
    return data;
};
openscad.toFile = async function (id, text) {
    const now = new Date().getTime();
    const fileName = now + '_' + id + '.scad';
    const filePath = path_1.join(tmpDir, fileName);
    try {
        await fs_extra_1.writeFile(filePath, text, 'utf8');
    }
    catch (err) {
        log.error(err);
        return null;
    }
    return filePath;
};
openscad.cleanTmp = async function (scad, stl) {
    try {
        await fs_extra_1.unlink(scad);
        await fs_extra_1.unlink(stl);
        log.info(`Removed ${scad} and ${stl}`);
    }
    catch (err) {
        log.error(err);
    }
};
openscad.service = async function openscad_service(username, object, source) {
    const query = {
        url: 'https://openscad.hipcad.com/openscad',
        method: 'POST',
        form: {
            username: username,
            object: object,
            source: source,
            type: 'stl'
        }
    };
    let body;
    let res;
    try {
        res = await request_promise_1.default(query);
    }
    catch (err) {
        log.error(err);
    }
    try {
        body = JSON.parse(res.body);
    }
    catch (err) {
        log.error('Invalid response');
        log.error(err);
        return null;
    }
    return body;
};
openscad.progress = async function openscad_process(id) {
    const query = {
        url: `https://openscad.hipcad.com/progress?id=${id}`,
        method: 'GET'
    };
    let res;
    let status;
    try {
        res = await request_promise_1.default(query);
    }
    catch (err) {
        log.error(err);
    }
    try {
        status = JSON.parse(res.body);
    }
    catch (err) {
        log.error('Invalid response');
        log.error(err);
        return null;
    }
    return status;
};
module.exports = function (pool) {
    return openscad;
};
//# sourceMappingURL=index.js.map