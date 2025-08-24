import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  signSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} from "../src/middlewares/validator";
import User from "../src/models/userModel";
import { doHash, doHashValidation, hmacProcess } from "../src/middlewares/hashing";
import transport from "../src/middlewares/sendMail";

// Extendemos Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    verified: boolean;
  };
}

// ------------------- SIGNUP -------------------
export const signup = async (req: Request, res: Response) => {
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
export const signin = async (req: Request, res: Response) => {
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
      { userId: existingUser._id, email: existingUser.email, verified: existingUser.verified }, //payload con datos que quiero guardar en el token
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
export const signout = async (req: Request, res: Response) => {
  res.clearCookie("Authorization").status(200).json({ success: true, message: "logged out successfully" });
};

// ------------------- SEND VERIFICATION CODE -------------------
export const sendVerificationCode = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(404).json({ success: false, message: "User does not exists!" });
    if (existingUser.verified) return res.status(400).json({ success: false, message: "You are already verified!" });

    const codeValue = Math.floor(Math.random() * 1000000).toString(); //genero código de verificación random
    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "verification code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingUser.email) { //si el email está en la lista de aceptados
      //hasheo código de verificación
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET as string);
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
  } catch (err) {
    console.error(err);
  }
};

// ------------------- VERIFY VERIFICATION CODE -------------------
export const verifyVerificationCode = async (req: Request, res: Response) => {
  const { email, providedCode } = req.body;
  try {
    const { error } = acceptCodeSchema.validate({ email, providedCode });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });
    
    const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");
    if (!existingUser) return res.status(401).json({ success: false, message: "User does not exists!" });
    if (existingUser.verified) return res.status(400).json({ success: false, message: "you are already verified!" });

    if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
      return res.status(400).json({ success: false, message: "something is wrong with the code!" });
    }

    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) { //si pasaron 5 minutos desde que se generó el código, expira
      return res.status(400).json({ success: false, message: "code has been expired!" });
    }

    const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET as string);
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({ success: true, message: "your account has been verified!" });
    }
    return res.status(400).json({ success: false, message: "unexpected occured!!" });
  } catch (err) {
    console.error(err);
  }
};

// ------------------- CHANGE PASSWORD -------------------
export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { userId, verified } = req.user!;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });
    if (!verified) return res.status(401).json({ success: false, message: "You are not verified user!" });

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

// ------------------- SEND FORGOT PASSWORD CODE -------------------
export const sendForgotPasswordCode = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(404).json({ success: false, message: "User does not exists!" });

    const codeValue = Math.floor(Math.random() * 1000000).toString(); //Se crea un número aleatorio entre 0 y 999999 como código de recuperación.
    const info = await transport.sendMail({ //envio codigo por mail
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot password code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET as string);
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
  } catch (err) {
    console.error(err);
  }
};

// ------------------- VERIFY FORGOT PASSWORD CODE -------------------
export const verifyForgotPasswordCode = async (req: Request, res: Response) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error } = acceptFPCodeSchema.validate({ email, providedCode, newPassword });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation");
    if (!existingUser) return res.status(401).json({ success: false, message: "User does not exists!" });

    if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
      return res.status(400).json({ success: false, message: "something is wrong with the code!" });
    }

    if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "code has been expired!" });
    }

    const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET as string);
    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Password updated!!" });
    }
    return res.status(400).json({ success: false, message: "unexpected occured!!" });
  } catch (err) {
    console.error(err);
  }
};
