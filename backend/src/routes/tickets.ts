import { Router, Request, Response } from "express";
import Ticket, { ITicket } from "../models/ticketModel";
import { createTicketSchema, updateTicketSchema } from "../middlewares/validator";
import mongoose from "mongoose";
 
const router = Router();
 
// CREATE POST
// POST /api/tickets - Crear un nuevo ticket
router.post("/tickets", async (req: Request, res: Response) => {
  try {
    // Validar datos con Joi
    const { error, value } = createTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }
 
    // Obtener el ID del usuario que crea el ticket (desde el token JWT si está autenticado)
    // Por ahora, asumimos que viene en el body o lo obtenemos de otra forma
    const createdBy = req.body.createdBy || req.body.userId;
 
    if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Valid createdBy (userId) is required",
      });
    }
 
    // Crear el ticket
    const newTicket = new Ticket({
      title: value.title,
      description: value.description,
      status: value.status || "open",
      priority: value.priority || "medium",
      assignedTo: value.assignedTo || null,
      createdBy: createdBy,
      tags: value.tags || [],
    });
 
    const savedTicket = await newTicket.save();
 
    // Populate para obtener información del usuario
    await savedTicket.populate("createdBy", "email");
    if (savedTicket.assignedTo) {
      await savedTicket.populate("assignedTo", "email");
    }
 
    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: savedTicket,
    });
  } catch (err: any) {
    console.error("Error creating ticket:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;