import {IDLE_TIMEOUT_MS} from './public/idle-session.js';
export function createIdleSessions(db,now=Date.now){
 db.exec('CREATE TABLE IF NOT EXISTS session_activity(token TEXT PRIMARY KEY REFERENCES sessions(token) ON DELETE CASCADE,last_active INTEGER NOT NULL)');
 db.prepare('INSERT OR IGNORE INTO session_activity SELECT token,? FROM sessions').run(now());
 const find=db.prepare('SELECT last_active FROM session_activity WHERE token=?');
 const insert=db.prepare('INSERT OR IGNORE INTO session_activity(token,last_active) VALUES(?,?)');
 function expired(token){
  const current=now();let row=find.get(token);
  if(!row){insert.run(token,current);return false;}
  if(current-row.last_active<IDLE_TIMEOUT_MS)return false;
  db.prepare('DELETE FROM sessions WHERE token=?').run(token);return true;
 }
 return {expired,touch(token){if(expired(token))return false;db.prepare('UPDATE session_activity SET last_active=? WHERE token=?').run(now(),token);return true;}};
}
