import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export interface FeatureFlag {
  key: string;
  value: boolean;
  description: string;
  updatedBy: string | null;
  updatedAt: string;
}

const DEFAULT_FLAGS: { key: string; value: boolean; description: string }[] = [
  { key: 'enableAI', value: true, description: 'Enable or disable AI platform features' },
  { key: 'enableMessaging', value: true, description: 'Enable or disable live chat messaging' },
  { key: 'maintenanceMode', value: false, description: 'Put application in read-only maintenance mode' },
  { key: 'studentRegistration', value: true, description: 'Enable student registrations' },
  { key: 'employerRegistration', value: true, description: 'Enable employer registrations' },
  { key: 'universityRegistration', value: true, description: 'Enable university registrations' },
];

export class FeatureFlagsService {
  private static async ensureSeeded(): Promise<void> {
    const count = await prisma.featureFlag.count();
    if (count > 0) return;

    await prisma.$transaction(
      DEFAULT_FLAGS.map((flag) =>
        prisma.featureFlag.upsert({
          where: { key: flag.key },
          update: {},
          create: flag,
        })
      )
    );
  }

  static async getFlag(key: string): Promise<boolean> {
    try {
      await this.ensureSeeded();
      const flag = await prisma.featureFlag.findUnique({ where: { key } });
      return flag?.value ?? false;
    } catch (err) {
      logger.error({ err }, 'Failed to read feature flag from database.');
      return false;
    }
  }

  static async getFlagsList(): Promise<FeatureFlag[]> {
    await this.ensureSeeded();
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    return flags.map((f: { key: string; value: boolean; description: string; updatedBy: string | null; updatedAt: Date }) => ({
      key: f.key,
      value: f.value,
      description: f.description,
      updatedBy: f.updatedBy,
      updatedAt: f.updatedAt.toISOString(),
    }));
  }

  static async updateFlag(key: string, value: boolean, updatedBy: string): Promise<FeatureFlag> {
    await this.ensureSeeded();
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) {
      throw new Error(`Feature flag ${key} does not exist.`);
    }

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: { value, updatedBy },
    });

    return {
      key: updated.key,
      value: updated.value,
      description: updated.description,
      updatedBy: updated.updatedBy,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
