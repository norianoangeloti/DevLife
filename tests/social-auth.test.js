import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { providerConfig, checkClaims, verifiedIdentity } from '../social-auth.js';

test('Login social oferece somente Google e Facebook e exige credenciais', () => {
  const disabled = providerConfig({});
  assert.deepEqual(Object.keys(disabled), ['google', 'facebook']);
  assert.equal(disabled.google.client, undefined);
  assert.equal(disabled.facebook.secret, undefined);
  const configured = providerConfig({
    GOOGLE_CLIENT_ID: 'google-client',
    GOOGLE_CLIENT_SECRET: 'google-secret',
    FACEBOOK_CLIENT_ID: 'facebook-client',
    FACEBOOK_CLIENT_SECRET: 'facebook-secret',
  });
  assert.equal(configured.google.client, 'google-client');
  assert.equal(configured.facebook.secret, 'facebook-secret');
  assert.equal(configured.facebook.scope, 'public_profile');
});

test('OIDC exige emissor, audiência, nonce e validade da identidade', () => {
  const config = { client: 'devlife', issuer: ['https://issuer.example'] },
    claims = {
      iss: 'https://issuer.example',
      aud: 'devlife',
      sub: '123',
      nonce: 'one-time',
      exp: 2000,
      iat: 900,
    };
  assert.equal(checkClaims(claims, config, 'one-time', 1000).sub, '123');
  for (const patch of [
    { iss: 'evil' },
    { aud: 'other' },
    { exp: 999 },
    { sub: '' },
    { nonce: 'replay' },
    { iat: 2000 },
  ])
    assert.throws(() => checkClaims({ ...claims, ...patch }, config, 'one-time', 1000));
});
test('Assinatura RSA do provedor é verificada antes de aceitar o login', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 }),
    jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'verified-key' };
  const config = {
    client: 'devlife',
    issuer: ['https://issuer.example'],
    jwks: 'https://keys.example/test',
  };
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: jwk.kid })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      iss: config.issuer[0],
      aud: config.client,
      sub: '123',
      nonce: 'nonce',
      exp: Math.floor(Date.now() / 1000) + 1000,
    }),
  ).toString('base64url');
  const signature = sign('RSA-SHA256', Buffer.from(header + '.' + body), privateKey).toString(
    'base64url',
  );
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  try {
    assert.equal(
      (await verifiedIdentity(header + '.' + body + '.' + signature, config, 'nonce')).sub,
      '123',
    );
    await assert.rejects(
      verifiedIdentity(
        header + '.' + body + '.' + Buffer.alloc(256).toString('base64url'),
        config,
        'nonce',
      ),
    );
    await assert.rejects(
      verifiedIdentity(header + '.' + body + '.' + signature, config, 'wrong-nonce'),
    );
  } finally {
    globalThis.fetch = original;
  }
});
