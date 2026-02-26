const express = require("express");
const request = require("supertest");
const { body } = require("express-validator");
const validateRequest = require("../../../middleware/validateRequest");

const createApp = (...rules) => {
  const app = express();
  app.use(express.json());
  app.post("/test", ...rules, validateRequest, (req, res) => {
    res.json({ success: true });
  });
  return app;
};

describe("validateRequest middleware", () => {
  it("should pass through when validation succeeds", async () => {
    const app = createApp(
      body("name").notEmpty().withMessage("Name is required")
    );

    const res = await request(app)
      .post("/test")
      .send({ name: "Alice" })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it("should return 400 with errors array when validation fails", async () => {
    const app = createApp(
      body("name").notEmpty().withMessage("Name is required")
    );

    const res = await request(app)
      .post("/test")
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("should join multiple error messages", async () => {
    const app = createApp(
      body("name").notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Valid email is required")
    );

    const res = await request(app)
      .post("/test")
      .send({})
      .expect(400);

    expect(res.body.message).toContain("Name is required");
    expect(res.body.message).toContain("Valid email is required");
  });
});
