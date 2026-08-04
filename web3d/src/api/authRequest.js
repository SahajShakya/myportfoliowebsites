import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const privateAgent = axios.create({
  baseURL,
  withCredentials: true,
});

const publicAgent = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

privateAgent.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          const retryConfig = { ...originalRequest };
          if (originalRequest._clonedBody) {
            retryConfig.data = originalRequest._clonedBody;
          }
          return privateAgent(retryConfig);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (originalRequest.data instanceof FormData) {
        const clonedData = new FormData();
        for (const [key, value] of originalRequest.data.entries()) {
          if (value instanceof File) {
            clonedData.append(key, value, value.name);
          } else {
            clonedData.append(key, value);
          }
        }
        originalRequest._clonedBody = clonedData;
      }

      try {
        const response = await privateAgent.post("/auth/refresh");

        if (response.status === 200) {
          processQueue(null);
          const retryConfig = { ...originalRequest };
          if (originalRequest._clonedBody) {
            retryConfig.data = originalRequest._clonedBody;
          }
          return privateAgent(retryConfig);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { privateAgent, publicAgent };
