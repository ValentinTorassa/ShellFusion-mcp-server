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

// READ ALL (GET)
// GET /api/tickets - Obtener todos los tickets con filtros opcionales
router.get("/tickets", async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      createdBy,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
 
    // Construir filtros
    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) {
      if (mongoose.Types.ObjectId.isValid(assignedTo as string)) {
        filter.assignedTo = new mongoose.Types.ObjectId(assignedTo as string);
      }
    }
    if (createdBy) {
      if (mongoose.Types.ObjectId.isValid(createdBy as string)) {
        filter.createdBy = new mongoose.Types.ObjectId(createdBy as string);
      }
    }
 
    // Paginación
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
 
    // Ordenamiento
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;
 
    // Ejecutar consulta
    const tickets = await Ticket.find(filter)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
 
    const total = await Ticket.countDocuments(filter);
 
    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

 // READ ONE (GET)
// GET /api/tickets/:id - Obtener un ticket por ID
router.get("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID format",
      });
    }
 
    const ticket = await Ticket.findById(id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email");
 
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
 
    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (err: any) {
    console.error("Error fetching ticket:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// UPDATE (PATCH) 
// PATCH /api/tickets/:id - Actualizar un ticket
router.patch("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID format",
      });
    }
 
    // Validar datos con Joi
    const { error, value } = updateTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }
 
    // Preparar datos para actualizar
    const updateData: any = {};
    if (value.title !== undefined) updateData.title = value.title;
    if (value.description !== undefined) updateData.description = value.description;
    if (value.status !== undefined) updateData.status = value.status;
    if (value.priority !== undefined) updateData.priority = value.priority;
    if (value.tags !== undefined) updateData.tags = value.tags;
 
    if (value.assignedTo !== undefined) {
      if (value.assignedTo === null || value.assignedTo === "") {
        updateData.assignedTo = null;
      } else if (mongoose.Types.ObjectId.isValid(value.assignedTo)) {
        updateData.assignedTo = new mongoose.Types.ObjectId(value.assignedTo);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid assignedTo format",
        });
      }
    }
 
    // Actualizar el ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "email")
      .populate("assignedTo", "email");
 
    if (!updatedTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (err: any) {
    console.error("Error updating ticket:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;