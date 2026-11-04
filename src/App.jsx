import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Users,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "./services/api";
import { attendanceCsv, dateKey, daysAgo, demoData, hours } from "./lib/data";
import { copy } from "./i18n";
import Modal from "./components/Modal";
import Editor from "./components/Editor";

const navigation = [
  ["overview", LayoutDashboard],
  ["team", Users],
  ["attendance", CalendarDays],
  ["export", FileSpreadsheet],
];
const initialRange = { from: daysAgo(29), to: dateKey() };
function preference(name, fallback) {
  try {
    return localStorage.getItem(name) || fallback;
  } catch {
    return fallback;
  }
}
function Avatar({ name, id = 1 }) {
  return (
    <span className={`avatar avatar-${id % 5}`} aria-hidden="true">
      {name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")}
    </span>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        a<span>·</span>
      </span>
      <span>
        attendance<span className="brand-dot">.</span>
      </span>
    </div>
  );
}

export default function App({ client = api }) {
  const [lang, setLang] = useState(() =>
    preference("attendance-language", "cs"),
  );
  const [dark, setDark] = useState(
    () => preference("attendance-theme", "light") === "dark",
  );
  const t = copy[lang] || copy.cs;
  const locale = lang === "cs" ? "cs-CZ" : "en-GB";
  const [mode, setMode] = useState("loading");
  const [current, setCurrent] = useState(null);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [range, setRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [section, setSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [person, setPerson] = useState("");
  const [page, setPage] = useState(0);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const generation = useRef(0);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("attendance-language", lang);
      localStorage.setItem("attendance-theme", dark ? "dark" : "light");
    } catch {
      /* Preferences are optional in restricted browsers. */
    }
  }, [lang, dark]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const load = useCallback(
    async (selectedRange, owner) => {
      const id = ++generation.current;
      setBusy(true);
      setError("");
      try {
        const [people, rows] = await Promise.all([
          client.users(),
          client.records(selectedRange.from, selectedRange.to),
        ]);
        if (generation.current !== id) return;
        setUsers(people);
        setRecords(rows);
        setRange(selectedRange);
        setPage(0);
        if (owner) setCurrent(owner);
      } catch (failure) {
        if (generation.current !== id) return;
        if (failure.status === 401) {
          setMode("guest");
          setCurrent(null);
          setUsers([]);
          setRecords([]);
        }
        setError(failure.status === 401 ? "session" : "connection");
      } finally {
        if (generation.current === id) setBusy(false);
      }
    },
    [client],
  );
  useEffect(() => {
    let active = true;
    client
      .me()
      .then((user) => {
        if (active) {
          setCurrent(user);
          setMode("app");
          load(initialRange, user);
        }
      })
      .catch((failure) => {
        if (active) {
          setMode("guest");
          if (failure.status !== 401) setError("connection");
        }
      });
    const counter = generation;
    return () => {
      active = false;
      counter.current++;
    };
  }, [client, load]);

  const formatNumber = (value) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const formatDate = (value) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
      new Date(`${value.slice(0, 10)}T12:00:00`),
    );
  const errorMessage = (failure) =>
    failure.status === 0
      ? t.connection
      : failure.status === 401
        ? t.session
        : failure.status === 403
          ? t.forbidden
          : failure.message || t.failed;
  const selectSection = (value) => {
    setSection(value);
    setSearch("");
    setPerson("");
    setPage(0);
    setMenu(false);
  };
  function startDemo() {
    generation.current++;
    const data = demoData();
    setUsers(data.users);
    setRecords(data.records);
    setCurrent(data.users[0]);
    setMode("demo");
    setBusy(false);
    setError("");
    setRange(initialRange);
    setDraftRange(initialRange);
    selectSection("overview");
  }
  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await client.login(loginForm);
      setLoginForm({ username: "", password: "" });
      setCurrent(user);
      setMode("app");
      await load(range, user);
    } catch (failure) {
      setError(failure.status === 0 ? "connection" : "loginError");
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      if (mode !== "demo") await client.logout();
      generation.current++;
      setMode("guest");
      setCurrent(null);
      setUsers([]);
      setRecords([]);
      setNotice("");
      setError("");
      selectSection("overview");
    } catch {
      setError("connection");
    } finally {
      setBusy(false);
    }
  }
  function applyRange(event) {
    event.preventDefault();
    const diff =
      (new Date(draftRange.to) - new Date(draftRange.from)) / 86400000;
    if (!Number.isFinite(diff) || diff < 0 || diff > 366) {
      setError("rangeError");
      return;
    }
    if (mode === "demo") {
      setRange(draftRange);
      setPage(0);
      setError("");
    } else load(draftRange);
  }
  async function save(kind, data) {
    const isUser = kind === "user";
    const result =
      mode === "demo"
        ? { ...data, id: data.id || Date.now() }
        : await (isUser ? client.saveUser(data) : client.saveRecord(data));
    (isUser ? setUsers : setRecords)((previous) =>
      data.id
        ? previous.map((item) => (item.id === data.id ? result : item))
        : [...previous, result],
    );
    if (isUser && result.id === current.id) setCurrent(result);
    setNotice(t.saved);
  }
  async function remove() {
    setBusy(true);
    setDeleteError("");
    try {
      if (
        mode === "demo" &&
        deletion.kind === "user" &&
        records.some((record) => record.userId === deletion.item.id)
      )
        throw new Error(
          lang === "cs"
            ? "Člen má historii docházky. Nejprve odstraňte jeho záznamy."
            : "This member has attendance history. Remove their records first.",
        );
      if (mode !== "demo")
        await (deletion.kind === "user"
          ? client.deleteUser(deletion.item.id)
          : client.deleteRecord(deletion.item.id));
      (deletion.kind === "user" ? setUsers : setRecords)((previous) =>
        previous.filter((item) => item.id !== deletion.item.id),
      );
      setDeletion(null);
      setNotice(t.deleted);
    } catch (failure) {
      setDeleteError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  const selected = records.filter(
    (record) =>
      record.date.slice(0, 10) >= range.from &&
      record.date.slice(0, 10) <= range.to,
  );
  const filtered = selected
    .filter((record) => {
      const user = users.find((value) => value.id === record.userId);
      return (
        (!person || String(record.userId) === person) &&
        `${user?.username ?? ""} ${record.note ?? ""}`
          .toLocaleLowerCase(locale)
          .includes(search.toLocaleLowerCase(locale))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.email} ${user.position}`
      .toLocaleLowerCase(locale)
      .includes(search.toLocaleLowerCase(locale)),
  );
  const totalHours = selected.reduce((sum, row) => sum + hours(row), 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${range.to}T12:00:00`);
    date.setDate(date.getDate() - 6 + index);
    const key = dateKey(date);
    return {
      key,
      label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
      total: selected
        .filter((row) => row.date.slice(0, 10) === key)
        .reduce((sum, row) => sum + hours(row), 0),
    };
  });
  const maximum = Math.max(...days.map((day) => day.total), 1);
  const effectivePage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 10) - 1),
  );
  const visibleRows =
    section === "overview"
      ? filtered.slice(0, 5)
      : filtered.slice(effectivePage * 10, (effectivePage + 1) * 10);
  function download() {
    const blob = new Blob(
      [
        attendanceCsv(filtered, users, [
          t.member,
          t.date,
          t.arrival,
          t.departure,
          t.duration,
          t.note,
        ]),
      ],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-${range.from}-${range.to}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const preferences = (
    <div className="preferences">
      <button
        className="language-button"
        onClick={() => setLang(lang === "cs" ? "en" : "cs")}
        aria-label={lang === "cs" ? "Switch to English" : "Přepnout do češtiny"}
      >
        {lang.toUpperCase()}
      </button>
      <button
        className="icon-button"
        aria-label={dark ? t.light : t.dark}
        onClick={() => setDark(!dark)}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
  if (mode === "loading")
    return (
      <div className="loading-screen">
        <Brand />
        <p role="status">{t.loading}</p>
      </div>
    );
  if (mode === "guest")
    return (
      <div className="login-page">
        <section className="login-story">
          <Brand />
          <div className="story-content">
            <span className="eyebrow">{t.people}</span>
            <h1>{t.loginTitle}</h1>
            <p>{t.loginSub}</p>
            <div className="story-clock" aria-hidden="true">
              <Clock3 size={100} strokeWidth={1} />
              <span>
                Less admin.
                <br />
                More perspective.
              </span>
            </div>
          </div>
          <small>{t.footer}</small>
        </section>
        <section className="login-panel">
          {preferences}
          <div className="login-form">
            <span className="eyebrow">ATTENDANCE WORKSPACE</span>
            <h2>{t.login}</h2>
            <p className="muted">{t.loginHint}</p>
            <form onSubmit={signIn}>
              <label>
                {t.name}
                <input
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, username: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {t.password}
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, password: event.target.value })
                  }
                  required
                />
              </label>
              {error && (
                <p role="alert" className="error-box">
                  {t[error]}
                </p>
              )}
              <button className="button primary wide" disabled={busy}>
                {busy ? t.loading : t.login}
                <ArrowRight size={17} />
              </button>
            </form>
            <p className="small muted">{t.loginHelp}</p>
            <div className="login-divider" />
            <button
              className="button secondary wide"
              onClick={startDemo}
              disabled={busy}
            >
              {t.tryDemo}
              <ArrowUpRight size={17} />
            </button>
          </div>
        </section>
      </div>
    );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {lang === "cs" ? "Přejít na obsah" : "Skip to content"}
      </a>
      {menu && (
        <button
          className="nav-backdrop"
          aria-label={t.close}
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Brand />
        <div className="workspace-selector">
          <span className="workspace-symbol">
            <Users size={18} />
          </span>
          <div>
            <strong>{mode === "demo" ? "Studio North" : "My workspace"}</strong>
            <small>{mode === "demo" ? t.demo : t.workspace}</small>
          </div>
          <MoreHorizontal size={17} />
        </div>
        <p className="nav-label">{t.workspace}</p>
        <nav aria-label={t.workspace}>
          {navigation.map(([key, Icon]) => (
            <button
              key={key}
              className={`nav-item ${section === key ? "active" : ""}`}
              aria-current={section === key ? "page" : undefined}
              onClick={() => selectSection(key)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{t[key]}</span>
              {section === key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-note">
            <ShieldCheck size={20} />
            <strong>{t.privacy}</strong>
            <p>{t.privacyHint}</p>
          </div>
          <div className="account">
            <Avatar name={current.username} id={current.id} />
            <div>
              <strong>{current.username}</strong>
              <small>{current.role === "admin" ? t.admin : t.user}</small>
            </div>
            <button
              className="icon-button"
              disabled={busy}
              onClick={signOut}
              aria-label={mode === "demo" ? t.leave : t.logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-label={t.menu}
            >
              <Menu size={22} />
            </button>
            <span>{t.workspace}</span>
            <ChevronRight size={14} />
            <strong>{t[section]}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today">
              {new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
            {preferences}
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{t.people}</span>
              <h1>{t[`${section}Title`]}</h1>
              <p>{t[`${section}Sub`]}</p>
            </div>
            {section !== "export" && (
              <button
                className="button primary"
                disabled={busy || users.length === 0}
                onClick={() =>
                  setEditor({
                    kind:
                      section === "team" && current.role === "admin"
                        ? "user"
                        : "record",
                    item: null,
                  })
                }
              >
                <Plus size={18} />
                {section === "team" && current.role === "admin"
                  ? t.addUser
                  : t.addRecord}
              </button>
            )}
          </div>
          {mode === "demo" && (
            <div className="demo-banner">
              <span className="demo-label">
                <span className="status-dot" />
                {t.demo}
              </span>
              <span>{t.demoHint}</span>
              <button onClick={signOut}>
                {t.leave}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          {error && (
            <div className="error-box" role="alert">
              {t[error]}{" "}
              {error === "connection" && (
                <button onClick={() => load(range)}>{t.retry}</button>
              )}
            </div>
          )}
          {section !== "team" && (
            <form className="range-form" onSubmit={applyRange}>
              <span>
                <CalendarDays size={16} />
                {t.activeRange}
              </span>
              <label>
                {t.from}
                <input
                  type="date"
                  value={draftRange.from}
                  onChange={(event) =>
                    setDraftRange({ ...draftRange, from: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {t.to}
                <input
                  type="date"
                  value={draftRange.to}
                  onChange={(event) =>
                    setDraftRange({ ...draftRange, to: event.target.value })
                  }
                  required
                />
              </label>
              <button className="button compact secondary" disabled={busy}>
                {t.apply}
              </button>
              {mode !== "demo" && (
                <button
                  type="button"
                  className="icon-button"
                  disabled={busy}
                  onClick={() => load(range)}
                  aria-label={t.refresh}
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </form>
          )}
          {busy && (
            <p className="loading-strip" role="status">
              {t.loading}
            </p>
          )}
          {section === "overview" && (
            <>
              <section className="metrics" aria-label={t.overview}>
                {[
                  [t.members, users.length, t.teamHint, Users],
                  [t.hours, formatNumber(totalHours), t.hoursHint, Clock3],
                  [
                    t.daily,
                    formatNumber(
                      selected.length ? totalHours / selected.length : 0,
                    ),
                    t.dailyHint,
                    CalendarDays,
                  ],
                  [t.records, selected.length, t.recordsHint, FileSpreadsheet],
                ].map(([label, value, hint, Icon], index) => (
                  <article
                    className={`metric ${index === 1 ? "featured" : ""}`}
                    key={label}
                  >
                    <div className="metric-label">
                      {label}
                      <Icon size={18} />
                    </div>
                    <div className="metric-value">
                      {value}
                      {index === 1 && <small>h</small>}
                    </div>
                    <p>{hint}</p>
                  </article>
                ))}
              </section>
              <div className="insight-grid">
                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t.activity}</h2>
                      <p>{t.activitySub}</p>
                    </div>
                    <span className="chart-unit">h</span>
                  </div>
                  <div
                    className="chart"
                    role="img"
                    aria-label={days
                      .map(
                        (day) => `${day.label}: ${formatNumber(day.total)} h`,
                      )
                      .join(", ")}
                  >
                    {days.map((day, index) => (
                      <div className="chart-column" key={day.key}>
                        <span className="bar-value">
                          {formatNumber(day.total)}
                        </span>
                        <div className="bar-track">
                          <div
                            className={`bar ${index === 6 ? "current" : ""}`}
                            style={{
                              height: `${Math.max(2, (day.total / maximum) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="bar-label">{day.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-footer">
                    <span>
                      <span className="legend-dot" />
                      {t.weekTotal}
                    </span>
                    <strong>
                      {formatNumber(
                        days.reduce((sum, day) => sum + day.total, 0),
                      )}{" "}
                      h
                    </strong>
                  </div>
                </section>
                <section className="panel team-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t.team}</h2>
                      <p>
                        {users.length} {t.teamHint}
                      </p>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => selectSection("team")}
                      aria-label={t.team}
                    >
                      <ArrowUpRight size={19} />
                    </button>
                  </div>
                  <div className="team-preview">
                    {users.slice(0, 4).map((user) => (
                      <div className="person-row" key={user.id}>
                        <Avatar name={user.username} id={user.id} />
                        <div>
                          <strong>{user.username}</strong>
                          <small>{user.position || t.user}</small>
                        </div>
                        <span
                          className="role-dot"
                          title={user.role === "admin" ? t.admin : t.user}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => selectSection("team")}
                  >
                    {t.team}
                    <ArrowRight size={16} />
                  </button>
                </section>
              </div>
            </>
          )}
          {section === "team" ? (
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  {t.team} <span className="count">{users.length}</span>
                </h2>
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label={t.search}
                    placeholder={t.search}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t.member}</th>
                      <th>{t.position}</th>
                      <th>{t.role}</th>
                      <th>
                        <span className="sr-only">{t.edit}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="person-row">
                            <Avatar name={user.username} id={user.id} />
                            <div>
                              <strong>{user.username}</strong>
                              <small>{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{user.position || "—"}</td>
                        <td>
                          <span
                            className={`badge ${user.role === "admin" ? "badge-admin" : ""}`}
                          >
                            {user.role === "admin" ? t.admin : t.user}
                          </span>
                        </td>
                        <td>
                          {current.role === "admin" && (
                            <div className="row-actions">
                              <button
                                className="icon-button"
                                aria-label={`${t.edit} ${user.username}`}
                                onClick={() =>
                                  setEditor({ kind: "user", item: user })
                                }
                              >
                                <Pencil size={15} />
                              </button>
                              {user.id !== current.id && (
                                <button
                                  className="icon-button"
                                  aria-label={`${t.delete} ${user.username}`}
                                  onClick={() => {
                                    setDeleteError("");
                                    setDeletion({ kind: "user", item: user });
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filteredUsers.length && (
                <div className="empty-state">
                  <Users />
                  <h3>{t.noMatch}</h3>
                  <p>{t.emptyHint}</p>
                </div>
              )}
            </section>
          ) : (
            <>
              {section === "export" && (
                <section className="export-card">
                  <span className="export-icon">
                    <FileSpreadsheet size={34} />
                  </span>
                  <div>
                    <h2>{t.exportHeading}</h2>
                    <p>{t.exportHint}</p>
                    <span className="badge">
                      CSV · UTF-8 · {filtered.length} {t.records.toLowerCase()}
                    </span>
                  </div>
                  <button
                    className="button primary"
                    onClick={download}
                    disabled={!filtered.length}
                  >
                    <ArrowDownToLine size={17} />
                    {t.download}
                  </button>
                </section>
              )}
              <section className="panel records-panel">
                <div className="panel-heading">
                  <h2>
                    {section === "overview" ? t.recent : t.attendance}{" "}
                    <span className="count">{filtered.length}</span>
                  </h2>
                  {section === "overview" ? (
                    <button
                      className="text-button"
                      onClick={() => selectSection("attendance")}
                    >
                      {t.viewAll}
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="table-filters">
                      <label className="search-field">
                        <Search size={17} />
                        <input
                          placeholder={t.searchRecords}
                          aria-label={t.searchRecords}
                          value={search}
                          onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(0);
                          }}
                        />
                      </label>
                      <select
                        aria-label={t.member}
                        value={person}
                        onChange={(event) => {
                          setPerson(event.target.value);
                          setPage(0);
                        }}
                      >
                        <option value="">{t.all}</option>
                        {users.map((user) => (
                          <option value={user.id} key={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.member}</th>
                        <th>{t.date}</th>
                        <th>{t.arrival}</th>
                        <th>{t.departure}</th>
                        <th>{t.duration}</th>
                        <th>{t.note}</th>
                        <th>
                          <span className="sr-only">{t.edit}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((record) => {
                        const user = users.find(
                          (value) => value.id === record.userId,
                        );
                        return (
                          <tr key={record.id}>
                            <td>
                              <div className="person-row">
                                <Avatar
                                  name={user?.username || "?"}
                                  id={record.userId}
                                />
                                <div>
                                  <strong>{user?.username || "—"}</strong>
                                  <small>{user?.position || t.user}</small>
                                </div>
                              </div>
                            </td>
                            <td className="nowrap">
                              {formatDate(record.date)}
                            </td>
                            <td className="time-cell">
                              {record.arrivalTime.slice(0, 5)}
                            </td>
                            <td className="time-cell">
                              {record.departureTime.slice(0, 5)}
                            </td>
                            <td>
                              <span className="duration-badge">
                                {formatNumber(hours(record))} h
                              </span>
                            </td>
                            <td className="note-cell">{record.note || "—"}</td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="icon-button"
                                  aria-label={`${t.edit} ${user?.username} ${record.date.slice(0, 10)}`}
                                  onClick={() =>
                                    setEditor({ kind: "record", item: record })
                                  }
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`${t.delete} ${user?.username} ${record.date.slice(0, 10)}`}
                                  onClick={() => {
                                    setDeleteError("");
                                    setDeletion({
                                      kind: "record",
                                      item: record,
                                    });
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && (
                  <div className="empty-state">
                    <CalendarDays />
                    <h3>{t.empty}</h3>
                    <p>{t.emptyHint}</p>
                  </div>
                )}
                {section !== "overview" && filtered.length > 10 && (
                  <div className="pagination">
                    <span>
                      {effectivePage + 1} / {Math.ceil(filtered.length / 10)}
                    </span>
                    <button
                      className="icon-button"
                      disabled={effectivePage === 0}
                      aria-label={t.previous}
                      onClick={() => setPage(Math.max(0, effectivePage - 1))}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      className="icon-button"
                      disabled={
                        effectivePage >= Math.ceil(filtered.length / 10) - 1
                      }
                      aria-label={t.more}
                      onClick={() => setPage(effectivePage + 1)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>attendance.</span>
            <span>{t.footer}</span>
          </footer>
        </main>
      </div>
      {editor && (
        <Editor
          key={`${editor.kind}-${editor.item?.id ?? "new"}`}
          {...editor}
          users={users}
          current={current}
          t={t}
          onClose={() => setEditor(null)}
          onSave={save}
          errorMessage={errorMessage}
        />
      )}
      {deletion && (
        <Modal
          title={t.deleteTitle}
          onClose={() => setDeletion(null)}
          closeLabel={t.close}
          busy={busy}
        >
          <p className="muted">{t.deleteHint}</p>
          {deleteError && (
            <p className="error-box" role="alert">
              {deleteError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeletion(null)}
              disabled={busy}
            >
              {t.cancel}
            </button>
            <button className="button danger" onClick={remove} disabled={busy}>
              {busy ? t.saving : t.delete}
            </button>
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{notice}</span>
          <button
            className="icon-button"
            onClick={() => setNotice("")}
            aria-label={t.close}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
