const { http } = require('swa-api');

module.exports = http.onRequest(async function ({ req, realtime, log }) {
    const userId = req.query.userid ?? "17baeed9bn1sa3e5dbs24283";
    log(JSON.stringify(req.query));
    await realtime.user(userId).send('testmessage', 'hello');
});