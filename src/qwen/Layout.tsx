import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navigation, screens } from "./navigation";
import { Icon } from "./ui";
export function QwenLayout() {
  const location = useLocation();
  const content = useRef<HTMLElement>(null);
  const login = location.pathname === "/login";
  useEffect(() => {
    content.current?.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return (
    <div className={`qwen-workspace ${login ? "is-login" : ""}`}>
      {!login && (
        <aside className="qwen-sidebar">
          <NavLink to="/" className="sidebar-brand">
            <span>
              <Icon name="book-open" />
            </span>
            <div>
              Biblioteca Espírita<small>Sistema de Gestão do Acervo</small>
            </div>
          </NavLink>
          <nav aria-label="Navegação do computador">
            {navigation.map(([id, label, icon]) => (
              <NavLink end key={id} to={screens[id]}>
                <Icon name={icon} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <p className="sidebar-local">
            <Icon name="desktop" /> Modo local · neste navegador
          </p>
        </aside>
      )}
      <main ref={content} className="qwen-content">
        <Outlet />
        {!login && (
          <footer className="qwen-local-note">
            Modo local · Dados salvos somente neste navegador
          </footer>
        )}
      </main>
      {!login && (
        <nav className="qwen-mobile-nav" aria-label="Navegação principal">
          {(
            [
              ["/", "Início", "home"],
              ["/acervo", "Acervo", "book"],
              ["/scanner", "Escanear", "camera"],
              ["/emprestimos", "Emprést.", "exchange-alt"],
              ["/configuracoes", "Config.", "cog"],
            ] as const
          ).map(([path, label, icon]) => (
            <NavLink
              end
              key={path}
              to={path}
              className={path === "/scanner" ? "scan-link" : ""}
            >
              <span>
                <Icon name={icon} />
              </span>
              <small>{label}</small>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
