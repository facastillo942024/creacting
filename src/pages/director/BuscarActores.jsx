import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner, Table, Alert, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { api, assetUrl } from "../../api/client";

export default function BuscarActores() {
  const navigate = useNavigate();
  const [catalogo, setCatalogo] = useState([]);
  const [fijos, setFijos] = useState({
    texto: "",
    genero: "",
    pais: "",
    estatura_min: "",
    estatura_max: "",
    peso_min: "",
    peso_max: "",
    color_ojos: "",
    color_cabello: "",
    color_piel: "",
    mano_dominante: "",
    disponible: false,
  });
  const [caracFiltros, setCaracFiltros] = useState({}); // clave -> valor/array
  const [resultados, setResultados] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .catalogo(true) // solo buscables
      .then(({ caracteristicas }) => setCatalogo(caracteristicas))
      .catch((e) => setError(e.message));
  }, []);

  const setFijo = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFijos({ ...fijos, [k]: v });
  };

  const construirFiltros = useCallback(
    (page = 1) => {
      const f = { page, pageSize: 20 };
      Object.entries(fijos).forEach(([k, v]) => {
        if (v === "" || v === false) return;
        f[k] = v;
      });

      const caracteristicas = [];
      catalogo.forEach((c) => {
        const v = caracFiltros[c.clave];
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return;
        if (c.tipo_dato === "multi" || c.tipo_dato === "opcion") {
          caracteristicas.push({ clave: c.clave, opciones: Array.isArray(v) ? v : [v] });
        } else if (c.tipo_dato === "boolean") {
          caracteristicas.push({ clave: c.clave, valor: true });
        } else if (c.tipo_dato === "numero") {
          caracteristicas.push({ clave: c.clave, valor: Number(v) });
        } else {
          caracteristicas.push({ clave: c.clave, valor: v });
        }
      });
      if (caracteristicas.length) f.caracteristicas = caracteristicas;
      return f;
    },
    [fijos, caracFiltros, catalogo]
  );

  const buscar = useCallback(
    async (page = 1) => {
      setBuscando(true);
      setError("");
      try {
        const data = await api.buscarActores(construirFiltros(page));
        setResultados(data.actores);
        setMeta({ total: data.total, page: data.page, totalPages: data.totalPages });
      } catch (e) {
        setError(e.message);
      } finally {
        setBuscando(false);
      }
    },
    [construirFiltros]
  );

  const toggleMulti = (clave, valor) => {
    const actual = Array.isArray(caracFiltros[clave]) ? caracFiltros[clave] : [];
    const nuevo = actual.includes(valor) ? actual.filter((x) => x !== valor) : [...actual, valor];
    setCaracFiltros({ ...caracFiltros, [clave]: nuevo });
  };

  return (
    <Container fluid>
      <h3 className="mb-3">Buscar talento</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        {/* Panel de filtros */}
        <Col md={4} lg={3}>
          <Card className="p-3 mb-3">
            <h6>Filtros</h6>
            <Form.Group className="mb-2">
              <Form.Label>Nombre</Form.Label>
              <Form.Control value={fijos.texto} onChange={setFijo("texto")} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Genero</Form.Label>
              <Form.Select value={fijos.genero} onChange={setFijo("genero")}>
                <option value="">Cualquiera</option>
                <option value="masculino">masculino</option>
                <option value="femenino">femenino</option>
                <option value="no_binario">no binario</option>
                <option value="otro">otro</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Pais</Form.Label>
              <Form.Control value={fijos.pais} onChange={setFijo("pais")} />
            </Form.Group>
            <Row>
              <Col>
                <Form.Label>Estatura min</Form.Label>
                <Form.Control type="number" value={fijos.estatura_min} onChange={setFijo("estatura_min")} />
              </Col>
              <Col>
                <Form.Label>max</Form.Label>
                <Form.Control type="number" value={fijos.estatura_max} onChange={setFijo("estatura_max")} />
              </Col>
            </Row>
            <Row className="mt-2">
              <Col>
                <Form.Label>Peso min</Form.Label>
                <Form.Control type="number" value={fijos.peso_min} onChange={setFijo("peso_min")} />
              </Col>
              <Col>
                <Form.Label>max</Form.Label>
                <Form.Control type="number" value={fijos.peso_max} onChange={setFijo("peso_max")} />
              </Col>
            </Row>
            <Form.Group className="mb-2 mt-2">
              <Form.Label>Color de ojos</Form.Label>
              <Form.Control value={fijos.color_ojos} onChange={setFijo("color_ojos")} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Color de cabello</Form.Label>
              <Form.Control value={fijos.color_cabello} onChange={setFijo("color_cabello")} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Color de piel</Form.Label>
              <Form.Control value={fijos.color_piel} onChange={setFijo("color_piel")} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Mano dominante</Form.Label>
              <Form.Select value={fijos.mano_dominante} onChange={setFijo("mano_dominante")}>
                <option value="">Cualquiera</option>
                <option value="diestro">diestro</option>
                <option value="zurdo">zurdo</option>
                <option value="ambidiestro">ambidiestro</option>
              </Form.Select>
            </Form.Group>
            <Form.Check
              className="mb-3"
              type="switch"
              id="f-disp"
              label="Solo disponibles"
              checked={fijos.disponible}
              onChange={setFijo("disponible")}
            />

            {/* Filtros dinamicos del catalogo */}
            {catalogo.map((c) => (
              <Form.Group className="mb-3" key={c.id}>
                {c.tipo_dato === "boolean" ? (
                  <Form.Check
                    type="checkbox"
                    id={`f-${c.clave}`}
                    label={c.etiqueta}
                    checked={!!caracFiltros[c.clave]}
                    onChange={(e) => setCaracFiltros({ ...caracFiltros, [c.clave]: e.target.checked })}
                  />
                ) : c.tipo_dato === "opcion" ? (
                  <>
                    <Form.Label>{c.etiqueta}</Form.Label>
                    <Form.Select
                      value={caracFiltros[c.clave] || ""}
                      onChange={(e) => setCaracFiltros({ ...caracFiltros, [c.clave]: e.target.value })}
                    >
                      <option value="">Cualquiera</option>
                      {c.opciones.map((o) => (
                        <option key={o.id} value={o.valor}>
                          {o.valor}
                        </option>
                      ))}
                    </Form.Select>
                  </>
                ) : c.tipo_dato === "multi" ? (
                  <>
                    <Form.Label>{c.etiqueta}</Form.Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {c.opciones.map((o) => (
                        <Form.Check
                          key={o.id}
                          type="checkbox"
                          id={`f-${c.clave}-${o.id}`}
                          label={o.valor}
                          checked={(caracFiltros[c.clave] || []).includes(o.valor)}
                          onChange={() => toggleMulti(c.clave, o.valor)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Form.Label>{c.etiqueta}</Form.Label>
                    <Form.Control
                      type={c.tipo_dato === "numero" ? "number" : "text"}
                      value={caracFiltros[c.clave] || ""}
                      onChange={(e) => setCaracFiltros({ ...caracFiltros, [c.clave]: e.target.value })}
                    />
                  </>
                )}
              </Form.Group>
            ))}

            <Button variant="danger" className="w-100" onClick={() => buscar(1)} disabled={buscando}>
              {buscando ? "Buscando..." : "Buscar"}
            </Button>
          </Card>
        </Col>

        {/* Resultados */}
        <Col md={8} lg={9}>
          <p className="text-muted">{meta.total} resultado(s)</p>
          {buscando ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Genero</th>
                  <th>Pais</th>
                  <th>Estatura</th>
                  <th>Peso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((a) => (
                  <tr key={a.id}>
                    <td style={{ width: 60 }}>
                      {a.foto_principal ? (
                        <Image
                          src={assetUrl(a.foto_principal)}
                          roundedCircle
                          width={44}
                          height={44}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{ width: 44, height: 44, borderRadius: "50%", background: "#eee" }}
                        />
                      )}
                    </td>
                    <td>{a.nombre_artistico || a.nombre}</td>
                    <td>{a.genero}</td>
                    <td>{a.pais}</td>
                    <td>{a.estatura_cm ? `${a.estatura_cm} cm` : "-"}</td>
                    <td>{a.peso_kg ? `${a.peso_kg} kg` : "-"}</td>
                    <td>
                      <Button size="sm" variant="outline-danger" onClick={() => navigate(`/actor/${a.id}`)}>
                        Ver perfil
                      </Button>
                    </td>
                  </tr>
                ))}
                {resultados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Sin resultados. Ajusta los filtros y busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

          {meta.totalPages > 1 && (
            <div className="d-flex gap-2 align-items-center">
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={meta.page <= 1}
                onClick={() => buscar(meta.page - 1)}
              >
                Anterior
              </Button>
              <span>
                Pagina {meta.page} de {meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={meta.page >= meta.totalPages}
                onClick={() => buscar(meta.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
