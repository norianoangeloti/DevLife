import test from 'node:test';
import { shopModels } from '../public/shop-models.js';
import assert from 'node:assert/strict';
import {
  buildings,
  plazaBuildings,
  move,
  blocked,
  doorAt,
  stationAt,
  seats,
  seatAt,
  exitAt,
  safePosition,
  plazaReturn,
  travelPassage,
  competitionBoards,
  onRoad,
} from '../public/navigation.js';
test('Telões dos quatro mapas têm base sólida fora das pistas',()=>{
 assert.equal(Object.keys(competitionBoards).length,4);
 for(const [map,position] of Object.entries(competitionBoards)){
  assert.equal(onRoad({...position,map}),false);
  assert.equal(blocked(position,map,true),true);
 }
});
test('Passagens aceitam as duas calçadas e preservam o lado na chegada',()=>{
 const routes=[['city',932,[375,470],'plaza'],['plaza',932,[520,620],'downtown'],['plaza',26,[520,620],'city'],['downtown',932,[330,510],'usa'],['downtown',26,[330,510],'plaza'],['usa',26,[330,510],'downtown']];
 for(const [map,x,heights,target] of routes)for(const y of heights){
  const passage=travelPassage({map,x,y});assert.equal(passage?.destination.map,target);
  assert.equal(blocked({x,y},map,true),false,`${map} ${x},${y}`);
  assert.equal(blocked(passage.destination,target,true),false);
  const end=move({x:x>900?870:65,y},x>900?65:-40,0,map,true);
  assert.ok(x>900?end.x>930:end.x<28,`${map}: calçada bloqueada em ${y}`);
  const center=target==='plaza'?570:420;
  assert.equal(passage.destination.y<center,y<heights[1]);
 }
 assert.equal(travelPassage({map:'city',x:932,y:530}),null);
});
test('Móveis comuns são sólidos sem equipamento e todos os assentos têm acesso livre', () => {
  for (const point of [
    { x: 468, y: 280 },
    { x: 565, y: 235 },
    { x: 697, y: 410 },
    { x: 705, y: 464 },
    { x: 724, y: 280 },
  ]) {
    assert.equal(blocked(point, 'house', false, []), true);
  }
  for (const [scene, furniture] of Object.entries(seats)) {
    for (const seat of furniture) {
      const approaches = [0, -29, 29].flatMap((dx) =>
        [30, 40, 50].map((dy) => ({ x: seat.x + dx, y: seat.y + dy })),
      );
      assert.ok(
        approaches.some((p) => !blocked(p, scene, true) && seatAt(p, scene) === seat),
        `${scene}: ${seat.x},${seat.y}`,
      );
    }
  }
});
test('Retorno da praça nasce fora da TechSoft e permite caminhar de volta à cidade', () => {
  assert.equal(blocked(plazaReturn, 'city', true), false);
  assert.ok(plazaReturn.x < 931);
  const passage = move(plazaReturn, -53, 0, 'city', true);
  const south = move(passage, 0, 90, 'city', true);
  const west = move(south, -110, 0, 'city', true);
  assert.ok(south.y >= 509);
  assert.ok(west.x < 850);
});
test('Paredes impedem passagem inclusive com deslocamento grande', () => {
  for (const b of buildings) {
    const p = move({ x: b.x - 30, y: b.y + 80 }, b.w + 100, 0);
    assert.ok(p.x < b.x - 8);
    const front = move({ x: b.x + 25, y: b.y + b.h + 35 }, 0, -100);
    assert.ok(front.y >= b.y + b.h + 7);
    assert.equal(doorAt(front), undefined);
  }
});
test('Não é possível contornar o portão fechado por cima, por baixo ou na diagonal', () => {
  for (const y of [60, 180, 350, 383, 420, 457, 530, 615]) {
    const end = move({ x: 870, y }, 100, 0, 'city', false);
    assert.ok(end.x <= 875, `Passagem fechada na altura ${y}`);
  }
  const diagonal = move({ x: 850, y: 470 }, 100, -100, 'city', false);
  assert.ok(diagonal.x <= 875);
  assert.ok(move({ x: 870, y: 420 }, 100, 0, 'city', true).x > 931);
  assert.ok(move({ x: 850, y: 530 }, 100, 0, 'city', true).x <= 875);
});
test('Praça tem fonte sólida e biblioteca com entrada apenas na porta', () => {
  assert.equal(blocked({ x: 480, y: 435 }, 'plaza'), true);
  const b = plazaBuildings[0];
  const front = move({ x: 480, y: 326 }, 0, -60, 'plaza');
  assert.equal(doorAt(front, 'plaza')?.id, 'library');
  const side = move({ x: b.x - 30, y: b.y + 90 }, 300, 0, 'plaza');
  assert.ok(side.x < b.x - 8);
  assert.equal(blocked({ x: 480, y: 485 }, 'library'), false);
  assert.equal(stationAt({ x: 640, y: 336 }, 'library')?.id, 'library-computer');
  assert.equal(safePosition({ x: 80, y: 420, map: 'plaza' }).map, 'plaza');
});
test('As quatro portas são acessíveis e somente elas autorizam entrada', () => {
  for (const b of buildings) {
    let p = { x: b.x + b.w / 2, y: b.y + b.h + 34 };
    p = move(p, 0, -25);
    assert.equal(doorAt(p)?.id, b.id);
    assert.equal(blocked(p), false);
  }
});
test('Troncos, fonte e portão bloqueiam, e desbloquear libera portão', () => {
  assert.equal(blocked({ x: 71, y: 236 }), true);
  assert.equal(blocked({ x: 600, y: 330 }), true);
  assert.equal(blocked({ x: 899, y: 423 }), true);
  assert.equal(blocked({ x: 899, y: 423 }, 'city', true), false);
});
test('Interiores possuem paredes, móveis sólidos, saída e pontos de interação', () => {
  for (const id of ['house', 'school', 'office', 'shop']) {
    assert.equal(blocked({ x: 480, y: 485 }, id), false);
    const p = move({ x: 480, y: 485 }, 1000, 0, id);
    assert.ok(p.x <= 732);
    assert.equal(exitAt({ x: 480, y: 510 }), true);
    assert.equal(exitAt({ x: 300, y: 510 }), false);
  }
  assert.equal(stationAt({ x: 652, y: 335 }, 'house')?.id, 'notebook');
  assert.equal(blocked({ x: 290, y: 400 }, 'house'), true);
  assert.equal(stationAt({ x: 480, y: 350 }, 'shop')?.id, 'counter');
});
test('Posições antigas dentro de edifícios são recuperadas', () => {
  assert.deepEqual(safePosition({ x: 400, y: 150 }), { x: 430, y: 450, map: 'city' });
  assert.deepEqual(safePosition({ x: 934, y: 540, map: 'city' }, false), {
    x: 430,
    y: 450,
    map: 'city',
  });
});

test('Novos modelos preservam as colisões dos móveis e o acesso à cama', () => {
  for (const item of shopModels) {
    for (const point of [
      { x: 450, y: 280 },
      { x: 700, y: 460 },
      { x: 540, y: 230 },
      { x: 308, y: 485 },
    ])
      assert.equal(
        blocked(point, 'house', false, [item.id]),
        blocked(point, 'house', false, [item.baseId]),
        item.id,
      );
  }
  assert.equal(stationAt({ x: 308, y: 485 }, 'house')?.id, 'bed');
});
