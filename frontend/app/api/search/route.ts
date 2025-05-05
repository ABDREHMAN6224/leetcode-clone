
// app/api/search/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const rawQuery = body.query || "*:*";
  const encodedQuery = rawQuery.replace(/:/g, "%3A");

  const res = await fetch(`http://localhost:8983/solr/Task1-408351/select?q.op=OR&q=${encodedQuery}`);
  const data = await res.json();

  return Response.json({ articles: data.response.docs });
}