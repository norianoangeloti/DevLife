import { equippedBases } from './shop-models.js';
// O desenho, a colisão e a iluminação compartilham a posição de cada poste.
export const streetLamps = {
  city: [[330,370],[661,370],[418,489],[548,272]],
  plaza: [[210,420],[750,420],[395,495],[565,495]],
  downtown: [[350,330],[630,330],[350,520],[630,520]],
  usa: [[130,330],[830,330],[350,520],[630,520]],
};
export const lampBulb = {x:-7,y:-59,width:14,height:13};
export const competitionBoards={city:{x:245,y:565},plaza:{x:785,y:175},downtown:{x:720,y:606},usa:{x:720,y:606}};
const boardObstacles=scene=>competitionBoards[scene]?[{x:competitionBoards[scene].x-94,y:competitionBoards[scene].y-8,w:188,h:14}]:[];
export const regionalTrees = [[48,280],[915,280],[70,570],[890,570]];
export const buildings = [
  { id: 'house', x: 95, y: 125, w: 205, h: 170, name: 'SUA CASA' },
  { id: 'school', x: 380, y: 82, w: 230, h: 180, name: 'ESCOLA DEV' },
  { id: 'office', x: 655, y: 105, w: 200, h: 190, name: 'TECHSOFT' },
  { id: 'shop', x: 395, y: 485, w: 180, h: 100, name: 'LOJA' },
];
export const plazaBuildings = [
  { id: 'library', x: 365, y: 112, w: 230, h: 180, name: 'BIBLIOTECA' },
];
export const plazaTrees = [
  [110, 210],
  [180, 275],
  [280, 170],
  [805, 265],
  [880, 370],
  [100, 470],
  [190, 480],
  [770, 460],
  [870, 480],
];
export const plazaBenches = [
  [310, 400],
  [650, 400],
  [310, 495],
  [650, 495],
];
export const regionalBuildings = {
  downtown:[{id:'city-office',x:90,y:100,w:210,h:160,name:'CODEWORKS · R$'},{id:'devclub',x:375,y:70,w:210,h:170,name:'DEVCLUB'},{id:'city-shop',x:665,y:100,w:200,h:160,name:'Loja Do Centro'}],
  usa:[{id:'us-office',x:180,y:110,w:220,h:170,name:'FULL STACK LAB · US$'},{id:'us-shop',x:590,y:110,w:210,h:170,name:'PREMIUM STORE · US$'}],
};
regionalBuildings.downtown.push({id:'stadium',x:46,y:535,w:360,h:99,entrance:'north',name:'Estádio de Competição'});
export const allBuildings=[...buildings,...plazaBuildings,...Object.values(regionalBuildings).flat()];
export const outdoor = scene => ['city','plaza','downtown','usa'].includes(scene);
export const onRoad = position => ['downtown','usa'].includes(position.map)
  ? (position.y>=355&&position.y<=485)||(position.x>=455&&position.x<=505&&position.y>=345)
  : position.map==='plaza' ? position.y>=542&&position.y<=598 : position.map==='city'&&position.y>=394&&position.y<=446;
