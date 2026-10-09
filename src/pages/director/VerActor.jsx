import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Alert, Button, Badge } from "react-bootstrap";
import { api } from "../../api/client";
import GaleriaFotos from "../../components/GaleriaFotos";

// Agrupa las caracteristicas planas para mostrarlas legibles.
function agrupar(caracteristicas) {
  const out = {}; // etiqueta -> [valores]
  for (const c of caracteristicas) {
    let texto;
    if (c.tipo_dato === "boolean") texto = c.valor_booleano ? "Si" : "No";
    else if (c.tipo_dato === "opcion" || c.tipo_dato === "multi") texto = c.opcion_valor;
    else if (c.tipo_dato === "numero") texto = c.valor_numero;
    else texto = c.valor_texto;
    if (texto == null || texto === "") continue;
    (out[c.etiqueta] = out[c.etiqueta] || []).push(texto);
  }
  return out;
}

export default function VerActor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actor, setActor] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .verActor(id)
      .then(({ actor }) => setActor(actor))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando)
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;
  if (!actor) return null;

  const carac = agrupar(actor.caracteristicas || []);

  return (
    <Container>
      <Button variant="link" onClick={() => navigate(-1)} className="px-0 mb-2">
        &larr; Volver
      </Button>
      <Row>
        <Col md={4}>
          <Card className="p-2 mb-3">
            <GaleriaFotos fotos={actor.fotos} principalId={actor.foto_principal_id} />
          </Card>
        </Col>
        <Col md={8}>
          <h3>
            {actor.nombre_artistico || actor.nombre}{" "}
            {actor.disponible ? (
              <Badge bg="success">Disponible</Badge>
            ) : (
              <Badge bg="secondary">No disponible</Badge>
            )}
          </h3>
          <p className="text-muted mb-1">{actor.email}</p>

          <Card className="p-3 my-3">
            <h6>Datos</h6>
            <Row>
              {[
                ["Genero", actor.genero],
                ["Pais", actor.pais],
                ["Ciudad", actor.ciudad],
                ["Estatura", actor.estatura_cm && `${actor.estatura_cm} cm`],
                ["Peso", actor.peso_kg && `${actor.peso_kg} kg`],
                ["Cabello", actor.color_cabello],
                ["Ojos", actor.color_ojos],
                ["Piel", actor.color_piel],
                ["Mano dominante", actor.mano_dominante],
              ]
                .filter(([, v]) => v)
                .map(([l, v]) => (
                  <Col md={4} key={l} className="mb-2">
                    <strong>{l}:</strong> {v}
                  </Col>
                ))}
            </Row>
            {actor.biografia && (
              <>
                <h6 className="mt-2">Biografia</h6>
                <p>{actor.biografia}</p>
              </>
            )}
            {actor.reel_url && (
              <a href={actor.reel_url} target="_blank" rel="noreferrer">
                Ver reel
              </a>
            )}
          </Card>

          <Card className="p-3">
            <h6>Caracteristicas y habilidades</h6>
            <Row>
              {Object.entries(carac).map(([etiqueta, valores]) => (
                <Col md={6} key={etiqueta} className="mb-2">
                  <strong>{etiqueta}:</strong> {valores.join(", ")}
                </Col>
              ))}
              {Object.keys(carac).length === 0 && (
                <p className="text-muted">Sin caracteristicas registradas.</p>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
