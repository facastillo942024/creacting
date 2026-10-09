import { useState } from "react";
import { Container, Card, Form, Button, Alert, ToggleButton, ButtonGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../auth/useAuth";

export default function Registro() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    rol: "actor",
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    setCargando(true);
    try {
      const usuario = await register(form);
      navigate(usuario.rol === "director" ? "/buscar" : "/perfil");
    } catch (err) {
      setError(err.message || "No se pudo completar el registro");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container style={{ maxWidth: 480 }}>
      <Card className="p-4 shadow-sm">
        <h3 className="mb-3">Crear cuenta</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={enviar}>
          <Form.Group className="mb-3">
            <Form.Label>Quiero registrarme como</Form.Label>
            <div>
              <ButtonGroup>
                {[
                  { v: "actor", t: "Actor / Talento" },
                  { v: "director", t: "Director / Productor" },
                ].map((op) => (
                  <ToggleButton
                    key={op.v}
                    id={`rol-${op.v}`}
                    type="radio"
                    variant={form.rol === op.v ? "danger" : "outline-danger"}
                    name="rol"
                    value={op.v}
                    checked={form.rol === op.v}
                    onChange={set("rol")}
                  >
                    {op.t}
                  </ToggleButton>
                ))}
              </ButtonGroup>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nombre completo</Form.Label>
            <Form.Control value={form.nombre} onChange={set("nombre")} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={form.email} onChange={set("email")} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contrasena</Form.Label>
            <Form.Control
              type="password"
              value={form.password}
              onChange={set("password")}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Telefono (opcional)</Form.Label>
            <Form.Control value={form.telefono} onChange={set("telefono")} />
          </Form.Group>

          <Button type="submit" variant="danger" disabled={cargando} className="w-100">
            {cargando ? "Creando..." : "Crear cuenta"}
          </Button>
        </Form>
        <p className="mt-3 mb-0 text-center">
          Ya tienes cuenta? <Link to="/login">Ingresa</Link>
        </p>
      </Card>
    </Container>
  );
}
