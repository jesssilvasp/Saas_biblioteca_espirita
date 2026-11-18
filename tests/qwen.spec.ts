import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  freshDatabase,
  saveBook,
  saveReader,
  createLoan,
  returnLoan,
  availableCopies,
  validIsbn,
  dueIn,
  overdueLoans,
} from "../src/services/library";
import { emptyBook } from "../src/types/library";

test("regras e compatibilidade do acervo local", () => {
  expect(validIsbn("9780140328721")).toBe(true);
  expect(validIsbn("9780140328722")).toBe(false);
  const db = freshDatabase();
  saveBook(db, { ...emptyBook, title: "Teste", author: "Autor" }, 1);
  saveReader(db, { name: "Leitor", email: "", phone: "", notes: "" });
  createLoan(db, db.copies[0].id, db.readers[0].id, dueIn(14));
  expect(availableCopies(db)).toHaveLength(0);
  expect(() =>
    createLoan(db, db.copies[0].id, db.readers[0].id, dueIn(14)),
  ).toThrow();
  db.loans[0].dueDate = "2000-01-01";
  expect(overdueLoans(db)).toHaveLength(1);
  returnLoan(db, db.loans[0].id);
  expect(availableCopies(db)).toHaveLength(1);
  expect(() => returnLoan(db, db.loans[0].id)).toThrow();
});

test("cadastro, edição, empréstimo, devolução e backup na interface Qwen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Continuar no modo local" }).click();
  await page
    .locator("#screen-dashboard")
    .getByRole("button", { name: "Cadastrar", exact: true })
    .click();
  await page.getByRole("button", { name: /Cadastro manual/ }).click();
  await page.getByLabel("Título", { exact: true }).fill("Obra de teste");
  await page
    .getByLabel("Autor / médium", { exact: true })
    .fill("Autor de teste");
  await page.getByLabel("Edição", { exact: true }).fill("2ª");
  await page.getByRole("button", { name: "Salvar Livro", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Obra de teste" }),
  ).toBeVisible();
  await page.locator('[data-action="edit-book"]').click();
  await page.getByLabel("Título", { exact: true }).fill("Obra revisada");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("heading", { name: "Obra revisada" }),
  ).toBeVisible();
  await page.goto("/#/leitores/novo");
  await page.getByRole("button", { name: /Cadastro manual/ }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Leitor de teste");
  await page.getByLabel("Endereço", { exact: true }).fill("Rua de teste, 123");
  await page.getByRole("button", { name: "Salvar Leitor" }).click();
  await expect(page.getByRole("alert")).toContainText("Leitor salvo");
  await page.goto("/#/emprestimo");
  await page.getByLabel("Livro / Exemplar").selectOption({ index: 1 });
  await page.getByRole("button", { name: /Leitor de teste/ }).click();
  await page.getByRole("button", { name: "Confirmar Empréstimo" }).click();
  await expect(page.locator('[data-slot="loans"] a')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-slot="loans"] a')).toHaveCount(1);
  await page.locator('[data-slot="loans"] a').click();
  await page.locator('[data-action="confirm-return"]').click();
  await expect(page.getByRole("alert")).toContainText("Devolução confirmada");
  await page.goto("/#/acervo");
  await expect(page.getByText("1 exemplares · 1 disponíveis")).toBeVisible();
  await page.goto("/#/sincronizacao");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup em JSON" }).click();
  expect((await download).suggestedFilename()).toContain("biblioteca-");
  expect(errors).toEqual([]);
});

