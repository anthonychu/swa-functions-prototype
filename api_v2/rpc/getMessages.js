const { rpc } = require("swa-api");

module.exports = rpc.allowAuthenticated().onInvoke(async function({ database }) {
    return await database.collection("messages").findDocuments({}, {
        sort: { created: -1 },
        limit: 100
    });
});