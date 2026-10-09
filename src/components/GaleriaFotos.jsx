import { useState, useCallback, useEffect } from "react";
import { Row, Col, Image, Modal, Button } from "react-bootstrap";
import { assetUrl } from "../api/client";

// Galeria de fotos del actor con lightbox navegable.
// props:
//   fotos: [{ id, ruta }]
//   principalId: id de la foto principal (se marca y se muestra primero)
export default function GaleriaFotos({ fotos = [], principalId = null }) {
  // Ordena: la principal primero, luego por orden/id.
  const ordenadas = [...fotos].sort((a, b) => {
    if (a.id === principalId) return -1;
    if (b.id === principalId) return 1;
    return (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id;
  });

  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(0);

  const abrir = (i) => {
    setIndice(i);
    setAbierto(true);
  };
  const cerrar = () => setAbierto(false);

  const anterior = useCallback(
    () => setIndice((i) => (i - 1 + ordenadas.length) % ordenadas.length),
    [ordenadas.length]
  );
  const siguiente = useCallback(
    () => setIndice((i) => (i + 1) % ordenadas.length),
    [ordenadas.length]
  );

  // Navegacion con teclado dentro del lightbox.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") siguiente();
      else if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, anterior, siguiente]);

  if (ordenadas.length === 0) {
    return (
      <div style={{ height: 260, background: "#eee", borderRadius: 8 }} />
    );
  }

  const actual = ordenadas[indice];

  return (
    <>
      {/* Foto destacada */}
      <div
        style={{ cursor: "pointer" }}
        onClick={() => abrir(0)}
        title="Click para ampliar"
      >
        <Image src={assetUrl(ordenadas[0].ruta)} fluid rounded />
      </div>

      {/* Miniaturas del resto */}
      {ordenadas.length > 1 && (
        <Row className="mt-2 g-2">
          {ordenadas.map((f, i) => (
            <Col xs={3} key={f.id}>
              <Image
                src={assetUrl(f.ruta)}
                thumbnail
                style={{
                  cursor: "pointer",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderColor: f.id === principalId ? "#dc3545" : undefined,
                }}
                onClick={() => abrir(i)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Lightbox */}
      <Modal show={abierto} onHide={cerrar} centered size="lg" className="galeria-lightbox">
        <Modal.Body className="p-0 bg-dark position-relative text-center">
          <img
            src={assetUrl(actual.ruta)}
            alt={`Foto ${indice + 1} de ${ordenadas.length}`}
            style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
          />

          {ordenadas.length > 1 && (
            <>
              <Button
                variant="light"
                onClick={anterior}
                aria-label="Anterior"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 10,
                  transform: "translateY(-50%)",
                  opacity: 0.85,
                }}
              >
                &lsaquo;
              </Button>
              <Button
                variant="light"
                onClick={siguiente}
                aria-label="Siguiente"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%)",
                  opacity: 0.85,
                }}
              >
                &rsaquo;
              </Button>
            </>
          )}

          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 0,
              right: 0,
              color: "#fff",
              fontSize: 14,
            }}
          >
            {indice + 1} / {ordenadas.length}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
