import Joi from "joi";

export const signSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } })
    .messages({
      'string.empty': 'El email no puede estar vacío',
      'string.min': 'El email debe tener al menos 6 caracteres',
      'string.max': 'El email no puede tener más de 60 caracteres',
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido',
    }),
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      'string.empty': 'La contraseña no puede estar vacía',
      'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      'any.required': 'La contraseña es requerida',
    }),
});

export const changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      'string.empty': 'La nueva contraseña no puede estar vacía',
      'string.pattern.base': 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      'any.required': 'La nueva contraseña es requerida',
    }),
  oldPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .messages({
      'string.empty': 'La contraseña actual no puede estar vacía',
      'string.pattern.base': 'La contraseña actual debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      'any.required': 'La contraseña actual es requerida',
    }),
});

const baseTicketFields = {
  title: Joi.string().min(3).max(200).messages({
    "string.empty": "El título no puede estar vacío",
    "string.min": "El título debe tener al menos 3 caracteres",
    "string.max": "El título no debe exceder 200 caracteres",
  }),
  description: Joi.string().min(10).max(2000).messages({
    "string.empty": "La descripción no puede estar vacía",
    "string.min": "La descripción debe tener al menos 10 caracteres",
    "string.max": "La descripción no debe exceder 2000 caracteres",
  }),
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed")
    .messages({
      "any.only": "El estado debe ser uno de: open, in_progress, resolved, closed",
    }),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .messages({
      "any.only": "La prioridad debe ser una de: low, medium, high, urgent",
    }),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, "")
    .messages({
      "string.pattern.base": "assignedTo debe ser un ObjectId válido de MongoDB",
    }),
  tags: Joi.array()
    .items(Joi.string().trim())
    .max(10)
    .messages({
      "array.max": "Máximo 10 etiquetas permitidas",
    }),
};

export const createTicketSchema = Joi.object({
  ...baseTicketFields,
  createdBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "createdBy debe ser un ObjectId válido de MongoDB",
      "any.required": "createdBy es requerido",
    }),
});

export const updateTicketSchema = Joi.object({
  ...baseTicketFields,
}).min(1).messages({
  "object.min": "Se debe proporcionar al menos un campo para actualizar",
});