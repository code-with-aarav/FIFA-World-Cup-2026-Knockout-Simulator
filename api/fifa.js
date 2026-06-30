export default async function handler(req, res) {
  const apiKey = process.env.VITE_FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing API key' });
  }

  const endpoint = 'https://api.football-data.org/v4/competitions/WC/matches?stage=knockout';
  try {
    const response = await fetch(endpoint, {
      headers: {
        'X-Auth-Token': apiKey.trim().replace(/['"]/g, '')
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
