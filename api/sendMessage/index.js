const { functions, database, realtime } = require('../lib/swa');

module.exports = functions.http().onInvoke(async function(message) {
    const db = await database.getClient();
    const { item } = await db.items.create(message);
    const { resource: newItem } = await item.read();
    await realtime.send('newMessage', newItem);
    return newItem;
});