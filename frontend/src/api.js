import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const jwt = sessionStorage.getItem("jwt");

  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }

  return config;
});

export const mediaUrl = (url) => (url ? `${api.defaults.baseURL}${url}` : null);

export default api;
