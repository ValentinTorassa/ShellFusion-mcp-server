import mongoose, { Schema, Document, Model } from "mongoose";

// Interfaz que describe el documento User
export interface IUser extends Document {
  email: string;
  password: string;
  verified: boolean;
  verificationCode?: string;
  verificationCodeValidation?: number;
  forgotPasswordCode?: string;
  forgotPasswordCodeValidation?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Esquema
const userSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required!"],
      trim: true,
      unique: [true, "Email must be unique!"],
      minLength: [5, "Email must have 5 characters!"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password must be provided!"],
      trim: true,
      select: false, //para que no se devuelva en las queries por defecto
    },
    verified: { // ¿Está verificado?
      type: Boolean,
      default: false,
    },
    verificationCode: { // Código de verificación
      type: String,
      select: false,
    },
    verificationCodeValidation: { // Timestamp del código de verificación
      type: Number,
      select: false,
    },
    forgotPasswordCode: { // Código de recuperación
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: { // Timestamp del código de recuperación
      type: Number,
      select: false,
    },
  },
  {
    timestamps: true, // crea createdAt (fecha de creación) y updatedAt (fecha de actualización) automáticamente
  }
);

// Modelo
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;