// src/routes/cognito.js
require('dotenv').config();
const express = require('express');
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');

const router = express.Router();

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION
});

// Helper: SECRET_HASH only if your app client shows a Client secret
function secretHash(username) {
  const secret = process.env.COGNITO_CLIENT_SECRET;
  if (!secret) return undefined;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(username + process.env.COGNITO_CLIENT_ID);
  return hmac.digest('base64');
}

/**
 * POST /api/cognito/signup
 * body: { username, password, email }
 */
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }]
    };
    const sh = secretHash(username);
    if (sh) params.SecretHash = sh;

    const out = await client.send(new SignUpCommand(params));
    res.status(201).json({ message: 'Signup initiated', userSub: out.UserSub, codeDelivery: out.CodeDeliveryDetails });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/cognito/confirm
 * body: { username, code }
 */
router.post('/confirm', async (req, res) => {
  try {
    const { username, code } = req.body;
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      ConfirmationCode: code
    };
    const sh = secretHash(username);
    if (sh) params.SecretHash = sh;

    await client.send(new ConfirmSignUpCommand(params));
    res.json({ message: 'Email confirmed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/cognito/login
 * body: { username, password }
 * returns: idToken (JWT you can show in video)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const authParams = {
      USERNAME: username,
      PASSWORD: password
    };
    const sh = secretHash(username);
    if (sh) authParams.SECRET_HASH = sh;

    const out = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: authParams
      })
    );

    const { IdToken, AccessToken, RefreshToken } = out.AuthenticationResult;
    res.json({ idToken: IdToken, accessToken: AccessToken, refreshToken: RefreshToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
