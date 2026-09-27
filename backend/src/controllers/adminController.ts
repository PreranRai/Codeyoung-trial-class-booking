import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';

export class AdminController {
  constructor(private adminService: AdminService) {}

  getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await this.adminService.getAdminOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err) {
      next(err);
    }
  };
}
