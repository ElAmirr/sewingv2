import axios from "axios";

const api = axios.create({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export { api };
