class SwaRealtime {
  _events = []
  _signalRConnection
  _apiBaseUrl

  constructor(apiBaseUrl) {
    this._apiBaseUrl = apiBaseUrl || ''
  }

  on(eventName, fn) {
    this._events.push({ eventName, fn })
    return this
  }

  onDatabaseUpdate(fn) {
    this._events.push( { eventName: '_swa_database_update', fn })
    return this
  }

  connect() {
    this._signalRConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this._apiBaseUrl}/api/management/realtime`)
      .withAutomaticReconnect()
      .build()

    for (let ev of this._events) {
      this._signalRConnection.on(ev.eventName, ev.fn)
    }

    return this._signalRConnection.start()
  }
}

class StaticWebAppsClient {
  _apiBaseUrl
  _realtime
  constructor(apiBaseUrl) {
    this._apiBaseUrl = apiBaseUrl || ''
    this._realtime = new SwaRealtime(apiBaseUrl)
  }

  functions(functionName) {
    return {
      invoke: async function(data) {
        const body = { data: data }
        const response = await fetch(`${this._apiBaseUrl}/api/rpc/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
        const responseBody = await response.json()
        return responseBody.data
      }.bind(this)
    }
  }

  realtime() {
    return this._realtime
  }

  auth() {
    return {
      user: async function() {
        try {
          const response = await fetch(`${this._apiBaseUrl}/.auth/me`)
          const body = await response.json()
          return body.clientPrincipal
        } catch {
          return
        }
      }.bind(this),
      loginUrl: function(provider, redirectUrl) {
        let url = `${this._apiBaseUrl}/.auth/login/${provider}`
        if (redirectUrl) {
          url += `?post_login_redirect_uri=${encodeURIComponent(redirectUrl)}`
        }
        return url
      }.bind(this),
      logoutUrl: function(redirectUrl) {
        let url = `${this._apiBaseUrl}/.auth/logout`
        if (redirectUrl) {
          url += `?post_logout_redirect_uri=${encodeURIComponent(redirectUrl)}`
        }
        return url
      }.bind(this)
    }
  }

  database() {
    const apiBaseUrl = this._apiBaseUrl
    return {
      collection(collectionName) {
        return {
          async insertDocument(doc) {
            const payload = {
              operation: 'insertDocument',
              collection: collectionName,
              doc
            }
            const response = await fetch(`${apiBaseUrl}/api/management/database/operation`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
            const body = await response.json()
            return body.result
          },

          async replaceDocument(doc) {
            const payload = {
              operation: 'replaceDocument',
              collection: collectionName,
              doc
            }
            await fetch(`${apiBaseUrl}/api/management/database/operation`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
          },

          async getDocument(_id) {
            const payload = {
              operation: 'insertDocument',
              collection: collectionName,
              _id
            }
            const response = await fetch(`${apiBaseUrl}/api/management/database/operation`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
            const body = await response.json()
            return body.result

          },

          async findDocuments(query, options) {
            const payload = {
              operation: 'findDocuments',
              collection: collectionName,
              query,
              options
            }
            const response = await fetch(`${apiBaseUrl}/api/management/database/operation`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
            const body = await response.json()
            return body.result
          },

          async deleteDocument(_id) {
            const payload = {
              operation: 'deleteDocument',
              collection: collectionName,
              _id
            }
            await fetch(`${apiBaseUrl}/api/management/database/operation`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
          }
        }
      }
    }
  }
}