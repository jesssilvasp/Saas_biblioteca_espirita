import type { FormEvent } from "react";
import { Button, Field, cardClass, controlClass, Icon } from "./ui";
export type Values = Record<string, string | boolean | undefined>;
export interface FormProps {
  values: Values;
  change: (key: string, value: string | boolean) => void;
  submit: () => void;
}
export function BookForm({ values, change, submit }: FormProps) {
  const field = (
    key: string,
    label: string,
    required = false,
    type = "text",
  ) => (
    <Field
      key={key}
      label={label}
      required={required}
      type={type}
      value={String(values[key] ?? "")}
      onChange={(v) => change(key, v)}
    />
  );
  return (
    <form
      className={`${cardClass} space-y-3 qwen-form-grid`}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        submit();
      }}
    >
      <h3 className="text-sm font-bold text-gray-800 form-wide">
        Cadastro manual
      </h3>
      {field("title", "Título", true)}
      {field("author", "Autor / médium", true)}
      {field("isbn", "ISBN")}
      {field("publisher", "Editora")}
      {field("edition", "Edição")}
      {field("year", "Ano")}
      {field("subtitle", "Subtítulo")}
      {field("cde", "Classificação CDE")}
      {field("location", "Estante / localização física")}
      {field("shelf", "Prateleira")}
      {field("category", "Categoria")}
      {!values.editing &&
        field("copies", "Quantidade de exemplares", true, "number")}
      <label className="flex items-center gap-2 text-xs text-gray-600 form-wide">
        <input
          type="checkbox"
          checked={Boolean(values.donation)}
          onChange={(e) => change("donation", e.target.checked)}
        />
        Recebido por doação
      </label>
      <div className="form-wide">
        <label
          htmlFor="book-description"
          className="text-[10px] text-gray-400 uppercase tracking-wide"
        >
          Descrição / observações
        </label>
        <textarea
          id="book-description"
          className={controlClass}
          rows={3}
          value={String(values.notes ?? "")}
          onChange={(e) => change("notes", e.target.value)}
        />
      </div>
      <div className="form-wide">
        <Button type="submit">
          <Icon name="check" />
          {values.editing ? "Salvar alterações" : "Salvar Livro"}
        </Button>
      </div>
    </form>
  );
}
export function ReaderForm({ values, change, submit }: FormProps) {
  return (
    <form
      className={`${cardClass} space-y-3 qwen-form-grid`}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h3 className="text-sm font-bold text-gray-800 form-wide">
        {values.readerEditing ? "Editar Leitor" : "Cadastro manual"}
      </h3>
      {[
        ["name", "Nome", "text"],
        ["phone", "Telefone", "tel"],
        ["email", "E-mail", "email"],
        ["address", "Endereço", "text"],
        ["birthDate", "Data de Nascimento", "date"],
      ].map(([key, label, type]) => (
        <Field
          key={key}
          label={label}
          required={key === "name"}
          type={type}
          value={String(values[key] ?? "")}
          onChange={(v) => change(key, v)}
        />
      ))}
      <Field
        label="Observações"
        value={String(values.readerNotes ?? "")}
        onChange={(v) => change("readerNotes", v)}
      />
      <div className="form-wide">
        <Button type="submit">
          <Icon name="check" />
          {values.readerEditing ? "Salvar alterações" : "Salvar Leitor"}
        </Button>
      </div>
    </form>
  );
}
