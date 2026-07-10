// Thin wrapper for the shared POST-JSON request shape. Callers keep their own
// response parsing and error handling so behavior stays identical per endpoint.
export function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
