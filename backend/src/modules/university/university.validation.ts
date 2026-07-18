import { z } from 'zod';

const verificationStatusEnum = z.enum(['PENDING', 'VERIFIED', 'PLACEMENT_ELIGIBLE', 'PLACEMENT_COMPLETED', 'REJECTED'], {
  errorMap: () => ({ message: 'Status must be one of: PENDING, VERIFIED, PLACEMENT_ELIGIBLE, PLACEMENT_COMPLETED, REJECTED.' })
});

export const verifyStudentSchema = z.object({
  body: z.object({
    status: verificationStatusEnum
  })
});

export const createDriveSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Drive title is required.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    location: z.string().min(1, 'Location is required.'),
    scheduledAt: z.string().datetime({ message: 'Scheduled date/time is invalid.' }),
    deadline: z.string().datetime({ message: 'Deadline is invalid.' })
  })
});

export const updateDriveSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(1).optional(),
    scheduledAt: z.string().datetime().optional(),
    deadline: z.string().datetime().optional()
  })
});

export const updateSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'University name is required.').optional(),
    logoUrl: z.string().url('Logo URL must be a valid URL.').optional().or(z.literal('')),
    location: z.string().min(1, 'Location is required.').optional(),
    directorName: z.string().min(1, 'Director name is required.').optional(),
    contactEmail: z.string().email('Contact email is invalid.').optional(),
    phone: z.string().optional()
  })
});

export const sendBroadcastSchema = z.object({
  body: z.object({
    recipientUserIds: z.array(z.string().uuid()).min(1, 'Select at least one recipient.'),
    title: z.string().min(2, 'Subject is required.'),
    content: z.string().min(2, 'Message content is required.')
  })
});

export const supportRequestSchema = z.object({
  body: z.object({
    subject: z.string().min(2, 'Subject is required.'),
    message: z.string().min(10, 'Please provide at least 10 characters describing the issue.')
  })
});
