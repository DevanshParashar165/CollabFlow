import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const res = await fetch(`http://localhost:${port}/api/auth/logout`, { method: 'POST' });
  console.log('Status:', res.status);
  console.log('Set-Cookie header:', JSON.stringify(res.headers.get('set-cookie')));
  server.close();
});
