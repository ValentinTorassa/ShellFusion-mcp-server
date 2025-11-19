import { Request, Response, NextFunction } from "express";


export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = process.env.API_KEY;
  const requestApiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return next();
  }

  if (!requestApiKey) {
    res.status(401).json({
      success: false,
      message: "Invalid or missing API key",
    });
    return;
  }

  if (requestApiKey !== apiKey) {
    res.status(401).json({
      success: false,
      message: "Invalid or missing API key",
    });
    return;
  }

  next();
};
