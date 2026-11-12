import { randomBytes, createHash, createPublicKey, verify, createHmac } from 'node:crypto';
const digest = (value) => createHash('sha256').update(value).digest('hex');
export function providerConfig(env = process.env) {
  const graphVersion = env.FACEBOOK_GRAPH_VERSION || 'v24.0';
  return {
    google: {
      name: 'Google',
      client: env.GOOGLE_CLIENT_ID,
      secret: env.GOOGLE_CLIENT_SECRET,
      authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      jwks: 'https://www.googleapis.com/oauth2/v3/certs',
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      scope: 'openid email profile',
    },
    facebook: {
      version: graphVersion,
      name: 'Facebook',
      client: env.FACEBOOK_CLIENT_ID,
      secret: env.FACEBOOK_CLIENT_SECRET,
      authorize: `https://www.facebook.com/${graphVersion}/dialog/oauth`,
      token: `https://graph.facebook.com/${graphVersion}/oauth/access_token`,
      scope: 'public_profile',
    },

  };
}
export function checkClaims(claims, config, nonce, now = Math.floor(Date.now() / 1000)) {
  if (
    !config.issuer.includes(claims.iss) ||
    claims.aud !== config.client ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now ||
    claims.iat > now + 60 ||
    claims.nonce !== nonce ||
    typeof claims.sub !== 'string' ||
    !claims.sub
  )
    throw new Error('Identidade inválida ou expirada.');
  return claims;
}
async function jsonFetch(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('O provedor não confirmou seu acesso. Tente novamente.');
  return response.json();
}
const keyCache = new Map();
export async function verifiedIdentity(token, config, nonce) {
  const parts = token?.split('.');
  if (parts?.length !== 3) throw new Error('Resposta de identidade inválida.');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()),
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  if (header.alg !== 'RS256' || typeof header.kid !== 'string')
    throw new Error('Assinatura de identidade inválida.');
  let cached = keyCache.get(config.jwks);
  if (!cached || cached.expires < Date.now() || !cached.keys.some((k) => k.kid === header.kid)) {
    cached = { ...(await jsonFetch(config.jwks)), expires: Date.now() + 3600000 };
    keyCache.set(config.jwks, cached);
  }
  const jwk = cached.keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
  if (
    !jwk ||
    !verify(
      'RSA-SHA256',
      Buffer.from(parts.slice(0, 2).join('.')),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(parts[2], 'base64url'),
    )
  )
    throw new Error('Assinatura de identidade inválida.');
  return checkClaims(claims, config, nonce);
}
export function createSocialAuth({ db, initial, passwordHash, hash,sessionActive=()=>true }) {
  const config = providerConfig(),
    base = (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
  const secure = base.startsWith('https://');
  db.exec(`CREATE TABLE IF NOT EXISTS social_identities(provider TEXT NOT NULL, subject TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id), PRIMARY KEY(provider,subject));
  CREATE TABLE IF NOT EXISTS oauth_requests(state TEXT PRIMARY KEY, browser TEXT NOT NULL, provider TEXT NOT NULL, nonce TEXT NOT NULL, verifier TEXT NOT NULL, user_id INTEGER, expires INTEGER NOT NULL);`);
  const cookie = (key, value, maxAge, sameSite = 'Lax') =>
    `${key}=${value}; HttpOnly; Path=/; SameSite=${sameSite}; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  const redirect = (res, url) => {
    res.writeHead(303, { Location: url, 'Cache-Control': 'no-store' });
    res.end();
  };
  const getSession = (req) => {
    const raw = req.headers.cookie?.match(/(?:^|;\s*)devlife=([a-f0-9]{64})(?:;|$)/)?.[1];
    const session = (
      raw &&
      db
        .prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?')
        .get(hash(raw), Date.now())
    );
    return session&&sessionActive(hash(raw))?session:null;
  };
  return async (req, res, url) => {
    if (url.pathname === '/api/auth/providers' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(
        JSON.stringify(
          Object.entries(config).map(([id, c]) => ({
            id,
            name: c.name,
            enabled: !!(c.client && c.secret),
          })),
        ),
      );
      return true;
    }
    const route = url.pathname.match(/^\/api\/auth\/(google|facebook)\/(start|callback)$/);
    if (!route) return false;
    const [, provider, action] = route,
      c = config[provider],
      callback = base + `/api/auth/${provider}/callback`;
    const error = (message) => redirect(res, '/?authError=' + encodeURIComponent(message));
    try {
      if (!c.client || !c.secret) {
        error(`${c.name} ainda precisa ser configurado pelo responsável pelo jogo.`);
        return true;
      }
      if (action === 'start') {
        if (req.method !== 'GET') {
          res.writeHead(405);
          res.end();
          return true;
        }
        const requests = db
          .prepare('SELECT count(*) AS count FROM oauth_requests WHERE expires>?')
          .get(Date.now()).count;
        db.prepare('DELETE FROM oauth_requests WHERE expires<=?').run(Date.now());
        if (requests > 1000) {
          error('Muitas tentativas de login. Aguarde um momento.');
          return true;
        }
        const state = randomBytes(32).toString('hex'),
          browser = randomBytes(32).toString('hex'),
          nonce = randomBytes(24).toString('hex'),
          verifier = randomBytes(32).toString('base64url');
        db.prepare('INSERT INTO oauth_requests VALUES(?,?,?,?,?,?,?)').run(
          digest(state),
          digest(browser),
          provider,
          nonce,
          verifier,
          getSession(req)?.user_id || null,
          Date.now() + 600000,
        );
        res.setHeader(
          'Set-Cookie',
          cookie('devlife_oauth', browser, 600, 'Lax'),
        );
        const target = new URL(c.authorize);
        Object.entries({
          client_id: c.client,
          redirect_uri: callback,
          response_type: 'code',
          scope: c.scope,
          state,
          nonce,
        }).forEach(([k, v]) => target.searchParams.set(k, v));
        if (provider === 'google') {
          target.searchParams.set(
            'code_challenge',
            createHash('sha256').update(verifier).digest('base64url'),
          );
          target.searchParams.set('code_challenge_method', 'S256');
        }
        redirect(res, target.toString());
        return true;
      }
      let params = url.searchParams;
      if (req.method !== 'GET') {
        res.writeHead(405);
        res.end();
        return true;
      }
      const raw = params.get('state'),
        browser = req.headers.cookie?.match(/(?:^|;\s*)devlife_oauth=([a-f0-9]{64})(?:;|$)/)?.[1];
      if (!raw || !browser) throw new Error('O login expirou. Comece novamente.');
      const request = db
        .prepare(
          'SELECT * FROM oauth_requests WHERE state=? AND browser=? AND provider=? AND expires>?',
        )
        .get(digest(raw), digest(browser), provider, Date.now());
      if (!request) throw new Error('O login expirou ou não pertence a este navegador.');
      db.prepare('DELETE FROM oauth_requests WHERE state=?').run(digest(raw));
      if (params.get('error')) throw new Error('Login cancelado. Você pode tentar novamente.');
      const code = params.get('code');
      if (!code || code.length > 16000) throw new Error('Código de login inválido.');
      const token = await jsonFetch(c.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: c.client,
          client_secret: c.secret,
          code,
          redirect_uri: callback,
          grant_type: 'authorization_code',
          ...(provider === 'google' ? { code_verifier: request.verifier } : {}),
        }),
      });
      let identity;
      if (provider === 'facebook') {
        const debug = new URL(`https://graph.facebook.com/${c.version}/debug_token`);
        debug.searchParams.set('input_token', token.access_token);
        debug.searchParams.set('access_token', c.client + '|' + c.secret);
        const checked = (await jsonFetch(debug)).data;
        if (
          !checked.is_valid ||
          String(checked.app_id) !== c.client ||
          checked.expires_at <= Math.floor(Date.now() / 1000)
        )
          throw new Error('Acesso do Facebook inválido.');
        const me = new URL(`https://graph.facebook.com/${c.version}/me`);
        me.searchParams.set('fields', 'id,name');
        me.searchParams.set('access_token', token.access_token);
        me.searchParams.set(
          'appsecret_proof',
          createHmac('sha256', c.secret).update(token.access_token).digest('hex'),
        );
        const profile = await jsonFetch(me);
        if (profile.id !== checked.user_id) throw new Error('Identidade do Facebook inválida.');
        identity = {
          sub: profile.id,
          name: profile.name,
          email_verified: false,
        };
      } else identity = await verifiedIdentity(token.id_token, c, request.nonce);
      const existing = db
        .prepare('SELECT user_id FROM social_identities WHERE provider=? AND subject=?')
        .get(provider, identity.sub);
      let userId = existing?.user_id;
      // Vincular exige a sessão original: nunca mescla contas apenas por um e-mail recebido.
      if (request.user_id && getSession(req)?.user_id !== request.user_id)
        throw new Error('Entre novamente na sua conta antes de vincular o provedor.');
      if (existing && request.user_id && existing.user_id !== request.user_id)
        throw new Error('Este provedor já está vinculado a outra conta.');
      if (!userId) {
        if (request.user_id) userId = request.user_id;
        else {
          const verified = identity.email_verified === true || identity.email_verified === 'true';
          const email =
            verified && typeof identity.email === 'string'
              ? identity.email.toLowerCase()
              : `${provider}.${digest(identity.sub).slice(0, 24)}@social.invalid`;
          if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
            throw new Error(
              'Este e-mail já tem conta. Entre com sua senha e vincule o provedor na edição do personagem.',
            );
          const name = String(identity.name || 'Novo Dev').slice(0, 24);
          db.exec('BEGIN');
          try {
            userId = Number(
              db
                .prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)')
                .run(name, email, passwordHash(randomBytes(32).toString('hex'))).lastInsertRowid,
            );
            db.prepare('INSERT INTO characters(user_id,state) VALUES(?,?)').run(
              userId,
              JSON.stringify(initial(name)),
            );
            db.prepare('INSERT INTO social_identities VALUES(?,?,?)').run(
              provider,
              identity.sub,
              userId,
            );
            db.exec('COMMIT');
          } catch (e) {
            db.exec('ROLLBACK');
            throw e;
          }
        }
        if (request.user_id)
          db.prepare('INSERT INTO social_identities VALUES(?,?,?)').run(
            provider,
            identity.sub,
            userId,
          );
      }
      const session = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
        hash(session),
        userId,
        Date.now() + 604800000,
      );
      res.setHeader('Set-Cookie', [
        cookie('devlife', session, 604800),
        cookie('devlife_oauth', '', 0, 'Lax'),
      ]);
      redirect(res, '/?socialLogin=1');
      return true;
    } catch (e) {
      error(
        e.message === 'Identidade inválida ou expirada.'
          ? e.message
          : e.message?.startsWith('Unexpected')
            ? 'Resposta de login inválida.'
            : e.message || 'Não foi possível entrar com o provedor.',
      );
      return true;
    }
  };
}
