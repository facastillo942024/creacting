import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

// Barra horizontal simple (sin dependencias): etiqueta + barra proporcional + valor.
function BarList({ datos, color = "#dc3545" }) {
  const max = Math.max(1, ...datos.map((d) => Number(d.valor) || 0));
  if (!datos || datos.length === 0) {
    return <p className="text-muted mb-0">Sin datos aun.</p>;
  }
  return (
    <div>
      {datos.map((d, i) => {
        const pct = Math.round(((Number(d.valor) || 0) / max) * 100);
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div className="d-flex justify-content-between" style={{ fontSize: 14 }}>
              <span>{d.etiqueta}</span>
              <strong>{d.valor}</strong>
            </div>
            <div style={{ background: "#eee", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: color,
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Tarjeta de numero grande.
function StatCard({ titulo, valor, color = "danger" }) {
  return (
    <Card className="text-center shadow-sm h-100">
      <Card.Body>
        <div style={{ fontSize: 34, fontWeight: 700 }} className={`text-${color}`}>
          {valor}
        </div>
        <div className="text-muted" style={{ fontSize: 13 }}>
          {titulo}
        </div>
      </Card.Body>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .estadisticas()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando)
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  if (error)
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  if (!data) return null;

  const t = data.totales;

  return (
    <Container fluid className="pb-5">
      <h3 className="mb-1">Panel de CreactingCinema</h3>
      <p className="text-muted">Resumen del talento en la plataforma</p>

      {/* Tarjetas de resumen */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <StatCard titulo="Actores registrados" valor={t.actores} color="danger" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard titulo="Disponibles para casting" valor={t.disponibles} color="success" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard titulo="Directores / productores" valor={t.directores} color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard titulo="Fotos en portfolios" valor={t.fotos} color="dark" />
        </Col>
      </Row>

      {/* Graficos */}
      <Row className="g-3">
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="mb-3">Por genero</h6>
              <BarList datos={data.porGenero} color="#dc3545" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="mb-3">Top paises</h6>
              <BarList datos={data.porPais} color="#0d6efd" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="mb-3">Por estatura</h6>
              <BarList datos={data.porEstatura} color="#6f42c1" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="mb-3">Idiomas mas comunes</h6>
              <BarList datos={data.topIdiomas} color="#198754" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="mb-3">Caracteristicas mas frecuentes</h6>
              <BarList datos={data.topHabilidades} color="#fd7e14" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={12} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="mb-3">Perfiles recientes</h6>
              {data.recientes.length === 0 ? (
                <p className="text-muted mb-0">Sin actividad reciente.</p>
              ) : (
                <Table size="sm" hover className="mb-0">
                  <tbody>
                    {data.recientes.map((r) => (
                      <tr
                        key={r.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/actor/${r.id}`)}
                      >
                        <td>{r.nombre}</td>
                        <td className="text-muted" style={{ fontSize: 13 }}>
                          {r.pais || "-"}
                        </td>
                        <td>
                          {r.genero ? <Badge bg="light" text="dark">{r.genero}</Badge> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
