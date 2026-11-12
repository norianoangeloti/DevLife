import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolLessons, validateSchool, schoolFeedback } from '../school-content.js';
const lesson = schoolLessons.find(item => item.title === 'Feedback de envio acessível');
const answer = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Formulário de Comentários</title></head><body><main><form id="comentario"><h2>Deixe seu comentário</h2><label for="texto">Digite seu comentário:</label><textarea id="texto" name="texto" required></textarea><button type="submit">Enviar comentário</button></form><div id="feedback" role="status" aria-live="polite" aria-atomic="true"></div></main></body></html>`;
test('Aceita o documento completo enviado pelo aluno e status vazio', () => {
  assert.equal(validateSchool(lesson.id, answer), true);
  assert.deepEqual(schoolFeedback(lesson.id, answer), []);
});
test('Aceita regiões alternativas, nomes autorais e labels envolvendo textarea', () => {
  for (const tag of ['div','p','section']) {
    const code = `<form><h2>Comente.</h2><label>Mensagem<textarea required></textarea></label><button>Publicar.</button><${tag} role="status" aria-live="polite" aria-atomic="true"></${tag}></form>`;
    assert.equal(validateSchool(lesson.id, code), true);
  }
  assert.equal(validateSchool(lesson.id, lesson.solution), true);
});
test('Recusa requisitos ausentes com feedback específico', () => {
  for (const [before,after] of [[' required',''],['for="texto"','for="inexistente"'],['aria-live="polite"','aria-live="assertive"'],['aria-atomic="true"','aria-atomic="false"'],['role="status"',''],['<h2>Deixe seu comentário</h2>',''],['type="submit"','type="button"']]) {
    const code=answer.replace(before,after);
    assert.equal(validateSchool(lesson.id,code),false, before);
    assert.ok(schoolFeedback(lesson.id,code).length);
  }
  assert.equal(validateSchool(lesson.id,answer.replace('id="feedback"','id="texto"')),false);
});