export const sceneBuildings = (scene) => (regionalBuildings[scene] || (scene === 'plaza' ? plazaBuildings : buildings));
export function travelPassage(position) {
  const corridors={city:[370,420,475],plaza:[510,570,624],downtown:[322,420,518],usa:[322,420,518]};
  const from=corridors[position.map];
  if(!from||position.y<from[0]||position.y>from[2])return null;
  const destination=(map,x)=>{const to=corridors[map],side=position.y<from[1]?0:2;return {map,x,y:to[1]+(position.y-from[1])*(to[side]-to[1])/(from[side]-from[1])}};
  if(position.map==='downtown'&&position.x>870)return {label:'USA',access:'usa',destination:destination('usa',110)};
  if(position.map==='downtown'&&position.x<90)return {label:'Praça',access:'plaza',destination:destination('plaza',850)};
  if(position.map==='usa'&&position.x<90)return {label:'Centro de DevCity',access:'downtown',destination:destination('downtown',850)};
  if(position.map==='city'&&position.x>860)return {label:'Praça',access:'plaza',destination:destination('plaza',110)};
  if(position.map==='plaza'&&position.x>870)return {label:'Centro',access:'downtown',destination:destination('downtown',110)};
  if(position.map==='plaza'&&position.x<100)return {label:'DevCity',destination:destination('city',840)};
  return null;
}
export const trees = [
  ...Array.from({ length: 35 }, (_, i) => [20 + i * 28, 75 + (i % 3) * 14]),
  [34, 190],
  [71, 239],
  [36, 320],
  [917, 184],
  [918, 278],
  [917, 350],
  [54, 556],
  [105, 605],
  [689, 591],
  [751, 612],
  [847, 589],
  [912, 596],
];
export const bushes = [
  [79, 484],
  [313, 482],
  [363, 263],
  [634, 260],
  [665, 481],
  [830, 535],
  [356, 541],
  [606, 554],
  [72, 280],
  [888, 252],
];
export const stations = {
  plaza: [],
  library: [
    {
      id: 'library-computer',
      x: 586,
      y: 278,
      w: 116,
      h: 48,
      label: 'E · Ler livros de programação',
    },
  ],
  house: [
    { id: 'notebook', x: 615, y: 280, w: 84, h: 44, label: 'E · Sentar e praticar' },
    { id: 'wardrobe', x: 267, y: 240, w: 68, h: 75, label: 'E · Decorar minha casa' },
    { id: 'bed', x: 260, y: 358, w: 96, h: 114, label: 'E · Dormir até mudar o período' },
  ],
  school: [{ id: 'teacher', x: 480, y: 246, w: 30, h: 20, label: 'E · Falar com a professora' }],
  office: [
    {
      id: 'recruiter',
      x: 308,
      y: 288,
      w: 28,
      h: 20,
      label: 'E · Recrutamento e avaliação de cargo',
    },
    { id: 'terminal', x: 628, y: 288, w: 76, h: 42, label: 'E · Abrir ticket de trabalho' },
  ],
  shop: [{ id: 'counter', x: 372, y: 290, w: 216, h: 40, label: 'E · Conversar com o vendedor' }],
};
stations.downtown=[];stations.usa=[];
stations['city-office']=[{id:'city-terminal',x:628,y:288,w:76,h:42,label:'E · Contratos em reais'}];
stations['us-office']=[{id:'us-terminal',x:628,y:288,w:76,h:42,label:'E · Contratos Full Stack'}];
stations['city-shop']=[{id:'city-counter',x:372,y:290,w:216,h:40,label:'E · Loja em reais'}];
stations['us-shop']=[{id:'us-counter',x:372,y:290,w:216,h:40,label:'E · Loja em dólares'}];
export const devClubComputers = [
  {track:'node',x:246,screen:'Node.js'},
  {track:'react',x:373,screen:'React'},
  {track:'ts-front',x:500,screen:'TS Front-end'},
  {track:'ts-back',x:627,screen:'TS Back-end'},
];
stations.devclub = devClubComputers.map(({track,x,screen}) => ({
  id:`${track}-computer`, x:x-14, y:269, w:115, h:72, label:`E · Usar computador ${screen}`,
}));
stations.stadium=Array.from({length:6},(_,i)=>({id:'competition-computer',x:260+(i%3)*145,y:235+Math.floor(i/3)*125,w:80,h:55,label:'E · Competição mensal · Enviar projeto'}));
// A estação administrativa só é exibida e autorizada para a conta com o papel administrativo.
export const adminStation={id:'competition-admin',x:410,y:350,w:85,h:55,label:'E · Administrar competição'};

