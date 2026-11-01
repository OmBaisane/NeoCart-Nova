import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

export const api = axios.create({
  baseURL: API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred";

      error.message = message;
    }

    return Promise.reject(error);
  },
);
