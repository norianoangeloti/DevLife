import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolLessons,validateSchool,schoolFeedback} from '../school-content.js';
const lesson=schoolLessons.find(l=>l.title==='Formulário com restrições combinadas');
const fields=`<label for="apelido">Apelido:</label><input id="apelido" name="apelido" type="text" required minlength="3" maxlength="24" aria-describedby="dica-apelido"><p id="dica-apelido">Use de 3 a 24 caracteres.</p><label for="idade">Idade:</label><input id="idade" name="idade" type="number" min="16" max="120" required aria-describedby="dica-idade"><p id="dica-idade">Informe uma idade entre 16 e 120 anos.</p><div><input id="consentimento" name="consentimento" type="checkbox" required><label for="consentimento">Aceito os termos de uso.</label></div><button type="submit">Cadastrar</button>`;
const document=body=>`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Criar conta</title></head><body><main>${body}</main></body></html>`;
test('Aceita as duas organizações enviadas pelo aluno para criar conta',()=>{
  for(const code of [document(`<form id="conta"><h1>Criar conta</h1>${fields}</form>`),document(`<h1>Criar sua conta</h1><form id="conta"><div>${fields.replace('<label for="idade">','</div><div><label for="idade">').replace('<div><input id="consentimento"','</div><div><input id="consentimento"')}</form>`)]){
    assert.equal(validateSchool(lesson.id,code),true);
    assert.deepEqual(schoolFeedback(lesson.id,code),[]);
  }
});
test('Mantém limites, consentimento obrigatório e dicas associadas',()=>{
  for(const code of [fields.replace('minlength="3"','minlength="2"'),fields.replace('max="120"',''),fields.replace('type="checkbox" required','type="checkbox"'),fields.replace('id="dica-idade"','id="outro"'),fields.replace('Informe uma idade entre 16 e 120 anos.','')]) assert.equal(validateSchool(lesson.id,document(`<form>${code}</form>`)),false);
});
test('Aceita alerta inicialmente vazio no desafio de senha',()=>{
 const password=schoolLessons.find(l=>l.solution.includes('aria-invalid="false"')&&l.description.includes('senha obrigatória'));
 assert.ok(password);
 const code=`<form id="seguranca"><label for="senha">Senha</label><input id="senha" name="senha" type="password" required minlength="8" aria-describedby="ajuda erro" aria-invalid="false"><p id="ajuda">Use pelo menos 8 caracteres.</p><p id="erro" role="alert"></p><button type="submit">Salvar senha</button></form>`;
 assert.equal(validateSchool(password.id,document(code)),true);
});
