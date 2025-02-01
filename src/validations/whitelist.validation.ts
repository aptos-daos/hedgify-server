import { z } from "zod";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{1,64}$/;
const DEFAULT_VALUE = "1";

const WhitelistRowSchema = z.object({
  address: z.string().regex(ADDRESS_REGEX, "Invalid address format"),
  amount: z
    .string()
    .transform((val) => Number(val))
    .default(DEFAULT_VALUE),
});

export type WhitelistRow = z.infer<typeof WhitelistRowSchema>;
export { WhitelistRowSchema };
