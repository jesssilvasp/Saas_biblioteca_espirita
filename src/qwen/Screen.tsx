import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { ReactNode } from "react";
import { useLibrary } from "../hooks/useLibrary";
import { useScanner } from "../hooks/useScanner";
import {
  addCopies,
  availableCopies,
  createLoan,
  dueIn,
  exportBackup,
  formatDate,
  normalizeIsbn,
  overdueLoans,
  returnLoan,
  saveBook,
  saveReader,
  today,
  validIsbn,
} from "../services/library";
import {
  lookupIsbn,
  ocrEndpoint,
  readReaderCard,
} from "../services/integrations";
import { emptyBook } from "../types/library";
import { adminExists, createAdmin, currentAdmin, login, logout } from "../services/auth";
import type { BookDraft } from "../types/library";
import { Template } from "./Template";
import { screens } from "./navigation";
import type { ScreenId } from "./navigation";
import { Analysis } from "./Analysis";
import { BookForm, ReaderForm } from "./Forms";
import type { Values } from "./Forms";
import {
  BookCard,
  Button,
  Empty,
  Field,
  Icon,
  LoanCard,
  Notice,
  cardClass,
  controlClass,
  loanInfo,
} from "./ui";

export function QwenScreen({ screen }: { screen: ScreenId }) {
  const { db, mutate, storageError } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [params] = useSearchParams();
  const editing = params.get("editar");
  const existing = db.books.find((b) => b.id === (editing || id));
  const [values, setValues] = useState<Values>(() => ({
    ...emptyBook,
    copies: "1",
    borrowedDate: today(),
    dueDate: dueIn(db.settings.loanDays),
    libraryName: db.settings.name,
    loanDays: String(db.settings.loanDays),
    ...existing,
    ...(location.state?.draft ?? {}),
    editing: editing ?? "",
    query: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    birthDate: "",
    ...(screen === "screen-ocr-result" ? (location.state?.reader ?? {}) : {}),
  }));
  const [message, setMessage] = useState("");
  const [manualBook, setManualBook] = useState(
    Boolean(editing || location.state?.draft),
  );
  const [manualReader, setManualReader] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(() => adminExists());
  const [adminName, setAdminName] = useState(() => currentAdmin());
  const [filter, setFilter] = useState("all");
  const [loanFilter, setLoanFilter] = useState("active");
  const [copyId, setCopyId] = useState(
    () => availableCopies(db, params.get("livro") || undefined)[0]?.id ?? "",
  );
  const [readerId, setReaderId] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [file, setFile] = useState<File | null>(location.state?.image ?? null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const active = db.loans.filter((l) => !l.returnedAt);
  const late = overdueLoans(db);
  const selectedLoan = db.loans.find(
    (l) => l.id === (id || params.get("emprestimo")),
  );
  const returned = loanInfo(db, selectedLoan);
  const query = String(values.query ?? "").toLocaleLowerCase("pt-BR");
  const duplicate = db.readers.find(
    (r) =>
      r.name.trim().toLocaleLowerCase("pt-BR") ===
      String(values.name ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR"),
  );
  function change(key: string, value: string | boolean) {
    setValues((v) => ({ ...v, [key]: value }));
    if (screen === "screen-ocr-result") setReviewed(false);
  }
  const safe = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  function codeRead(code: string) {
    const copy = db.copies.find(
      (c) => c.code.toLowerCase() === code.trim().toLowerCase(),
    );
    if (copy) {
      if (params.get("return") === "1") {
        const loan = active.find((l) => l.copyId === copy.id);
        if (loan) navigate(`/devolucao/resultado/${loan.id}`);
        else setMessage("Este exemplar não tem empréstimo em aberto.");
      } else navigate(`/livros/${copy.bookId}`);
      return;
    }
    if (!validIsbn(code)) {
      setMessage("ISBN inválido ou código de exemplar não encontrado.");
      return;
    }
    navigate(`/scanner/resultado?isbn=${normalizeIsbn(code)}`);
  }
  const scanner = useScanner(codeRead);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (screen !== "screen-scan-result") return;
    const isbn = params.get("isbn");
    if (!isbn) return;
    const request = new AbortController();
    let disposed = false;
    const timer = setTimeout(() => request.abort(), 15000);
    setBusy(true);
    lookupIsbn(isbn, request.signal)
      .then((book) => {
        if (disposed) return;
        setValues((v) => ({ ...v, ...(book ?? emptyBook), isbn }));
        setMessage(
          book
            ? "Dados consultados na Open Library. Revise a edição antes de salvar."
            : "ISBN não encontrado. Preencha os campos manualmente.",
        );
      })
      .catch((e) => {
        if (!disposed)
          setMessage(
            e.name === "AbortError"
              ? "Consulta interrompida ou tempo limite excedido."
              : e.message,
          );
      })
      .finally(() => {
        clearTimeout(timer);
        if (!disposed) setBusy(false);
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      request.abort();
    };
  }, [screen, params]);
  function bookDraft(): BookDraft {
    const keys = [
      "title",
      "author",
      "isbn",
      "publisher",
      "year",
      "cde",
      "location",
      "notes",
      "edition",
      "subtitle",
      "category",
      "shelf",
    ];
    return {
      ...emptyBook,
      ...Object.fromEntries(keys.map((k) => [k, String(values[k] ?? "")])),
      donation: Boolean(values.donation),
    };
  }
  function saveCurrentBook() {
    const bookId = mutate((d) =>
      saveBook(
        d,
        bookDraft(),
        Number(values.copies || 1),
        editing ?? undefined,
      ),
    );
    navigate(`/livros/${bookId}`);
  }
  function saveCurrentReader(ocr = false) {
    if (ocr && !reviewed)
      throw new Error(
        "Revise os dados e confirme a conferência antes de salvar.",
      );
    const draft = {
      name: String(values.name ?? ""),
      phone: String(values.phone ?? ""),
      email: String(values.email ?? ""),
      address: String(values.address ?? ""),
      birthDate: String(values.birthDate ?? ""),
      notes: String(values.readerNotes ?? ""),
    };
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
      throw new Error("Confira o e-mail do leitor.");
    mutate((d) =>
      saveReader(
        d,
        draft,
        values.readerEditing ? String(values.readerEditing) : undefined,
      ),
    );
    if (ocr) navigate("/leitores/novo");
    else {
      setMessage("Leitor salvo neste navegador.");
      setValues((v) => ({
        ...v,
        name: "",
        phone: "",
        email: "",
        address: "",
        birthDate: "",
        readerNotes: "",
        readerEditing: "",
      }));
    }
  }
  async function runOcr() {
    if (!file) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    const timer = setTimeout(() => request.abort(), 30000);
    try {
      const reader = await readReaderCard(file, request.signal);
      navigate("/ocr/resultado", {
        state: { reader, source: "ocr", image: file },
      });
    } catch (e) {
      setMessage(
        (e as Error).name === "AbortError"
          ? "Tempo limite de processamento excedido."
          : (e as Error).message,
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  async function authenticate() {
    if (!hasAdmin) {
      await createAdmin(String(values.username ?? ""), String(values.password ?? ""));
      setHasAdmin(true);
      setAdminName(String(values.username ?? "").trim());
      setMessage("Administrador criado neste navegador. Você já está conectado.");
      navigate("/");
      return;
    }
    const name = await login(String(values.username ?? ""), String(values.password ?? ""));
    setAdminName(name);
    setMessage("Login realizado.");
    navigate("/");
  }
  function action(name: string) {
    safe(() => {
      if (name.startsWith("go:")) {
        const route = screens[name.slice(3) as ScreenId];
        if (route) navigate(route.includes(":id") ? "/acervo" : route);
        return;
      }
      switch (name) {
        case "login":
          void authenticate().catch((e) => setMessage((e as Error).message));
          break;
        case "logout":
          logout();
          setAdminName("");
          navigate("/login");
          break;
        case "toggle-password":
          setPasswordVisible(!passwordVisible);
          break;
        case "forgot-password":
          setMessage(
            hasAdmin ? "A recuperação de senha ainda depende do backend. Neste modo local, crie outra conta após limpar os dados deste navegador." : "Ainda não existe uma conta. Preencha seu nome e uma senha para criar o administrador.",
          );
          break;
        case "manual-book":
          setManualBook(true);
          break;
        case "manual-reader":
          setManualReader(true);
          break;
        case "camera":
          scanner.active ? scanner.stop() : void scanner.start();
          break;
        case "manual-code":
          document.getElementById("manual-code")?.focus();
          break;
        case "save-scanned-book":
          if (busy) throw new Error("Aguarde a consulta terminar.");
          saveCurrentBook();
          break;
        case "edit-scanned-book":
          navigate("/livros/novo", { state: { draft: bookDraft() } });
          break;
        case "edit-book":
          navigate(`/livros/novo?editar=${id}`);
          break;
        case "lend-book":
          navigate(`/emprestimo?livro=${id}`);
          break;
        case "capture-card":
          fileInput.current?.click();
          break;
        case "save-ocr-reader":
          saveCurrentReader(true);
          break;
        case "save-loan":
          mutate((d) => {
            createLoan(d, copyId, readerId, String(values.dueDate));
            d.loans[d.loans.length - 1].notes = String(values.loanNotes ?? "");
          });
          navigate("/emprestimos");
          break;
        case "return-scan":
          navigate("/scanner?return=1");
          break;
        case "return-search":
          document.getElementById("return-code")?.focus();
          break;
        case "confirm-return":
          if (!selectedLoan) throw new Error("Selecione um empréstimo.");
          mutate((d) => returnLoan(d, selectedLoan.id));
          setMessage(
            "Devolução confirmada! Exemplar disponível no acervo local.",
          );
          break;
        case "filter":
          setFilter(filter === "all" ? "available" : "all");
          break;
        case "history":
          navigate("/emprestimos?historico=1");
          break;
        case "book-history":
          navigate(`/emprestimos?historico=1&livro=${id}`);
          break;
        case "sync":
          setMessage(
            "Sincronização remota ainda não conectada. Exporte um backup dos dados locais.",
          );
          break;
        case "integration":
          navigate("/sincronizacao");
          break;
        case "permissions":
          setMessage(
            "Usuários, perfis e permissões dependem de autenticação e backend. Não estão ativos no modo local.",
          );
          break;
        case "privacy":
          setMessage(
            "Dados armazenados somente neste navegador, sem controle de acesso remoto. Retenção e auditoria protegida dependem do backend.",
          );
          break;
        case "about":
          setMessage(
            "Biblioteca Espírita — interface baseada no Qwen, com operação local e versão web responsiva.",
          );
          break;
        default:
          setMessage("Esta integração ainda não está disponível.");
      }
    });
  }
  const notifications = [
    ...late.map((l) => ({
      id: `late-${l.id}`,
      text: `Devolução atrasada — ${loanInfo(db, l).book?.title}`,
      at: l.dueDate,
      to: `/devolucao/resultado/${l.id}`,
    })),
    ...db.events
      .slice(0, 30)
      .map((e) => ({ ...e, to: "/emprestimos?historico=1" })),
  ];
  const bindings: Record<string, ReactNode> = {
    "book-count": db.books.length.toLocaleString("pt-BR"),
    "active-count": active.length,
    "late-count": late.length,
    "notification-count": notifications.filter(
      (n) => !db.readNotifications.includes(n.id),
    ).length,
    "local-events": db.events.length,
    "late-alert": `${late.length} devoluções atrasadas`,
    "late-description": late.length
      ? "Confira os empréstimos pendentes"
      : "Nenhum atraso registrado",
    "pending-alert": `${db.books.filter((b) => b.review === "pending").length} obras aguardando análise`,
    isbn: params.get("isbn") || String(values.isbn || "Não informado"),
    "book-title": existing?.title,
    "book-author": existing?.author,
    "book-publisher": `${existing?.publisher || "Editora não informada"} • ${existing?.edition || "Edição não informada"} • ${existing?.year || "—"}`,
    "book-cde": `CDE ${existing?.cde || "—"}`,
    "book-category": existing?.category || "A classificar",
    "book-location": existing?.location || "—",
    "book-shelf": existing?.shelf || "—",
    "copy-count": `${db.copies.filter((c) => c.bookId === id).length} total`,
    "return-title": returned.book?.title,
    "return-author": returned.book?.author,
    "return-code": `Tombo ${returned.copy?.code || "—"}`,
    "return-reader": returned.reader?.name,
    "return-start": selectedLoan ? formatDate(selectedLoan.borrowedAt) : "—",
    "return-due": selectedLoan ? formatDate(selectedLoan.dueDate) : "—",
    "return-status": selectedLoan?.returnedAt
      ? "Devolvido"
      : selectedLoan && selectedLoan.dueDate < today()
        ? "Em atraso"
        : "No prazo",
    "auth-submit": hasAdmin ? "Entrar" : "Criar administrador",
    "ocr-source":
      location.state?.source === "ocr"
        ? "Dados Extraídos via OCR"
        : "Dados da Ficha — Revisão Manual",
  };
  const history = (
    <div className="space-y-2">
      {db.events.length ? (
        db.events.slice(0, 20).map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="history" className="text-blue-600 text-xs" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-800">{e.text}</p>
              <p className="text-[10px] text-gray-400">{formatDate(e.at)}</p>
            </div>
          </div>
        ))
      ) : (
        <Empty>Nenhuma movimentação registrada.</Empty>
      )}
    </div>
  );
  const filterButton = (key: string, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${filter === key ? "bg-spirit-100 text-spirit-700" : "bg-gray-100 text-gray-600"}`}
    >
      {label}
    </button>
  );
  const filteredBooks = db.books.filter(
    (b) =>
      `${b.title} ${b.author} ${b.isbn} ${b.cde} ${db.copies
        .filter((c) => c.bookId === b.id)
        .map((c) => c.code)
        .join(" ")}`
        .toLowerCase()
        .includes(query) &&
      (filter === "all" ||
        (filter === "pending"
          ? b.review === "pending"
          : filter === "available"
            ? availableCopies(db, b.id).length > 0
            : db.copies.some(
                (c) =>
                  c.bookId === b.id && active.some((l) => l.copyId === c.id),
              ))),
  );
  const effectiveLoanFilter = params.has("historico") ? "all" : loanFilter;
  const loans = db.loans.filter(
    (l) =>
      (effectiveLoanFilter === "all" ||
        (effectiveLoanFilter === "late"
          ? late.some((a) => a.id === l.id)
          : !l.returnedAt)) &&
      (!params.get("livro") ||
        db.copies.find((c) => c.id === l.copyId)?.bookId ===
          params.get("livro")),
  );
  const filePicker = (
    <input
      ref={fileInput}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      capture="environment"
      hidden
      aria-label="Selecionar imagem da ficha"
      onChange={(e) => {
        const next = e.target.files?.[0];
        if (!next) return;
        if (
          next.size > 8 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(next.type)
        ) {
          setMessage("Selecione JPG, PNG ou WebP com até 8 MB.");
          e.target.value = "";
          return;
        }
        setFile(next);
      }}
    />
  );
  const slots: Record<string, ReactNode> = {
    "dashboard-loans": active.length ? (
      <div className="record-grid space-y-2.5">
        {active
          .slice(-3)
          .reverse()
          .map((l) => (
            <LoanCard key={l.id} db={db} loan={l} compact />
          ))}
      </div>
    ) : (
      <Empty to="/emprestimo" label="Registrar Empréstimo">
        Nenhum empréstimo ativo.
      </Empty>
    ),
    history,
    "new-books": db.books.length ? (
      db.books
        .slice(-5)
        .reverse()
        .map((b) => (
          <Link
            to={`/livros/${b.id}`}
            key={b.id}
            className="flex-shrink-0 w-32 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm"
          >
            <div className="w-full h-20 bg-gradient-to-br from-spirit-100 to-spirit-200 rounded-xl flex items-center justify-center mb-2">
              <Icon name="book" className="text-spirit-400 text-xl" />
            </div>
            <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">
              {b.title}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {formatDate(b.createdAt)}
            </p>
          </Link>
        ))
    ) : (
      <Empty to="/livros/novo" label="Cadastrar Livro">
        Nenhum livro cadastrado.
      </Empty>
    ),
    camera: (
      <>
        <video
          ref={scanner.video}
          autoPlay
          playsInline
          muted
          className="camera-video"
          aria-label="Imagem da câmera"
        />
        <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
        <div className="scanner-corners" />
        {scanner.active && <div className="scanner-line" />}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/70 text-xs">
            Posicione o código de barras dentro da área
          </p>
        </div>
      </>
    ),
    "manual-code": (
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          scanner.stop();
          codeRead(String(values.code ?? ""));
        }}
      >
        <label htmlFor="manual-code" className="text-xs text-gray-500">
          ISBN ou código do exemplar
        </label>
        <input
          id="manual-code"
          required
          value={String(values.code ?? "")}
          onChange={(e) => change("code", e.target.value)}
          className={controlClass}
        />
        <Button type="submit">Consultar código</Button>
        {scanner.active && (
          <Button tone="gray" onClick={scanner.stop}>
            Parar câmera
          </Button>
        )}
      </form>
    ),
    "catalog-filters": (
      <>
        {filterButton("all", `Todos (${db.books.length})`)}
        {filterButton("available", "Disponíveis")}
        {filterButton("borrowed", "Emprestados")}
        {filterButton("pending", "Em análise")}
      </>
    ),
    catalog: filteredBooks.length ? (
      filteredBooks.map((b) => <BookCard key={b.id} book={b} db={db} />)
    ) : (
      <Empty to="/livros/novo" label="Cadastrar Livro">
        Nenhuma obra encontrada.
      </Empty>
    ),
    copies: (
      <>
        {db.copies
          .filter((c) => c.bookId === id)
          .map((c) => {
            const loan = active.find((l) => l.copyId === c.id);
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-2.5 ${loan ? "bg-blue-50" : "bg-emerald-50"} rounded-xl`}
              >
                <span
                  className={`status-dot ${loan ? "bg-blue-500" : "bg-emerald-500"}`}
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800">
                    Tombo {c.code}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {loan
                      ? `Emprestado a ${db.readers.find((r) => r.id === loan.readerId)?.name}`
                      : `${existing?.location || "Localização não definida"} / ${existing?.shelf || "—"}`}
                  </p>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {loan ? "Emprestado" : "Disponível"}
                </span>
              </div>
            );
          })}
        <button
          className="text-xs text-spirit-600 mt-3"
          onClick={() => safe(() => mutate((d) => addCopies(d, id!, 1)))}
        >
          <Icon name="plus" /> Adicionar exemplar
        </button>
      </>
    ),
    "book-form": manualBook ? (
      <BookForm
        values={values}
        change={change}
        submit={() => safe(saveCurrentBook)}
      />
    ) : null,
    "reader-form": manualReader ? (
      <ReaderForm
        values={values}
        change={change}
        submit={() => safe(() => saveCurrentReader())}
      />
    ) : null,
    readers: db.readers.length ? (
      <div className={cardClass}>
        <h3 className="text-sm font-bold text-gray-800 mb-3">
          Leitores cadastrados
        </h3>
        {db.readers.map((r) => (
          <button
            key={r.id}
            className="w-full text-left text-sm text-gray-700 py-3 border-b border-gray-100 flex items-center justify-between"
            onClick={() => {
              setValues((v) => ({
                ...v,
                ...r,
                readerNotes: r.notes,
                readerEditing: r.id,
              }));
              setManualReader(true);
            }}
          >
            {r.name}
            <Icon name="edit" className="text-spirit-500" />
          </button>
        ))}
      </div>
    ) : null,
    "card-image": (
      <>
        {filePicker}
        {preview ? (
          <img src={preview} alt="Ficha selecionada" className="q-card-image" />
        ) : (
          <>
            <div className="absolute inset-6 border-2 border-dashed border-white/30 rounded-2xl" />
            <div className="text-center z-10">
              <Icon name="id-card" className="text-white/40 text-5xl mb-3" />
              <p className="text-white/60 text-sm">
                Posicione a ficha dentro da área
              </p>
            </div>
          </>
        )}
      </>
    ),
    "ocr-actions": (
      <div className="space-y-3">
        <Notice>
          {ocrEndpoint
            ? "Revise os dados após a extração."
            : "OCR ainda não conectado. A transcrição manual está disponível."}
        </Notice>
        {preview && <p className="text-xs text-gray-500">{file?.name}</p>}
        <Button
          disabled={!file || !ocrEndpoint || busy}
          onClick={() => void runOcr()}
        >
          {busy ? "Processando…" : "Extrair texto com OCR"}
        </Button>
        <Button
          tone="gray"
          onClick={() =>
            navigate("/ocr/resultado", {
              state: { source: "manual", image: file },
            })
          }
        >
          Transcrever manualmente
        </Button>
      </div>
    ),
    "duplicate-reader": duplicate ? (
      <>
        <p className="text-sm font-semibold text-warm-800">
          Possível cadastro encontrado
        </p>
        <p className="text-xs text-warm-700 mt-1">
          Já existe um leitor com nome similar:{" "}
          <strong>{duplicate.name}</strong>
        </p>
        <div className="flex gap-2 mt-3">
          <button
            className="text-[11px] bg-warm-200 text-warm-800 px-3 py-1.5 rounded-lg"
            onClick={() => {
              setValues((v) => ({
                ...v,
                ...duplicate,
                readerEditing: duplicate.id,
              }));
              setReviewed(false);
            }}
          >
            Usar existente
          </button>
          <button
            className="text-[11px] bg-white text-warm-700 px-3 py-1.5 rounded-lg"
            onClick={() =>
              setMessage(
                `Cadastro existente: ${duplicate.name}; ${duplicate.phone || "sem telefone"}; ${duplicate.email || "sem e-mail"}.`,
              )
            }
          >
            Comparar
          </button>
          <button
            className="text-[11px] bg-white text-warm-700 px-3 py-1.5 rounded-lg"
            onClick={() => {
              change("readerEditing", "");
              setMessage("Será criado um novo registro após sua revisão.");
            }}
          >
            Criar novo
          </button>
        </div>
      </>
    ) : (
      <p className="text-xs text-warm-700">
        Confira a ficha e revise os dados antes de salvar. Nenhum cadastro
        duplicado encontrado para este nome.
      </p>
    ),
    "review-check": (
      <>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          Revisei e confirmo os dados da ficha.
        </label>
        {preview && (
          <img
            className="q-review-image mt-4"
            src={preview}
            alt="Ficha original para conferência"
          />
        )}
      </>
    ),
    "loan-book": (
      <>
        <label
          htmlFor="loan-copy"
          className="text-xs text-gray-500 font-medium mb-2 block"
        >
          Livro / Exemplar
        </label>
        <div className="flex items-center gap-3 p-3 bg-spirit-50 rounded-xl border border-spirit-100">
          <div className="w-10 h-14 bg-spirit-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="book" className="text-spirit-400" />
          </div>
          <select
            id="loan-copy"
            value={copyId}
            onChange={(e) => setCopyId(e.target.value)}
            className={`${controlClass} flex-1 min-w-0`}
          >
            <option value="">Selecione um exemplar</option>
            {availableCopies(db).map((c) => (
              <option value={c.id} key={c.id}>
                {db.books.find((b) => b.id === c.bookId)?.title} — {c.code}
              </option>
            ))}
          </select>
          <Link
            to="/scanner"
            aria-label="Escanear livro"
            className="w-9 h-9 bg-spirit-100 rounded-lg flex items-center justify-center"
          >
            <Icon name="camera" className="text-spirit-600 text-sm" />
          </Link>
        </div>
        {!availableCopies(db).length && (
          <Link
            className="text-xs text-spirit-600 block mt-3"
            to="/livros/novo"
          >
            Cadastrar Livro
          </Link>
        )}
      </>
    ),
    "loan-reader": (
      <>
        <label
          htmlFor="reader-query"
          className="text-xs text-gray-500 font-medium mb-2 block"
        >
          Leitor
        </label>
        <div className="relative mb-3">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          />
          <input
            id="reader-query"
            type="text"
            placeholder="Buscar leitor por nome..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm"
            value={String(values.readerQuery ?? "")}
            onChange={(e) => change("readerQuery", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          {db.readers
            .filter((r) =>
              r.name
                .toLowerCase()
                .includes(String(values.readerQuery ?? "").toLowerCase()),
            )
            .map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setReaderId(r.id)}
                className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl ${readerId === r.id ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"}`}
              >
                <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {r.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1">
                  <span className="text-sm text-gray-700 block">{r.name}</span>
                  <span className="text-[10px] text-gray-400">
                    {active.filter((l) => l.readerId === r.id).length}{" "}
                    empréstimos ativos
                  </span>
                </span>
                {readerId === r.id && (
                  <Icon name="check-circle" className="text-emerald-500" />
                )}
              </button>
            ))}
        </div>
        {!db.readers.length && (
          <Link to="/leitores/novo" className="text-xs text-spirit-600">
            Cadastrar Leitor
          </Link>
        )}
      </>
    ),
    "return-search": (
      <input
        id="return-code"
        aria-label="Buscar devolução por leitor, título ou tombo"
        placeholder="Leitor, título ou tombo"
        className={controlClass}
        value={String(values.query ?? "")}
        onChange={(e) => change("query", e.target.value)}
      />
    ),
    "pending-returns": active
      .filter((l) => {
        const info = loanInfo(db, l);
        return `${info.reader?.name} ${info.book?.title} ${info.copy?.code}`
          .toLowerCase()
          .includes(query);
      })
      .map((l) => <LoanCard key={l.id} loan={l} db={db} compact />),
    analysis: <Analysis message={setMessage} />,
    "loan-filters": (
      <div className="flex gap-2">
        {[
          ["active", `Ativos (${active.length})`],
          ["late", `Atrasados (${late.length})`],
          ["all", "Histórico"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`flex-1 text-xs font-medium py-2 rounded-xl ${effectiveLoanFilter === value ? "bg-spirit-100 text-spirit-700" : "bg-gray-100 text-gray-600"}`}
            onClick={() => {
              setLoanFilter(value);
              if (params.has("historico"))
                navigate("/emprestimos", { replace: true });
            }}
          >
            {label}
          </button>
        ))}
      </div>
    ),
    loans: loans.length ? (
      <div className="record-grid space-y-2">
        {loans
          .slice()
          .reverse()
          .map((l) => (
            <LoanCard loan={l} db={db} key={l.id} />
          ))}
      </div>
    ) : (
      <Empty to="/emprestimo" label="Registrar Empréstimo">
        Nenhum empréstimo nesta lista.
      </Empty>
    ),
    overdue: late.length ? (
      <div className="record-grid space-y-3">
        {late.map((l) => (
          <LoanCard loan={l} db={db} key={l.id} />
        ))}
      </div>
    ) : (
      <Empty>Nenhuma devolução atrasada.</Empty>
    ),
    "sync-records": (
      <>
        <Notice>
          Não há conexão com banco remoto. Os registros abaixo existem somente
          neste navegador.
        </Notice>
        {history}
      </>
    ),
    backup: (
      <div className="space-y-3">
        <Button onClick={() => exportBackup(db)}>
          <Icon name="download" />
          Exportar backup em JSON
        </Button>
        <p className="text-xs text-gray-500">
          Limpar os dados do navegador remove os registros locais. Guarde o
          backup em local reservado. Restauração por arquivo ainda pendente.
        </p>
      </div>
    ),
    notifications: notifications.length ? (
      <>
        <button
          className="text-xs text-spirit-600 mb-3"
          onClick={() =>
            safe(() =>
              mutate((d) => {
                d.readNotifications = [
                  ...new Set([
                    ...d.readNotifications,
                    ...notifications.map((n) => n.id),
                  ]),
                ];
              }),
            )
          }
        >
          Marcar todas como lidas
        </button>
        {notifications.map((n) => (
          <Link
            to={n.to}
            key={n.id}
            className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="info-circle" className="text-blue-500 text-xs" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {n.id.startsWith("late-")
                  ? "Devolução atrasada"
                  : "Movimentação da biblioteca"}
              </p>
              <p className="text-[11px] text-gray-600">{n.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {formatDate(n.at)} ·{" "}
                {db.readNotifications.includes(n.id) ? "Lida" : "Não lida"}
              </p>
            </div>
          </Link>
        ))}
      </>
    ) : (
      <Empty>Nenhuma notificação local.</Empty>
    ),
    settings: (
      <form
        className={`${cardClass} space-y-3`}
        onSubmit={(e) => {
          e.preventDefault();
          safe(() => {
            mutate((d) => {
              const days = Number(values.loanDays);
              if (
                !Number.isInteger(days) ||
                days < 1 ||
                days > 90 ||
                !String(values.libraryName).trim()
              )
                throw new Error(
                  "Informe um nome e um prazo entre 1 e 90 dias.",
                );
              d.settings = {
                name: String(values.libraryName).trim(),
                loanDays: days,
              };
            });
            setMessage("Preferências salvas.");
          });
        }}
      >
        <h3 className="text-sm font-bold text-gray-800">
          Preferências da biblioteca
        </h3>
        <Field
          label="Nome da biblioteca"
          required
          value={String(values.libraryName)}
          onChange={(v) => change("libraryName", v)}
        />
        <Field
          label="Prazo padrão (dias)"
          required
          type="number"
          value={String(values.loanDays)}
          onChange={(v) => change("loanDays", v)}
        />
        <Button type="submit">Salvar preferências</Button>
      </form>
    ),
  };
  if (screen === "screen-livro-detalhe" && !existing)
    return (
      <div className="p-5">
        <Empty to="/acervo" label="Ver Acervo">
          Livro não encontrado neste navegador.
        </Empty>
      </div>
    );
  if (screen === "screen-devolucao-result" && !selectedLoan)
    return (
      <div className="p-5">
        <Empty to="/devolucao" label="Registrar Devolução">
          Selecione um empréstimo para conferir a devolução.
        </Empty>
      </div>
    );
  return (
    <>
      {(message || storageError || scanner.error) && (
        <div className="qwen-message" role="alert">
          <Icon name="info-circle" />
          <span>{storageError || scanner.error || message}</span>
          <button aria-label="Fechar aviso" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      {busy && (
        <div role="status" className="qwen-busy">
          Consultando serviço…
        </div>
      )}
      <Template
        screen={screen}
        values={values}
        bindings={bindings}
        slots={slots}
        action={action}
        change={change}
        passwordVisible={passwordVisible}
      />
      {screen === "screen-login" && (
        <div className="local-access">
          <p>{hasAdmin ? `Administrador local: ${adminName || "conta criada neste navegador"}` : "Primeiro acesso: crie o administrador local"}</p>
          <small>{hasAdmin ? "Use seu nome e senha acima para entrar." : "A senha é protegida neste navegador e não é enviada para a internet."}</small>
          <Link to="/">Continuar no modo local</Link>
          <small>Modo local · para acesso compartilhado ainda será necessário conectar um backend.</small>
        </div>
      )}
      {screen === "screen-devolucao-result" && selectedLoan?.returnedAt && (
        <div className="p-5">
          <Notice>
            Devolução registrada em {formatDate(selectedLoan.returnedAt)}. O
            exemplar está disponível.
          </Notice>
        </div>
      )}
    </>
  );
}
