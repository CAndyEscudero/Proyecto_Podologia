function createMockRequest({
  headers = {},
  body = {},
  query = {},
  path = "/",
  originalUrl,
  method = "GET",
  ip = "::1",
  tenant = undefined,
} = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    headers: normalizedHeaders,
    body,
    query,
    path,
    originalUrl: originalUrl || path,
    url: originalUrl || path,
    method,
    ip,
    tenant,
    get(name) {
      return normalizedHeaders[String(name).toLowerCase()] || undefined;
    },
  };
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    finished: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.finished = true;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      this.body = null;
      this.finished = true;
      return this;
    },
    send(payload) {
      this.body = payload;
      this.finished = true;
      return this;
    },
    redirect(statusOrUrl, maybeUrl) {
      if (typeof statusOrUrl === "number") {
        this.statusCode = statusOrUrl;
        this.headers.location = maybeUrl;
      } else {
        this.statusCode = 302;
        this.headers.location = statusOrUrl;
      }
      this.finished = true;
      return this;
    },
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[String(name).toLowerCase()];
    },
    on() {
      return this;
    },
  };
}

function createNextSpy() {
  const state = {
    called: false,
    error: null,
  };

  const next = (error = null) => {
    state.called = true;
    state.error = error;
  };

  return { next, state };
}

module.exports = {
  createMockRequest,
  createMockResponse,
  createNextSpy,
};
