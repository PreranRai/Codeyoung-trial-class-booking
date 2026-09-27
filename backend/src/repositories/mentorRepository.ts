import { PrismaClient, Mentor } from '@prisma/client';

export interface IMentorRepository {
  findAllActive(): Promise<Mentor[]>;
  findById(id: string): Promise<Mentor | null>;
}

export class PrismaMentorRepository implements IMentorRepository {
  constructor(private prisma: PrismaClient) {}

  async findAllActive(): Promise<Mentor[]> {
    return this.prisma.mentor.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string): Promise<Mentor | null> {
    return this.prisma.mentor.findUnique({
      where: { id },
    });
  }
}
