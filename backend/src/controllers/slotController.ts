import { Request, Response, NextFunction } from 'express';
import { SlotService } from '../services/slotService';
import { getSlotsQuerySchema } from '../validators/bookingValidator';

export class SlotController {
  constructor(private slotService: SlotService) {}

  getSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = getSlotsQuerySchema.parse(req.query);
      const slots = await this.slotService.getAvailableSlots(
        validatedQuery.date,
        validatedQuery.timezone
      );

      res.status(200).json({
        success: true,
        date: validatedQuery.date,
        timezone: validatedQuery.timezone,
        slots,
      });
    } catch (err) {
      next(err);
    }
  };
}
