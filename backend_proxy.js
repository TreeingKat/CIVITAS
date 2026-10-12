const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    });
    res.end();
    return;
  }

  const options = {
    hostname: 'localhost',
    port: 8080,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:8080' }
  };

  const proxy = http.request(options, (targetRes) => {
    const headers = { ...targetRes.headers };
    headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept';

    res.writeHead(targetRes.statusCode, headers);
    targetRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend unreachable', details: err.message }));
  });

  req.pipe(proxy);
});

server.listen(8088, '0.0.0.0', () => {
  console.log('CIVITAS Backend LAN Proxy listening on 0.0.0.0:8088 -> localhost:8080');
});
