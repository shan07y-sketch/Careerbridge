import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format.'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one numeric digit.'),
    role: z.enum(['STUDENT', 'EMPLOYER', 'UNIVERSITY', 'ADMIN'], {
      errorMap: () => ({ message: 'Role must be one of: STUDENT, EMPLOYER, UNIVERSITY, ADMIN.' })
    }),
    firstName: z.string().min(1, 'First name is required.').optional(),
    lastName: z.string().min(1, 'Last name is required.').optional(),
    companyName: z.string().min(1, 'Company name is required.').optional(),
    industry: z.string().min(1, 'Industry name is required.').optional(),
    universityName: z.string().min(1, 'University name is required.').optional(),
    location: z.string().min(1, 'Location is required.').optional(),
    // Student-only optional academic details, collected at signup. They were
    // previously sent by the frontend but silently stripped by this schema;
    // now they are part of the contract and persisted (see AuthRepository).
    degree: z.string().min(1, 'Degree is required.').optional(),
    graduationYear: z.coerce.number().int().min(1950).max(2100).optional()
  }).refine((data) => {
    if (data.role === 'STUDENT') {
      return !!data.firstName && !!data.lastName;
    }
    if (data.role === 'EMPLOYER') {
      return !!data.companyName && !!data.industry;
    }
    if (data.role === 'UNIVERSITY') {
      return !!data.universityName && !!data.location;
    }
    return true;
  }, {
    message: 'Profile details matching selected role must be supplied.',
    path: ['role']
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.'),
    password: z.string().min(1, 'Password is required.')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required.'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one numeric digit.')
  })
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required.')
  })
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.')
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required.'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters.')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'New password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'New password must contain at least one numeric digit.')
  })
});
