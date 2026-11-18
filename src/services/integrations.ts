import { z } from "zod";
import { normalizeIsbn, validIsbn } from "./library";
import type { BookDraft } from "../types/library";
import { emptyBook } from "../types/library";

const SearchSchema = z.object({
  docs: z.array(
    z.object({
      title: z.string(),
      author_name: z.array(z.string()).optional(),
      publisher: z.array(z.string()).optional(),
      first_publish_year: z.number().optional(),
    }),
  ),
});
export async function lookupIsbn(
  value: string,
  signal: AbortSignal,
): Promise<BookDraft | null> {
  const isbn = normalizeIsbn(value);
  if (!validIsbn(isbn))
    throw new Error("ISBN inválido. Confira os 10 ou 13 caracteres.");
  const response = await fetch(
    `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&fields=title,author_name,publisher,first_publish_year&limit=1`,
    { signal },
  );
  if (!response.ok)
    throw new Error(
      "A consulta bibliográfica está indisponível. Tente novamente ou cadastre manualmente.",
    );
  const book = SearchSchema.parse(await response.json()).docs[0];
  return book
    ? {
        ...emptyBook,
        isbn,
        title: book.title,
        author: book.author_name?.join(", ") ?? "",
        publisher: book.publisher?.[0] ?? "",
        year: String(book.first_publish_year ?? ""),
      }
    : null;
}
export const ocrEndpoint = import.meta.env.VITE_OCR_ENDPOINT as
  string | undefined;
const OcrSchema = z.object({
  title: z.string().default(""),
  author: z.string().default(""),
  isbn: z.string().default(""),
  publisher: z.string().default(""),
  year: z.string().default(""),
  cde: z.string().default(""),
  location: z.string().default(""),
  notes: z.string().default(""),
});
export async function readCard(
  file: File,
  signal: AbortSignal,
): Promise<BookDraft> {
  if (!ocrEndpoint)
    throw new Error(
      "OCR ainda não conectado. Use a transcrição manual para revisar a ficha.",
    );
  const url = new URL(ocrEndpoint, window.location.origin);
  if (url.origin !== window.location.origin || url.protocol !== "https:")
    throw new Error(
      "O OCR exige um endpoint HTTPS na mesma origem, protegido pelo backend.",
    );
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(url, {
    method: "POST",
    body,
    credentials: "same-origin",
    signal,
  });
  if (!response.ok)
    throw new Error(
      "Não foi possível processar a ficha. Verifique a integração OCR.",
    );
  return OcrSchema.parse(await response.json());
}

const ReaderOcrSchema = z.object({
  name: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  birthDate: z.string().default(""),
});
export async function readReaderCard(file: File, signal: AbortSignal) {
  if (!ocrEndpoint)
    throw new Error("OCR ainda não conectado. Use a transcrição manual.");
  const url = new URL(ocrEndpoint, window.location.origin);
  if (url.origin !== window.location.origin || url.protocol !== "https:")
    throw new Error("Configure um endpoint OCR HTTPS na mesma origem.");
  const body = new FormData();
  body.append("image", file);
  body.append("documentType", "reader");
  const response = await fetch(url, {
    method: "POST",
    body,
    credentials: "same-origin",
    signal,
  });
  if (!response.ok)
    throw new Error("O serviço OCR não conseguiu processar a ficha.");
  return ReaderOcrSchema.parse(await response.json());
}
