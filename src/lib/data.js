export function dateKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
export function daysAgo(count, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() - count);
  return dateKey(date);
}
export function hours(record) {
  const minutes = (value) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(
    0,
    (minutes(record.departureTime) - minutes(record.arrivalTime)) / 60,
  );
}
export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+@\-\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function attendanceCsv(records, users, labels) {
  return (
    "\uFEFF" +
    [
      labels,
      ...records.map((r) => [
        users.find((u) => u.id === r.userId)?.username ?? "",
        r.date.slice(0, 10),
        r.arrivalTime.slice(0, 5),
        r.departureTime.slice(0, 5),
        hours(r).toFixed(2),
        r.note ?? "",
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
export function demoData(now = new Date()) {
  const people = [
    ["Alex Morgan", "Product designer"],
    ["Jamie Chen", "Frontend developer"],
    ["Sam Taylor", "Engineering lead"],
    ["Robin Novak", "People operations"],
    ["Charlie Lee", "Backend developer"],
    ["Taylor Reed", "Product manager"],
  ];
  const users = people.map(([username, position], i) => ({
    id: i + 1,
    username,
    position,
    email: `${username.toLowerCase().replaceAll(" ", ".")}@example.com`,
    role: i === 0 ? "admin" : "user",
  }));
  const records = [];
  for (let d = 0; d < 90; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    if ([0, 6].includes(date.getDay())) continue;
    users.forEach((user, i) => {
      if ((d + i) % 11 === 0) return;
      records.push({
        id: d * 10 + i + 1,
        userId: user.id,
        date: dateKey(date),
        arrivalTime: i % 2 ? "08:30:00" : "09:00:00",
        departureTime: i % 2 ? "16:30:00" : "17:00:00",
        note: "",
      });
    });
  }
  return { users, records };
}
