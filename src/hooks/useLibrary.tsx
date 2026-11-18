import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Database } from "../types/library";
import {
  freshDatabase,
  readDatabase,
  STORAGE_KEY,
  writeDatabase,
} from "../services/library";

interface Store {
  db: Database;
  storageError: string;
  mutate: <T>(change: (db: Database) => T) => T;
}
const Context = createContext<Store | null>(null);
function load() {
  try {
    return { db: readDatabase(), storageError: "" };
  } catch {
    return {
      db: freshDatabase(),
      storageError:
        "Não foi possível ler os dados locais. Os registros existentes foram preservados. Verifique o armazenamento do navegador antes de continuar.",
    };
  }
}
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setState(load());
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  function mutate<T>(change: (db: Database) => T): T {
    if (state.storageError) throw new Error(state.storageError);
    try {
      const next = readDatabase();
      const result = change(next);
      writeDatabase(next);
      setState({ db: next, storageError: "" });
      return result;
    } catch (e) {
      if (e instanceof DOMException)
        throw new Error(
          "Não foi possível salvar neste navegador. Verifique espaço e permissões de armazenamento.",
        );
      throw e;
    }
  }
  return (
    <Context.Provider value={{ ...state, mutate }}>{children}</Context.Provider>
  );
}
export function useLibrary() {
  const store = useContext(Context);
  if (!store) throw new Error("LibraryProvider ausente");
  return store;
}
