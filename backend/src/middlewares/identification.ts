import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const identifier = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): any => {
  let token: string | undefined;

  if (req.headers["client"] === "not-browser") {
    token = req.headers["authorization"] as string;
  } else {
    token = req.cookies?.["Authorization"];
  }

  if (!token) {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  try {
    const userToken = token.split(" ")[1];
    const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET as string);

    if (jwtVerified) {
      req.user = jwtVerified;
      next();
    } else {
      throw new Error("Error en el token");
    }
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
};
