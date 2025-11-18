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

const baseTicketFields = {
  title: Joi.string().min(3).max(200).messages({
    "string.min": "Title must have at least 3 characters",
    "string.max": "Title must not exceed 200 characters",
  }),
  description: Joi.string().min(10).max(2000).messages({
    "string.min": "Description must have at least 10 characters",
    "string.max": "Description must not exceed 2000 characters",
  }),
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed")
    .messages({
      "any.only": "Status must be one of: open, in_progress, resolved, closed",
    }),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .messages({
      "any.only": "Priority must be one of: low, medium, high, urgent",
    }),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, "")
    .messages({
      "string.pattern.base": "assignedTo must be a valid MongoDB ObjectId",
    }),
  tags: Joi.array()
    .items(Joi.string().trim())
    .max(10)
    .messages({
      "array.max": "Maximum 10 tags allowed",
    }),
};

export const createTicketSchema = Joi.object({
  ...baseTicketFields,
  createdBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "createdBy must be a valid MongoDB ObjectId",
      "any.required": "createdBy is required",
    }),
});

export const updateTicketSchema = Joi.object({
  ...baseTicketFields,
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});