const BASE_URL = import.meta.env.VITE_API_URL;

export async function getUsers() {
  const resp = await fetch(`${BASE_URL}/api/Users`);
  if (!resp.ok) throw new Error("Failed to fetch users");
  return resp.json();
}

export async function createUser(data) {
  return fetch(`${BASE_URL}/api/Users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateUser(id, data) {
  return fetch(`${BASE_URL}/api/Users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id) {
  return fetch(`${BASE_URL}/api/Users/${id}`, { method: "DELETE" });
}

export async function getAttendanceRecords() {
  const resp = await fetch(`${BASE_URL}/api/attendancerecords`);
  if (!resp.ok) throw new Error("Failed to fetch attendance records");
  return resp.json();
}

export async function getRecordsByUser(userId) {
  const resp = await fetch(`${BASE_URL}/api/attendancerecords/user/${userId}`);
  if (!resp.ok) throw new Error("Failed to fetch attendance records");
  return resp.json();
}

export async function createAttendanceRecord(data) {
  return fetch(`${BASE_URL}/api/attendancerecords`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateAttendanceRecord(id, data) {
  return fetch(`${BASE_URL}/api/attendancerecords/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteAttendanceRecord(id) {
  return fetch(`${BASE_URL}/api/attendancerecords/${id}`, { method: "DELETE" });
}
