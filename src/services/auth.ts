const ADMIN_KEY = "biblioteca-espirita:admin:v1";
const SESSION_KEY = "biblioteca-espirita:session:v1";
const ITERATIONS = 120_000;

type AdminRecord = { username: string; salt: string; hash: string; iterations: number };

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, material, 256);
  return new Uint8Array(bits);
}

export function adminExists() {
  return Boolean(localStorage.getItem(ADMIN_KEY));
}

export function currentAdmin() {
  return localStorage.getItem(SESSION_KEY) || "";
}

export async function createAdmin(username: string, password: string) {
  const name = username.trim();
  if (name.length < 2) throw new Error("Informe seu nome ou usuário.");
  if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
  if (adminExists()) throw new Error("Já existe um administrador neste navegador.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  const record: AdminRecord = { username: name, salt: bytesToBase64(salt), hash: bytesToBase64(hash), iterations: ITERATIONS };
  localStorage.setItem(ADMIN_KEY, JSON.stringify(record));
  localStorage.setItem(SESSION_KEY, name);
}

export async function login(username: string, password: string) {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) throw new Error("Nenhum administrador criado neste navegador.");
  const record = JSON.parse(raw) as AdminRecord;
  const hash = await derive(password, base64ToBytes(record.salt), record.iterations);
  if (record.username.toLocaleLowerCase() !== username.trim().toLocaleLowerCase() || bytesToBase64(hash) !== record.hash) {
    throw new Error("Usuário ou senha inválidos.");
  }
  localStorage.setItem(SESSION_KEY, record.username);
  return record.username;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function clearAdminForLocalSetup() {
  localStorage.removeItem(ADMIN_KEY);
  logout();
}
