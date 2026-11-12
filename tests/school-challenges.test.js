import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolLessons, legacySchoolLessons, validateSchool, schoolFeedback } from '../school-content.js';
import { publicExercise } from '../content.js';
import { checkJavascriptChallenge } from '../school-challenge-validator.js';
import { createLearning } from '../public/learning.js';

test('180 desafios independentes substituem as tarefas curtas sem trocar IDs ou recompensas', () => {
  const upgraded = schoolLessons.filter(l=>l.stage !== 'beginner');
  assert.equal(upgraded.length, 180);
  for (const lesson of upgraded) {
    const previous = legacySchoolLessons.find(l=>l.id===lesson.id);
    assert.equal(lesson.xp, previous.xp);
    assert.deepEqual(lesson.requires, previous.requires);
    assert.equal(lesson.curriculumVersion, 2);
    assert.equal(lesson.previousEdition.description, previous.description);
    assert.ok(lesson.solution.length > previous.solution.length, lesson.id);
    assert.ok(lesson.requirements.length >= 3, lesson.id);
    assert.equal(validateSchool(lesson.id, lesson.solution), true, lesson.id);
    assert.equal(validateSchool(lesson.id, lesson.starter), false, lesson.id);
    const published = publicExercise(lesson);
    assert.ok(!('solution' in published));
    assert.ok(!('contract' in published));
  }
  for (const lesson of schoolLessons.filter(l=>l.stage==='beginner')) assert.equal(lesson,legacySchoolLessons.find(l=>l.id===lesson.id));
});

test('HTML aceita textos próprios e atributos equivalentes, mas exige componentes e associações', () => {
  const lesson = schoolLessons.find(l=>l.title==='Cadastro com campos associados');
  const answer=lesson.solution.replace('Seu perfil','Dados do aluno').replace('name="nome" type="text"','type=\'text\' name=\'nome\'').replaceAll(' required',' required="required"');
  assert.equal(validateSchool(lesson.id,answer),true);
  assert.equal(validateSchool(lesson.id,answer.replace('for="nome"','for="outro"')),false);
  assert.equal(validateSchool(lesson.id,answer.replace(/<fieldset>[\s\S]*<\/fieldset>/,'')),false);
});

test('CSS aceita outra organização e rejeita ausência de responsividade ou foco', () => {
  const lesson=schoolLessons.find(l=>l.title==='Botão em quatro estados');
  assert.equal(validateSchool(lesson.id,lesson.solution.replace('background: #0f172a; color: #ffffff;','color: #ffffff; background: #0f172a;')),true);
  assert.equal(validateSchool(lesson.id,lesson.solution.replace(/\.botao:focus-visible\s*\{[^}]*\}/,'')),false);
  const responsive=schoolLessons.find(l=>l.title==='Grade de produtos em duas telas');
  assert.equal(validateSchool(responsive.id,responsive.solution.replace(/@media[\s\S]*$/,'')),false);
});

test('JS avalia comportamento: aceita laços e rejeita resposta fixa, entrada modificada e limites errados', () => {
  const lesson=schoolLessons.find(l=>l.functionName==='totalCarrinho');
  assert.equal(validateSchool(lesson.id,'function totalCarrinho(itens){let soma=0;for(const item of itens){if(item.quantidade>0)soma+=item.preco*item.quantidade;}return soma;}'),true);
  assert.equal(validateSchool(lesson.id,'const totalCarrinho = () => 70;'),false);
  const favorites=schoolLessons.find(l=>l.functionName==='alternarFavorito');
  assert.equal(validateSchool(favorites.id,'function alternarFavorito(lista,id){const result=lista.includes(id)?lista.filter(x=>x!==id):[...lista,id];lista.push(999);return result;}'),false);
  assert.ok(schoolFeedback(lesson.id,'function totalCarrinho(){return 0;}').some(message=>message.includes('Caso')));
});

test('Avaliador JS interrompe loops e não fornece Node, rede ou filesystem', () => {
  const lesson={id:'isolation-test',solution:'function ambiente(){return [typeof process,typeof require,typeof fetch];}',contract:{functionName:'ambiente',cases:[[]],immutable:true}};
  assert.deepEqual(checkJavascriptChallenge(lesson,lesson.solution),[]);
  const start=Date.now();
  assert.ok(checkJavascriptChallenge(lesson,'function ambiente(){while(true){}}').length>0);
  assert.ok(Date.now()-start<2000);
});

test('Revisão preserva a edição antiga e o botão de prática abre o desafio novo', () => {
  const original=globalThis.document;
  const elements=new Map();let rendered='';
  const lesson=schoolLessons.find(l=>l.title==='Botão em quatro estados');
  const previous=legacySchoolLessons.find(l=>l.id===lesson.id);
  globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,{setAttribute(){},removeAttribute(){},getAttribute:()=>'/sandbox-preview.html',contentWindow:{postMessage(){}},addEventListener(){},style:{},classList:{}});return elements.get(id);}};
  try{
    const learning=createLearning({getState:()=>({completed:[lesson.id],submissions:{[lesson.id]:{code:previous.solution,completedAt:'2026-10-01T12:00:00Z',attempts:1}}}),showPanel:(_title,html)=>rendered=html});
    learning.review(publicExercise(lesson));
    assert.match(rendered,/edição anterior/);
    assert.ok(rendered.includes(previous.title));
    assert.ok(rendered.includes('Praticar novo desafio'));
    elements.get('redoExercise').onclick();
    assert.ok(rendered.includes(lesson.title));
    assert.ok(rendered.includes('Ver critérios'));
    assert.equal(elements.get('editor').value,lesson.starter);
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
