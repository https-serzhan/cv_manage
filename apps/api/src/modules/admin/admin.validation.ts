import { z } from "zod";

export const adminRoleCodes = ["CANDIDATE", "RECRUITER", "ADMIN"] as const;

export const listAdminUsersQuerySchema = z.object({
  prefix: z.string().trim().min(1).optional(),
  role: z.enum(adminRoleCodes).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

export const adminUserIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export type AdminUserIdParams = z.infer<typeof adminUserIdParamsSchema>;

export const updateAdminUserRolesBodySchema = z
  .object({
    roles: z.array(z.enum(adminRoleCodes)).min(1)
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();

    data.roles.forEach((role, index) => {
      if (seen.has(role)) {
        ctx.addIssue({
          code: "custom",
          message: "Roles should be unique",
          path: ["roles", index]
        });
      }

      seen.add(role);
    });
  });

export type UpdateAdminUserRolesBody = z.infer<typeof updateAdminUserRolesBodySchema>;
export type AdminRoleCode = (typeof adminRoleCodes)[number];
