import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { signSchema, changePasswordSchema } from "./middlewares/validator";
import User from "./models/userModel";
import { doHash, doHashValidation } from "./middlewares/hashing";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const signup = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    const { error } = signSchema.validate({ email, password });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(401).json({ success: false, message: "El usuario ya existe" });

    const hashedPassword = await doHash(password, 12);
    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save();

    const { password: _, ...userWithoutPassword } = result.toObject();

    res.status(201).json({
      success: true,
      message: "Tu cuenta ha sido creada exitosamente",
      data: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: err instanceof Error ? err.message : "Error desconocido",
    });
  }
};

export const signin = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    const { error } = signSchema.validate({ email, password });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) return res.status(401).json({ success: false, message: "El usuario no existe" });

    const valid = await doHashValidation(password, existingUser.password);
    if (!valid) return res.status(401).json({ success: false, message: "Credenciales inválidas" });

    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.TOKEN_SECRET as string,
      { expiresIn: "8h" }
    );

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({ success: true, token, message: "Sesión iniciada exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: err instanceof Error ? err.message : "Error desconocido",
    });
  }
};

export const signout = async (req: Request, res: Response): Promise<any> => {
  res.clearCookie("Authorization").status(200).json({ success: true, message: "Sesión cerrada exitosamente" });
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { userId } = req.user!;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ _id: userId }).select("+password");
    if (!existingUser) return res.status(401).json({ success: false, message: "El usuario no existe" });

    const valid = await doHashValidation(oldPassword, existingUser.password);
    if (!valid) return res.status(401).json({ success: false, message: "Contraseña actual incorrecta" });

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();

    return res.status(200).json({ success: true, message: "Contraseña actualizada exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: err instanceof Error ? err.message : "Error desconocido",
    });
  }
};
