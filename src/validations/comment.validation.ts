import { z } from "zod";

const commentSchema = z.object({
  id: z.string().uuid().optional(),
  comment: z.string().min(1, "Comment cannot be empty"),
  name: z.string().min(1, "Name cannot be empty"),
  userId: z.string().min(1, "User Id cant be empty"),
  image: z.string().url("Invalid image URL"),
  daoId: z.string().min(1, "DAO Id is required"),
});

export const commentSchemaResponse = commentSchema.extend({
    likes: z.number().int().default(0), // TOTAL LIKES
})

export type Comment = z.infer<typeof commentSchema>;
export { commentSchema };
