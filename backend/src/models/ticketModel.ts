import mongoose, { Schema, Document, Model } from "mongoose";
 
// Source of Truth: Interfaz que describe el documento Ticket
export interface ITicket extends Document {
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: mongoose.Types.ObjectId; // Referencia al usuario asignado
  createdBy: mongoose.Types.ObjectId; // Referencia al usuario que creó el ticket
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
 
// Esquema de Mongoose (mapeo a MongoDB)
const ticketSchema: Schema<ITicket> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required!"],
      trim: true,
      minLength: [3, "Title must have at least 3 characters!"],
      maxLength: [200, "Title must not exceed 200 characters!"],
    },
    description: {
      type: String,
      required: [true, "Description is required!"],
      trim: true,
      minLength: [10, "Description must have at least 10 characters!"],
      maxLength: [2000, "Description must not exceed 2000 characters!"],
    },
    status: {
      type: String,
      enum: {
        values: ["open", "in_progress", "resolved", "closed"],
        message: "Status must be one of: open, in_progress, resolved, closed",
      },
      default: "open",
      required: true,
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "Priority must be one of: low, medium, high, urgent",
      },
      default: "medium",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required!"],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10; // Máximo 10 tags
        },
        message: "Maximum 10 tags allowed",
      },
    },
  },
  {
    timestamps: true, // Crea createdAt y updatedAt automáticamente
  }
);
 
// Índices para mejorar el rendimiento de las consultas
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdAt: -1 }); // Índice descendente para ordenar por fecha
 
// Modelo
const Ticket: Model<ITicket> = mongoose.model<ITicket>("Ticket", ticketSchema);
 
export default Ticket;