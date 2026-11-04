import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Editor from "./Editor";
import { copy } from "../i18n";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);
const user = {
  id: 1,
  username: "Fixture",
  email: "fixture@example.com",
  role: "admin",
  position: "Designer",
};
const props = {
  kind: "user",
  item: user,
  users: [user],
  current: user,
  t: copy.en,
  errorMessage: (failure) => failure.message,
};
it("keeps the editor and draft open when a save fails", async () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockRejectedValue(new Error("Email already exists."));
  render(<Editor {...props} onSave={onSave} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "new@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Email already exists.",
  );
  expect(screen.getByLabelText("Email").value).toBe("new@example.com");
  expect(onClose).not.toHaveBeenCalled();
});
it("closes only after the server has accepted a save", async () => {
  const onClose = vi.fn();
  let resolve;
  const onSave = vi.fn(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<Editor {...props} onSave={onSave} onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(onClose).not.toHaveBeenCalled();
  resolve();
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
});
it("rejects backwards time ranges before sending a request", async () => {
  const onSave = vi.fn();
  render(
    <Editor
      {...props}
      kind="record"
      item={null}
      onSave={onSave}
      onClose={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Check-out"), {
    target: { value: "08:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    copy.en.timeError,
  );
  expect(onSave).not.toHaveBeenCalled();
});
