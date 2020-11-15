const jwt = require('jsonwebtoken');
const swa = require('../lib/swa');

module.exports = async function (context, req) {
    context.res.json(swa.realtime.generateNegotiatePayload());
}