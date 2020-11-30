const { rpc } = require("swa-api");

module.exports = rpc.allowAuthenticated().onInvoke(async function ({ database, log, realtime, user, input: message }) {
    message.created = new Date().getTime();

    log(`Saving message from ${user.userDetails}`);
    const insertedId = await database.collection("messages").insertDocument(message);
    message._id = insertedId;

    await realtime.send('newMessage', message);
    return message;
});