export function GET() {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
