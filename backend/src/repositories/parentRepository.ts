import { PrismaClient, Parent } from '@prisma/client';

export interface IParentRepository {
  findOrCreate(data: { name: string; email: string; timezone: string }, tx?: PrismaClient): Promise<Parent>;
}

export class PrismaParentRepository implements IParentRepository {
  constructor(private prisma: PrismaClient) {}

  async findOrCreate(
    data: { name: string; email: string; timezone: string },
    tx?: any
  ): Promise<Parent> {
    const db = tx || this.prisma;
    
    // Find existing parent by email or create new
    const existing = await db.parent.findFirst({
      where: { email: data.email },
    });

    if (existing) {
      return db.parent.update({
        where: { id: existing.id },
        data: { name: data.name, timezone: data.timezone },
      });
    }

    return db.parent.create({
      data: {
        name: data.name,
        email: data.email,
        timezone: data.timezone,
      },
    });
  }
}
