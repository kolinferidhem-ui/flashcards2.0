// Vercel serverless function: POST /api/generate
// Keeps the Anthropic API key server-side. Set ANTHROPIC_API_KEY in your
// Vercel project's Environment Variables (Project Settings -> Environment Variables).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' });
  }

  const { imageBlocks, prompt } = req.body || {};

  if (!Array.isArray(imageBlocks) || imageBlocks.length === 0 || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Request must include imageBlocks (array) and prompt (string)' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [...imageBlocks, { type: 'text', text: prompt }]
          }
        ]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const message = data?.error?.message || `Anthropic API error (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('generate.js error:', err);
    return res.status(500).json({ error: 'Failed to reach Anthropic API' });
  }
}