test("19 IDs originais, navegação e sete larguras responsivas", async ({
  page,
}) => {
  const db = freshDatabase();
  const bookId = saveBook(
    db,
    {
      ...emptyBook,
      title: "O Evangelho Segundo o Espiritismo",
      author: "Allan Kardec",
      publisher: "IDE",
      edition: "1ª",
      year: "2015",
      cde: "100",
      location: "04",
      shelf: "B",
      category: "Evangelho",
    },
    3,
  );
  saveReader(db, { name: "Leitor de teste", email: "", phone: "", notes: "" });
  createLoan(db, db.copies[0].id, db.readers[0].id, dueIn(14));
  await page.addInitScript(
    (data) =>
      localStorage.setItem("biblioteca-espirita:v1", JSON.stringify(data)),
    db,
  );
  await page.route("https://openlibrary.org/**", (route) =>
    route.fulfill({ json: { docs: [] } }),
  );
  const routes = [
    "/login",
    "/",
    "/scanner",
    "/scanner/resultado?isbn=9780140328721",
    "/acervo",
    `/livros/${bookId}`,
    "/livros/novo",
    "/leitores/novo",
    "/digitalizar",
    "/ocr/resultado",
    "/emprestimo",
    "/devolucao",
    `/devolucao/resultado/${db.loans[0].id}`,
    "/analise",
    "/emprestimos",
    "/atrasados",
    "/sincronizacao",
    "/notificacoes",
    "/configuracoes",
  ];
  for (const width of [320, 390, 768, 901, 1024, 1366, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(`/#${route}`);
      await expect(page.locator(".qwen-screen")).toHaveCount(1);
      const overflow = await page.evaluate(() => ({
        body: document.documentElement.scrollWidth > innerWidth,
        screen:
          document.querySelector(".qwen-screen")!.scrollWidth >
          document.querySelector(".qwen-screen")!.clientWidth,
      }));
      expect(overflow, `${width}px ${route}`).toEqual({
        body: false,
        screen: false,
      });
    }
  }
  await page.goto("/#/");
  await expect(
    page.getByRole("navigation", { name: "Navegação do computador" }),
  ).toBeVisible();
  await expect(page.locator(".qwen-mobile-nav")).toBeHidden();
  await page.screenshot({ path: "artifacts/qwen-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/");
  await page.screenshot({
    path: "artifacts/qwen-dashboard-mobile.png",
    fullPage: true,
  });
  await page.goto("/#/login");
  await page.screenshot({
    path: "artifacts/qwen-login-mobile.png",
    fullPage: true,
  });
});

test("scanner indisponível, falha ISBN, ficha de leitor e revisão humana", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "BarcodeDetector", { value: undefined }),
  );
  await page.goto("/#/scanner");
  await page
    .getByRole("button", { name: "Ativar câmera", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("não está disponível");
  await page.route("https://openlibrary.org/**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.getByLabel("ISBN ou código do exemplar").fill("9780140328721");
  await page.getByRole("button", { name: "Consultar código" }).click();
  await expect(page.getByRole("alert")).toContainText("indisponível");
  await page.goto("/#/digitalizar");
  await expect(
    page.getByRole("button", { name: "Extrair texto com OCR" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Transcrever manualmente" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Leitora transcrita");
  await page.getByLabel("Telefone", { exact: true }).fill("11999999999");
  await page.getByLabel("Endereço", { exact: true }).fill("Rua da ficha");
  await page.getByRole("button", { name: "Confirmar e Salvar" }).click();
  await expect(page.getByRole("alert")).toContainText("Revise");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar e Salvar" }).click();
  await expect(
    page.getByRole("button", { name: "Leitora transcrita" }),
  ).toBeVisible();
});

test("armazenamento inválido preservado e templates sem scripts", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("biblioteca-espirita:v1", "dados danificados"),
  );
  await page.goto("/#/");
  await expect(page.getByRole("alert")).toContainText("preservados");
  expect(
    await page.evaluate(() => localStorage.getItem("biblioteca-espirita:v1")),
  ).toBe("dados danificados");
  const html = readFileSync("src/qwen/templates/screen-dashboard.html", "utf8");
  expect(html).not.toMatch(/onclick=|<script/);
  expect(html).toContain("Ações Rápidas");
  expect(html).toContain("Movimentações Recentes");
});
