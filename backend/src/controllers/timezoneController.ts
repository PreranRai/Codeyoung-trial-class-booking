import { Request, Response } from 'express';

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', region: 'US' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', region: 'US' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', region: 'US' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', region: 'US' },
  { value: 'Europe/London', label: 'London / GMT / BST', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris / CET / CEST', region: 'Europe' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', region: 'Asia' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST/AEDT)', region: 'Australia' },
];

export class TimezoneController {
  static getTimezones(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      timezones: COMMON_TIMEZONES,
    });
  }
}
