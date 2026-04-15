# attendance-tracker-frontend

Frontend web application for **AttendanceTrackerApi** — an employee attendance tracking system. Built with React and Vite, it provides a responsive interface for managing attendance records and users through a REST API backend.

---

## Description

`attendance-tracker-frontend` is a single-page application (SPA) that serves as the client for the AttendanceTrackerApi. It allows administrators and managers to track employee attendance in real time, view historical records, and manage user accounts — all through a clean, component-driven UI.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI library |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [MUI (Material UI v7)](https://mui.com/) | Component library & styling |
| [Recharts](https://recharts.org/) | Data visualization |
| [react-countup](https://github.com/glennreyes/react-countup) | Animated number counters |

---

## Features

- **Attendance Records** — View a complete list of all attendance entries across the organization
- **Filter by User** — Look up attendance history for a specific employee
- **Create / Update / Delete Records** — Full CRUD operations on attendance entries via the REST API
- **User Management** — Interface for creating, editing, and removing employee accounts

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- The [AttendanceTrackerApi](../AttendanceTrackerApi) backend running locally or hosted remotely

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/attendance-tracker-frontend.git
cd attendance-tracker-frontend

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Building for Production

```bash
npm run build
```

The compiled output will be placed in the `dist/` directory.

---

## Environment Variables

Create a `.env` file in the project root and define the following variable:

```env
VITE_API_URL=http://localhost:5000
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the AttendanceTrackerApi backend |

> All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

---

## Project Structure

```
attendance-tracker-frontend/
├── public/                 # Static assets served as-is
├── src/
│   ├── assets/             # Images and static resources
│   ├── App.jsx             # Root application component
│   ├── App.css             # Global component styles
│   ├── main.jsx            # Application entry point
│   └── index.css           # Base/reset styles
├── .env                    # Environment variables (not committed)
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML entry point
├── package.json
└── vite.config.js          # Vite configuration
```

---

## License

This project is intended for portfolio and demonstration purposes.
