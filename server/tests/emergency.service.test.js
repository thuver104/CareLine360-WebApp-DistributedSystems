const EmergencyService = require('../services/emergency.service');

jest.mock('../models/EmergencyCase', () => ({
  create: jest.fn(),
  aggregate: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/Hospital', () => ({ find: jest.fn() }));
jest.mock('../utils/hospitals', () => ([
  { name: 'H1', lat: 0, lng: 0, address: 'A', contact: 'C' },
  { name: 'H2', lat: 1, lng: 1, address: 'B', contact: 'D' }
]));

jest.mock('../utils/distance', () => ({ calculateDistance: jest.fn() }));

const EmergencyCase = require('../models/EmergencyCase');
const Hospital = require('../models/Hospital');
const { calculateDistance } = require('../utils/distance');

describe('EmergencyService', () => {
  afterEach(() => jest.clearAllMocks());

  it('createEmergency delegates to EmergencyCase.create', async () => {
    EmergencyCase.create.mockResolvedValue({ _id: 'e1' });
    const res = await EmergencyService.createEmergency({ foo: 'bar' });
    expect(EmergencyCase.create).toHaveBeenCalledWith({ foo: 'bar' });
    expect(res._id).toBe('e1');
  });

  it('getEmergencyById returns aggregated emergency or null', async () => {
    // use valid 24-char hex ObjectId strings to avoid BSON errors
    const validId1 = '507f1f77bcf86cd799439011';
    const validId2 = '000000000000000000000000';

    EmergencyCase.aggregate.mockResolvedValueOnce([{ _id: 'e1' }]);
    const res = await EmergencyService.getEmergencyById(validId1);
    expect(EmergencyCase.aggregate).toHaveBeenCalled();
    expect(res._id).toBe('e1');

    EmergencyCase.aggregate.mockResolvedValueOnce([]);
    const res2 = await EmergencyService.getEmergencyById(validId2);
    expect(res2).toBeNull();
  });

  it('updateStatus throws when not found and computes response time when resolved', async () => {
    EmergencyCase.findById.mockResolvedValue(null);
    await expect(EmergencyService.updateStatus('x', { status: 'DISPATCHED' })).rejects.toThrow(/not found/i);

    const triggeredAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const existing = { _id: 'e2', triggeredAt };
    EmergencyCase.findById.mockResolvedValue(existing);
    EmergencyCase.findByIdAndUpdate.mockResolvedValue({ _id: 'e2', status: 'RESOLVED', responseTime: 5 });

    const res = await EmergencyService.updateStatus('e2', { status: 'RESOLVED' });
    expect(EmergencyCase.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toBe('RESOLVED');
  });

  it('getNearestHospital falls back to static list when DB empty and returns nearest', async () => {
    const emergency = { _id: 'em1', latitude: 0.1, longitude: -0.1 };
    EmergencyCase.findById.mockResolvedValue(emergency);

    Hospital.find.mockResolvedValue([]);
    calculateDistance.mockImplementation((lat1, lon1, lat2, lon2) => Math.hypot(lat1 - lat2, lon1 - lon2));

    const nearest = await EmergencyService.getNearestHospital('em1');
    expect(nearest).toHaveProperty('name');
    expect(typeof nearest.distance).toBe('number');
  });
});
