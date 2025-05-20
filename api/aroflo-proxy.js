export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const {
      zone,
      pEncoded,
      secretKey,
      hostIP,
      uEncoded,
      orgEncoded
    } = req.body;

    if (!zone || !pEncoded || !secretKey || !hostIP || !uEncoded || !orgEncoded) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const afdatetimeutc = new Date().toISOString();
    const baseString = afdatetimeutc + hostIP;

    // Generate HMAC-SHA512
    const crypto = await import('crypto');
    const hmac = crypto
      .createHmac('sha512', Buffer.from(secretKey, 'base64'))
      .update(baseString)
      .digest('hex')
      .toUpperCase();

    const headers = {
      Authentication: `HMAC ${hmac}`,
      Authorization: `Bearer ${pEncoded}`,
      Accept: 'text/json',
      afdatetimeutc,
      uEncoded,
      orgEncoded
    };

    const apiUrl = `https://api.aroflo.com/?zone=${zone}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });

    const data = await response.text();

    return res.status(200).json({
      debug: {
        afdatetimeutc,
        baseString,
        hmac,
        headersSent: headers,
        url: apiUrl
      },
      response: data
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
