const mongoose = require("mongoose");

jest.mock("../../../utils/tokens");
jest.mock("../../../models/User");

const { verifyAccessToken } = require("../../../utils/tokens");
const User = require("../../../models/User");
const { authMiddleware, roleMiddleware } = require("../../../middleware/auth");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authMiddleware", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set req.user for a valid token", async () => {
    const userId = new mongoose.Types.ObjectId();
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockReturnValue({ userId });
    User.findById.mockResolvedValue({ _id: userId, role: "patient", isActive: true });

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toEqual(userId);
    expect(req.user.role).toBe("patient");
  });

  it("should return 401 when no authorization header", async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when header does not start with Bearer", async () => {
    const req = { headers: { authorization: "Basic some-token" } };
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", async () => {
    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockImplementation(() => {
      throw new Error("invalid token");
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid/Expired token" });
  });

  it("should return 401 when token is expired", async () => {
    const req = { headers: { authorization: "Bearer expired-token" } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockImplementation(() => {
      const err = new Error("jwt expired");
      err.name = "TokenExpiredError";
      throw err;
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid/Expired token" });
  });

  it("should return 401 when user not found in DB", async () => {
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockReturnValue({ userId: new mongoose.Types.ObjectId() });
    User.findById.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("should return 403 when account is deactivated", async () => {
    const userId = new mongoose.Types.ObjectId();
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockReturnValue({ userId });
    User.findById.mockResolvedValue({ _id: userId, role: "patient", isActive: false });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Account is deactivated" });
  });
});

describe("roleMiddleware", () => {
  it("should call next when role is allowed", () => {
    const req = { user: { role: "doctor" } };
    const res = mockRes();
    const next = jest.fn();

    roleMiddleware(["doctor", "admin"])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 403 when role is not allowed", () => {
    const req = { user: { role: "patient" } };
    const res = mockRes();
    const next = jest.fn();

    roleMiddleware(["doctor"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden: role not allowed" });
  });

  it("should return 403 when req.user is missing", () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    roleMiddleware(["doctor"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
