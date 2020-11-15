const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const functions = {
  http() {
    return new HttpFunctionBuilder();
  }
};

class HttpFunctionBuilder {
  _authAllowOptions;

  _decodeAuthInfo(req) {
    // This block sets a development user that has rights to upload
    if (process.env.AZURE_FUNCTIONS_ENVIRONMENT === "Development") {
      return {
        identityProvider: "github",
        userId: "17baeed9bn1sa3e5dbs24283",
        userDetails: "testuser",
        userRoles: ["admin", "anonymous", "authenticated"],
      };
    }

    const clientPrincipalHeader = "x-ms-client-principal";

    if (req.headers[clientPrincipalHeader] == null) {
      return null;
    }
    const buffer = Buffer.from(req.headers[clientPrincipalHeader], "base64");
    const serializedJson = buffer.toString("ascii");
    return JSON.parse(serializedJson);
  }

  _isAuthorized(authenticatedUser) {
    if (!this._authAllowOptions) return true;

    if (!authenticatedUser) return false;

    if (this._authAllowOptions.roles) {
      const matchingRoles = authenticatedUser.userRoles.filter(value => this._authAllowOptions.roles.includes(value));
      if (matchingRoles.length > 0) {
        return true;
      }
    }

    if (this._authAllowOptions.users) {
      if (this._authAllowOptions.users.includes(authenticatedUser.userDetails)) {
        return true;
      }
    }

    if (this._authAllowOptions.userIds) {
      if (this._authAllowOptions.userIds.includes(authenticatedUser.userId)) {
        return true;
      }
    }

    return false;
  }

  onInvoke(fn) {
    return async function (context, req) {
      const data = req.body.data;
      context.authenticatedUser = this._decodeAuthInfo(req);

      if (!this._isAuthorized(context.authenticatedUser)) {
        context.res = { status: context.authenticatedUser ? 403 : 401 };
        return;
      }

      const result = await Promise.resolve(fn(data, context));
      context.res.json({
        data: result
      });
    }.bind(this);
  }

  onRequest(fn) {
    return async function (context, req) {
      context.authenticatedUser = this._decodeAuthInfo(req);

      if (!this._isAuthorized(context.authenticatedUser)) {
        context.res = { status: context.authenticatedUser ? 403 : 401 };
        return;
      }

      await Promise.resolve(fn(req, context.res, context))
    };
  }

  allow(options) {
    this._authAllowOptions = options;
    return this;
  }

  allowAuthenticated() {
    return this.allow({ roles: ['authenticated'] });
  }
}

const { CosmosClient } = require("@azure/cosmos");

async function initializeCosmos() {
  const connectionString = process.env.SWA_COSMOS_CONNECTION_STRING;
  if (!connectionString) {
    throw "Cosmos DB connection string missing";
  }

  const client = new CosmosClient(connectionString);
  const { database } = await client.databases.createIfNotExists({ id: "swa" });
  const { container } = await database.containers.createIfNotExists({ id: "data" });
  return container;
}

let initializeCosmosTask;

const database = {
  async getClient() {
    if (!initializeCosmosTask) {
      initializeCosmosTask = initializeCosmos();
    }
    const container = await initializeCosmosTask;
    return container;
  }
};

class RealtimeBuilder {
  _scope = {};
  _endpoint;
  _accessKey;
  _defaultHubName = 'default';

  constructor() {
    const signalRConnectionString = process.env.SWA_SIGNALR_CONNECTION_STRING;
    const endpointMatch = /\bEndpoint=([^;]+)/i.exec(signalRConnectionString);
    this._endpoint = endpointMatch[1];
    const accessKeyMatch = /\bAccessKey=([^;]+)/i.exec(signalRConnectionString);
    this._accessKey = accessKeyMatch[1];
    if (!(this._endpoint && this._accessKey)) {
      throw "SignalR Connection string not found";
    }
  }

  user(userId) {
    this._scope.userId = userId;
    return this;
  }

  group(groupName) {
    this._scope.groupName = groupName;
    return this;
  }

  async send(eventName, data) {
    const hubUrl = `${this._endpoint}/api/v1/hubs/${this._defaultHubName}`;
    const accessToken = jwt.sign({
      aud: hubUrl,
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }, this._accessKey);

    const response = await fetch(hubUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        target: eventName,
        arguments: [data]
      })
    });
  }

  generateNegotiatePayload(userId) {
    const hubUrl = `${this._endpoint}/client/?hub=${this._defaultHubName}`;
    const payload = {
      aud: hubUrl,
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    };
    if (userId) {
      payload.userId = userId;
    }
    const accessToken = jwt.sign(payload, this._accessKey);

    return {
      accessToken,
      url: hubUrl
    };
  }

  async addToGroup(groupName) {

  }
}

const realtime = new RealtimeBuilder();

module.exports = {
  functions,
  database,
  realtime
};