const { functions } = require('../lib/swa');

module.exports = functions.http()
    .allow({ users: ["anthony"] })
    .onInvoke(function (name) {
        return `Hello ${name}!`;
    });