import { z } from "zod";

export const IssueCertificateSchema = z.object({
  studentName: z.string().trim().min(2, "Student full name must be at least 2 characters").max(100),
  studentIdRef: z.string().trim().min(1, "Student ID or reference is required").max(64),
  course: z.string().trim().min(2, "Course / program name is required").max(150),
  award: z.string().trim().min(2, "Award / qualification is required").max(100),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be in YYYY-MM-DD format"),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  institutionName: z.string().trim().max(150).optional(),
  privacyConfirmation: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the privacy terms before issuing" }),
  }),
});

export const RevokeCertificateSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Revocation reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
  confirmation: z.boolean().optional(),
});

export const VerifyParamsSchema = z.object({
  certificateId: z
    .string()
    .trim()
    .min(3, "Certificate ID must be at least 3 characters")
    .max(128, "Certificate ID is too long")
    .regex(/^[A-Za-z0-9-_]+$/, "Certificate ID contains invalid characters"),
});
