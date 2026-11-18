import { Request, Response } from "express";
import { getMe } from "./UserController";

describe("UserController --- getMe", () => {
  it("returns the displayName of the session user", () => {
    const req = { user: { displayName: "Thais", avatar: "https://avatars.test/thais.jpg", createdAt: new Date() } } as unknown as Request;
    const res = { json: jest.fn() } as unknown as Response;

    getMe(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      status: 200,
      message: "",
      data: { displayName: "Thais", avatar: "https://avatars.test/thais.jpg" },
      request: undefined,
    });
  });
});
