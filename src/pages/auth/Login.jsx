import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../auth/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const usuario = await login(email, password);
      navigate(usuario.rol === "director" ? "/buscar" : "/perfil");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesion");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container style={{ maxWidth: 420 }}>
      <Card className="p-4 shadow-sm">
        <h3 className="mb-3">Ingresar</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={enviar}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contrasena</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="danger" disabled={cargando} className="w-100">
            {cargando ? "Ingresando..." : "Ingresar"}
          </Button>
        </Form>
        <p className="mt-3 mb-0 text-center">
          No tienes cuenta? <Link to="/registro">Registrate</Link>
        </p>
      </Card>
    </Container>
  );
}
