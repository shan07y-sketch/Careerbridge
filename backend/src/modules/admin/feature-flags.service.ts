import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';

export interface FeatureFlag {
  key: string;
  value: boolean;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

export class FeatureFlagsService {
  private static filePath = path.resolve(process.cwd(), 'uploads', 'feature_flags.json');
  private static defaults: { [key: string]: FeatureFlag } = {
    enableAI: {
      key: 'enableAI',
      value: true,
      description: 'Enable or disable AI platform features',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    },
    enableMessaging: {
      key: 'enableMessaging',
      value: true,
      description: 'Enable or disable live chat messaging',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    },
    maintenanceMode: {
      key: 'maintenanceMode',
      value: false,
      description: 'Put application in read-only maintenance mode',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    },
    studentRegistration: {
      key: 'studentRegistration',
      value: true,
      description: 'Enable student registrations',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    },
    employerRegistration: {
      key: 'employerRegistration',
      value: true,
      description: 'Enable employer registrations',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    },
    universityRegistration: {
      key: 'universityRegistration',
      value: true,
      description: 'Enable university registrations',
      updatedBy: 'system',
      updatedAt: new Date().toISOString()
    }
  };

  private static loadFlags(): { [key: string]: FeatureFlag } {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify(this.defaults, null, 2));
        return this.defaults;
      }

      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      logger.error({ err }, 'Failed to load feature flags, falling back to defaults.');
      return this.defaults;
    }
  }

  static getFlag(key: string): boolean {
    const flags = this.loadFlags();
    return flags[key] ? flags[key].value : false;
  }

  static getFlagsList(): FeatureFlag[] {
    const flags = this.loadFlags();
    return Object.values(flags);
  }

  static updateFlag(key: string, value: boolean, updatedBy: string) {
    const flags = this.loadFlags();
    if (!flags[key]) {
      throw new Error(`Feature flag ${key} does not exist.`);
    }

    flags[key] = {
      ...flags[key],
      value,
      updatedBy,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(this.filePath, JSON.stringify(flags, null, 2));
    return flags[key];
  }
}
