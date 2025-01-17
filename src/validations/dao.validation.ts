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
    fundingEnds: addDays(fundingStartDate, DEFAULT_FUNDING_DURATION),
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

const daoSchema = z
  .object({
    id: z.string().cuid().optional(),
    walletAddress: z.string(),
    title: z.string().min(3).max(50, "Title max word limit is 50"),
    description: z
      .string()
      .min(1, "Bio is required")
      .max(500, "Bio must be less than 500 characters"),
    treasuryAddress: z.string().optional(),
    daoCoinAddress: z.string().optional(),

    fundingStarts: dateSchema.optional().default(new Date()),
    fundingEnds: dateSchema.optional(),

    tradingStartsAt: dateSchema.optional(),
    tradingEndsAt: dateSchema.optional(),

    createdAt: z.date().default(() => new Date()),
  })
  .transform((data) => ({
    ...data,
    ...getDefaultDates(data.fundingStarts),
  }))
  .refine((data) => data.fundingStarts < data.fundingEnds, {
    message: "Funding end date must be after funding start date",
    path: ["fundingEnds"],
  })
  .refine((data) => data.tradingStartsAt < data.tradingEndsAt, {
    message: "Trading end date must be after trading start date",
    path: ["tradingEndsAt"],
  });

export const DAODataSchema = daoSchema;
