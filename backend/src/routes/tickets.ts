import { Router, Request, Response } from "express";
import Ticket, { ITicket } from "../models/ticketModel";
import { createTicketSchema, updateTicketSchema } from "../middlewares/validator";
import mongoose from "mongoose";
 
const router = Router();
 
// CREATE
// POST /api/tickets - Create a new ticket
router.post("/tickets", async (req: Request, res: Response): Promise<any> => {
  try {
    // Validate data with Joi
    const { error, value } = createTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        details: error.details.map((detail) => detail.message),
      });
    }
 
    // Get user ID who creates the ticket (from JWT token if authenticated)
    // For now, we assume it comes in the body or we get it from elsewhere
    const createdBy = req.body.createdBy || req.body.userId;
 
    if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un ID de usuario válido",
      });
    }
 
    // Create the ticket
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
 
    // Populate to get user information
    await savedTicket.populate("createdBy", "email");
    if (savedTicket.assignedTo) {
      await savedTicket.populate("assignedTo", "email");
    }
 
    res.status(201).json({
      success: true,
      message: "Ticket creado exitosamente",
      data: savedTicket,
    });
  } catch (err: any) {
    console.error("Error creating ticket:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: err.message,
    });
  }
});

// READ ALL
// GET /api/tickets - Get all tickets with optional filters
router.get("/tickets", async (req: Request, res: Response): Promise<any> => {
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
 
    // Build filters
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
 
    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
 
    // Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;
 
    // Execute query
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
      message: "Error interno del servidor",
      error: err.message,
    });
  }
});

router.get("/tickets/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Formato de ID de ticket inválido",
      });
    }
 
    const ticket = await Ticket.findById(id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email");
 
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket no encontrado",
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
      message: "Error interno del servidor",
      error: err.message,
    });
  }
});

// UPDATE
// PATCH /api/tickets/:id - Update a ticket
router.patch("/tickets/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Formato de ID de ticket inválido",
      });
    }
 
    // Validate data with Joi
    const { error, value } = updateTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        details: error.details.map((detail) => detail.message),
      });
    }
 
    // Prepare data for update
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
          message: "Formato de assignedTo inválido",
        });
      }
    }
 
    // Update the ticket
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
        message: "Ticket no encontrado",
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Ticket actualizado exitosamente",
      data: updatedTicket,
    });
  } catch (err: any) {
    console.error("Error updating ticket:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: err.message,
    });
  }
});

router.delete("/tickets/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Formato de ID de ticket inválido",
      });
    }
 
    const deletedTicket = await Ticket.findByIdAndDelete(id);
 
    if (!deletedTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket no encontrado",
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Ticket eliminado exitosamente",
      data: deletedTicket,
    });
  } catch (err: any) {
    console.error("Error deleting ticket:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: err.message,
    });
  }
});

export default router;