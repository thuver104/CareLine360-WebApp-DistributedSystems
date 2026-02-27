# CareLine360 🏥

A full-stack **MERN** web application for remote medical consultation and emergency assistance — connecting patients, doctors, responders, and administrators on a single healthcare platform.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Contributors](#contributors)
- [License](#license)

---

## Features

### Patient Portal

- Book in-person / video / phone consultations with doctors
- Real-time chat with doctors during appointments
- AI-powered medical assistant (Gemini + Groq)
- Upload & manage medical documents (Cloudinary storage)
- View medical history, prescriptions & payment receipts
- SOS emergency case submission with GPS coordinates
- Profile strength indicator for completion tracking

### Doctor Portal

- Manage availability slots and consultation fees
- View upcoming appointments with auto-generated Jitsi meeting links
- In-appointment chat, prescriptions & medical records
- Rating & review system per appointment

### Admin Dashboard

- User management (CRUD, status toggle, role assignment)
- Appointment meeting link assignment
- Analytics & report generation (PDF / CSV / Excel)
- Emergency case monitoring with dispatcher controls
- Email & SMS notifications (Nodemailer + SMSLenz)

### Emergency & Responder

- Emergency case lifecycle: **PENDING → DISPATCHED → ARRIVED → RESOLVED**
- Nearest hospital lookup by GPS coordinates
- Responder-specific dashboard with case assignments

### Real-Time Features

- Socket.io appointment-scoped chat with typing indicators
- Background cron schedulers for meeting reminders (10 min before) and appointment reminders (24 hrs before)

---

## Tech Stack

| Layer            | Technology                                               |
| ---------------- | -------------------------------------------------------- |
| **Frontend**     | React 19, Vite 7, Tailwind CSS 4, React Router 7         |
| **Backend**      | Node.js, Express 5, Mongoose (MongoDB)                   |
| **Real-Time**    | Socket.io 4                                              |
| **Auth**         | JWT (access + refresh tokens), role-based access control |
| **File Storage** | Cloudinary                                               |
| **Email**        | Nodemailer (SMTP)                                        |
| **SMS**          | SMSLenz API                                              |
| **AI**           | Google Gemini API, Groq API                              |
| **PDF**          | jsPDF (client), PDFKit (server)                          |
| **Maps**         | Leaflet / React-Leaflet                                  |
| **Charts**       | Chart.js / react-chartjs-2                               |
| **Testing**      | Jest, Supertest, mongodb-memory-server, Artillery        |

---

## Project Structure

```
CareLine360-WebApp-MERN/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── api/              # Axios API modules
│       ├── auth/             # Auth context & guards
│       ├── components/       # Reusable UI components
│       ├── layouts/          # Layout wrappers (Admin, Doctor, Patient)
│       ├── pages/            # Route-level page components
│       ├── routes/           # React Router config
│       ├── socket/           # Socket.io client setup
│       └── utils/            # Helpers & constants
├── server/                   # Express backend
│   ├── config/               # DB & Cloudinary config
│   ├── controllers/          # Route handler logic
│   ├── middleware/            # Auth, upload, validation, error handling
│   ├── models/               # Mongoose schemas (15 models)
│   ├── routes/               # Express route definitions
│   ├── services/             # Business logic layer
│   ├── socket/               # Socket.io event handlers
│   ├── validators/           # Express-validator schemas
│   ├── utils/                # Helpers (OTP, tokens, distance)
│   ├── tests/                # Unit, integration & load tests
│   └── server.js             # App entry point
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **Cloudinary** account
- **SMTP** credentials (Gmail app password recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/CareLine360-WebApp-MERN.git
cd CareLine360-WebApp-MERN

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Configuration

Copy the example env files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Run Development Servers

```bash
# Terminal 1 — Backend (port 1111)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

---

## Environment Variables

### Server (`server/.env`)

| Variable                | Description                       |
| ----------------------- | --------------------------------- |
| `PORT`                  | Server port (default: `1111`)     |
| `MONGO_URI`             | MongoDB connection string         |
| `NODE_ENV`              | `development` or `production`     |
| `CLIENT_URL`            | Frontend URL for CORS             |
| `JWT_SECRET`            | Socket.io token verification      |
| `JWT_ACCESS_SECRET`     | Access token signing key          |
| `JWT_REFRESH_SECRET`    | Refresh token signing key         |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name             |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret             |
| `SMTP_HOST`             | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT`             | SMTP port (default: `587`)        |
| `SMTP_USER`             | SMTP email address                |
| `SMTP_PASS`             | SMTP password / app password      |
| `EMAIL_FROM`            | Sender email address              |
| `GEMINI_API_KEY`        | Google Gemini API key             |
| `SMSLENZ_USER_ID`       | SMSLenz user ID                   |
| `SMSLENZ_API_KEY`       | SMSLenz API key                   |

### Client (`client/.env`)

| Variable            | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `VITE_API_URL`      | Backend API base URL (default: `http://localhost:1111/api`) |
| `VITE_GROQ_API_KEY` | Groq API key for AI chat                                    |

---

## API Endpoints

| Base Path           | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `/api/auth`         | Register, login, OTP verification, token refresh, password reset   |
| `/api/admin`        | Admin dashboard, user management, report generation, meeting links |
| `/api/patients`     | Patient profile, medical history, AI assistant                     |
| `/api/doctor`       | Doctor profile, availability, setup                                |
| `/api/appointments` | CRUD appointments, reschedule, status transitions                  |
| `/api/chat`         | Chat messages scoped to appointments                               |
| `/api/payments`     | Create & verify payments                                           |
| `/api/emergency`    | Emergency case CRUD & status updates                               |
| `/api/hospitals`    | Hospital directory & nearest lookup                                |
| `/api/documents`    | File upload & retrieval (Cloudinary)                               |
| `/api/users`        | User profile & password management                                 |

---

## Testing

```bash
# Run all tests
cd server
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

**Test coverage includes:** appointment controller/service/validator, payment controller/service/validator, auth middleware, error handler, chat integration, and Artillery load testing.

---

## Contributors

> **SLIIT** | Year 3 Semester 2 — Application Frameworks Module  
> **Group ID:** Y3S2-SE-80

| Name          | Student ID |
| ------------- | ---------- |
| K. Vanayalini | IT23193840 |
| T. Thuvarekan | IT23281332 |
| B. Clarin     | IT23402584 |
| G. Shajana    | IT23164208 |

---

## License

This project is licensed under the [MIT License](LICENSE).
