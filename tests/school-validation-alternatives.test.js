import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlAlternative,cssAlternative} from './helpers/school-alternatives.js';
import {schoolLessons,validateSchool,schoolFeedback} from '../school-content.js';
import {matchCssChallenge} from '../school-css-validator.js';

test('Todos os 210 exercícios aceitam sua solução e recusam código vazio',()=>{
  for(const lesson of schoolLessons){assert.equal(validateSchool(lesson.id,lesson.solution),true,lesson.id);assert.equal(validateSchool(lesson.id,''),false,lesson.id);}
});
test('Os 60 desafios HTML aceitam documento completo, metadados reordenados, contêineres e associações renomeadas',()=>{
  for(const lesson of schoolLessons.filter(l=>l.challengeKind==='html-composition')){
    const alternative=htmlAlternative(lesson);
    assert.equal(validateSchool(lesson.id,alternative),true,lesson.id+': '+JSON.stringify(schoolFeedback(lesson.id,alternative)));
  }
});
test('Todos os 70 exercícios CSS aceitam propriedades longas, cores RGB, milissegundos e formatação alternativa',()=>{
  for(const lesson of schoolLessons.filter(l=>l.area==='CSS')){
    const alternative=cssAlternative(lesson.solution);
    assert.equal(validateSchool(lesson.id,alternative),true,lesson.id+': '+JSON.stringify(schoolFeedback(lesson.id,alternative)));
  }
});
test('Os 60 contratos JS aceitam arrow functions e nomes internos sem colisão',()=>{
  for(const lesson of schoolLessons.filter(l=>l.contract)){
    const alternative='const result=123; const entry=456; const cases=[]; '+lesson.solution.replace(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/,'const $1 = ($2) => {')+';';
    assert.equal(validateSchool(lesson.id,alternative),true,lesson.id+': '+JSON.stringify(schoolFeedback(lesson.id,alternative)));
    assert.equal(validateSchool(lesson.id,`function ${lesson.functionName}(){return null;}`),false,lesson.id);
  }
});
test('HTML iniciante mantém textos exigidos e aceita tags maiúsculas e página completa',()=>{
  for(const lesson of schoolLessons.filter(l=>l.area==='HTML'&&l.stage==='beginner')){
    const answer='<html lang="pt-BR"><head><title>Estudo</title></head><body>'+lesson.solution.replace(/<\/?[a-z][\w-]*/g,tag=>tag.toUpperCase())+'</body></html>';
    assert.equal(validateSchool(lesson.id,answer),true,lesson.id);
  }
  assert.equal(validateSchool('school-html-beginner-1','<h1>Texto diferente</h1>'),false);
});
test('CSS aceita sintaxes equivalentes sem dispensar estados e condições',()=>{
  const cases=[
    ['.x{color:rgb(255,255,255);padding-top:24px;padding-right:24px;padding-bottom:24px;padding-left:24px}','.x{color:#fff;padding:24px}'],
    ['@media screen and (width <= 600px){.x{gap:20px}}','@media (max-width:600px){.x{row-gap:20px;column-gap:20px}}'],
    ['.x{border:none}','.x{border:0}'],
    ['.x{transition-property:background;transition-duration:300ms}','.x{transition:background .3s ease}'],
    ['.x{&:hover{color:white}}','.x:hover{color:#ffffff}'],
    ['.x{animation-name:surgir;animation-duration:500ms;animation-fill-mode:both}','.x{animation:surgir .5s ease both}'],
    [':root{--surface:white}.x{background-color:var(--surface)}',':root{--surface:#fff}.x{background:var(--surface)}'],
    ['@keyframes surgir{0%{opacity:0}100%{opacity:1}}','@keyframes surgir{from{opacity:0}to{opacity:1}}'],
  ];
  for(const [answer,reference]of cases)assert.equal(matchCssChallenge(answer,reference),true,answer);
  assert.equal(matchCssChallenge('.x{color:white}','.x:hover{color:white}'),false);
  assert.equal(matchCssChallenge('.x{gap:20px}','@media(max-width:600px){.x{gap:20px}}'),false);
});

test('Portal e galeria escritos de forma independente cumprem o enunciado',()=>{
  const portal=schoolLessons.find(l=>l.title==='Navegação de um portal');
  const answer='<!doctype html><html lang="pt-br"><head><title>Meu portal</title></head><body><header><a href="#cursos">Minha marca</a><nav aria-label="Menu"><a href="#cursos">Cursos</a><a href="#agenda">Agenda</a><a href="#contato">Contato</a></nav></header><main><div><section id="cursos"><h2>Cursos</h2></section><section id="agenda"><h2>Agenda</h2></section><section id="contato"><h2>Contato</h2></section></div></main></body></html>';
  assert.equal(validateSchool(portal.id,answer),true);
  const gallery=schoolLessons.find(l=>l.title==='Galeria com contexto');
  assert.equal(validateSchool(gallery.id,'<section id="meus-projetos"><h2>Meu trabalho</h2><div><figure><img src="agenda.png" alt="Tela da agenda"><figcaption><a href="agenda.html">Minha agenda</a></figcaption></figure><figure><img src="loja.png" alt="Catálogo da loja"><figcaption><a href="loja.html">Minha loja</a></figcaption></figure></div></section>'),true);
});

test('Formulário com labels envolvendo campos é aceito e associações incompletas continuam falhando',()=>{
  const lesson=schoolLessons.find(l=>l.title==='Cadastro com campos associados');
  assert.equal(validateSchool(lesson.id,'<form id="perfil"><fieldset><legend>Dados do aluno</legend><p><label>Nome completo <input name="nome-completo" autocomplete="name" required></label></p><p><label>Apelido <input name="nome-publico" minlength="3" maxlength="20" required></label></p></fieldset><button>Cadastrar</button></form>'),true);
  const password=schoolLessons.find(l=>l.title==='Senha com ajuda e erro');
  assert.equal(validateSchool(password.id,password.solution.replace('aria-describedby="ajuda erro"','aria-describedby="ajuda"')),false);
});
