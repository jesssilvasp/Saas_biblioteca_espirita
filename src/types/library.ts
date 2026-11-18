import { z } from "zod";

export const BookSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string(),
  publisher: z.string(),
  edition: z.string().optional(),
  subtitle: z.string().optional(),
  category: z.string().optional(),
  shelf: z.string().optional(),
  donation: z.boolean().optional(),
  year: z.string(),
  cde: z.string(),
  location: z.string(),
  notes: z.string(),
  review: z.enum(["pending", "accepted", "study", "declined"]),
  reviewNotes: z.string(),
  createdAt: z.string(),
});
export const ReaderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string(),
  phone: z.string(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string(),
});
export const CopySchema = z.object({
  id: z.string(),
  bookId: z.string(),
  code: z.string(),
});
export const LoanSchema = z.object({
  id: z.string(),
  copyId: z.string(),
  readerId: z.string(),
  borrowedAt: z.string(),
  dueDate: z.string(),
  returnedAt: z.string().nullable(),
  notes: z.string().optional(),
});
export const DatabaseSchema = z.object({
  version: z.literal(1),
  books: z.array(BookSchema),
  readers: z.array(ReaderSchema),
  copies: z.array(CopySchema),
  loans: z.array(LoanSchema),
  events: z.array(
    z.object({ id: z.string(), text: z.string(), at: z.string() }),
  ),
  readNotifications: z.array(z.string()),
  settings: z.object({
    name: z.string().min(1),
    loanDays: z.number().int().min(1).max(90),
  }),
});
export type Book = z.infer<typeof BookSchema>;
export type Reader = z.infer<typeof ReaderSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type Database = z.infer<typeof DatabaseSchema>;
export type BookDraft = Omit<
  Book,
  "id" | "createdAt" | "review" | "reviewNotes"
>;
export const emptyBook: BookDraft = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  year: "",
  cde: "",
  location: "",
  notes: "",
};
export const reviewLabels: Record<Book["review"], string> = {
  pending: "Aguardando análise",
  accepted: "Aprovada",
  study: "Em estudo",
  declined: "Não incorporada",
};
