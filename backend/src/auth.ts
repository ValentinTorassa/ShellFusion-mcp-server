import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { signSchema, changePasswordSchema } from "../src/middlewares/validator";
import User from "../src/models/userModel";
import { doHash, doHashValidation } from "../src/middlewares/hashing";

// Extendemos Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// ------------------- SIGNUP -------------------
export const signup = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body; // Obtengo email y password del request
  try {
    //valido mail y contraseña
    const { error } = signSchema.validate({ email, password });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });
    //busco si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(401).json({ success: false, message: "User already exists!" });
    //hasheo contraseña
    const hashedPassword = await doHash(password, 12);
    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save();
    
    // Remove password from response object
    const { password: _, ...userWithoutPassword } = result.toObject();

    res.status(201).json({
      success: true,
      message: "Your account has been created successfully",
      result: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
  }
};

// ------------------- SIGNIN -------------------
export const signin = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    const { error } = signSchema.validate({ email, password });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) return res.status(401).json({ success: false, message: "User does not exists!" });

    const valid = await doHashValidation(password, existingUser.password); //valido contraseña comparandolas
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials!" });

    //genero JSON Web Token
    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email }, //payload con datos que quiero guardar en el token
      process.env.TOKEN_SECRET as string, //clave secreta para firmar el token
      { expiresIn: "8h" } //tiempo de expiración del token
    );
    //guardo token en cookie
    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production", //evita que JavaScript del frontend acceda a la cookie
        secure: process.env.NODE_ENV === "production", //solo se envía en HTTPS en producción
      })
      .json({ success: true, token, message: "logged in successfully" });
  } catch (err) {
    console.error(err);
  }
};

// ------------------- SIGNOUT -------------------
export const signout = async (req: Request, res: Response): Promise<any> => {
  res.clearCookie("Authorization").status(200).json({ success: true, message: "logged out successfully" });
};

// ------------------- CHANGE PASSWORD -------------------
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { userId } = req.user!;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ _id: userId }).select("+password");
    if (!existingUser) return res.status(401).json({ success: false, message: "User does not exists!" });

    const valid = await doHashValidation(oldPassword, existingUser.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials!" });

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();

    return res.status(200).json({ success: true, message: "Password updated!!" });
  } catch (err) {
    console.error(err);
  }
};
