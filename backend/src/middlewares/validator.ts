import Joi from "joi"; //librería de validación de datos para Node.js

// Schema para registro y login, valido mail y contraseña
export const signSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

// Schema para verificar código de email, valido mail y código
export const acceptCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  providedCode: Joi.number().required(),
});

// Schema para cambiar contraseña, valido nueva contraseña y antigua contraseña
export const changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
  oldPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

// Schema para código de recuperación de contraseña
export const acceptFPCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  providedCode: Joi.number().required(),
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});