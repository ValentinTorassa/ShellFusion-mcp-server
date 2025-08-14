import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

interface Item {
  _id: string;
  name: string;
}

let items: Item[] = [
  { _id: '1', name: 'Sample item' },
  { _id: '2', name: 'Another sample item' },
];

let nextId = 3;

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

router.get('/items', (req: Request, res: Response) => {
  res.json(items);
});

router.post('/items', (req: Request, res: Response) => {
  try {
    const validatedData = createItemSchema.parse(req.body);
    
    const newItem: Item = {
      _id: nextId.toString(),
      name: validatedData.name,
    };
    
    items.push(newItem);
    nextId++;
    
    res.status(201).json(newItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;