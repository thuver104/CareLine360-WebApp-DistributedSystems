require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = Number(process.env.PORT || 1111);

const targets = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:5002',
  doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5004',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:5005',
  emergency: process.env.EMERGENCY_SERVICE_URL || 'http://localhost:5006',
};

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(helmet());
app.use(morgan('dev'));

const buildProxy = (target, options = {}) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    proxyTimeout: 15000,
    timeout: 15000,
    ...options,
  });

const preservePrefix = (prefix) => (path) =>
  `${prefix}${path === '/' ? '' : path}`;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    port: PORT,
    targets,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Use /health for gateway status',
  });
});

app.use('/api/auth', buildProxy(targets.auth, {
  pathRewrite: preservePrefix('/api/auth'),
}));
app.use('/api/users', buildProxy(targets.auth, {
  pathRewrite: preservePrefix('/api/users'),
}));

app.use('/api/doctor', buildProxy(targets.doctor, {
  pathRewrite: preservePrefix('/api/doctor'),
}));
app.use('/api/v1/doctors', buildProxy(targets.doctor, {
  pathRewrite: preservePrefix('/api/v1/doctors'),
}));

app.use('/api/patient', buildProxy(targets.patient, {
  pathRewrite: preservePrefix('/api/patient'),
}));
app.use('/api/v1/patient', buildProxy(targets.patient, {
  pathRewrite: preservePrefix('/api/v1/patient'),
}));

app.use('/api/admin/appointments', buildProxy(targets.appointment, {
  pathRewrite: preservePrefix('/api/v1/appointments'),
}));

app.use('/api/appointments', buildProxy(targets.appointment, {
  pathRewrite: preservePrefix('/api/v1/appointments'),
}));
app.use('/api/v1/appointments', buildProxy(targets.appointment, {
  pathRewrite: preservePrefix('/api/v1/appointments'),
}));

app.use('/api/admin', buildProxy(targets.admin, {
  pathRewrite: preservePrefix('/api/admin'),
}));
app.use('/api/v1/admin', buildProxy(targets.admin, {
  pathRewrite: preservePrefix('/api/v1/admin'),
}));

app.use('/api/emergency', buildProxy(targets.emergency, {
  pathRewrite: preservePrefix('/api/emergency'),
}));
app.use('/api/hospitals', buildProxy(targets.emergency, {
  pathRewrite: preservePrefix('/api/hospitals'),
}));
app.use('/api/v1/emergency', buildProxy(targets.emergency, {
  pathRewrite: preservePrefix('/api/v1/emergency'),
}));
app.use('/api/v1/hospitals', buildProxy(targets.emergency, {
  pathRewrite: preservePrefix('/api/v1/hospitals'),
}));

app.use('/socket.io', (req, res) => {
  res.status(501).json({
    message: 'Socket service is not enabled in the current microservices setup.',
    hint: 'Set VITE_SOCKET_URL only when a socket backend is running.',
  });
});

app.use('/api/payments', (req, res) => {
  res.status(501).json({
    message: 'Payment service is not available in current microservices setup.',
  });
});

app.use('/api/chat', (req, res) => {
  res.status(501).json({
    message: 'Chat service is not available in current microservices setup.',
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Route not mapped in API gateway',
    path: req.path,
    method: req.method,
  });
});

app.listen(PORT, () => {
  console.log(`API gateway running on http://localhost:${PORT}`);
  console.log('Route targets:', targets);
});
