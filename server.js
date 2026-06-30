import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// In-memory storage for shared brackets (in production, use a database)
const sharedDraws = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Generate a random 10-character ID
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/share - Save a shared bracket
app.post('/api/share', (req, res) => {
  try {
    const { payload } = req.body;
    
    if (!payload || typeof payload !== 'string') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Validate JSON structure
    try {
      const parsed = JSON.parse(payload);
      if (!parsed.v || !parsed.winners) {
        return res.status(400).json({ error: 'Invalid bracket data structure' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    // Generate unique ID
    let id;
    do {
      id = generateId();
    } while (sharedDraws.has(id));

    // Store the payload
    sharedDraws.set(id, payload);

    // Set expiration (24 hours)
    setTimeout(() => {
      sharedDraws.delete(id);
    }, 24 * 60 * 60 * 1000);

    res.json({ id });
  } catch (error) {
    console.error('Error saving share:', error);
    res.status(500).json({ error: 'Failed to save share' });
  }
});

// GET /api/share/:id - Retrieve a shared bracket
app.get('/api/share/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!/^[A-Za-z0-9_-]{10}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid share ID format' });
    }

    const payload = sharedDraws.get(id);
    
    if (!payload) {
      return res.status(404).json({ error: 'Share not found or expired' });
    }

    res.json({ payload });
  } catch (error) {
    console.error('Error retrieving share:', error);
    res.status(500).json({ error: 'Failed to retrieve share' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', shares: sharedDraws.size });
});

app.listen(PORT, () => {
  console.log(`Share API server running on http://localhost:${PORT}`);
});
