import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('Áudio fornece tamanho, HEAD e trechos de bytes para reprodução móvel',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'devlife-audio-http-')),port=8100+Math.floor(Math.random()*400);
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DEVLIFE_DB:path.join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Servidor não iniciou')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
  const url=`http://localhost:${port}/audio/devcity-fim-de-tarde.wav`,source=readFileSync('public/audio/devcity-fim-de-tarde.wav');
  const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('accept-ranges'),'bytes');assert.equal(Number(head.headers.get('content-length')),source.length);assert.equal((await head.arrayBuffer()).byteLength,0);
  for(const [range,start,end] of [['bytes=0-1',0,1],['bytes=100-143',100,143],['bytes=-12',source.length-12,source.length-1],['bytes=100-',100,source.length-1]]){
   const response=await fetch(url,{headers:{Range:range}});assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/${source.length}`);assert.deepEqual(Buffer.from(await response.arrayBuffer()),source.subarray(start,end+1));
  }
  for(const range of ['bytes=999999999-','bytes=9-2','bytes=-0']){const response=await fetch(url,{headers:{Range:range}});assert.equal(response.status,416);assert.equal(response.headers.get('content-range'),`bytes */${source.length}`);await response.arrayBuffer();}
 }finally{if(child.exitCode===null&&child.signalCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}rmSync(dir,{recursive:true,force:true});}
});
