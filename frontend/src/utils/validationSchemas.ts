import Joi from 'joi';

const baseEmailSchema = Joi.string()
  .min(6)
  .max(60)
  .required()
  .email({ tlds: { allow: ['com', 'net'] } })
  .messages({
    'string.empty': 'El email no puede estar vacío',
    'any.required': 'El email es requerido',
  });

const basePasswordSchema = Joi.string()
  .required()
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'))
  .messages({
    'string.empty': 'La contraseña no puede estar vacía',
    'any.required': 'La contraseña es requerida',
  });

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
      'string.empty': 'La confirmación de contraseña no puede estar vacía',
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

const baseTicketFields = {
  title: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'El título no puede estar vacío',
    'string.min': 'El título debe tener al menos 3 caracteres',
    'string.max': 'El título no puede tener más de 200 caracteres',
    'any.required': 'El título es requerido',
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    'string.empty': 'La descripción no puede estar vacía',
    'string.min': 'La descripción debe tener al menos 10 caracteres',
    'string.max': 'La descripción no puede tener más de 2000 caracteres',
    'any.required': 'La descripción es requerida',
  }),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').messages({
    'any.only': 'El estado debe ser uno de: open, in_progress, resolved, closed',
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').messages({
    'any.only': 'La prioridad debe ser una de: low, medium, high, urgent',
  }),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'assignedTo debe ser un ObjectId válido de MongoDB',
    }),
  tags: Joi.string()
    .allow('')
    .custom((value: string, helpers) => {
      if (!value || value.trim() === '') {
        return value;
      }
      const tagsArray = value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      if (tagsArray.length > 10) {
        return helpers.error('string.max');
      }
      return value;
    })
    .messages({
      'string.max': 'Se permiten máximo 10 etiquetas',
    }),
};

export const createTicketSchema = Joi.object({
  ...baseTicketFields,
});

export const updateTicketSchema = Joi.object({
  title: Joi.string().min(3).max(200).messages({
    'string.empty': 'El título no puede estar vacío',
    'string.min': 'El título debe tener al menos 3 caracteres',
    'string.max': 'El título no puede tener más de 200 caracteres',
  }),
  description: Joi.string().min(10).max(2000).messages({
    'string.empty': 'La descripción no puede estar vacía',
    'string.min': 'La descripción debe tener al menos 10 caracteres',
    'string.max': 'La descripción no puede tener más de 2000 caracteres',
  }),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').messages({
    'any.only': 'El estado debe ser uno de: open, in_progress, resolved, closed',
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').messages({
    'any.only': 'La prioridad debe ser una de: low, medium, high, urgent',
  }),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'assignedTo debe ser un ObjectId válido de MongoDB',
    }),
  tags: Joi.string()
    .allow('')
    .custom((value: string, helpers) => {
      if (!value || value.trim() === '') {
        return value;
      }
      const tagsArray = value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      if (tagsArray.length > 10) {
        return helpers.error('string.max');
      }
      return value;
    })
    .messages({
      'string.max': 'Se permiten máximo 10 etiquetas',
    }),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
});
