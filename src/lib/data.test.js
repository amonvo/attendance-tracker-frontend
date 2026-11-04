import { expect, it } from "vitest";
import {
  attendanceCsv,
  csvCell,
  dateKey,
  daysAgo,
  demoData,
  hours,
} from "./data";

it("calculates partial hours without rounding away minutes", () =>
  expect(hours({ arrivalTime: "08:30:00", departureTime: "16:45:00" })).toBe(
    8.25,
  ));
it.each(["=SUM(A1)", "+cmd", "-cmd", "@SUM(1)", "\tformula", "\rformula"])(
  "neutralizes spreadsheet formulas: %s",
  (value) => expect(csvCell(value)).toBe(`"'${value}"`),
);
it("escapes quotes, separators and Unicode", () =>
  expect(csvCell('Žofie, "QA"')).toBe('"Žofie, ""QA"""'));
it("exports the chosen records with a UTF-8 BOM", () => {
  const csv = attendanceCsv(
    [
      {
        userId: 1,
        date: "2026-01-01",
        arrivalTime: "09:00",
        departureTime: "17:00",
        note: "=cmd",
      },
    ],
    [{ id: 1, username: "Žofie" }],
    ["Name", "Date", "Start", "End", "Hours", "Note"],
  );
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Žofie"');
  expect(csv).toContain('"\'=cmd"');
});
it("handles year boundaries as local dates", () => {
  const now = new Date(2026, 0, 1, 12);
  expect(dateKey(now)).toBe("2026-01-01");
  expect(daysAgo(1, now)).toBe("2025-12-31");
});
it("uses fictional reproducible demo data with stable IDs", () => {
  const data = demoData(new Date(2026, 10, 3, 12));
  expect(data.users.every((user) => user.email.endsWith("@example.com"))).toBe(
    true,
  );
  expect(new Set(data.records.map((row) => row.id)).size).toBe(
    data.records.length,
  );
});
