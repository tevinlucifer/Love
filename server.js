const http = require('http');
const fs = require('fs');
const path = require('path');

let messages = [
    { sender: 'girl', text: 'Hey ❤️ Welcome to our app!' }
];

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) { res.writeHead(500); res.end('Server Error'); }
            else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(content); }
        });
    } else if (req.method === 'GET' && (req.url.endsWith('.jpg') || req.url.endsWith('.png'))) {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, content) => {
            if (err) { res.writeHead(404); res.end('Image Not Found'); }
            else { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.end(content); }
        });
    } else if (req.method === 'GET' && req.url === '/messages') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(messages));
    } else if (req.method === 'POST' && req.url === '/send') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                messages.push(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (e) {
                res.writeHead(400); res.end('Invalid JSON');
            }
        });
    } else {
        res.writeHead(404); res.end('Not Found');
    }
});

server.listen(3000, () => console.log('Chat server running on http://localhost:3000'));