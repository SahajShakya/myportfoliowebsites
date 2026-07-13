import { routes } from "../constants/routes";

let accessTokenGetter = null;
let refreshFn = null;
let clearFn = null;

export const registerAuth = (getToken, refresh, clear) => {
  accessTokenGetter = getToken;
  refreshFn = refresh;
  clearFn = clear;
};

async function request(endpoint, options = {}) {
  const token = accessTokenGetter?.();

  const config = {
    credentials: "include",
    headers: {
      ...options.headers,
    },
  };

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

  let response = await fetch(endpoint, config);

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));

    if (
      (data.code === "TOKEN_EXPIRED" || data.code === "NO_TOKEN") &&
      !endpoint.includes("/auth/refresh") &&
      !endpoint.includes("/auth/login")
    ) {
      if (refreshFn) {
        const newToken = await refreshFn();
        if (newToken) {
          config.headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(endpoint, config);
        } else {
          if (clearFn) clearFn();
          window.location.href = "/login";
          throw new Error("Session expired");
        }
      } else {
        if (clearFn) clearFn();
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
    } else {
      throw new Error(data.error || "Unauthorized");
    }
  }

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || "Request failed");
  }

  return responseData;
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
