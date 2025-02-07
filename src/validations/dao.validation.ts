import { z } from "zod";
import { addDays } from "date-fns";

const DEFAULT_FUNDING_TRADING_DURATION = 0; // 0 days
const DEFAULT_FUNDING_DURATION = 7; // 7 days
const DEFAULT_TRADING_DURATION = 90; // 90 days

export const getDefaultDates = (fundingStartDate: Date = new Date()) => {
  const tradingStart = addDays(
    fundingStartDate,
    DEFAULT_FUNDING_TRADING_DURATION + DEFAULT_FUNDING_DURATION
  );
  return {
    fundingStarts: fundingStartDate,
    tradingStartsAt: tradingStart,
    tradingEndsAt: addDays(tradingStart, DEFAULT_TRADING_DURATION),
  };
};

const dateSchema = z
  .union([
    z.date(), // Accepts Date objects
    z.string().refine((str) => !isNaN(Date.parse(str)), {
      message: "Invalid date string format",
    }),
  ])
  .transform((value) => {
    if (typeof value === "string") {
      return new Date(value); // Parse string into Date
    }
    return value;
  });

const daoSchema = z.object({
  id: z.string().cuid().optional(),
  walletAddress: z.string(),
  title: z.string().min(3).max(60, "Title max word limit is 60"),
  description: z
    .string()
    .min(1, "Bio is required")
    .max(280, "Bio must be less than 280 characters"),
  treasuryAddress: z.string().optional().nullable(), // TODO: UPDATE WHILE DEPLOYING
  daoCoinAddress: z.string().optional().nullable(), // TODO: UPDATE WHILE DEPLOYING
  indexFund: z
    .union([
      z
        .string()
        .regex(/^\d+$/, "Must be a valid number")
        .transform((val) => Number(val)),
      z.number(),
    ])
    .refine((val) => val > 0, "Index fund must be greater than 0"),
  profits: z.number().min(0).max(10, "Profits must be between 0 and 10"),

  poster: z.string().url(),

  fundTicker: z.string().max(10).optional().nullable(),
  userXHandle: z.string(),
  daoXHandle: z.string().optional().nullable(),
  telegramHandle: z.string(),
  telegramGroup: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  isPublic: z.boolean().default(false),
  publicLimit: z.number(),

  fundingStarts: dateSchema,
  tradingPeriod: z
    .union([
      z
        .string()
        .regex(/^\d+$/, "Must be a valid number")
        .transform((val) => Number(val)),
      z.number(),
    ])
    .optional()
    .nullable()
    .refine((val) => !val || [30, 90, 120, 150, 180, 270].includes(val), {
      message: "Invalid trading period",
    }),

  createdAt: z.date().default(() => new Date()),
});

export const DAODataSchema = daoSchema;
