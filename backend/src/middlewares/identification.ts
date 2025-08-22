import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extendemos Request para agregar `user`
export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const identifier = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // Si viene de un cliente "no-browser", tomamos token de headers
  if (req.headers["client"] === "not-browser") {
    token = req.headers["authorization"] as string;
  } else {
    // Si viene de un navegador, tomamos token de cookies
    token = req.cookies?.["Authorization"];
  }

  if (!token) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    // El token normalmente viene como "Bearer <token>"
    const userToken = token.split(" ")[1];

    // Verificamos el token con la clave secreta
    const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET as string);

    if (jwtVerified) {
      req.user = jwtVerified;
      next(); // continuamos al siguiente middleware
    } else {
      throw new Error("Error in the token");
    }
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
