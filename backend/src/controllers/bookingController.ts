import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/bookingService';
import { createBookingSchema } from '../validators/bookingValidator';

export class BookingController {
  constructor(private bookingService: BookingService) {}

  createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedInput = createBookingSchema.parse(req.body);
      const bookingResult = await this.bookingService.createBooking(validatedInput);

      res.status(201).json({
        success: true,
        data: bookingResult,
      });
    } catch (err) {
      next(err);
    }
  };

  getBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  };
}
