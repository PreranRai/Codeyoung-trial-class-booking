import { Request, Response } from 'express';

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Trial Class Booking API',
    });
  }
}
