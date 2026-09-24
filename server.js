const http = require('http');
const fs = require('fs');
const path = require('path');

let messages = [
    { sender: 'girl', text: 'Hey ❤️ Welcome to our app!' }
];

// In-memory user store
let users = {}; 

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
    const reqUrl = decodeURIComponent(req.url);

    if (req.method === 'GET' && reqUrl === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) { res.writeHead(500); res.end('Server Error'); }
            else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(content); }
        });
    } else if (req.method === 'GET') {
        const ext = path.extname(reqUrl);
        if (MIME_TYPES[ext]) {
            const filePath = path.join(__dirname, reqUrl);
            fs.readFile(filePath, (err, content) => {
                if (err) { res.writeHead(404); res.end('File Not Found'); }
                else { res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] }); res.end(content); }
            });
            return;
        }
    }

    if (req.method === 'POST' && reqUrl === '/register') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { username, role, password } = JSON.parse(body);
                if (users[username]) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', message: 'Username already exists' }));
                }
                users[username] = { role, password };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (e) {
                res.writeHead(400); res.end('Invalid JSON');
            }
        });
    } else if (req.method === 'POST' && reqUrl === '/login') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                const user = users[username];
                if (!user || user.password !== password) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', message: 'Password incorrect, try again' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', role: user.role }));
            } catch (e) {
                res.writeHead(400); res.end('Invalid JSON');
            }
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