// src/middleware/verifyCognito.js
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

let pemsCache = null;

async function loadPems() {
  if (pemsCache) return pemsCache;

  const region = process.env.COGNITO_REGION;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

  const res = await fetch(jwksUrl);
  const { keys } = await res.json();

  pemsCache = {};
  keys.forEach(k => { pemsCache[k.kid] = jwkToPem(k); });
  return pemsCache;
}

module.exports = async function verifyCognito(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader?.header?.kid) {
      return res.status(401).json({ error: 'Invalid token header' });
    }

    const pems = await loadPems();
    const pem = pems[decodedHeader.header.kid];
    if (!pem) return res.status(401).json({ error: 'Unknown token key id' });

    const region = process.env.COGNITO_REGION;
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const iss = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const aud = process.env.COGNITO_CLIENT_ID;

    jwt.verify(
      token,
      pem,
      { algorithms: ['RS256'], issuer: iss, audience: aud },
      (err, payload) => {
        if (err) return res.status(401).json({ error: 'Token verification failed' });
        req.user = payload; // contains email, cognito:username, etc.
        next();
      }
    );
  } catch (e) {
    console.error('JWT verify error:', e);
    res.status(401).json({ error: 'Unauthorized' });
  }
};
