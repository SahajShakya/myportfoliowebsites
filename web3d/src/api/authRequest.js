import axios from "axios";

const HOST_URL = "";
const ROOT_ROUTE = "/api";
const baseURL = HOST_URL + ROOT_ROUTE;

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
        }).then(() => privateAgent(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await privateAgent.post("/auth/refresh");

        if (response.status === 200) {
          processQueue(null);
          return privateAgent(originalRequest);
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
