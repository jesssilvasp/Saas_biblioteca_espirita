import { useId } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Book, Database, Loan } from "../types/library";
import { availableCopies, formatDate, today } from "../services/library";

export const controlClass =
  "w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 mt-1";
export const cardClass =
  "bg-white border border-gray-100 rounded-2xl p-4 shadow-sm";
export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return <i aria-hidden="true" className={`fas fa-${name} ${className}`} />;
}
export function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  tone = "blue",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  tone?: "blue" | "gray" | "teal";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${tone === "gray" ? "bg-gray-100 text-gray-700" : tone === "teal" ? "bg-teal-600 text-white" : "bg-spirit-600 text-white"}`}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  children,
}: {
  label: string;
  value?: string | number;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] text-gray-400 uppercase tracking-wide"
      >
        {label}
        {required ? " *" : ""}
      </label>
      {children ?? (
        <input
          id={id}
          aria-label={label}
          className={controlClass}
          type={type}
          required={required}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          min={type === "number" ? 1 : undefined}
          max={type === "number" ? 100 : undefined}
          maxLength={2000}
        />
      )}
    </div>
  );
}
export function Empty({
  children,
  to,
  label,
}: {
  children: ReactNode;
  to?: string;
  label?: string;
}) {
  return (
    <div className="q-empty bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
      <Icon name="book-open" className="text-spirit-300 text-2xl mb-3" />
      <p className="text-sm text-gray-500">{children}</p>
      {to && (
        <Link
          className="text-spirit-600 text-sm font-medium block mt-3"
          to={to}
        >
          {label}
        </Link>
      )}
    </div>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700">
      <Icon name="info-circle" />
      {children}
    </div>
  );
}
export function BookCard({ book, db }: { book: Book; db: Database }) {
  const count = db.copies.filter((c) => c.bookId === book.id).length;
  const available = availableCopies(db, book.id).length;
  return (
    <Link to={`/livros/${book.id}`} className={`card-hover block ${cardClass}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-16 bg-gradient-to-br from-spirit-100 to-spirit-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="book" className="text-spirit-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {book.title}
          </p>
          <p className="text-xs text-gray-500">
            {book.author} • {book.publisher || "Editora não informada"}{" "}
            {book.year && `• ${book.year}`}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] bg-spirit-50 text-spirit-700 px-2 py-0.5 rounded-full font-medium">
              CDE {book.cde || "—"}
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {count} exemplares · {available} disponíveis
            </span>
          </div>
        </div>
        <Icon name="chevron-right" className="text-gray-300" />
      </div>
    </Link>
  );
}
export function loanInfo(db: Database, loan?: Loan) {
  const copy = db.copies.find((c) => c.id === loan?.copyId);
  return {
    copy,
    book: db.books.find((b) => b.id === copy?.bookId),
    reader: db.readers.find((r) => r.id === loan?.readerId),
  };
}
export function LoanCard({
  loan,
  db,
  compact = false,
}: {
  loan: Loan;
  db: Database;
  compact?: boolean;
}) {
  const { copy, book, reader } = loanInfo(db, loan);
  const late = !loan.returnedAt && loan.dueDate < today();
  return (
    <Link
      to={`/devolucao/resultado/${loan.id}`}
      className={`card-hover block ${cardClass} ${late ? "bg-red-50/30 border-red-100" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${late ? "bg-red-100" : "bg-spirit-100"} rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-xs font-bold text-spirit-700">
            {compact ? (
              <Icon name="book" />
            ) : (
              reader?.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
            )}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {compact ? book?.title : reader?.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {compact ? `${book?.author} — Tombo ${copy?.code}` : book?.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400">
              {compact
                ? `Leitor: ${reader?.name}`
                : `Retirada: ${formatDate(loan.borrowedAt)}`}
            </span>
            <span
              className={`text-[10px] font-medium ${late ? "text-red-600" : "text-emerald-600"}`}
            >
              {loan.returnedAt
                ? "Devolvido"
                : `${late ? "Atrasado desde" : "Devolver até"} ${formatDate(loan.dueDate)}`}
            </span>
          </div>
        </div>
        {!compact && (
          <span className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <Icon name="undo" className="text-teal-600 text-sm" />
          </span>
        )}
      </div>
    </Link>
  );
}
