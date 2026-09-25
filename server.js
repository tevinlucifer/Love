const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// In-memory persistent data stores
let messages = [
    { id: 1, sender: 'girl', text: 'Hey ❤️ Welcome to our WhatsApp app!', timestamp: Date.now(), status: 'read' }
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const reqUrl = decodeURIComponent(req.url);

    // Serve index.html
    if (req.method === 'GET' && (reqUrl === '/' || reqUrl === '/index.html')) {
        return fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Server Error: index.html missing');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    }

    // Serve Static Files
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

    // Authentication API Endpoints
    if (req.method === 'POST' && reqUrl === '/register') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        return req.on('end', () => {
            try {
                const { username, email, role, password } = JSON.parse(body);
                const userKey = email || username;
                users[userKey] = { role, password, username: userKey };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', role }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid JSON');
            }
        });
    }

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
                    return res.end(JSON.stringify({ status: 'error', message: 'Invalid credentials' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', role: user.role }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid JSON');
            }
        });
    }

    // REST Fallback Endpoints
    if (req.method === 'GET' && reqUrl === '/messages') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(messages));
    }

    if (req.method === 'GET' && reqUrl === '/statuses') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(statuses));
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// WebSocket Server for Live Realtime Messaging
const wss = new WebSocket.Server({ server });

function broadcast(data) {
    const payload = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

wss.on('connection', (ws) => {
    // Send existing messages on join
    ws.send(JSON.stringify({ type: 'INIT_MESSAGES', messages }));
    ws.send(JSON.stringify({ type: 'INIT_STATUSES', statuses }));

    ws.on('message', (messageStr) => {
        try {
            const data = JSON.parse(messageStr);
            
            if (data.type === 'NEW_MESSAGE') {
                const msgObj = {
                    id: Date.now(),
                    sender: data.sender,
                    text: data.text,
                    timestamp: Date.now(),
                    status: 'delivered'
                };
                messages.push(msgObj);
                broadcast({ type: 'MESSAGE_RECEIVED', message: msgObj });
            }

            if (data.type === 'NEW_STATUS') {
                const statusObj = {
                    id: Date.now(),
                    sender: data.sender,
                    mediaUrl: data.mediaUrl,
                    type: data.mediaType,
                    timestamp: Date.now()
                };
                statuses.push(statusObj);
                broadcast({ type: 'STATUS_RECEIVED', status: statusObj });
            }

            if (data.type === 'TYPING') {
                broadcast({ type: 'USER_TYPING', sender: data.sender, isTyping: data.isTyping });
            }
        } catch (err) {
            console.error('WebSocket Error:', err);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));