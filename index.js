// SPDX-License-Identifier: 0BSD

const DOH_BIN = 'https://security.cloudflare-dns.com/dns-query';
const DOH_JSON = 'https://security.cloudflare-dns.com/dns-query';
const TYPE_BIN = 'application/dns-message';
const TYPE_JSON = 'application/dns-json';

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },
};

async function handleRequest(request) {
  const { method, headers, url } = request;
  const { pathname, searchParams } = new URL(url);

  // Default 404
  let res = new Response('Not Found', { status: 404 });

  // ------------------------------
  // 1. Binary DoH GET (?dns=...)
  // ------------------------------
  if (method === 'GET' && searchParams.has('dns')) {
    res = fetch(`${DOH_BIN}?dns=${searchParams.get('dns')}`, {
      method: 'GET',
      headers: { 'Accept': TYPE_BIN },
    });
  }

  // ------------------------------
  // 2. Binary DoH POST (application/dns-message)
  // ------------------------------
  else if (method === 'POST' && headers.get('content-type') === TYPE_BIN) {
    res = fetch(DOH_BIN, {
      method: 'POST',
      headers: {
        'Accept': TYPE_BIN,
        'Content-Type': TYPE_BIN,
      },
      body: request.body, // stream directly
    });
  }

  // ------------------------------
  // 3. JSON DoH GET (?name=...&type=...) with Accept: application/dns-json
  // ------------------------------
  else if (method === 'GET' && headers.get('accept')?.includes(TYPE_JSON) && searchParams.has('name')) {
    res = fetch(`${DOH_JSON}?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Accept': TYPE_JSON },
    });
  }

  // ------------------------------
  // 4. Google-style /resolve?name=...&type=...
  // ------------------------------
  else if (method === 'GET' && pathname.startsWith('/resolve') && searchParams.has('name')) {
    res = fetch(`${DOH_JSON}?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Accept': TYPE_JSON },
    });
  }

  return res;
}
