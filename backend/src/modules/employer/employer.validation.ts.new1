import { z } from 'zod';

const jobTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'TEMPORARY'], {
  errorMap: () => ({ message: 'Job type must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT, TEMPORARY.' })
});

const workModeEnum = z.enum(['ON_SITE', 'HYBRID', 'REMOTE'], {
  errorMap: () => ({ message: 'Work mode must be one of: ON_SITE, HYBRID, REMOTE.' })
});

const salaryRangeRefinement = (data: { salaryMin?: number | null; salaryMax?: number | null }) => {
  if (data.salaryMin != null && data.salaryMax != null) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
};

const jobStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED']);

export const createJobSchema = z.object({
  body: z
    .object({
      title: z.string().min(2, 'Job title is required.'),
      description: z.string().min(10, 'Description must be at least 10 characters.'),
      requirements: z.string().min(10, 'Requirements must be at least 10 characters.'),
      benefits: z.string().optional(),
      location: z.string().min(1, 'Location is required.'),
      jobType: jobTypeEnum,
      workMode: workModeEnum,
      categoryId: z.string().uuid('A valid job category must be selected.'),
      salaryMin: z.number().nonnegative().optional().nullable(),
      salaryMax: z.number().nonnegative().optional().nullable(),
      currency: z.string().min(3).max(3).optional(),
      deadline: z.string().datetime().optional().or(z.string().length(0)).optional(),
      skillIds: z.array(z.string().uuid()).optional(),
      status: jobStatusEnum.optional()
    })
    .refine(salaryRangeRefinement, {
      message: 'Minimum salary cannot be greater than maximum salary.',
      path: ['salaryMin']
    })
});

export const updateJobSchema = z.object({
  body: z
    .object({
      title: z.string().min(2).optional(),
      description: z.string().min(10).optional(),
      requirements: z.string().min(10).optional(),
      benefits: z.string().optional(),
      location: z.string().min(1).optional(),
      jobType: jobTypeEnum.optional(),
      workMode: workModeEnum.optional(),
      categoryId: z.string().uuid().optional(),
      salaryMin: z.number().nonnegative().optional().nullable(),
      salaryMax: z.number().nonnegative().optional().nullable(),
      currency: z.string().min(3).max(3).optional(),
      deadline: z.string().optional().nullable(),
      skillIds: z.array(z.string().uuid()).optional(),
      status: jobStatusEnum.optional()
    })
    .refine(salaryRangeRefinement, {
      message: 'Minimum salary cannot be greater than maximum salary.',
      path: ['salaryMin']
    })
});

export const autosaveJobSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.string().optional(),
      benefits: z.string().optional(),
      location: z.string().optional(),
      jobType: jobTypeEnum.optional(),
      workMode: workModeEnum.optional(),
      categoryId: z.string().uuid().optional(),
      salaryMin: z.number().nonnegative().optional().nullable(),
      salaryMax: z.number().nonnegative().optional().nullable(),
      currency: z.string().min(3).max(3).optional(),
      deadline: z.string().optional().nullable(),
      skillIds: z.array(z.string().uuid()).optional(),
      status: jobStatusEnum.optional()
    })
    .refine(salaryRangeRefinement, {
      message: 'Minimum salary cannot be greater than maximum salary.',
      path: ['salaryMin']
    })
});

export const bulkJobActionSchema = z.object({
  body: z.object({
    jobIds: z
      .array(z.string().min(1))
      .min(1, 'At least one job must be selected.')
      .max(200, 'Bulk actions are limited to 200 jobs at a time.')
  })
});

export const bulkApplicationActionSchema = z.object({
  body: z.object({
    applicationIds: z
      .array(z.string().min(1))
      .min(1, 'At least one application must be selected.')
      .max(200, 'Bulk actions are limited to 200 applications at a time.'),
    action: z.enum(['shortlist', 'reject'], {
      errorMap: () => ({ message: 'Action must be either "shortlist" or "reject".' })
    }),
    reason: z.string().optional()
  })
});

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tag name is required.').max(50, 'Tag name must be 50 characters or fewer.'),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #3B82F6.')
      .optional()
  })
});

export const attachTagSchema = z.object({
  body: z.object({
    tagId: z.string().min(1, 'A tag must be selected.')
  })
});

export const bulkTagSchema = z.object({
  body: z.object({
    applicationIds: z
      .array(z.string().min(1))
      .min(1, 'At least one application must be selected.')
      .max(200, 'Bulk actions are limited to 200 applications at a time.'),
    tagId: z.string().min(1, 'A tag must be selected.')
  })
});

export const createSavedFilterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'A name is required for the saved filter.').max(100),
    filters: z.record(z.any())
  })
});
