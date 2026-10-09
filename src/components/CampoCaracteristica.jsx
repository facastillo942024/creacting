import { Form } from "react-bootstrap";

// Renderiza el control adecuado segun el tipo_dato de una caracteristica.
// valor: para boolean -> bool; numero/texto -> string/num; opcion -> string;
//        multi -> array de strings (valores de opcion).
// onChange(nuevoValor)
export default function CampoCaracteristica({ caracteristica, valor, onChange }) {
  const c = caracteristica;

  switch (c.tipo_dato) {
    case "boolean":
      return (
        <Form.Check
          type="switch"
          id={`carac-${c.clave}`}
          label={c.etiqueta}
          checked={!!valor}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case "numero":
      return (
        <Form.Group>
          <Form.Label>
            {c.etiqueta} {c.unidad ? `(${c.unidad})` : ""}
          </Form.Label>
          <Form.Control
            type="number"
            value={valor ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </Form.Group>
      );

    case "opcion":
      return (
        <Form.Group>
          <Form.Label>{c.etiqueta}</Form.Label>
          <Form.Select value={valor ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {c.opciones.map((o) => (
              <option key={o.id} value={o.valor}>
                {o.valor}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      );

    case "multi": {
      const seleccion = Array.isArray(valor) ? valor : [];
      const toggle = (v) => {
        if (seleccion.includes(v)) onChange(seleccion.filter((x) => x !== v));
        else onChange([...seleccion, v]);
      };
      return (
        <Form.Group>
          <Form.Label>{c.etiqueta}</Form.Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {c.opciones.map((o) => (
              <Form.Check
                key={o.id}
                type="checkbox"
                id={`carac-${c.clave}-${o.id}`}
                label={o.valor}
                checked={seleccion.includes(o.valor)}
                onChange={() => toggle(o.valor)}
              />
            ))}
          </div>
        </Form.Group>
      );
    }

    default: // texto
      return (
        <Form.Group>
          <Form.Label>{c.etiqueta}</Form.Label>
          <Form.Control value={valor ?? ""} onChange={(e) => onChange(e.target.value)} />
        </Form.Group>
      );
  }
}
