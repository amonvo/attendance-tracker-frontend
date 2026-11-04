export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function createApi(fetcher = (...args) => fetch(...args)) {
  let token;
  async function request(path, method = "GET", data) {
    if (method !== "GET" && !token) {
      const result = await request("/auth/csrf");
      token = result.token;
    }
    let response;
    try {
      response = await fetcher(`/api${path}`, {
        method,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(method !== "GET" ? { "X-CSRF-TOKEN": token } : {}),
        },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      });
    } catch {
      throw new ApiError("NETWORK_ERROR", 0);
    }
    const text = response.status === 204 ? "" : await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 400) token = undefined;
      const message = body?.errors
        ? Object.values(body.errors).flat().join(" ")
        : body?.detail || body?.title || `HTTP_${response.status}`;
      throw new ApiError(message, response.status);
    }
    if (text && body === null)
      throw new ApiError("INVALID_RESPONSE", response.status);
    return body;
  }
  return {
    me: () => request("/auth/me"),
    login: async (data) => {
      const user = await request("/auth/login", "POST", data);
      token = undefined;
      return user;
    },
    logout: async () => {
      await request("/auth/logout", "POST");
      token = undefined;
    },
    users: () => request("/users"),
    records: (from, to) =>
      request(
        `/attendancerecords?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    saveUser: (data) =>
      request(
        `/users${data.id ? `/${data.id}` : ""}`,
        data.id ? "PUT" : "POST",
        data,
      ),
    deleteUser: (id) => request(`/users/${id}`, "DELETE"),
    saveRecord: (data) =>
      request(
        `/attendancerecords${data.id ? `/${data.id}` : ""}`,
        data.id ? "PUT" : "POST",
        data,
      ),
    deleteRecord: (id) => request(`/attendancerecords/${id}`, "DELETE"),
  };
}
export const api = createApi();
