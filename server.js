import {useVehicle,normalizeVehicle} from './public/vehicle-control.js';
import {createMultiplayer} from './multiplayer.js';
import {createIdleSessions} from './session-idle.js';
import {createCompetition} from './competition.js';
import {CHARACTER_EDIT_COST} from './public/economy.js';
import {transformSync} from 'esbuild';
import {executeJavascriptPreview} from './school-challenge-validator.js';
import {accessFor,canVisit,dollarPackages,currencyPackages,examPrerequisiteError} from './public/expansion-rules.js';
import {clubLessons,checkClub,clubProgram,regionalJobs,nextRegionalJob,checkRegionalJob,finishRegionalJob} from './expansion-content.js';
import { normalize, career, finishWork, unlock } from './progression.js';
import { books, readBookPage } from './books.js';
import { ensureWorld, beginSleep, settleSleep, worldSnapshot } from './public/day-cycle.js';
import { stationAt } from './public/navigation.js';
import { availableLesson, schoolLessons, schoolExams, schoolStages } from './school-content.js';
import { projectRequirements, saveExam } from './project-exams.js';
import { recruitmentExams, tierForCount } from './career-content.js';
import { works as archivedWorks } from './curriculum.js';
import { commonItems } from './public/shop-models.js';
import { createSocialAuth } from './social-auth.js';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  hairColors,
  levelForXp,
  itemFits,
  lessons,
  ticket,
  works,
  careerTiers,
  items,
  achievements,
  practices,
  publicExercise,
  equipItem,
  feedbackFor,
  validate,
} from './content.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const {edition,version: packageVersion} = JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
const installRoot = process.env.DEVLIFE_INSTALL_ROOT || root;
if (existsSync(path.join(installRoot, '.env'))) process.loadEnvFile(path.join(installRoot, '.env'));
mkdirSync(path.join(installRoot, 'data'), { recursive: true });
const db = new DatabaseSync(process.env.DEVLIFE_DB || path.join(installRoot, 'data/devlife.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS characters(user_id INTEGER PRIMARY KEY REFERENCES users(id), state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER NOT NULL);`);
const multiplayer=createMultiplayer(db);
const idleSessions=createIdleSessions(db);
const competition=createCompetition(db,{onWinner:()=>multiplayer.announce('competition',{})});
// Valores iniciais de uma conta nova. Contas existentes passam pela normalização.
const initial = (name) => ({
  name,
  skin: '#dba47b',
  shirt: '#ffffff',
  pants: '#ffffff',
  hairstyle: 'short',
  gender: 'male',
  characterSetupCompleted: false,
  npcWorldStartedAt: Date.now(),
  xp: 0,
  money: 0,
  economyVersion: 3,
  skills: { HTML: 0, CSS: 0, JavaScript: 0 },
  completed: [],
  inventory: commonItems.map((item) => item.id),
  equipped: [],
  achievements: [],
  campaignVersion: 4,
  schoolProjects: {},
  work: { completed: [], tier: -1, nextWorkAt: 0, cooldownVersion: 2 },
  job: null,
  salaryDate: null,
  lastStudy: null,
  streak: 0,
  position: { x: 430, y: 450 },
});
// O banco guarda o hash do token de sessão, nunca o token enviado no cookie.
const hash = (value) => createHash('sha256').update(value).digest('hex');
const passwordHash = (value) => {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(value, salt, 64).toString('hex');
};
const passwordMatches = (value, stored) => {
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored)) return false;
  const [salt, key] = stored.split(':');
  return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(value, salt, 64));
};
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
function markStudy(state) {
  const date = today();
  if (state.lastStudy === date) return;
  const previous = new Date(`${date}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  state.streak = state.lastStudy === previous.toISOString().slice(0, 10) ? state.streak + 1 : 1;
  state.lastStudy = date;
}
const save = (id, state) =>
  db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(state), id);
const publicRegionalJob = job => ({...publicExercise(job), demoInput:job.contract?.cases[0]?.[0]});
const publicState = (state) => ({
  ...normalize(state),
  characterEditorAccess: undefined,
  career: career(state),
  access: accessFor(state),
  serverNow: Date.now(),
  level: levelForXp(state.xp),
  world: worldSnapshot(state),
});
const limits = new Map();
// Limita o corpo do pedido antes de tentar interpretar o JSON.
const payload = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 100000) {
        reject(new Error('Pedido muito grande.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('JSON inválido.'));
      }
    });
  });
let startupState = process.env.DEVLIFE_STARTUP_STATE || 'local';
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(data));
  };
  try {
    if (url.pathname === '/__devlife/startup' && req.method === 'GET') {
      const state = startupState;
      if (startupState === 'updated') startupState = 'current';
      return send(200, { ready:true, state, version:process.env.DEVLIFE_VERSION || packageVersion, edition });
    }
    if (await socialAuth(req, res, url)) return;
    if (['GET','HEAD'].includes(req.method) && /^\/startup-previews\/(cidade|carreira|casa)\.png$/.test(url.pathname)) {
      const image = readFileSync(path.join(root, 'public', url.pathname));
      res.writeHead(200, {'Content-Type':'image/png','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      return res.end(req.method === 'HEAD' ? undefined : image);
    }
    if (!url.pathname.startsWith('/api/')) {
      const routes = {
        '/': url.searchParams.get('entrar') === '1' ? 'index.html' : 'startup.html',
        '/startup.css': 'startup.css',
        '/startup.js': 'startup.js',
        '/achievements.js': 'achievements.js',
        '/career.js': 'career.js',
        '/app.js': 'app.js',
        '/expansion-rules.js': 'expansion-rules.js',
        '/expansion-ui.js': 'expansion-ui.js',
        '/vendor/react-runtime.js': 'vendor/react-runtime.js',
        '/world.js': 'world.js',
        '/npcs.js': 'npcs.js',
        '/traffic.js': 'traffic.js',
        '/unlock-tour.js': 'unlock-tour.js',
        '/online.js': 'online.js',
        '/laptop.js': 'laptop.js',
        '/competition-ui.js': 'competition-ui.js',
        '/npc-dialogue.js': 'npc-dialogue.js',
        '/navigation.js': 'navigation.js',
        '/day-cycle.js': 'day-cycle.js',
        '/lighting.js': 'lighting.js',
        '/economy.js': 'economy.js',
        '/shop-models.js': 'shop-models.js',
        '/game-audio.js': 'game-audio.js',
        '/school-ui.js': 'school-ui.js',
        '/tutorial.js': 'tutorial.js',
        '/mobile-controls.js': 'mobile-controls.js',
        '/idle-session.js': 'idle-session.js',
        '/project-preview.html': 'project-preview.html',
        '/project-preview.js': 'project-preview.js',
        '/sandbox-preview.html': 'sandbox-preview.html',
        '/sandbox-preview.js': 'sandbox-preview.js',
        '/learning.js': 'learning.js',
        '/exercise-preview.js': 'exercise-preview.js',
        '/school-js-preview.js': 'school-js-preview.js',
        '/school-html-preview.js': 'school-html-preview.js',
        '/school-contract-preview.js': 'school-contract-preview.js',
        '/learning-images.js': 'learning-images.js',
        '/inventory.js': 'inventory.js',
        '/player-inventory.js': 'player-inventory.js',
        '/vehicle-control.js': 'vehicle-control.js',
        '/vehicle-art.js': 'vehicle-art.js',
        '/library.js': 'library.js',
        '/css/style.css': 'css/style.css',
        '/style.css': 'css/style.css',
      };
      const asset =
        url.pathname === '/logo-devclub.png'
          ? { file: url.pathname, type: 'image/png' }
          : /^\/books\/(html|css|javascript)\.pdf$/.test(url.pathname)
            ? { file: url.pathname, type: 'application/pdf' }
            : ['/audio/devcity-fim-de-tarde.wav', '/audio/descanso.wav','/audio/praca-natureza.wav','/audio/centro-urbano.wav','/audio/usa-estrada.wav'].includes(url.pathname)
              ? { file: url.pathname, type: 'audio/wav' }
              : ['/vendor/pdf.mjs', '/vendor/pdf.worker.mjs'].includes(url.pathname)
                ? { file: url.pathname, type: 'text/javascript; charset=utf-8' }
                : null;
      if (asset) {
        if(asset.type==='audio/wav'){
          if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
          const audio=readFileSync(path.join(root,'public',asset.file));
          const headers={'Content-Type':asset.type,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
          let start=0,end=audio.length-1,status=200;
          if(req.headers.range){
            const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
            if(match&&(match[1]||match[2])){
              if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
              else start=Math.max(0,audio.length-Number(match[2]));
            }else start=NaN;
            if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=audio.length){res.writeHead(416,{...headers,'Content-Range':`bytes */${audio.length}`});return res.end();}
            status=206;headers['Content-Range']=`bytes ${start}-${end}/${audio.length}`;
          }
          headers['Content-Length']=end-start+1;
          res.writeHead(status,headers);return res.end(req.method==='HEAD'?undefined:audio.subarray(start,end+1));
        }
        res.writeHead(200, {
          'Content-Type': asset.type,
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        });
        return res.end(readFileSync(path.join(root, 'public', asset.file)));
      }
      if (url.pathname === '/favicon.svg' || /^\/trophies\/[a-z0-9-]+\.svg$/.test(url.pathname)) {
        const file = path.join(root, 'public', url.pathname);
        try {
          const art = readFileSync(file);
          res.writeHead(200, {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
          });
          return res.end(art);
        } catch {
          return send(404, { error: 'Imagem não encontrada.' });
        }
      }
      const file = routes[url.pathname];
      if (!file) return send(404, { error: 'Página não encontrada.' });
      res.writeHead(200, {
        'Content-Type': file.endsWith('.html')
          ? 'text/html; charset=utf-8'
          : file.endsWith('.js')
            ? 'text/javascript; charset=utf-8'
            : 'text/css; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          url.pathname === '/sandbox-preview.html'
            ? "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"
            : "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; worker-src 'self'; frame-src 'self'; img-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'",
      });
      return res.end(readFileSync(path.join(root, 'public', file)));
    }
    // Pedidos do próprio site podem alterar o estado; outras origens são recusadas.
    if (req.method !== 'GET') {
      const origin = req.headers.origin;
      if (
        origin &&
        origin !== `http://${req.headers.host}` &&
        origin !== `https://${req.headers.host}`
      )
        return send(403, { error: 'Origem inválida.' });
      if (!req.headers['content-type']?.startsWith('application/json'))
        return send(415, { error: 'Envie JSON.' });
    }
    if (['/api/login', '/api/register'].includes(url.pathname) && req.method === 'POST') {
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      let limit = limits.get(ip);
      if (!limit || now - limit.start > 60000) {
        limit = { start: now, count: 0 };
        limits.set(ip, limit);
      }
      if (++limit.count > 20) return send(429, { error: 'Muitas tentativas. Aguarde um minuto.' });
      const body = await payload(req);
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 ||
        password.length < 8 ||
        password.length > 128
      )
        return send(400, { error: 'Informe um e-mail válido e senha entre 8 e 128 caracteres.' });
      let user;
      if (url.pathname === '/api/register') {
        const name = String(body.name || '').trim();
        if (name.length < 2 || name.length > 24)
          return send(400, { error: 'Nome deve ter entre 2 e 24 caracteres.' });
        if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
          return send(409, { error: 'Este e-mail já possui conta.' });
        db.exec('BEGIN');
        try {
          const result = db
            .prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)')
            .run(name, email, passwordHash(password));
          user = { id: Number(result.lastInsertRowid) };
          db.prepare('INSERT INTO characters(user_id,state) VALUES(?,?)').run(
            user.id,
            JSON.stringify(initial(name)),
          );
          db.exec('COMMIT');
        } catch (e) {
          db.exec('ROLLBACK');
          throw e;
        }
      } else {
        user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if (!user || !passwordMatches(password, user.password))
          return send(401, { error: 'E-mail ou senha incorretos.' });
      }
      const token = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
        hash(token),
        user.id,
        Date.now() + 7 * 86400000,
      );
      res.setHeader(
        'Set-Cookie',
        `devlife=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`,
      );
      return send(200, { ok: true });
    }
    const raw = req.headers.cookie?.match(/(?:^|;\s*)devlife=([a-f0-9]{64})(?:;|$)/)?.[1];
    const session =
      raw &&
      db
        .prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?')
        .get(hash(raw), Date.now());
    if (!session) return send(401, { error: 'Entre na sua conta para continuar.' });
    if(idleSessions.expired(hash(raw))){
      res.setHeader('Set-Cookie','devlife=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return send(401,{code:'IDLE_TIMEOUT',error:'Você foi desconectado após 15 minutos sem atividade.'});
    }
    if(url.pathname==='/api/activity'&&req.method==='POST'){
      idleSessions.touch(hash(raw));return send(200,{ok:true});
    }
    if (url.pathname === '/api/logout' && req.method === 'POST') {
      multiplayer.disconnect(session.user_id);
      db.prepare('DELETE FROM sessions WHERE token=?').run(hash(raw));
      res.setHeader('Set-Cookie', 'devlife=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return send(200, { ok: true });
    }
    const readState = () => {
      const state = JSON.parse(
        db.prepare('SELECT state FROM characters WHERE user_id=?').get(session.user_id).state,
      );
      state.submissions ??= {};
      state.practiceHistory ??= [];
      state.attempts ??= {};
      const migrateEconomy = state.economyVersion !== 3 || state.campaignVersion !== 4;
      const newNpcWorld=!Number.isFinite(state.npcWorldStartedAt);
      state.competitionParticipated=competition.hasParticipated(session.user_id);
      normalize(state);
      const newWorld = !state.worldTime;
      ensureWorld(state);
      const woke = settleSleep(state);
      if (newWorld || woke || migrateEconomy || newNpcWorld) save(session.user_id, state);
      unlock(state);
      if(competition.hasWon(session.user_id)&&!state.achievements.includes('project-king')){state.achievements.push('project-king');save(session.user_id,state);}
      state.isCompetitionAdmin=competition.isAdmin(session.user_id);
      return state;
    };
    if(url.pathname==='/api/competition'&&req.method==='GET')return send(200,competition.info(session.user_id));
    if(url.pathname==='/api/competition/admin'&&req.method==='GET'){const result=competition.admin(session.user_id,readState(),{cycleId:url.searchParams.has('cycle')?Number(url.searchParams.get('cycle')):undefined,offset:Number(url.searchParams.get('offset')||0)});return send(result.status||200,result)}
    if(url.pathname==='/api/competition/entry'&&req.method==='GET'){const result=competition.entry(session.user_id,readState(),Number(url.searchParams.get('id')));return send(result.status||200,result)}
    if(url.pathname==='/api/online/events'&&req.method==='GET')return multiplayer.connect(session.user_id,readState(),req,res,()=>{
      if(!db.prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?').get(hash(raw),Date.now()))return false;
      return idleSessions.expired(hash(raw))?'idle':true;
    });
    if(url.pathname==='/api/chat/history'&&req.method==='GET'){
      const result=multiplayer.history(session.user_id,readState(),url.searchParams.get('channel'),Number(url.searchParams.get('recipient')));return send(result.status||200,result);
    }
    if (url.pathname === '/api/state' && req.method === 'GET')
      return send(200, {
        state: publicState(readState()),
        accountId: session.user_id,
        lessons: lessons.map(publicExercise),
        ticket: publicExercise(ticket),
        practices: practices.map(publicExercise),
        items,
        expansion: {clubLessons:clubLessons.map(({solution,contract,...lesson})=>({...lesson,demoInput:contract.cases[0]?.[0]??{}})),regionalJobs:{downtown:regionalJobs.downtown.map(({solution,contract,...job})=>job),usa:regionalJobs.usa.map(publicRegionalJob)},nextJobs:{downtown:publicExercise(nextRegionalJob(readState(),'downtown') || {}),usa:publicRegionalJob(nextRegionalJob(readState(),'usa') || {})},dollarPackages,currencyPackages,projectRequirements:Object.fromEntries(["beginner","intermediate","advanced"].map(stage=>[stage,Object.fromEntries(["HTML","CSS","JavaScript"].map(area=>[area,projectRequirements(area,stage)]))])),paymentEnabled:false},
        books,
        achievements: achievements.map(achievement => ({
          ...achievement,
          image: achievement.image?.replace(/^\/trophies\//, './trophies/'),
        })),
        hairColors,
        works: works.map(publicExercise),
        archivedWorks: archivedWorks.map(publicExercise),
        careerTiers,
        schoolLessons: schoolLessons.map(publicExercise),
        schoolStages,
        schoolExams: schoolExams.map((exam) => ({
          ...publicExercise(exam),
          requirements: projectRequirements(exam.area, exam.stage),
        })),
        recruitmentExams: recruitmentExams.map(publicExercise),
        hairstyles: [
          { id: 'short', name: 'Curto' },
          { id: 'bob', name: 'Chanel' },
          { id: 'curly', name: 'Cacheado' },
          { id: 'ponytail', name: 'Rabo de cavalo' },
          { id: 'mohawk', name: 'Moicano' },
        ],
        serverNow: Date.now(),
      });
    if (req.method !== 'POST') return send(404, { error: 'Rota não encontrada.' });
    const body = await payload(req);
    // A leitura, aplicação das regras e gravação ficam juntas, sem await entre elas.
    // Um pedido lento de posição não pode restaurar um inventário antigo.
    const state = readState();
    if(url.pathname==='/api/competition/submit'||url.pathname==='/api/competition/promote'){
      const result=url.pathname.endsWith('/promote')?competition.promote(session.user_id,state,body):competition.submit(session.user_id,state,body);return send(result.status||200,result);
    }
    if(url.pathname==='/api/online/presence'||url.pathname==='/api/chat'){
      const result=url.pathname==='/api/chat'?multiplayer.chat(session.user_id,state,body):multiplayer.presence(session.user_id,state,body);return send(result.status||200,result);
    }
    if (state.worldTime.sleep && url.pathname !== '/api/position')
      return send(409, { error: 'Espere o personagem acordar.', state: publicState(state) });
    let message = 'Progresso salvo.';
    let details = {};
    switch (url.pathname) {
      case '/api/expansion-preview': {
        if(typeof body.code!=='string'||body.code.length>50000)return send(400,{error:'Código inválido.'});
        const lesson=clubLessons.find(x=>x.id===body.id)||(['downtown','usa'].includes(body.region)?nextRegionalJob(state,body.region):null);
        if(!lesson||lesson.id!==body.id||!accessFor(state)[body.region==='usa'?'usa':'downtown'])return send(403,{error:'Atividade indisponível.'});
        if(examPrerequisiteError(state,lesson))return send(403,{error:examPrerequisiteError(state,lesson)});
        try {
          if(lesson.track==='react')return send(200,{compiled:transformSync(body.code,{loader:'jsx',jsxFactory:'React.createElement',jsxFragment:'React.Fragment'}).code});
          return send(200,{output:executeJavascriptPreview(clubProgram(lesson,body.code),'entry',[body.input])});
        }catch(e){return send(422,{error:lesson.typescript?'TypeScript: '+e.message:'A demo encontrou um erro. Revise a sintaxe e o retorno da função.'});}
      }
      case '/api/expansion-test': {
        if(typeof body.code!=='string'||body.code.length>80000)return send(400,{error:'Código inválido.'});
        const lesson=clubLessons.find(x=>x.id===body.id);
        const job=['downtown','usa'].includes(body.region)?nextRegionalJob(state,body.region):null;
        if(lesson ? !accessFor(state).downtown || !lesson.requires.every(id=>state.completed.includes(id)) : !job || job.id!==body.id || !accessFor(state)[body.region])return send(403,{error:'Atividade indisponível.'});
        if(lesson&&examPrerequisiteError(state,lesson))return send(403,{error:examPrerequisiteError(state,lesson)});
        const feedback=lesson?checkClub(lesson,body.code):checkRegionalJob(job,body.code);
        if(feedback.length)return send(422,{error:'Revise os testes que falharam.',feedback});
        return send(200,{message:'Todos os casos de teste passaram. Você pode entregar.'});
      }
      case '/api/club-submit': {
        const lesson=clubLessons.find(x=>x.id===body.id);
        if(!accessFor(state).downtown || state.position.map!=='devclub')return send(403,{error:'Use um computador do DevClub.'});
        if(!lesson || !lesson.requires.every(id=>state.completed.includes(id)))return send(403,{error:'Conclua a atividade anterior.'});
        if(state.completed.includes(lesson.id))return send(409,{error:'Atividade já concluída.'});
        if(examPrerequisiteError(state,lesson))return send(403,{error:examPrerequisiteError(state,lesson)});
        if(typeof body.code!=='string'||body.code.length>50000)return send(400,{error:'Código inválido.'});
        const feedback=checkClub(lesson,body.code);
        if(feedback.length)return send(422,{error:'Revise seu código.',feedback});
        state.completed.push(lesson.id);state.xp+=lesson.xp;
        state.submissions[lesson.id]={code:body.code,completedAt:new Date().toISOString()};
        message=lesson.exam?'Prova DevClub aprovada!':'Atividade DevClub concluída!';break;
      }
      case '/api/regional-work': {
        const region=body.region;
        if(!['downtown','usa'].includes(region)||!accessFor(state)[region]||state.position.map!==(region==='usa'?'us-office':'city-office'))return send(403,{error:'Acesse o terminal da empresa na região liberada.'});
        const job=nextRegionalJob(state,region);
        if(!job||job.id!==body.id)return send(409,{error:'Este não é seu próximo contrato.'});
        if(typeof body.code!=='string'||body.code.length>80000)return send(400,{error:'Código inválido.'});
        if(Date.now()<state.regionalWork[region].nextWorkAt)return send(409,{error:'Aguarde o intervalo entre trabalhos.'});
        const feedback=checkRegionalJob(job,body.code);
        if(feedback.length)return send(422,{error:'A entrega ainda não atende ao contrato.',feedback});
        const result=finishRegionalJob(state,region);if(result.error)return send(result.status,result);
        state.submissions[job.id]={code:body.code,completedAt:new Date().toISOString()};
        state.xp+=300;message=region==='usa'?'Entrega aprovada! +US$ 1. Próximo contrato em 12 horas.':'Entrega aprovada! Pagamento em reais recebido.';
        details={nextJob:publicRegionalJob(nextRegionalJob(state,region)||{})};break;
      }
      case '/api/dollar-checkout':
      case '/api/currency-checkout':
        return send(503,{error:'Compras indisponíveis. A integração PagBank ainda não foi configurada. Nenhum valor foi cobrado.'});
      case '/api/sleep': {
        if (state.position.map !== 'house' || stationAt(state.position, 'house')?.id !== 'bed')
          return send(403, { error: 'Aproxime-se da sua cama para dormir.' });
        const result = beginSleep(state);
        if (result.error) return send(result.status, { error: result.error });
        details = result;
        message = 'Bom descanso! O tempo está passando mais rápido.';
        break;
      }
      case '/api/character-open': {
        const cost=state.characterSetupCompleted===false?0:CHARACTER_EDIT_COST;
        if(state.wallets.usd<cost)return send(402,{error:'Você precisa de US$ 10 para abrir a personalização.'});
        const editorToken=randomBytes(24).toString('hex');
        state.wallets.usd-=cost;
        state.characterEditorAccess={tokenHash:hash(editorToken)};
        details={editorToken,cost};
        message=cost?'Personalização aberta. US$ 10 descontados.':'Configuração inicial gratuita.';
        break;
      }
      case '/api/character':
        if(typeof body.editorToken!=='string'||!/^[a-f0-9]{48}$/.test(body.editorToken)||state.characterEditorAccess?.tokenHash!==hash(body.editorToken))
          return send(403,{error:'Abra a personalização do personagem antes de salvar.'});
        delete state.characterEditorAccess;
        state.characterSetupCompleted=true;
        if (
          typeof body.name === 'string' &&
          body.name.trim().length >= 2 &&
          body.name.trim().length <= 24
        )
          state.name = body.name.trim();
        if (['male', 'female'].includes(body.gender)) {
          state.gender = body.gender;
          state.equipped = state.equipped.filter((id) =>
            itemFits(
              items.find((i) => i.id === id),
              state.gender,
            ),
          );
        }
        if (hairColors.some((h) => h.color === body.hair)) state.hair = body.hair;
        if (['#dba47b', '#8d5524', '#f1c6a8'].includes(body.skin)) state.skin = body.skin;
        for (const [field, slot, values] of [
          ['shirt', 'shirt', ['#ffffff', '#18181b']],
          ['pants', 'pants', ['#ffffff', '#18181b']],
          ['hairstyle', 'hairstyle', ['short', 'bob', 'curly', 'ponytail', 'mohawk']],
        ])
          if (values.includes(body[field])) {
            state[field] = body[field];
            state.equipped = state.equipped.filter(
              (id) => items.find((i) => i.id === id)?.slot !== slot,
            );
          }
        break;
      case '/api/school-submit':
      case '/api/exam': {
        const isExam = url.pathname === '/api/exam';
        const mission = (isExam ? schoolExams : schoolLessons).find((l) => l.id === body.id);
        if (!mission) return send(400, { error: 'Atividade inválida.' });
        if (state.completed.includes(mission.id))
          return send(409, { error: 'Esta atividade já recebeu sua recompensa.' });
        if(examPrerequisiteError(state,mission))return send(403,{error:examPrerequisiteError(state,mission)});
        if (!availableLesson(state, mission))
          return send(403, { error: 'Complete os requisitos desta etapa antes de entregar.' });
        if (typeof body.code !== 'string' || body.code.length > 50000)
          return send(400, { error: 'Envie um código de até 50.000 caracteres.' });
        state.attempts[mission.id] = (state.attempts[mission.id] || 0) + 1;
        const result = isExam
          ? saveExam(state, mission, body.code)
          : validate(mission.id, body.code)
            ? {}
            : { feedback: feedbackFor(mission.id, body.code) };
        if (result.feedback) {
          save(session.user_id, state);
          return send(422, {
            error: 'Revise os requisitos que faltam.',
            feedback: result.feedback,
          });
        }
        state.submissions[mission.id] = {
          curriculumVersion: mission.curriculumVersion || 1,
          code: body.code,
          completedAt: new Date().toISOString(),
          attempts: state.attempts[mission.id],
        };
        state.completed.push(mission.id);
        state.xp += mission.xp;
        state.skills[mission.area] = Math.min(100, state.skills[mission.area] + mission.skill);
        markStudy(state);
        details = {
          passed: true,
          reward: { xp: mission.xp, money: 0, skill: mission.skill, area: mission.area },
          gateOpened: !!mission.opensGate,
        };
        message = isExam
          ? 'Prova aprovada! Seu projeto foi salvo e o troféu liberado.'
          : 'Aula concluída!';
        break;
      }
      case '/api/recruit': {
        const nextTier = state.work.tier + 1,
          exam = recruitmentExams[nextTier];
        if (!exam || body.id !== exam.id)
          return send(409, { error: 'Esta não é a sua próxima avaliação.' });
        if (nextTier === 0 && (state.xp < 150 || state.skills.HTML < 3))
          return send(403, { error: 'Estude HTML e conquiste 150 XP antes de se candidatar.' });
        if (nextTier > 0 && state.work.completed.length < careerTiers[nextTier].start)
          return send(403, { error: 'Conclua todos os trabalhos do cargo atual.' });
        if (
          typeof body.code !== 'string' ||
          body.code.length > 8000 ||
          !validate(exam.id, body.code)
        )
          return send(422, {
            error: 'Ainda falta um ajuste na avaliação.',
            feedback: feedbackFor(exam.id, body.code || ''),
          });
        state.work.tier = nextTier;
        state.job = careerTiers[nextTier].title;
        state.completed.push(exam.id);
        state.xp += exam.xp;
        state.skills[exam.area] = Math.min(100, state.skills[exam.area] + exam.skill);
        state.submissions[exam.id] = {
          code: body.code,
          completedAt: new Date().toISOString(),
          attempts: 1,
        };
        details = {
          passed: true,
          promotion: state.job,
          reward: { xp: exam.xp, money: 0, skill: exam.skill, area: exam.area },
        };
        message = `Avaliação aprovada! Você agora é ${state.job}.`;
        break;
      }
      case '/api/vehicle': {
        const result=useVehicle(state,body);
        if(result.error)return send(result.status,{error:result.error});
        message=result.message;break;
      }
      case '/api/position':
        if (state.worldTime.sleep) break;
        if (Number.isFinite(body.x) && Number.isFinite(body.y))
          state.position = {
            map:
              canVisit(state,body.map)
                ? body.map
                : 'city',
            x: Math.max(20, Math.min(940, body.x)),
            y: Math.max(20, Math.min(620, body.y)),
          };
        break;
      case '/api/book-read': {
        if (!accessFor(state).plaza || state.position.map !== 'library')
          return send(403, { error: 'Entre na biblioteca da praça para ler no computador.' });
        const result = readBookPage(state, body.id, body.page);
        if (result.error) return send(result.status, { error: result.error });
        details = result;
        message = result.rewarded
          ? `Livro concluído! +${result.reward.xp} XP · +${result.reward.skill} ${result.reward.area}`
          : 'Página lida. Seu progresso está salvo.';
        break;
      }
      // A escola dá XP e conhecimento uma única vez por aula.
      case '/api/submit': {
        const mission = lessons.find((l) => l.id === body.id);
        if (!mission) return send(400, { error: 'Missão inválida.' });
        if (state.completed.includes(mission.id))
          return send(409, { error: 'Essa missão já recebeu sua recompensa.' });
        const index = lessons.indexOf(mission);
        if (index > 0 && !state.completed.includes(lessons[index - 1].id))
          return send(403, { error: 'Complete a missão anterior.' });
        if (mission.id === ticket.id && !state.job)
          return send(403, { error: 'Candidate-se ao estágio primeiro.' });
        if (typeof body.code !== 'string' || body.code.length > 8000)
          return send(400, { error: 'Envie um código com até 8.000 caracteres.' });
        state.attempts[mission.id] = (state.attempts[mission.id] || 0) + 1;
        if (!validate(mission.id, body.code)) {
          save(session.user_id, state);
          return send(422, {
            error: 'Ainda falta um ajuste. Você consegue!',
            feedback: feedbackFor(mission.id, body.code),
          });
        }
        state.submissions[mission.id] = {
          code: body.code,
          completedAt: new Date().toISOString(),
          attempts: state.attempts[mission.id],
        };
        state.completed.push(mission.id);
        state.xp += mission.xp;
        state.money += mission.money;
        state.skills[mission.area] = Math.min(100, state.skills[mission.area] + mission.skill);
        const date = today();
        if (state.lastStudy !== date) {
          const prev = new Date(`${date}T12:00:00Z`);
          prev.setUTCDate(prev.getUTCDate() - 1);
          state.streak = state.lastStudy === prev.toISOString().slice(0, 10) ? state.streak + 1 : 1;
          state.lastStudy = date;
        }
        message = `Missão concluída! +${mission.xp} XP · +${mission.skill} ${mission.area}`;
        details = {
          reward: {
            xp: mission.xp,
            money: mission.money,
            skill: mission.skill,
            area: mission.area,
          },
          passed: true,
        };
        break;
      }
      case '/api/practice': {
        const exercise =
          practices.find((p) => p.id === body.id) ||
          lessons.find((p) => p.id === body.id) ||
          works.find((p) => p.id === body.id) ||
          archivedWorks.find((p) => p.id === body.id) ||
          schoolLessons.find((p) => p.id === body.id) ||
          recruitmentExams.find((p) => p.id === body.id);
        // As aulas novas também podem ser refeitas sem recompensa no DevBook.
        if (!exercise) return send(400, { error: 'Exercício inválido.' });
        if (
          !state.completed.includes(
            typeof exercise.requires === 'string' ? exercise.requires : exercise.id,
          )
        )
          return send(403, { error: 'Conclua primeiro a aula correspondente na escola.' });
        if (typeof body.code !== 'string' || body.code.length > 8000)
          return send(400, { error: 'Envie um código com até 8.000 caracteres.' });
        const passed = validate(exercise.id, body.code);
        state.practiceHistory.push({
          id: exercise.id,
          code: body.code,
          passed,
          practicedAt: new Date().toISOString(),
        });
        state.practiceHistory = state.practiceHistory.slice(-100);
        unlock(state);
        save(session.user_id, state);
        return send(passed ? 200 : 422, {
          state: publicState(state),
          passed,
          message: passed
            ? 'Prática concluída! Seu conhecimento está ficando mais sólido.'
            : undefined,
          error: passed ? undefined : 'Ainda falta um ajuste. Vamos tentar novamente?',
          feedback: passed ? [] : feedbackFor(exercise.id, body.code),
        });
      }
      case '/api/job':
        return send(403, {
          error: 'Fale com o recrutador e entregue a avaliação para conquistar o cargo.',
        });
      // A próxima entrega, seu pagamento e o intervalo são definidos no servidor.
      case '/api/work': {
        const work = works[state.work.completed.length];
        if (!state.job) return send(403, { error: 'Candidate-se ao estágio primeiro.' });
        if (!work || work.id !== body.id)
          return send(409, { error: 'Entregue apenas o próximo trabalho da carreira.' });
        if (work.tier > state.work.tier)
          return send(403, {
            error: 'Procure o recrutador para ser avaliado antes de iniciar o próximo cargo.',
          });
        const remainingMs = Math.max(0, state.work.nextWorkAt - Date.now());
        if (remainingMs)
          return send(429, {
            error: 'O próximo trabalho ainda está em preparação.',
            remainingMs,
            nextWorkAt: state.work.nextWorkAt,
          });
        if (state.xp < work.minXp)
          return send(403, { error: `Este trabalho exige ${work.minXp} XP. Continue estudando.` });
        if (typeof body.code !== 'string' || body.code.length > 50000)
          return send(400, { error: 'Envie um código com até 50.000 caracteres.' });
        state.attempts[work.id] = (state.attempts[work.id] || 0) + 1;
        if (!validate(work.id, body.code)) {
          save(session.user_id, state);
          return send(422, {
            error: 'Ainda falta um ajuste no trabalho.',
            feedback: feedbackFor(work.id, body.code),
          });
        }
        state.submissions[work.id] = {
          code: body.code,
          completedAt: new Date().toISOString(),
          attempts: state.attempts[work.id],
        };
        details = {
          ...finishWork(state, work),
          reward: { xp: work.xp, money: work.money, skill: work.skill, area: work.area },
          passed: true,
        };
        message = `Trabalho entregue! +${work.xp} XP · +${work.money} moedas`;
        break;
      }
      case '/api/salary':
        return send(410, { error: 'O pagamento agora acontece em cada entrega de trabalho.' });
      case '/api/buy': {
        const item = items.find((i) => i.id === body.id);
        if (!item) return send(400, { error: 'Item inválido.' });
        if (!itemFits(item, state.gender))
          return send(403, { error: 'Este modelo é para outro personagem.' });
        if (state.inventory.includes(item.id))
          return send(409, { error: 'Você já possui esse item.' });
        if (levelForXp(state.xp) < item.minLevel)
          return send(403, { error: `Este item exige nível ${item.minLevel}.` });
        if(item.region){
          if(!accessFor(state)[item.region==='usa'?'usa':'downtown'] || state.position.map!==(item.region==='usa'?'us-shop':'city-shop'))return send(403,{error:'Visite a loja na região liberada.'});
          if(state.wallets[item.currency]<item.price)return send(400,{error:'Saldo insuficiente nesta moeda.'});
          state.wallets[item.currency]-=item.price;state.inventory.push(item.id);if(!['vehicle','laptop'].includes(item.slot))equipItem(state,item.id);message=['vehicle','laptop'].includes(item.slot)?`${item.name} comprado! Selecione no inventário (I).`:`${item.name} comprado e equipado!`;break;
        }
        if (state.money < item.price)
          return send(400, { error: 'Você ainda não tem moedas suficientes.' });
        state.money -= item.price;
        state.inventory.push(item.id);
        equipItem(state, item.id);
        message = `${item.name} comprado e equipado!`;
        break;
      }
      case '/api/equip':
        if (!state.inventory.includes(body.id))
          return send(400, { error: 'Você não possui esse item.' });
        if (
          !state.equipped.includes(body.id) &&
          !itemFits(
            items.find((i) => i.id === body.id),
            state.gender,
          )
        )
          return send(403, { error: 'Este modelo é para outro personagem.' });
        equipItem(state, body.id);
        message = items.find(item=>item.id===body.id)?.slot==='laptop'?(state.equipped.includes(body.id)?'Notebook nas mãos. N para abrir.':'Notebook guardado.'):(state.equipped.includes(body.id)?'Item equipado. Sua prévia já foi atualizada.':'Item guardado. Sua prévia já foi atualizada.');
        break;
      default:
        return send(404, { error: 'Rota não encontrada.' });
    }
    normalizeVehicle(state);
    unlock(state);
    save(session.user_id, state);
    send(200, { state: publicState(state), message, ...details });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(500, { error: 'Não foi possível concluir. Tente novamente.' });
  }
});
const socialAuth = createSocialAuth({ db, initial, passwordHash, hash,sessionActive:token=>!idleSessions.expired(token) });
server.listen(Number(process.env.PORT || 5000), process.env.HOST || '0.0.0.0', () => {
  console.log(`DevLife disponível em http://localhost:${process.env.PORT || 5000}`);
  process.send?.({type:'devlife-ready'});
});
