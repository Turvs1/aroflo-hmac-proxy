export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST allowed' });
    }

    const { zone, pEncoded, secretKey, hostIP } = req.body;
    if (!zone || !pEncoded || !secretKey || !hostIP) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const afdatetimeutc = new Date().toISOString();
    const baseString = afdatetimeutc + hostIP;

    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha512', Buffer.from(secretKey, 'base64'))
      .update(baseString)
      .digest('hex')
      .toUpperCase();

    const headers = {
      Authentication: 'HMAC ' + hmac,
      Authorization: 'Bearer ' + pEncoded,
      Accept: 'text/json',
      afdatetimeutc
    };

    const apiUrl = `https://api.aroflo.com/?zone=${zone}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });

    const raw = await response.text();

    // Try parse if it's JSON, otherwise return as-is
    try {
      const json = JSON.parse(raw);
      return res.status(200).json(json);
    } catch {
      return res.status(200).send(raw);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy server failed', message: err.message });
  }
}