const box = (x, y, w, h) => ({ x, y, w, h });
export const seats = {
  city: [
    { x: 610, y: 480 },
    { x: 358, y: 343 },
  ],
  plaza: plazaBenches.map(([x, y]) => ({ x, y })),
  house: [
    { x: 468, y: 281, sofa: true },
    { x: 655, y: 348 },
  ],
  school: Array.from({ length: 6 }, (_, i) => ({
    x: 314 + (i % 3) * 145,
    y: 379 + Math.floor(i / 3) * 85,
  })),
  office: [
    { x: 663, y: 349 },
    { x: 305, y: 447 },
    { x: 627, y: 447 },
  ],
  library: [
    { x: 644, y: 349 },
    { x: 335, y: 436 },
    { x: 500, y: 436 },
  ],
  shop: [],
  devclub:devClubComputers.map(({x}) => ({x:x+37,y:383})),
};
export function seatAt(position, scene) {
  return seats[scene]?.find(
    (seat) =>
      Math.abs(position.x - seat.x) < (seat.sofa ? 65 : 30) &&
      position.y >= seat.y + 15 &&
      position.y < seat.y + 60,
  );
}
// A arte e as colisões usam as mesmas posições para portas, móveis e pontos de interação.
export function obstacles(scene = 'city', open = false, equipped = [],isAdmin=false) {
  if(regionalBuildings[scene]) return [
    ...boardObstacles(scene),
    ...regionalBuildings[scene].map(b=>b.entrance==='north'?box(b.x,b.y,b.w,b.h):box(b.x-3,b.y+24,b.w+6,b.h-24)),
    ...(streetLamps[scene]||[]).map(([x,y])=>box(x-5,y-3,10,8)),
    ...regionalTrees.map(([x,y])=>box(x-9,y-15,18,23)),
  ];
  if (scene === 'plaza')
    return [
      ...boardObstacles(scene),
      ...plazaBuildings.map((b) => box(b.x - 3, b.y + 24, b.w + 6, b.h - 24)),
      ...plazaTrees.map(([x, y]) => box(x - 9, y - 15, 18, 23)),
      ...plazaBenches.map(([x, y]) => box(x - 29, y - 5, 58, 23)),
      ...streetLamps.plaza.map(([x,y])=>box(x-5,y-3,10,8)),
      box(414, 379, 132, 105),
      box(32, 50, 14, 450),
    ];
  if (!outdoor(scene)) {
    const furniture = {
      library: [
        box(242, 205, 78, 64),
        box(352, 205, 78, 64),
        box(462, 205, 78, 64),
        box(275, 371, 120, 36),
        box(440, 371, 120, 36),
      ],
      house: [box(260, 358, 96, 114), box(641, 352, 28, 22)],
      school: [
        ...Array.from({ length: 6 }, (_, i) =>
          box(280 + (i % 3) * 145, 330 + Math.floor(i / 3) * 85, 68, 34),
        ),
        box(353, 201, 252, 18),
      ],
      office: [box(263, 385, 82, 44), box(585, 385, 82, 44)],
      shop: [box(251, 209, 63, 64), box(654, 209, 63, 64)],
    };
    const decor =
      scene === 'house'
        ? [
            box(403, 259, 130, 45),
            box(687, 404, 20, 12),
            box(695, 453, 20, 20),
            box(537, 201, 60, 63),
            box(522, 423, 60, 32),
            box(709, 242, 30, 57),
          ]
        : [];
    return [
      box(0, 0, 218, 640),
      box(742, 0, 218, 640),
      box(218, 0, 524, 188),
      box(218, 525, 524, 115),
      ...stations[scene].map((s) => box(s.x, s.y, s.w, s.h)),
      ...(seats[scene] || [])
        .filter((seat) => !seat.sofa)
        .map((seat) => box(seat.x - 10, seat.y + 5, 20, 22)),
      ...(furniture[scene] || []),
      ...(scene==='house'&&isAdmin?[box(adminStation.x,adminStation.y,adminStation.w,adminStation.h)]:[]),
      ...decor,
    ];
  }
  return [
    ...boardObstacles(scene),
    ...buildings.map((b) => box(b.x - 3, b.y + 24, b.w + 6, b.h - 24)),
    ...trees.map(([x, y]) => box(x - 9, y - 15, 18, 23)),
    ...bushes.map(([x, y]) => box(x - 17, y - 6, 34, 18)),
    box(72, 248, 240, 29),
    box(552, 298, 98, 73),
    box(584, 477, 52, 19),
    box(332, 338, 52, 19),
    ...streetLamps.city.map(([x, y]) => box(x - 5, y - 3, 10, 8)),
    box(631, 340, 22, 14),
    box(725, 488, 22, 14),
    box(884, 50, 35, 310),
    box(884, 485, 35, 155),
    ...(!open ? [box(884, 360, 35, 125)] : []),
  ];
}
export const plazaReturn = { x: 840, y: 420, map: 'city' };
export function blocked(position, scene = 'city', open = false, equipped = [],isAdmin=false) {
  equipped = equippedBases(equipped);
  const { x, y } = position;
  const bounds = outdoor(scene)
    ? { left: 15, right: 945, top: 50, bottom: 624 }
    : { left: 228, right: 732, top: 195, bottom: 518 };
  if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return true;
  return obstacles(scene, open, equipped,isAdmin).some(
    (b) => x + 9 > b.x && x - 9 < b.x + b.w && y + 3 > b.y && y - 7 < b.y + b.h,
  );
}
// Divide o deslocamento em passos pequenos. Assim, um quadro lento não atravessa uma parede.
export function move(position, dx, dy, scene = 'city', open = false, equipped = [],isAdmin=false) {
  let next = { ...position };
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3));
  for (let i = 0; i < steps; i++) {
    const a = { ...next, x: next.x + dx / steps };
    if (!blocked(a, scene, open, equipped,isAdmin)) next = a;
    const b = { ...next, y: next.y + dy / steps };
    if (!blocked(b, scene, open, equipped,isAdmin)) next = b;
  }
  return next;
}
export function doorAt(position, scene = 'city') {
  return sceneBuildings(scene).find(
    (b) =>
      Math.abs(position.x - (b.x + b.w / 2)) < 17 &&
      (b.entrance==='north' ? position.y>=b.y-26&&position.y<=b.y : position.y>=b.y+b.h+7&&position.y<=b.y+b.h+32),
  );
}
export function stationAt(position, scene) {
  return stations[scene]?.find(
    (s) =>
      position.x > s.x - 34 &&
      position.x < s.x + s.w + 34 &&
      position.y > s.y - 24 &&
      position.y < s.y + s.h + 35,
  );
}
export function exitAt(p) {
  return Math.abs(p.x - 480) < 24 && p.y > 492;
}
export function safePosition(p, open = true, equipped = []) {
  const scene = stations[p.map] ? p.map : 'city';
  const fallback =
    scene === 'city' ? { x: 430, y: 450, map: 'city' } : { x: 480, y: 485, map: scene };
  const outside = scene === 'plaza' ? { x: 95, y: 420, map: 'plaza' } : fallback;
  if (!open && (scene === 'plaza' || scene === 'library' || (scene === 'city' && p.x > 875)))
    return { x: 430, y: 450, map: 'city' };
  return blocked(p, scene, open, equipped) ? outside : { ...p, map: scene };
}
