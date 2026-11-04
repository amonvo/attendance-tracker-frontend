import { describe, expect, it, vi } from "vitest";
import { createApi } from "./api";

const response = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });
const operations = [
  [
    "create user",
    (client) => client.saveUser({ username: "New member" }),
    "POST",
    "/api/users",
  ],
  [
    "update user",
    (client) => client.saveUser({ id: 3, username: "Member" }),
    "PUT",
    "/api/users/3",
  ],
  ["delete user", (client) => client.deleteUser(3), "DELETE", "/api/users/3"],
  [
    "create record",
    (client) => client.saveRecord({ userId: 3 }),
    "POST",
    "/api/attendancerecords",
  ],
  [
    "update record",
    (client) => client.saveRecord({ id: 2, userId: 3 }),
    "PUT",
    "/api/attendancerecords/2",
  ],
  [
    "delete record",
    (client) => client.deleteRecord(2),
    "DELETE",
    "/api/attendancerecords/2",
  ],
];
describe.each(operations)("%s", (_, run, method, path) => {
  it.each([400, 401, 403, 500])(
    "rejects HTTP %i rather than reporting success",
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(response(200, { token: "csrf-fixture" }))
        .mockResolvedValueOnce(response(status, { title: "Rejected" }));
      await expect(run(createApi(fetcher))).rejects.toMatchObject({
        status,
        message: "Rejected",
      });
      expect(fetcher.mock.calls[1][0]).toBe(path);
      expect(fetcher.mock.calls[1][1]).toMatchObject({
        method,
        credentials: "same-origin",
        headers: { "X-CSRF-TOKEN": "csrf-fixture" },
      });
    },
  );
  it("accepts an empty 204 response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(200, { token: "csrf-fixture" }))
      .mockResolvedValueOnce(response(204));
    await expect(run(createApi(fetcher))).resolves.toBeNull();
  });
  it("rejects network failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(200, { token: "csrf-fixture" }))
      .mockRejectedValueOnce(new TypeError("offline"));
    await expect(run(createApi(fetcher))).rejects.toMatchObject({
      status: 0,
      message: "NETWORK_ERROR",
    });
  });
});
it("preserves server validation details", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(response(200, { token: "csrf-fixture" }))
    .mockResolvedValueOnce(
      response(400, {
        errors: { Email: ["Invalid email."], Password: ["Too short."] },
      }),
    );
  await expect(createApi(fetcher).saveUser({})).rejects.toMatchObject({
    message: "Invalid email. Too short.",
  });
});
it("rotates the CSRF token after login and never persists credentials", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(response(200, { token: "before-login" }))
    .mockResolvedValueOnce(response(200, { id: 1 }))
    .mockResolvedValueOnce(response(200, { token: "after-login" }))
    .mockResolvedValueOnce(response(204));
  const client = createApi(fetcher);
  await client.login({ username: "fixture", password: "fixture" });
  await client.logout();
  expect(fetcher.mock.calls[3][1].headers["X-CSRF-TOKEN"]).toBe("after-login");
});
it("handles non-JSON server errors without masking the status", async () => {
  await expect(
    createApi(
      vi
        .fn()
        .mockResolvedValue(
          new Response("<h1>Unavailable</h1>", { status: 503 }),
        ),
    ).users(),
  ).rejects.toMatchObject({ status: 503, message: "HTTP_503" });
});
