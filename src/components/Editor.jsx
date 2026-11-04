import { useState } from "react";
import Modal from "./Modal";
import { dateKey } from "../lib/data";

export default function Editor({
  kind,
  item,
  users,
  current,
  t,
  onClose,
  onSave,
  errorMessage,
}) {
  const isUser = kind === "user";
  const [form, setForm] = useState(
    isUser
      ? {
          username: "",
          email: "",
          position: "",
          role: "user",
          password: "",
          ...item,
        }
      : {
          userId:
            current.role === "admin"
              ? (users[0]?.id ?? current.id)
              : current.id,
          date: dateKey(),
          arrivalTime: "09:00",
          departureTime: "17:00",
          note: "",
          ...item,
          ...(item
            ? {
                date: item.date.slice(0, 10),
                arrivalTime: item.arrivalTime.slice(0, 5),
                departureTime: item.departureTime.slice(0, 5),
                note: item.note ?? "",
              }
            : {}),
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (event) =>
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!isUser && form.departureTime <= form.arrivalTime) {
      setError(t.timeError);
      return;
    }
    setBusy(true);
    try {
      const data = isUser
        ? { ...form, username: form.username.trim(), email: form.email.trim() }
        : {
            ...form,
            userId: Number(form.userId),
            arrivalTime: `${form.arrivalTime}:00`,
            departureTime: `${form.departureTime}:00`,
          };
      await onSave(kind, data);
      onClose();
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        t[
          isUser
            ? item
              ? "editUser"
              : "addUser"
            : item
              ? "editRecord"
              : "addRecord"
        ]
      }
      onClose={onClose}
      closeLabel={t.close}
      busy={busy}
    >
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="editor-fields">
          {isUser ? (
            <>
              <label>
                {t.name}
                <input
                  name="username"
                  value={form.username}
                  onChange={change}
                  required
                  minLength={3}
                  maxLength={80}
                  autoComplete="off"
                />
              </label>
              <label>
                {t.email}
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  required
                  maxLength={254}
                />
              </label>
              <label>
                {t.position}
                <input
                  name="position"
                  value={form.position}
                  onChange={change}
                  maxLength={80}
                />
              </label>
              <label>
                {t.role}
                <select
                  name="role"
                  value={form.role}
                  onChange={change}
                  disabled={item?.id === current.id}
                >
                  <option value="user">{t.user}</option>
                  <option value="admin">{t.admin}</option>
                </select>
              </label>
              {!item && (
                <label>
                  {t.password}
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={change}
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                  <small>{t.passwordHint}</small>
                </label>
              )}
            </>
          ) : (
            <>
              <label>
                {t.member}
                <select
                  name="userId"
                  value={form.userId}
                  onChange={change}
                  required
                  disabled={current.role !== "admin"}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.date}
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={change}
                  required
                />
              </label>
              <div className="form-pair">
                <label>
                  {t.arrival}
                  <input
                    name="arrivalTime"
                    type="time"
                    value={form.arrivalTime}
                    onChange={change}
                    required
                  />
                </label>
                <label>
                  {t.departure}
                  <input
                    name="departureTime"
                    type="time"
                    value={form.departureTime}
                    onChange={change}
                    required
                  />
                </label>
              </div>
              <label>
                {t.note}
                <textarea
                  name="note"
                  value={form.note}
                  onChange={change}
                  maxLength={2000}
                  rows={3}
                />
              </label>
            </>
          )}
        </fieldset>
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            {t.cancel}
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? t.saving : t.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
