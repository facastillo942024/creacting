import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Image, Badge } from "react-bootstrap";
import { api, assetUrl } from "../../api/client";
import CampoCaracteristica from "../../components/CampoCaracteristica";

const CAMPOS = [
  { k: "nombre_artistico", l: "Nombre artistico", t: "text" },
  { k: "genero", l: "Genero", t: "select", opts: ["masculino", "femenino", "no_binario", "otro"] },
  { k: "fecha_nacimiento", l: "Fecha de nacimiento", t: "date" },
  { k: "pais", l: "Pais", t: "text" },
  { k: "ciudad", l: "Ciudad", t: "text" },
  { k: "estatura_cm", l: "Estatura (cm)", t: "number" },
  { k: "peso_kg", l: "Peso (kg)", t: "number" },
  { k: "color_cabello", l: "Color de cabello", t: "text" },
  { k: "color_ojos", l: "Color de ojos", t: "text" },
  { k: "color_piel", l: "Color de piel", t: "text" },
  { k: "mano_dominante", l: "Mano dominante", t: "select", opts: ["diestro", "zurdo", "ambidiestro"] },
  { k: "reel_url", l: "Enlace a reel/video", t: "text" },
];

// Convierte las caracteristicas guardadas (filas planas) a un mapa clave -> valor de UI.
function mapearCaracteristicas(filas, catalogo) {
  const porClave = {};
  const defPorId = new Map(catalogo.map((c) => [c.id, c]));
  for (const f of filas) {
    const def = defPorId.get(f.caracteristica_id);
    if (!def) continue;
    if (def.tipo_dato === "multi") {
      if (!Array.isArray(porClave[def.clave])) porClave[def.clave] = [];
      if (f.opcion_valor) porClave[def.clave].push(f.opcion_valor);
    } else if (def.tipo_dato === "opcion") {
      porClave[def.clave] = f.opcion_valor || "";
    } else if (def.tipo_dato === "boolean") {
      porClave[def.clave] = !!f.valor_booleano;
    } else if (def.tipo_dato === "numero") {
      porClave[def.clave] = f.valor_numero;
    } else {
      porClave[def.clave] = f.valor_texto || "";
    }
  }
  return porClave;
}

export default function PerfilActor() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo, texto }
  const [datos, setDatos] = useState({});
  const [disponible, setDisponible] = useState(true);
  const [catalogo, setCatalogo] = useState([]);
  const [caracValores, setCaracValores] = useState({});
  const [fotos, setFotos] = useState([]);
  const [fotoPrincipalId, setFotoPrincipalId] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [{ actor }, { caracteristicas: cat }] = await Promise.all([
        api.miPerfil(),
        api.catalogo(),
      ]);
      setCatalogo(cat);
      const d = {};
      CAMPOS.forEach(({ k }) => {
        d[k] = actor[k] ?? "";
      });
      // fecha en formato yyyy-mm-dd para el input date
      if (actor.fecha_nacimiento) d.fecha_nacimiento = String(actor.fecha_nacimiento).slice(0, 10);
      setDatos(d);
      setDisponible(!!actor.disponible);
      setCaracValores(mapearCaracteristicas(actor.caracteristicas || [], cat));
      setFotos(actor.fotos || []);
      setFotoPrincipalId(actor.foto_principal_id || null);
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const setCampo = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });

  const guardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      // 1) columnas fijas
      const payload = { ...datos, disponible };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      await api.actualizarPerfil(payload);

      // 2) caracteristicas -> formato del backend
      const lista = catalogo
        .map((c) => {
          const v = caracValores[c.clave];
          if (c.tipo_dato === "multi") return { clave: c.clave, opciones: Array.isArray(v) ? v : [] };
          return { clave: c.clave, valor: v };
        })
        .filter((e) => {
          if (Array.isArray(e.opciones)) return e.opciones.length > 0;
          return e.valor !== undefined && e.valor !== null && e.valor !== "";
        });
      await api.guardarCaracteristicas(lista);

      setMensaje({ tipo: "success", texto: "Perfil guardado correctamente" });
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const subirFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMensaje(null);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      await api.subirFoto(fd);
      await cargar();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    } finally {
      e.target.value = "";
    }
  };

  const borrarFoto = async (id) => {
    try {
      await api.eliminarFoto(id);
      await cargar();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    }
  };

  const marcarPrincipal = async (id) => {
    try {
      await api.marcarFotoPrincipal(id);
      setFotoPrincipalId(id);
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    }
  };

  if (cargando) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  // agrupar catalogo por grupo
  const grupos = {};
  catalogo.forEach((c) => {
    const g = c.grupo || "Otros";
    (grupos[g] = grupos[g] || []).push(c);
  });

  return (
    <Container>
      <h3 className="mb-3">Mi perfil de talento</h3>
      {mensaje && <Alert variant={mensaje.tipo}>{mensaje.texto}</Alert>}

      <Card className="p-3 mb-4">
        <h5>Datos basicos</h5>
        <Row>
          {CAMPOS.map((campo) => (
            <Col md={4} className="mb-3" key={campo.k}>
              <Form.Label>{campo.l}</Form.Label>
              {campo.t === "select" ? (
                <Form.Select value={datos[campo.k] ?? ""} onChange={setCampo(campo.k)}>
                  <option value="">— Seleccionar —</option>
                  {campo.opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control
                  type={campo.t}
                  value={datos[campo.k] ?? ""}
                  onChange={setCampo(campo.k)}
                />
              )}
            </Col>
          ))}
          <Col md={12} className="mb-2">
            <Form.Check
              type="switch"
              id="disponible"
              label="Disponible para castings"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
            />
          </Col>
        </Row>
      </Card>

      <Card className="p-3 mb-4">
        <h5>Caracteristicas y habilidades</h5>
        {Object.entries(grupos).map(([grupo, items]) => (
          <div key={grupo} className="mb-3">
            <h6 className="text-muted">{grupo}</h6>
            <Row>
              {items.map((c) => (
                <Col md={c.tipo_dato === "multi" ? 12 : 4} className="mb-3" key={c.id}>
                  <CampoCaracteristica
                    caracteristica={c}
                    valor={caracValores[c.clave]}
                    onChange={(nuevo) => setCaracValores({ ...caracValores, [c.clave]: nuevo })}
                  />
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Card>

      <Card className="p-3 mb-4">
        <h5>Fotos</h5>
        <Form.Control type="file" accept="image/*" onChange={subirFoto} className="mb-3" style={{ maxWidth: 340 }} />
        <Row>
          {fotos.length === 0 && <p className="text-muted">Aun no has subido fotos.</p>}
          {fotos.map((f) => (
            <Col xs={6} md={3} className="mb-3" key={f.id}>
              <div style={{ position: "relative" }}>
                <Image src={assetUrl(f.ruta)} thumbnail />
                {fotoPrincipalId === f.id && (
                  <Badge bg="danger" style={{ position: "absolute", top: 6, left: 6 }}>
                    Principal
                  </Badge>
                )}
              </div>
              <div className="d-flex gap-2 mt-1">
                {fotoPrincipalId !== f.id && (
                  <Button size="sm" variant="outline-secondary" onClick={() => marcarPrincipal(f.id)}>
                    Principal
                  </Button>
                )}
                <Button size="sm" variant="outline-danger" onClick={() => borrarFoto(f.id)}>
                  Borrar
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Button variant="danger" onClick={guardar} disabled={guardando} className="mb-5">
        {guardando ? "Guardando..." : "Guardar perfil"}
      </Button>
    </Container>
  );
}
