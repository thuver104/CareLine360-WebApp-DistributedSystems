const adminService = require('../services/adminService');

jest.mock('../models/Appointment', () => ({
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
  populate: jest.fn(),
}));

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../models/EmergencyCase', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../services/emailService', () => ({ sendEmail: jest.fn() }));
jest.mock('../services/smsService', () => ({ sendSMS: jest.fn() }));

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

describe('adminService (functions)', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createMeetingLink', () => {
    // helper to simulate Mongoose Query chain with populate and await
    const makeThenable = (result) => ({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(result),
    });

    it('returns 404 when appointment not found', async () => {
      Appointment.findByIdAndUpdate.mockReturnValue(makeThenable(null));

      const res = await adminService.createMeetingLink('notfound');
      expect(res.status).toBe(404);
      expect(res.data.message).toMatch(/Appointment not found/i);
    });

    it('updates appointment and sends notifications on success', async () => {
      const fakeAppt = {
        _id: 'a1',
        date: new Date().toISOString(),
        time: '10:00 AM',
        consultationType: 'video',
        patient: { fullName: 'Patient One', email: 'p@example.com' },
        doctor: { fullName: 'Dr One', email: 'd@example.com' }
      };

      Appointment.findByIdAndUpdate.mockReturnValue(makeThenable(fakeAppt));
      // ensure sendEmail/sendSMS return promises so .catch exists in service
      sendEmail.mockResolvedValue(null);
      sendSMS.mockResolvedValue(null);

      const res = await adminService.createMeetingLink('a1');

      expect(Appointment.findByIdAndUpdate).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.data).toBe(fakeAppt);
    });
  });

  describe('getAppointments', () => {
    it('returns appointments list', async () => {
      const appts = [{ _id: 'ap1' }, { _id: 'ap2' }];
      // simulate chainable Query with populate().populate().sort()
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue({ then: (resolve) => resolve(appts) })
      });

      const res = await adminService.getAppointments();
      expect(Appointment.find).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.data).toBe(appts);
    });
  });

  describe('createUser', () => {
    it('rejects when no email or phone provided', async () => {
      const res = await adminService.createUser({ password: 'p' });
      expect(res.status).toBe(400);
    });

    it('rejects when user already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'u1' });
      const res = await adminService.createUser({ email: 'x@e.com', password: 'p' });
      expect(User.findOne).toHaveBeenCalled();
      expect(res.status).toBe(409);
    });
  });

  describe('toggleUserStatus & updateUserStatus', () => {
    it('toggleUserStatus returns 404 when not found', async () => {
      User.findById.mockResolvedValue(null);
      const res = await adminService.toggleUserStatus('notfound');
      expect(res.status).toBe(404);
    });

    it('updateUserStatus rejects invalid status', async () => {
      const res = await adminService.updateUserStatus({ userId: 'u1', status: 'INVALID' });
      expect(res.status).toBe(400);
    });
  });
});
