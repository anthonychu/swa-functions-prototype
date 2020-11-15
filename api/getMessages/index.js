const { functions, database } = require('../lib/swa');

module.exports = functions.http().allowAuthenticated().onInvoke(async function() {
    const db = await database.getClient();
    const query = 'SELECT * FROM messages m ORDER BY m._ts DESC OFFSET 0 LIMIT 10';
    const { resources: results } = await db.items.query(query).fetchAll();
    return results;
});