const AdminService = require('../services/admin.service');

jest.mock('../models/User', () => ({
  aggregate: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../models/EmergencyCase', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

const User = require('../models/User');
const EmergencyCase = require('../models/EmergencyCase');

describe('AdminService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('returns users with pagination metadata', async () => {
      const fakeAggregateResult = [
        {
          metadata: [{ total: 3 }],
          data: [{ _id: '1' }, { _id: '2' }, { _id: '3' }],
        },
      ];

      User.aggregate.mockResolvedValue(fakeAggregateResult);

      const res = await AdminService.getAllUsers({ page: 1, limit: 10, search: '', role: 'all' });

      expect(User.aggregate).toHaveBeenCalled();
      expect(res.total).toBe(3);
      expect(res.users.length).toBe(3);
      expect(res.pages).toBe(1);
    });

    it('applies role filter and search', async () => {
      const fakeAggregateResult = [
        { metadata: [{ total: 1 }], data: [{ _id: 'x', name: 'Alice' }] },
      ];
      User.aggregate.mockResolvedValue(fakeAggregateResult);

      const res = await AdminService.getAllUsers({ page: 2, limit: 1, search: 'Ali', role: 'patient' });

      expect(User.aggregate).toHaveBeenCalled();
      expect(res.total).toBe(1);
      expect(res.pages).toBe(1);
      expect(res.users[0].name).toBe('Alice');
    });
  });

  describe('toggleUserStatus', () => {
    it('throws when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(AdminService.toggleUserStatus('nonexistent')).rejects.toThrow('User not found');
      expect(User.findById).toHaveBeenCalledWith('nonexistent');
    });

    it('toggles ACTIVE to SUSPENDED and returns updated user', async () => {
      const existing = { _id: 'u1', status: 'ACTIVE' };
      const updated = { _id: 'u1', status: 'SUSPENDED' };

      User.findById.mockResolvedValue(existing);
      User.findByIdAndUpdate.mockResolvedValue(updated);

      const res = await AdminService.toggleUserStatus('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'SUSPENDED' }, { new: true, runValidators: false });
      expect(res.status).toBe('SUSPENDED');
    });
  });

  describe('getStats', () => {
    it('returns aggregated stats', async () => {
      User.countDocuments
        .mockResolvedValueOnce(10) // totalUsers
        .mockResolvedValueOnce(4) // totalPatients
        .mockResolvedValueOnce(3) // totalDoctors
        .mockResolvedValueOnce(2); // totalResponders

      EmergencyCase.countDocuments
        .mockResolvedValueOnce(20) // totalEmergencies
        .mockResolvedValueOnce(5); // resolvedEmergencies

      EmergencyCase.aggregate
        .mockResolvedValueOnce([{ _id: null, avgTime: 7.6 }]) // avgResponseTime
        .mockResolvedValueOnce([{ _id: 'PENDING', count: 3 }, { _id: 'RESOLVED', count: 5 }]); // status breakdown

      const res = await AdminService.getStats();

      expect(User.countDocuments).toHaveBeenCalledTimes(4);
      expect(EmergencyCase.countDocuments).toHaveBeenCalledTimes(2);
      expect(EmergencyCase.aggregate).toHaveBeenCalledTimes(2);

      expect(res.totalUsers).toBe(10);
      expect(res.totalEmergencies).toBe(20);
      expect(res.resolvedEmergencies).toBe(5);
      expect(typeof res.avgResponseTime).toBe('number');
      expect(res.emergencyStatusBreakdown.RESOLVED).toBe(5);
    });
  });
});
