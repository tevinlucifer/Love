const http = require('http');
const fs = require('fs');
const path = require('path');

// In-memory data stores
let messages = [
    { sender: 'girl', text: 'Hey ❤️ Welcome to our WhatsApp app!', timestamp: Date.now() }
];
let statuses = [];
let users = {}; 

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webm': 'audio/webm',
    '.mp4': 'video/mp4',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // Enable CORS for cross-origin feature support (calling/signaling)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const reqUrl = decodeURIComponent(req.url);

    // Serve index.html
    if (req.method === 'GET' && reqUrl === '/') {
        return fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) { 
                res.writeHead(500, { 'Content-Type': 'text/plain' }); 
                return res.end('Server Error: index.html missing'); 
            }
            res.writeHead(200, { 'Content-Type': 'text/html' }); 
            res.end(content);
        });
    } 

    // Serve static files (Images, CSS, JS, Audio)
    if (req.method === 'GET') {
        const ext = path.extname(reqUrl);
        if (MIME_TYPES[ext]) {
            const filePath = path.join(__dirname, reqUrl);
            return fs.readFile(filePath, (err, content) => {
                if (err) { 
                    res.writeHead(404, { 'Content-Type': 'text/plain' }); 
                    return res.end('File Not Found'); 
                }
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] }); 
                res.end(content);
            });
        }
    }

    // Handle Registration
    if (req.method === 'POST' && reqUrl === '/register') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        return req.on('end', () => {
            try {
                const { username, email, role, password } = JSON.parse(body);
                const userKey = email || username;
                if (users[userKey]) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', message: 'User already exists' }));
                }
                users[userKey] = { role, password, username: userKey };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', role }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' }); 
                res.end('Invalid JSON');
            }
        });
    } 

    // Handle Login
    if (req.method === 'POST' && reqUrl === '/login') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        return req.on('end', () => {
            try {
                const { username, email, password } = JSON.parse(body);
                const userKey = email || username;
                const user = users[userKey];
                if (!user || user.password !== password) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', message: 'Password incorrect or user not found' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', role: user.role }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' }); 
                res.end('Invalid JSON');
            }
        });
    } 

    // Get Messages
    if (req.method === 'GET' && reqUrl === '/messages') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(messages));
    } 

    // Send Message (Supports Text, Base64 Images, Audio Data)
    if (req.method === 'POST' && reqUrl === '/send') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        return req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!data.timestamp) data.timestamp = Date.now();
                messages.push(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' }); 
                res.end('Invalid JSON');
            }
        });
    }

    // Get Statuses
    if (req.method === 'GET' && reqUrl === '/statuses') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(statuses));
    }

    // Post Status Update
    if (req.method === 'POST' && reqUrl === '/status') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        return req.on('end', () => {
            try {
                const statusItem = JSON.parse(body);
                if (!statusItem.timestamp) statusItem.timestamp = Date.now();
                statuses.push(statusItem);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' }); 
                res.end('Invalid JSON');
            }
        });
    }

    // Default 404 Route
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));