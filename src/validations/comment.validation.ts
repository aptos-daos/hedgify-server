import { z } from "zod";

const commentSchema = z.object({
  id: z.string().optional(),
  comment: z.string().min(1, "Comment cannot be empty"),
  name: z.string().min(1, "Name cannot be empty"),
  userId: z.string().min(1, "User Id cant be empty"),
  image: z.string().url("Invalid image URL"),
  daoId: z.string().min(1, "DAO Id is required"),

  createdAt: z.date().optional(),
});

const likeSchema = z.object({
  id: z.string().optional(),
  commentId: z.string().min(1, "Comment Id cant be empty"),
  userId: z.string().min(1, "User Id cant be empty"),
  daoId: z.string(),
  createdAt: z.date().optional(),
});

export const commentSchemaResponse = commentSchema.extend({
    likes: z.number().int().default(0), // TOTAL LIKES
})

export type Like = z.infer<typeof likeSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CommentResponse = z.infer<typeof commentSchemaResponse>;
export { commentSchema };
