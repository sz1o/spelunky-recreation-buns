// api/scores.js - Vercel serverless function for leaderboard
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const {name, gold, level} = req.body || {};
    // In a real deployment, store to a DB
    // For now return success
    return res.status(200).json({
      success: true,
      message: 'Score recorded',
      score: {name: name || 'Spelunker', gold: gold || 0, level: level || '1-1'}
    });
  }

  if (req.method === 'GET') {
    // Return mock top scores
    return res.status(200).json({
      scores: [
        {name:'Spelunky Guy', gold:9800, level:'4-4'},
        {name:'Cave Dweller', gold:7200, level:'3-2'},
        {name:'Gold Hunter', gold:5400, level:'2-3'},
      ]
    });
  }

  res.status(405).json({error: 'Method not allowed'});
}
