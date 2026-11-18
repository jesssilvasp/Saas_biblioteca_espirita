import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "../hooks/useLibrary";
import { log } from "../services/library";
import { Button, Empty, Icon, cardClass, controlClass } from "./ui";
export function Analysis({ message }: { message: (s: string) => void }) {
  const { db, mutate } = useLibrary();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState("");
  const [notes, setNotes] = useState("");
  const filtered = db.books.filter(
    (b) =>
      filter === "all" ||
      (filter === "donations"
        ? b.donation
        : filter === "cde"
          ? !b.cde
          : b.review === "declined"),
  );
  function review(id: string, status: "accepted" | "declined") {
    if (!notes.trim()) {
      message("Registre o parecer e o nome do responsável antes de concluir.");
      setEditing(id);
      return;
    }
    try {
      mutate((d) => {
        const b = d.books.find((b) => b.id === id);
        if (!b) throw new Error("Obra não encontrada.");
        b.review = status;
        b.reviewNotes = notes;
        log(
          d,
          `Avaliação ${status === "accepted" ? "aprovada" : "crítica"}: ${b.title}.`,
        );
      });
      setEditing("");
      setNotes("");
      message("Avaliação salva neste navegador.");
    } catch (e) {
      message((e as Error).message);
    }
  }
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Aguardando", "pending", "warm"],
          ["Críticas", "declined", "red"],
          ["Aprovadas", "accepted", "emerald"],
        ].map(([label, status, color]) => (
          <div
            key={status}
            className={`bg-${color}-50 rounded-xl p-3 text-center`}
          >
            <p className={`text-xl font-bold text-${color}-700`}>
              {db.books.filter((b) => b.review === status).length}
            </p>
            <p className={`text-[10px] text-${color}-600`}>{label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["all", `Todas (${db.books.length})`],
          ["donations", "Doações"],
          ["cde", "Sem CDE"],
          ["critical", "Possíveis críticas"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${filter === value ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="record-grid space-y-2.5">
        {filtered.length ? (
          filtered.map((book) => (
            <article className={cardClass} key={book.id}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="book" className="text-orange-400 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {book.title}
                  </p>
                  <p className="text-xs text-gray-500">{book.author}</p>
                  <div className="mt-1.5">
                    <span className="text-[10px] bg-warm-50 text-warm-700 px-2 py-0.5 rounded-full font-medium">
                      {book.donation ? "Doação" : "Acervo"}
                    </span>
                  </div>
                  <div className="mt-2 bg-blue-50 rounded-lg p-2">
                    <p className="text-[10px] text-blue-700">
                      <Icon name="info-circle" />{" "}
                      {book.reviewNotes ||
                        "Aguardando avaliação humana. Sugestão por IA ainda não integrada."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 bg-emerald-100 text-emerald-700 text-[11px] font-medium py-2 rounded-lg"
                  onClick={() => {
                    setEditing(book.id);
                    setNotes(book.reviewNotes);
                  }}
                >
                  Aprovar
                </button>
                <button
                  className="flex-1 bg-spirit-100 text-spirit-700 text-[11px] font-medium py-2 rounded-lg"
                  onClick={() => navigate(`/livros/novo?editar=${book.id}`)}
                >
                  Classificar
                </button>
                <button
                  className="flex-1 bg-red-100 text-red-700 text-[11px] font-medium py-2 rounded-lg"
                  onClick={() => {
                    setEditing(book.id);
                    setNotes(book.reviewNotes);
                  }}
                >
                  Crítica
                </button>
              </div>
              {editing === book.id && (
                <div className="mt-3 space-y-2">
                  <label
                    className="text-xs text-gray-500"
                    htmlFor="review-notes"
                  >
                    Parecer e responsável
                  </label>
                  <textarea
                    id="review-notes"
                    className={controlClass}
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button onClick={() => review(book.id, "accepted")}>
                    Confirmar aprovação
                  </Button>
                  <Button
                    tone="gray"
                    onClick={() => review(book.id, "declined")}
                  >
                    Registrar crítica
                  </Button>
                </div>
              )}
            </article>
          ))
        ) : (
          <Empty to="/livros/novo" label="Cadastrar Livro">
            Nenhuma obra nesta lista.
          </Empty>
        )}
      </div>
    </>
  );
}
