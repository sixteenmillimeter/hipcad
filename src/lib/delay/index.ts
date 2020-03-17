'use strict';

function delay (ms : number) {
    return new Promise((resolve : Function) => {
        return setTimeout(resolve, ms);
    });
}
module.exports = delay;
