const { database } = require('swa-api');

module.exports = database.config({
    collections: {
        "todos": {
            permissions: [
                {
                    operations: [
                        "findDocuments",
                        "insertDocument",
                        "replaceDocument",
                        "deleteDocument"
                    ],
                    allowedRoles: [ "authenticated" ],
                    restrictDocsByUser: true
                }
            ],
            notifyOnChange: true
        }
    }
});