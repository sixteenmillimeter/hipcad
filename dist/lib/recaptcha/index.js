'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_1 = __importDefault(require("request-promise"));
const recaptcha = {};
const url = 'https://hcaptcha.com/siteverify';
let privateKey = process.env.RECAPTCHA_PRIVATE_KEY;
recaptcha.verify = async function (response, ip) {
    const postObj = {
        method: 'POST',
        url,
        form: {
            secret: privateKey,
            response,
            remoteip: ip
        }
    };
    let res;
    let body;
    try {
        res = await (0, request_promise_1.default)(postObj);
    }
    catch (err) {
        throw err;
    }
    try {
        body = JSON.parse(res);
    }
    catch (e) {
        throw new Error('Invalid response');
    }
    if (body.success === true) {
        return true;
    }
    else {
        return false;
    }
};
module.exports = recaptcha;
//# sourceMappingURL=index.js.map