import Joi from 'joi';

// Esquemas sincronizados con el backend (backend/src/middlewares/validator.ts)
// Usamos los mismos criterios de validación para consistencia

// Schema base para email y password (igual al backend)
const baseEmailSchema = Joi.string()
  .min(6)
  .max(60)
  .required()
  .email({ tlds: { allow: ['com', 'net'] } });

const basePasswordSchema = Joi.string()
  .required()
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'));

export const signupSchema = Joi.object({
  email: baseEmailSchema.messages({
    'string.min': 'El email debe tener al menos 6 caracteres',
    'string.max': 'El email no puede tener más de 60 caracteres',
    'string.email': 'Debe ser un email válido (dominios permitidos: .com, .net)',
    'any.required': 'El email es requerido',
  }),
  password: basePasswordSchema.messages({
    'any.required': 'La contraseña es requerida',
    'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Las contraseñas no coinciden',
      'any.required': 'La confirmación de contraseña es requerida',
    }),
});

export const signinSchema = Joi.object({
  email: baseEmailSchema.messages({
    'string.min': 'El email debe tener al menos 6 caracteres',
    'string.max': 'El email no puede tener más de 60 caracteres',
    'string.email': 'Debe ser un email válido (dominios permitidos: .com, .net)',
    'any.required': 'El email es requerido',
  }),
  password: basePasswordSchema.messages({
    'any.required': 'La contraseña es requerida',
    'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  }),
});

