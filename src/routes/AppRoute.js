import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Registro from "../pages/auth/Registro";
import PerfilActor from "../pages/actor/PerfilActor";
import BuscarActores from "../pages/director/BuscarActores";
import VerActor from "../pages/director/VerActor";
import NavBar from "../components/NavBar";
import ProtectedRoute from "./ProtectedRoute";
import useAuth from "../auth/useAuth";

// Redirige la raiz segun estado/rol.
function Inicio() {
  const { isAuth, rol } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Navigate to={rol === "director" ? "/buscar" : "/perfil"} replace />;
}

export default function AppRoute() {
  return (
    <Router>
      <NavBar />
      <div style={{ width: "100%" }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute roles={["actor"]}>
                <PerfilActor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buscar"
            element={
              <ProtectedRoute roles={["director", "admin"]}>
                <BuscarActores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/actor/:id"
            element={
              <ProtectedRoute roles={["director", "admin"]}>
                <VerActor />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
