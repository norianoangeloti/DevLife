function runChallenge(code, name, examples) {
  const select = document.querySelector('#challengeCase');
  const output = document.querySelector('#challengeOutput');
  const input = document.querySelector('#challengeInput');
  const expected = document.querySelector('#challengeExpected');
  const format = value => value === undefined ? 'Sem retorno' : typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const update = () => { const test=examples[Number(select.value)];input.textContent=JSON.stringify(test.args,null,2);expected.textContent=format(test.expected); };
  select.addEventListener('change', update); update();
  // O programa do aluno continua limitado ao iframe sem origem, rede ou dados da conta.
}

export function schoolContractPreview(exercise, code) {
  if (exercise.challengeKind !== 'javascript-contract') return null;
  const escape = value => value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cases = exercise.previewCases;
  const html = `<style>body{background:#f8faf9;color:#263c32;font:14px/1.6 system-ui;padding:16px}.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}small{color:#718078;font-size:10px;letter-spacing:1px}select,button{font:13px system-ui;border-radius:8px;padding:9px;border:1px solid #dce5df}button{background:#18794e;color:white;border:0;cursor:pointer}section{background:white;border:1px solid #e0e8e3;border-radius:12px;padding:16px}pre{font:13px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0}details{font-size:12px;color:#64746b;margin-top:16px}summary{cursor:pointer}label{font-size:12px;color:#64746b}</style><div class="toolbar"><label>Cenário <select id="challengeCase">${cases.map((_test,i)=>`<option value="${i}">Caso ${i+1}</option>`).join('')}</select></label><button id="challengeRun">Testar</button></div><section><small>RESULTADO</small><pre id="challengeOutput">Implemente ${escape(exercise.functionName)} e teste.</pre></section><details><summary>Ver entrada e resultado esperado</summary><small>ARGUMENTOS</small><pre id="challengeInput"></pre><small>ESPERADO</small><pre id="challengeExpected"></pre></details>`;
  const serialize = value => `JSON.parse(${JSON.stringify(JSON.stringify(value)).replace(/</g,'\\u003c')})`;
  const setup = `(${runChallenge.toString()})('',${serialize(exercise.functionName)},${serialize(cases)});`;
  const js = `${setup}
const examples=${serialize(cases)};
const execute=async()=>{
 const test=examples[Number(document.querySelector('#challengeCase').value)];
 const args=JSON.parse(JSON.stringify(test.args));
 try{
 const implementation=(()=>{${code}\n;return ${exercise.functionName};})();
 const result=await implementation(...args);
 document.querySelector('#challengeOutput').textContent=result===undefined?'Sem retorno. Use return para devolver o resultado.':typeof result==='string'?result:JSON.stringify(result,null,2);
 }catch(error){document.querySelector('#challengeOutput').textContent=error.message;}
};
document.querySelector('#challengeRun').addEventListener('click',execute);
document.querySelector('#challengeCase').addEventListener('change',execute);
await execute();`;
  return {html,js};
}
