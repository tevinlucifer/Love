const http = require('http');
const fs = require('fs');
const path = require('path');

let messages = [
    { sender: 'girl', text: 'Hey ❤️ Welcome to our app!' }
];

const server = http.createServer((req, res) => {
    // Decode URL to properly handle image filenames
    const reqUrl = decodeURIComponent(req.url);

    if (req.method === 'GET' && reqUrl === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) { res.writeHead(500); res.end('Server Error'); }
            else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(content); }
        });
    } else if (req.method === 'GET' && (reqUrl.endsWith('.jpg') || reqUrl.endsWith('.jpeg'))) {
        const filePath = path.join(__dirname, reqUrl);
        fs.readFile(filePath, (err, content) => {
            if (err) { res.writeHead(404); res.end('Image Not Found'); }
            else { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.end(content); }
        });
    } else if (req.method === 'GET' && reqUrl.endsWith('.png')) {
        const filePath = path.join(__dirname, reqUrl);
        fs.readFile(filePath, (err, content) => {
            if (err) { res.writeHead(404); res.end('Image Not Found'); }
            else { res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(content); }
        });
    } else if (req.method === 'GET' && reqUrl === '/messages') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(messages));
    } else if (req.method === 'POST' && reqUrl === '/send') {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));