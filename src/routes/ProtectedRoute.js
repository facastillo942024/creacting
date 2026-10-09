import { Navigate } from "react-router-dom";
import useAuth from "../auth/useAuth";

// Protege rutas por autenticacion y, opcionalmente, por rol.
// Uso: <ProtectedRoute roles={["actor"]}><Perfil/></ProtectedRoute>
export default function ProtectedRoute({ children, roles }) {
  const { isAuth, rol, cargando } = useAuth();

  if (cargando) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>;
  }
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  if (roles && roles.length > 0 && !roles.includes(rol)) {
    // Autenticado pero sin el rol requerido: lo mandamos a su area.
    return <Navigate to={rol === "director" ? "/buscar" : "/perfil"} replace />;
  }
  return children;
}
