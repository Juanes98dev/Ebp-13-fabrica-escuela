const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const sessionToken = window.localStorage.getItem("bancox-session-token");
  const usuarioId = window.localStorage.getItem("bancox-user-id");
  const rol = window.localStorage.getItem("bancox-role");

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (sessionToken) headers.set("X-Session-Token", sessionToken);
  if (usuarioId) headers.set("X-Usuario-Id", usuarioId);
  if (rol) headers.set("X-Rol", rol);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const mensaje =
      typeof payload === "object" && payload && "mensaje" in payload
        ? String((payload as { mensaje: string }).mensaje)
        : typeof payload === "string"
          ? payload
          : "Ocurrió un error al procesar la solicitud";
    throw new Error(mensaje);
  }
  return payload as T;
}
