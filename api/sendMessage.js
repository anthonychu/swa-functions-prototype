const { functions, database, realtime } = require('./lib/swa');

module.exports = functions.http()
    .allow({ roles: [ 'authenticated' ]})
    .onInvoke(async function(message, context) {
        message.sender = context.authenticatedUser.userDetails;
        
        const db = await database.getClient();
        const { item } = await db.items.create(message);
        const { resource: newItem } = await item.read();

        await realtime.send('newMessage', newItem);
        return newItem;
    });