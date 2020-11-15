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

  connect() {
    this._signalRConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this._apiBaseUrl}/api`)
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
        const response = await fetch(`${this._apiBaseUrl}/api/${functionName}`, {
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
      loginUrl: function(provider) {
        // todo: add redirect url
        return `${this._apiBaseUrl}/.auth/login/${provider}`
      }.bind(this),
      logoutUrl: function() {
        // todo: add redirect url
        return `${this._apiBaseUrl}/.auth/logout`
      }.bind(this)
    }
  }
}