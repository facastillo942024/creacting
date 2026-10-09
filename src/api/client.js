// Cliente HTTP centralizado para hablar con el backend.
// Maneja la URL base, el token JWT y el parseo de errores.

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const TOKEN_KEY = "creacting_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Construye la URL absoluta de un recurso servido por el backend (ej. fotos).
export function assetUrl(ruta) {
  if (!ruta) return "";
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${API_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
}

// Peticion JSON generica. Lanza Error con .status y mensaje del backend.
async function request(path, { method = "GET", body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }

  let payload;
  if (isForm) {
    payload = body; // FormData: el navegador pone el Content-Type con boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg = (data && data.error) || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (datos) => request("/api/auth/register", { method: "POST", body: datos }),
  login: (datos) => request("/api/auth/login", { method: "POST", body: datos }),
  me: () => request("/api/auth/me", { auth: true }),

  // Catalogo
  catalogo: (soloBuscables = false) =>
    request(`/api/catalogo/caracteristicas${soloBuscables ? "?buscables=1" : ""}`),

  // Perfil del actor
  miPerfil: () => request("/api/actores/me", { auth: true }),
  actualizarPerfil: (datos) => request("/api/actores/me", { method: "PUT", body: datos, auth: true }),
  guardarCaracteristicas: (caracteristicas) =>
    request("/api/actores/me/caracteristicas", { method: "PUT", body: { caracteristicas }, auth: true }),
  subirFoto: (formData) =>
    request("/api/actores/me/fotos", { method: "POST", body: formData, auth: true, isForm: true }),
  eliminarFoto: (fotoId) =>
    request(`/api/actores/me/fotos/${fotoId}`, { method: "DELETE", auth: true }),
  marcarFotoPrincipal: (fotoId) =>
    request(`/api/actores/me/foto-principal/${fotoId}`, { method: "PUT", auth: true }),

  // Director
  verActor: (id) => request(`/api/actores/${id}`, { auth: true }),
  buscarActores: (filtros) =>
    request("/api/busqueda/actores", { method: "POST", body: filtros, auth: true }),
};

export { API_URL };
