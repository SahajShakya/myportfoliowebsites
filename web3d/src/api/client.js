const API_BASE = "/api";

let isRefreshing = false;
let refreshQueue = [];
let accessTokenGetter = null;
let refreshFn = null;
let clearFn = null;

export function registerAuth(getToken, refresh, clear) {
  accessTokenGetter = getToken;
  refreshFn = refresh;
  clearFn = clear;
}

function processQueue(error, token) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

async function request(endpoint, options = {}) {
  const config = {
    credentials: "include",
    headers: {
      ...options.headers,
    },
  };

  const token = accessTokenGetter?.();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(options.body);
  } else if (options.body) {
    config.body = options.body;
  }

  config.method = options.method || "GET";

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));

    if (
      (data.code === "TOKEN_EXPIRED" || data.code === "NO_TOKEN") &&
      !endpoint.includes("/auth/refresh") &&
      !endpoint.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers["Authorization"] = `Bearer ${newToken}`;
          return fetch(`${API_BASE}${endpoint}`, config).then((res) =>
            res.json()
          );
        });
      }

      isRefreshing = true;

      try {
        if (refreshFn) {
          const newToken = await refreshFn();
          if (newToken) {
            processQueue(null, newToken);
            config.headers["Authorization"] = `Bearer ${newToken}`;
            response = await fetch(`${API_BASE}${endpoint}`, config);
          } else {
            processQueue(new Error("Refresh failed"));
            if (clearFn) clearFn();
            throw new Error("Session expired");
          }
        } else {
          const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (!refreshResponse.ok) {
            processQueue(new Error("Refresh failed"));
            if (clearFn) clearFn();
            throw new Error("Refresh failed");
          }

          const refreshData = await refreshResponse.json();
          processQueue(null, refreshData.accessToken);
          response = await fetch(`${API_BASE}${endpoint}`, config);
        }
      } catch (err) {
        processQueue(err);
        if (clearFn) clearFn();
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      throw new Error(data.error || "Unauthorized");
    }
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }

  return result;
}

const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
  postForm: (endpoint, formData) =>
    request(endpoint, { method: "POST", body: formData }),
  putForm: (endpoint, formData) =>
    request(endpoint, { method: "PUT", body: formData }),
};

export default api;
