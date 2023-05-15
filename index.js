// Backend server using Express and WebSocket

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Parser = require('rss-parser');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const parser = new Parser();

// Store connected clients
const clients = new Set();

// Function to broadcast data to all connected clients
function broadcastData(data) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

// Add a WebSocket connection
wss.on('connection', (ws) => {
  clients.add(ws);

  // Remove the WebSocket connection when it's closed
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Cron job function to fetch and notify sports news
async function fetchAndNotifySportsNews() {
  try {
    const feedUrl = 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms';
    const feed = await parser.parseURL(feedUrl);
    const news = feed.items.map(item => ({
      title: item.title,
      description: item.description,
      publishDate: item.pubDate,
      link: item.link
    }));

    // Send the fetched news to connected clients
    broadcastData({ type: 'newsUpdate', data: news });
  } catch (error) {
    console.error('Error fetching sports news:', error);
  }
}

// Schedule the cron job to run every hour

cron.schedule('0 * * * *', fetchAndNotifySportsNews);

// Start the server
server.listen(8080, () => {
  console.log('Server started on port 8080.');
});
