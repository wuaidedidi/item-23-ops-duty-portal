import axios from "axios";

const TOKEN_KEY = "ops_portal_token";
let notifier = null;

export function bindNotifier(nextNotifier) {
  notifier = nextNotifier;
}

function showError(message) {
  if (notifier?.error) notifier.error(message);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && payload.code !== 200) {
      const message = payload.message || "操作失败";
      showError(message);
      const error = new Error(message);
      error._isBusinessError = true;
      return Promise.reject(error);
    }
    return payload?.data ?? payload;
  },
  (error) => {
    if (error?._isBusinessError) {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (status === 401
        ? "登录已过期，请重新登录"
        : status === 403
          ? "当前账号无权执行该操作"
          : status === 404
            ? "请求的资源不存在"
            : status >= 500
              ? "服务器错误，请稍后重试"
              : error.response
                ? "请求处理失败"
                : "网络错误，请检查网络连接");
    showError(message);
    if (status === 401) {
      clearToken();
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post("/auth/login/", data),
  register: (data) => api.post("/auth/register/", data),
  logout: () => api.post("/auth/logout/"),
  me: () => api.get("/auth/me/"),
  updateMe: (data) => api.patch("/auth/me/", data),
};

export const dashboardApi = {
  metrics: () => api.get("/dashboard/metrics/"),
};

export const resourceApi = {
  list: (name, params) => api.get(`/${name}/`, { params }),
  create: (name, data) => api.post(`/${name}/`, data),
  update: (name, id, data) => api.patch(`/${name}/${id}/`, data),
  remove: (name, id) => api.delete(`/${name}/${id}/`),
  action: (name, id, action, data) => api.post(`/${name}/${id}/${action}/`, data),
};

export const lookupApi = {
  users: (params) => api.get("/lookups/users/", { params }),
};
