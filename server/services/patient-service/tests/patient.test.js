/**
 * Patient Service Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock environment
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/careline_patient_test_db';
process.env.NODE_ENV = 'test';

// Import after env setup
const app = require('../src/server');
const Patient = require('../src/models/Patient');
const PatientDocument = require('../src/models/PatientDocument');
const MedicalRecord = require('../src/models/MedicalRecord');

// Test helpers
const createTestToken = (userId, role = 'patient') => {
  return jwt.sign({ userId, role, email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Patient Service', () => {
  let testPatient;
  let testToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await Patient.deleteMany({});
    await PatientDocument.deleteMany({});
    await MedicalRecord.deleteMany({});

    // Create test patient
    testPatient = await Patient.create({
      userId: 'test-user-id-123',
      patientId: 'P' + Date.now(),
      fullName: 'John Doe',
      email: 'john@example.com'
    });

    testToken = createTestToken(testPatient.userId);
  });

  describe('Health Checks', () => {
    it('GET /health/live should return ok', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready should check dependencies', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('checks');
      expect(res.body.checks).toHaveProperty('mongodb');
    });
  });

  describe('Patient Profile', () => {
    it('GET /api/v1/patient/me should return patient profile', async () => {
      const res = await request(app)
        .get('/api/v1/patient/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patientId).toBe(testPatient.patientId);
      expect(res.body.data.fullName).toBe('John Doe');
      expect(res.body.data).toHaveProperty('profileStrength');
    });

    it('PATCH /api/v1/patient/me should update profile', async () => {
      const res = await request(app)
        .patch('/api/v1/patient/me')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          fullName: 'John Updated',
          gender: 'male',
          bloodGroup: 'A+'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient.fullName).toBe('John Updated');
      expect(res.body.data.patient.bloodGroup).toBe('A+');
    });

    it('should validate NIC format', async () => {
      const res = await request(app)
        .patch('/api/v1/patient/me')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          nic: 'invalid-nic'
        });

      expect(res.status).toBe(400);
    });

    it('should validate blood group format', async () => {
      const res = await request(app)
        .patch('/api/v1/patient/me')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          bloodGroup: 'invalid'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/v1/patient/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const res = await request(app)
        .get('/api/v1/patient/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('should reject non-patient roles', async () => {
      const doctorToken = createTestToken('doctor-id', 'doctor');
      const res = await request(app)
        .get('/api/v1/patient/me')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Medical Records', () => {
    beforeEach(async () => {
      // Create test medical records
      await MedicalRecord.create([
        {
          patientId: testPatient.patientId,
          doctorId: 'doctor-123',
          visitType: 'consultation',
          diagnosis: 'Common cold',
          vitals: { bloodPressure: '120/80', heartRate: 72 }
        },
        {
          patientId: testPatient.patientId,
          doctorId: 'doctor-456',
          visitType: 'follow-up',
          diagnosis: 'Recovery checkup'
        }
      ]);
    });

    it('GET /api/v1/patient/medical-records should return records', async () => {
      const res = await request(app)
        .get('/api/v1/patient/medical-records')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('GET /api/v1/patient/medical-records/vitals/latest should return latest vitals', async () => {
      const res = await request(app)
        .get('/api/v1/patient/medical-records/vitals/latest')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bloodPressure).toBe('120/80');
    });
  });

  describe('Profile Strength', () => {
    it('should calculate profile strength correctly', async () => {
      // Update patient with all required fields
      await Patient.findOneAndUpdate(
        { patientId: testPatient.patientId },
        {
          dob: new Date('1990-01-01'),
          gender: 'male',
          address: { district: 'Colombo', city: 'Colombo', line1: '123 Main St' },
          emergencyContact: { name: 'Jane Doe', phone: '0771234567', relationship: 'Spouse' },
          bloodGroup: 'O+',
          allergies: ['Penicillin']
        }
      );

      const res = await request(app)
        .get('/api/v1/patient/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      // Should have 80% (basic 30 + emergency 30 + medical 20)
      // Missing documents = 0
      expect(res.body.data.profileStrength.score).toBe(80);
    });
  });
});
