import { DatabaseSchema } from "../types/library";
import type { Book, BookDraft, Database, Reader } from "../types/library";

export const STORAGE_KEY = "biblioteca-espirita:v1";
export const today = () => localDate(new Date());
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dueIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(value.length === 10 ? `${value}T12:00:00` : value),
  );
}
export const freshDatabase = (): Database => ({
  version: 1,
  books: [],
  readers: [],
  copies: [],
  loans: [],
  events: [],
  readNotifications: [],
  settings: { name: "Biblioteca Espírita", loanDays: 14 },
});
export function readDatabase(): Database {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? DatabaseSchema.parse(JSON.parse(raw)) : freshDatabase();
}
export function writeDatabase(db: Database) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DatabaseSchema.parse(db)));
}
export function log(db: Database, text: string) {
  db.events.unshift({
    id: crypto.randomUUID(),
    text,
    at: new Date().toISOString(),
  });
}
export const availableCopies = (db: Database, bookId?: string) =>
  db.copies.filter(
    (c) =>
      (!bookId || c.bookId === bookId) &&
      !db.loans.some((l) => l.copyId === c.id && !l.returnedAt),
  );
export const overdueLoans = (db: Database) =>
  db.loans.filter((l) => !l.returnedAt && l.dueDate < today());
export function addCopies(db: Database, bookId: string, count: number) {
  if (!db.books.some((b) => b.id === bookId))
    throw new Error("Livro não encontrado.");
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error("Informe entre 1 e 100 exemplares.");
  for (let i = 0; i < count; i++)
    db.copies.push({
      id: crypto.randomUUID(),
      bookId,
      code: `BE-${String(db.copies.length + 1).padStart(5, "0")}`,
    });
  log(db, `${count} exemplar(es) adicionado(s) ao acervo.`);
}
export function saveBook(
  db: Database,
  draft: BookDraft,
  copies: number,
  id?: string,
) {
  if (!draft.title.trim() || !draft.author.trim())
    throw new Error("Preencha título e autoria.");
  if (draft.isbn && !validIsbn(draft.isbn))
    throw new Error("O ISBN informado é inválido.");
  if (
    draft.isbn &&
    db.books.some((b) => b.isbn === normalizeIsbn(draft.isbn) && b.id !== id)
  )
    throw new Error(
      "Este ISBN já está no acervo. Adicione exemplares nos detalhes do livro.",
    );
  const values = {
    ...draft,
    title: draft.title.trim(),
    author: draft.author.trim(),
    isbn: normalizeIsbn(draft.isbn),
  };
  if (id) {
    const book = db.books.find((b) => b.id === id);
    if (!book) throw new Error("Livro não encontrado.");
    Object.assign(book, values);
    log(db, `Livro atualizado: ${book.title}.`);
    return id;
  }
  const book: Book = {
    ...values,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    review: "pending",
    reviewNotes: "",
  };
  db.books.push(book);
  addCopies(db, book.id, copies);
  log(db, `Livro cadastrado: ${book.title}.`);
  return book.id;
}
export function saveReader(
  db: Database,
  draft: Omit<Reader, "id">,
  id?: string,
) {
  if (!draft.name.trim()) throw new Error("Informe o nome do leitor.");
  if (id) {
    const reader = db.readers.find((r) => r.id === id);
    if (!reader) throw new Error("Leitor não encontrado.");
    Object.assign(reader, draft);
  } else db.readers.push({ ...draft, id: crypto.randomUUID() });
  log(db, `Leitor ${id ? "atualizado" : "cadastrado"}: ${draft.name}.`);
}
export function createLoan(
  db: Database,
  copyId: string,
  readerId: string,
  dueDate: string,
) {
  if (!availableCopies(db).some((c) => c.id === copyId))
    throw new Error("O exemplar não está disponível.");
  if (!db.readers.some((r) => r.id === readerId))
    throw new Error("Selecione um leitor cadastrado.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
    dueDate < today() ||
    !Number.isFinite(new Date(`${dueDate}T12:00:00`).getTime())
  )
    throw new Error("Escolha uma data de devolução válida, a partir de hoje.");
  db.loans.push({
    id: crypto.randomUUID(),
    copyId,
    readerId,
    dueDate,
    borrowedAt: new Date().toISOString(),
    returnedAt: null,
  });
  const copy = db.copies.find((c) => c.id === copyId)!;
  log(
    db,
    `Empréstimo registrado: ${db.books.find((b) => b.id === copy.bookId)?.title} (${copy.code}).`,
  );
}
export function returnLoan(db: Database, id: string) {
  const loan = db.loans.find((l) => l.id === id);
  if (!loan || loan.returnedAt)
    throw new Error("Este empréstimo já foi devolvido ou não existe.");
  loan.returnedAt = new Date().toISOString();
  log(
    db,
    `Devolução registrada: ${db.copies.find((c) => c.id === loan.copyId)?.code}.`,
  );
}
export function normalizeIsbn(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}
export function validIsbn(value: string) {
  const isbn = normalizeIsbn(value);
  if (/^(978|979)\d{10}$/.test(isbn))
    return (
      [...isbn].reduce((sum, n, i) => sum + Number(n) * (i % 2 ? 3 : 1), 0) %
        10 ===
      0
    );
  if (/^\d{9}[\dX]$/.test(isbn))
    return (
      [...isbn].reduce(
        (sum, n, i) => sum + (n === "X" ? 10 : Number(n)) * (10 - i),
        0,
      ) %
        11 ===
      0
    );
  return false;
}
export function exportBackup(db: Database) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `biblioteca-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
