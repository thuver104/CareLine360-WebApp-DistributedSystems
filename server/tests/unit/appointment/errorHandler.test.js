const errorHandler = require("../../../middleware/errorHandler");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler middleware", () => {
  const req = {};
  const next = jest.fn();

  it("should handle Mongoose ValidationError as 400", () => {
    const err = {
      name: "ValidationError",
      errors: {
        date: { message: "Date is required" },
        time: { message: "Time is required" },
      },
    };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Date is required, Time is required",
    });
  });

  it("should handle CastError as 400", () => {
    const err = { name: "CastError" };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid ID format",
    });
  });

  it("should handle duplicate key error (code 11000) as 409", () => {
    const err = { code: 11000, keyValue: { email: "test@test.com" } };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Duplicate value for email",
    });
  });

  it("should use custom statusCode from error", () => {
    const err = { statusCode: 404, message: "Not found" };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not found",
    });
  });

  it("should default to 500 when no statusCode", () => {
    const err = { message: "Something broke" };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Something broke",
    });
  });

  it("should use 'Internal Server Error' when no message", () => {
    const err = {};
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });
});
