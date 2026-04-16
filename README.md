# attendance-tracker-frontend

![Build](https://github.com/amonvo/attendance-tracker-frontend/actions/workflows/build.yml/badge.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

HR attendance management system built with React 19, Vite, and Material UI 7. Frontend for [AttendanceTrackerApi](https://github.com/amonvo/AttendanceTrackerApi).

## Screenshots

> Dashboard with live charts, sidebar navigation, dark/light mode and CS/EN language switch.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI library |
| Vite 6 | Build tool |
| MUI v7 | Component library |
| Recharts | Data visualization |
| Docker + Nginx | Production deployment |

## Features

- **Dashboard** — stat cards, bar/pie/line charts, weekly attendance overview
- **User Management** — CRUD, avatars, role chips, position field, pagination
- **Attendance Records** — period filter (day/week/month/year), user performance chart, pagination
- **Export** — CSV export for users and attendance with preview
- **Dark / Light mode** — full MUI theme support
- **CS / EN** — language switching
- **Docker ready** — Nginx production build

## Getting Started

### Option A — Docker (recommended)

```bash
git clone https://github.com/amonvo/attendance-tracker-frontend.git
cd attendance-tracker-frontend
docker build -t attendance-frontend .
docker run -p 3000:80 attendance-frontend
```

### Option B — Local

```bash
git clone https://github.com/amonvo/attendance-tracker-frontend.git
cd attendance-tracker-frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`

### Full Stack (Docker Compose)

```bash
git clone https://github.com/amonvo/AttendanceTrackerApi.git
git clone https://github.com/amonvo/attendance-tracker-frontend.git
cd ..
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Environment Variables

```env
VITE_API_URL=http://localhost:5000
```

## Project Structure

attendance-tracker-frontend/
├── src/
│   ├── components/
│   │   ├── Attendance/
│   │   ├── Dashboard/
│   │   ├── Layout/
│   │   └── Users/
│   ├── pages/
│   │   ├── AttendancePage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ExportPage.jsx
│   │   └── UsersPage.jsx
│   ├── services/
│   │   └── api.js
│   ├── i18n.js
│   └── App.jsx
├── Dockerfile
├── nginx.conf
└── .github/workflows/
└── build.yml

## Related

- [AttendanceTrackerApi](https://github.com/amonvo/AttendanceTrackerApi) — ASP.NET Core 8 backend

## License

MIT