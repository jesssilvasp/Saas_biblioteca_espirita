import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { QwenLayout } from "../qwen/Layout";
import { QwenScreen } from "../qwen/Screen";
import { screens } from "../qwen/navigation";
import type { ScreenId } from "../qwen/navigation";
import { Empty } from "../qwen/ui";
function ScreenRoute({ id }: { id: ScreenId }) {
  const location = useLocation();
  return <QwenScreen key={location.pathname + location.search} screen={id} />;
}
export function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<QwenLayout />}>
          {Object.entries(screens).map(([id, path]) => (
            <Route
              key={id}
              path={path}
              element={<ScreenRoute id={id as ScreenId} />}
            />
          ))}
          <Route
            path="*"
            element={
              <div className="p-5">
                <Empty to="/" label="Início">
                  Página não encontrada.
                </Empty>
              </div>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
