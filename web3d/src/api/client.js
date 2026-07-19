import { privateAgent } from "./authRequest";

async function request(endpoint, options = {}) {
  const config = {};

  if (options.body && options.body instanceof FormData) {
    config.headers = { "Content-Type": "multipart/form-data" };
    config.data = options.body;
  } else if (options.body) {
    config.data = options.body;
  }

  config.method = options.method || "GET";
  config.url = endpoint;

  if (options.headers) {
    config.headers = { ...config.headers, ...options.headers };
  }

  const response = await privateAgent(config);
  return response.data;
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
