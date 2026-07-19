import axios from "axios";
import Cookies from "js-cookie";

const HOST_URL = "";
const ROOT_ROUTE = "/api";
const baseURL = HOST_URL + ROOT_ROUTE;

const privateAgent = axios.create({
  baseURL,
  withCredentials: true,
});

const publicAgent = axios.create({
  baseURL,
});

privateAgent.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("token");
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken");

      if (!refreshToken) return Promise.reject(error);

      try {
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        if (response.status === 200) {
          const token = response.data.token || response.data.accessToken;
          const newRefreshToken =
            response.data.refreshToken || response.data.token;

          if (token) Cookies.set("token", token, { sameSite: "Strict" });
          if (newRefreshToken)
            Cookies.set("refreshToken", newRefreshToken, { sameSite: "Strict" });

          return privateAgent(originalRequest);
        }
      } catch (refreshError) {
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { privateAgent, publicAgent };
