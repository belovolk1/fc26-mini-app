// Minimal pass-through: avoids "Failed to publish your Function" (Cloudflare internal error)
// when deploying static-only Pages. All requests fall through to static assets.
export function onRequest(context) {
  return context.next();
}
