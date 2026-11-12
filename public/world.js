import {drawVehicle,vehicleMapScale} from './vehicle-art.js';
import {drawLaptop} from './laptop.js';
import {trafficAt} from './traffic.js';
import {activeVehicle} from './vehicle-control.js';
import {
  trees,
  streetLamps,
  competitionBoards,
  adminStation,
  lampBulb,
  bushes,
  stations,
  seats,
  plazaBuildings,
  outdoor,
  regionalBuildings,
  regionalTrees,
  plazaTrees,
  plazaBenches,
  devClubComputers,
} from './navigation.js';
import { itemModel, baseItemId, equippedBases, equippedModel } from './shop-models.js';
// Mundo ilustrado original: formas orgânicas, materiais e luz, sem recursos externos.
// As rotinas de desenho compartilham o contexto escolhido pela função de entrada.
let g;
let rasterScenery = false;
const scenerySprites = new Map();
let sceneryPixels = 0;
// Reutiliza formas estáticas, mantendo cada objeto na sua camada de profundidade.
function scenerySprite(key,x,y,bounds,paint) {
  if(!rasterScenery){paint();return;}
  let sprite=scenerySprites.get(key);
  if(!sprite){
    const [left,top,width,height]=bounds,canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const previous=g;g=canvas.getContext('2d');g.translate(-x-left,-y-top);
    rasterScenery=false;
    try{paint();}finally{g=previous;rasterScenery=true;}
    // Aproximadamente 12 MB, mesmo depois de visitar todos os mapas.
    while(sceneryPixels+width*height>3_000_000&&scenerySprites.size){
      const oldest=scenerySprites.keys().next().value,old=scenerySprites.get(oldest);
      sceneryPixels-=old.canvas.width*old.canvas.height;scenerySprites.delete(oldest);
    }
    sprite={canvas,left,top};scenerySprites.set(key,sprite);sceneryPixels+=width*height;
  }
  g.drawImage(sprite.canvas,x+sprite.left,y+sprite.top);
}
let activeStyle;
const styleColors = {
  bed: [
    ['#84acb5', '#8a7765', '#b0a28a'],
    ['#577c93', '#807965'],
    ['#acc9c9', '#faf0d6', '#c4dfdb'],
  ],
  sofa: [
    ['#cfab96', '#d1ad96'],
    ['#997e70', '#b18e7b', '#b3937e'],
    ['#91a6a0', '#d9be95'],
  ],
  rug: [['#719ea8', '#abc4c1'], ['#5a8495'], ['#dce5cf']],
  shelf: [['#bc9d76'], ['#927353', '#715840'], ['#d9b58a']],
  books: [
    ['#bc9d76', '#91b6ad', '#9c9dba'],
    ['#927353', '#715840'],
    ['#bf9688', '#d3ba89', '#d9b58a'],
  ],
  desk: [['#c9a078', '#ad8764'], ['#9a7557', '#6e594b'], ['#efcfab']],
  chair: [['#80dfd0', '#77c7ba', '#385e70'], ['#29384f', '#29465a'], ['#809ba7']],
  monitor: [['#6193a6'], ['#2d4353', '#375578'], ['#88c9d0', '#b1d5bd']],
  keyboard: [['#8fcbbd'], ['#364c59'], []],
  speaker: [['#344c5b'], ['#172b35'], ['#a7c1b8']],
  plant: [['#e4baa0', '#9dc296'], ['#ae7760', '#448478'], ['#c5977b']],
  lamp: [['#ffe3b4'], ['#d6b07c', '#947956'], ['#edd0a1']],
  poster: [['#93b0a1', '#d9ae77'], ['#72594a', '#668d8b'], ['#e8ddc1']],
  curtains: [['#f0dcc1'], ['#c7a58a', '#b99173'], []],
  mug: [['#e7c28e'], ['#e1ba88'], []],
  clock: [['#dac9aa'], ['#496168'], ['#f3e9d4']],
  neon: [['#91ffee', '#79f2de'], ['#254450'], []],
  cap: [['#d5b16b'], ['#b89254'], []],
  headphones: [['#608a95'], ['#4a6876'], []],
  wardrobe: [
    ['#c9a47c', '#b8926d'],
    ['#957350', '#785b45'],
    ['#e3bd8f', '#f1d5a6'],
  ],
};
function styledColor(color) {
  if (!activeStyle || typeof color !== 'string') return color;
  const groups = styleColors[activeStyle.slot] || [];
  const index = groups.findIndex((group) => group.includes(color.slice(0, 7)));
  return index < 0
    ? color
    : [activeStyle.color, activeStyle.dark, activeStyle.light][index] + color.slice(7);
}
function withItemStyle(item, draw) {
  const previous = activeStyle;
  activeStyle = item;
  try {
    draw();
  } finally {
    activeStyle = previous;
  }
}
let clubLogo;
if (typeof Image !== 'undefined') {
  clubLogo = new Image();
  clubLogo.src = './logo-devclub.png?v=master-symbol';
}
function logo(x, y, w, h = w) {
  if (clubLogo?.complete && clubLogo.naturalWidth) {
    const scale = Math.min(w/clubLogo.naturalWidth,h/clubLogo.naturalHeight);
    const width = clubLogo.naturalWidth*scale, height = clubLogo.naturalHeight*scale;
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(clubLogo,x+(w-width)/2,y+(h-height)/2,width,height);
    g.restore();
  }
  else {
    box(x, y, w, h, '#54009a', 2);
    text('DC', x + w / 2, y + h * 0.7, '#64ff36', Math.max(5, w * 0.4));
  }
}
function finishDetail(x, y, w, h) {
  const item = activeStyle;
  if (!item || item.variant < 2) return;
  g.save();
  if (item.variant === 5) {
    g.shadowColor = '#64ff36';
    g.shadowBlur = 8;
  }
  const color = item.light;
  // Costuras, painéis e iluminação acompanham a progressão do material.
  if (item.variant === 2) {
    line(x + 3, y + h - 4, x + w - 3, y + h - 4, color + '99', 2);
    for (let i = 0; i < 3; i++) line(x + 5 + i * 6, y + 3, x + 5 + i * 6, y + 9, color, 1);
  }
  if (item.variant === 3) {
    box(x + 2, y + 2, w - 4, h - 4, '#ffffff00', Math.min(9, h / 4), color + 'aa');
    line(x + w / 2, y + 3, x + w / 2, y + h - 3, color + '77');
  }
  if (item.variant === 4) {
    for (let i = 0; i < 4; i++)
      box(x + 3 + (i * (w - 6)) / 4, y + h - 6, (w - 10) / 4, 3, color + '99', 1);
    poly(
      [
        [x + w - 15, y + 3],
        [x + w - 4, y + 3],
        [x + w - 4, y + 14],
      ],
      color + '88',
    );
  }
  if (item.variant === 5) {
    line(x + 3, y + 3, x + w - 3, y + 3, color, 2);
    line(x + 3, y + h - 3, x + w - 3, y + h - 3, color, 2);
    line(x + w - 3, y + 3, x + w - 3, y + h - 3, color, 1);
    for (let i = 0; i < 3; i++) box(x + 5 + i * 5, y + h - 8, 3, 2, color, 0);
  }
  if (item.variant === 6) {
    box(x + 2, y + 2, w - 4, h - 4, '#ffffff00', Math.min(8, h / 4), color + 'aa');
    line(x + 4, y + h - 5, x + w - 4, y + h - 5, color, 2);
    for (let i = 0; i < 4; i++) box(x + 4 + i * 5, y + 4, 2, 2, color, 0);
  }
  g.restore();
}
const W = 960,
  H = 640;
function gradient(x, y, h, a, b) {
  const c = g.createLinearGradient(x, y, x, y + h);
  c.addColorStop(0, styledColor(a));
  c.addColorStop(1, styledColor(b));
  return c;
}
function box(x, y, w, h, c, r = 0, stroke) {
  g.fillStyle = styledColor(c);
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
  if (stroke) {
    g.strokeStyle = styledColor(stroke);
    g.lineWidth = 1;
    g.stroke();
  }
}
function oval(x, y, rx, ry, c) {
  g.fillStyle = styledColor(c);
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
function poly(points, c, stroke) {
  g.beginPath();
  for (let i = 0; i < points.length; i++) g[i ? 'lineTo' : 'moveTo'](...points[i]);
  g.closePath();
  g.fillStyle = styledColor(c);
  g.fill();
  if (stroke) {
    g.strokeStyle = styledColor(stroke);
    g.lineWidth = 1;
    g.stroke();
  }
}
function line(x, y, x2, y2, c, w = 1) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = styledColor(c);
  g.lineWidth = w;
  g.lineCap = 'round';
  g.stroke();
}
function text(s, x, y, c = '#f4e7ce', size = 12, weight = 600) {
  g.fillStyle = styledColor(c);
  g.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  g.textAlign = 'center';
  g.fillText(s, x, y);
}
function shade(x, y, rx, ry) {
  oval(x + 5, y + 4, rx, ry, '#16363526');
  oval(x, y, rx * 0.72, ry * 0.65, '#142f3420');
}
function tree(x, y, v = 0) {
  if(rasterScenery)return scenerySprite(`tree:${Number(!!v)}`,x,y,[-52,-110,104,128],()=>tree(x,y,v));
  shade(x + 13, y, 35, 11);
  box(x - 6, y - 40, 13, 44, gradient(x, y - 40, 44, '#a9855e', '#654735'), 4);
  line(x, y - 29, x - 10, y - 48, '#795237', 5);
  line(x + 1, y - 32, x + 14, y - 53, '#795237', 4);
  const colors = v ? ['#5d805c', '#83a06c', '#a3b87a'] : ['#376f63', '#538f74', '#81ae83'];
  const blobs = [
    [-21, -52, 23, 22],
    [22, -53, 23, 21],
    [0, -71, 30, 26],
    [-3, -47, 35, 25],
  ];
  for (const [dx, dy, rx, ry] of blobs) {
    oval(x + dx, y + dy, rx + 1, ry + 1, '#31594e');
    oval(x + dx, y + dy - 2, rx, ry, gradient(x, y + dy - ry, ry * 2, colors[1], colors[0]));
  }
  oval(x - 12, y - 77, 17, 10, colors[2] + '88');
  oval(x + 13, y - 63, 13, 8, colors[2] + '55');
  for (let i = 0; i < 10; i++)
    oval(x - 26 + ((i * 19) % 55), y - 76 + ((i * 13) % 46), 3, 1.5, colors[2] + '70');
}
function bush(x, y) {
  shade(x, y + 5, 21, 7);
  for (const [dx, dy, r] of [
    [-12, 0, 12],
    [10, -1, 14],
    [0, -7, 14],
  ])
    oval(x + dx, y + dy, r, r * 0.65, gradient(x, y - 20, 30, '#8aa46c', '#50765b'));
  for (let i = 0; i < 5; i++) oval(x - 11 + i * 6, y - 7 + (i % 2) * 4, 2, 2, '#d9c88b');
}
function plant(x, y, cactus = false) {
  shade(x, y + 3, 16, 6);
  poly(
    [
      [x - 13, y - 15],
      [x + 13, y - 15],
      [x + 9, y + 9],
      [x - 9, y + 9],
    ],
    gradient(x, y - 15, 24, '#e4baa0', '#ae7760'),
  );
  oval(x, y - 15, 14, 4, '#c5977b');
  oval(x, y - 15, 10, 2.5, '#645344');
  if (cactus) {
    box(x - 6, y - 52, 12, 40, '#64987e', 6);
    box(x - 15, y - 40, 8, 21, '#7ba687', 4);
    line(x - 10, y - 23, x, y - 23, '#7ba687', 6);
    box(x + 8, y - 46, 8, 20, '#8bb28f', 4);
    line(x + 9, y - 27, x, y - 27, '#8bb28f', 6);
    line(x - 1, y - 46, x - 1, y - 18, '#b6c59b', 1);
  } else {
    line(x, y - 14, x, y - 65, '#5a8467', 3);
    for (const [dx, dy] of [
      [-12, -38],
      [12, -50],
      [-10, -61],
      [13, -28],
    ]) {
      g.save();
      g.translate(x + dx, y + dy);
      g.rotate(dx > 0 ? -0.55 : 0.55);
      oval(0, 0, 14, 7, gradient(0, -8, 18, '#9dc296', '#448478'));
      line(-10, 0, 10, 0, '#bfd1a660');
      g.restore();
      line(x, y + dy + 7, x + dx, y + dy, '#568b6e', 2);
    }
  }
  finishDetail(x - 11, y - 15, 22, 16);
}
function window(x, y, w, h, curtains = false) {
  box(x - 4, y - 4, w + 8, h + 10, '#816c59', 3);
  box(x - 2, y - 2, w + 4, h + 5, '#e9d8b5', 2);
  box(x, y, w, h, gradient(x, y, h, '#9bc8cb', '#5790a0'), 2);
  poly(
    [
      [x + 3, y + 3],
      [x + w - 3, y + 3],
      [x + 3, y + h - 3],
    ],
    '#e5f2df4a',
  );
  line(x + w / 2, y, x + w / 2, y + h, '#ecdec1', 3);
  line(x, y + h * 0.53, x + w, y + h * 0.53, '#ecdec1', 3);
  box(x - 7, y + h, w + 14, 5, '#f0dfbd', 2);
  if (curtains) {
    box(x - 11, y - 6, 12, h + 10, gradient(x, y, h, '#f0dcc1', '#c7a58a'), 4);
    box(x + w - 1, y - 6, 12, h + 10, gradient(x, y, h, '#f0dcc1', '#c7a58a'), 4);
    line(x - 3, y - 2, x - 3, y + h, '#b9917355', 1);
    line(x + w + 5, y - 2, x + w + 5, y + h, '#b9917355', 1);
    line(x - 14, y - 8, x + w + 14, y - 8, '#6f5748', 3);
  }
  finishDetail(x - 4, y - 4, w + 8, h + 10);
}
function roof(x, y, w, h, color) {
  shade(x + w / 2, y + h, w * 0.55, 9);
  poly(
    [
      [x - 12, y + h],
      [x + 20, y],
      [x + w - 20, y],
      [x + w + 12, y + h],
    ],
    gradient(x, y, h, color, '#465c62'),
    '#334e55',
  );
  for (let yy = 7; yy < h - 4; yy += 8) {
    const inset = 20 * (1 - yy / h);
    for (let xx = x + inset; xx < x + w - inset; xx += 18) {
      box(xx, y + yy, 17, 6, '#ffffff0d', 1);
      line(xx, y + yy + 6, Math.min(xx + 17, x + w - inset), y + yy + 6, '#122d3c24');
    }
  }
  line(x + 20, y, x + w - 20, y, '#ffffff35', 3);
  line(x - 12, y + h, x + w + 12, y + h, '#334c51', 5);
  box(x - 10, y + h + 1, w + 20, 4, '#d7caae', 1);
}
function sign(s, x, y, w, c = '#f5e9c7') {
  shade(x, y + 19, w / 2, 4);
  box(x - w / 2, y, w, 26, '#253f49', 5, '#a9bcac66');
  box(x - w / 2 + 3, y + 3, w - 6, 1, '#e6e2c633');
  text(s, x, y + 18, c, 11);
}
function facade(b, state) {
  if(rasterScenery){
    const color=state.completed.includes('css-color')||state.completed.includes('school-css-beginner-1');
    const logoReady=b.id==='devclub'&&!!clubLogo?.naturalWidth;
    return scenerySprite(`facade:${b.id}:${b.name}:${b.w}:${b.h}:${color}:${logoReady}`,b.x,b.y,[-70,-42,b.w+140,b.h+90],()=>facade(b,state));
  }
  const { x, y, w, h, id } = b;
  const wall =
    id === 'office'
      ? '#b6cbd0'
      : id === 'house'
        ? '#e3c8a6'
        : id === 'school'
          ? '#e7dbc0'
          : '#dfc7a4';
  shade(x + w / 2 + 8, y + h, w * 0.58, 16);
  box(x - 7, y + h - 10, w + 14, 17, '#9eaa9a', 3);
  box(
    x,
    y + 32,
    w,
    h - 43,
    gradient(x, y + 32, h - 43, wall, id === 'office' ? '#91aab5' : '#c3aa8b'),
    3,
  );
  box(x + 3, y + 35, w - 6, 6, '#fff7d122');
  for (let yy = y + 65; yy < y + h - 16; yy += 11) line(x + 3, yy, x + w - 3, yy, '#7b6a5720');
  box(x + w - 12, y + 35, 12, h - 49, '#4d625f1c');
  roof(
    x,
    y - 16,
    w,
    id === 'shop' ? 55 : 68,
    id === 'house'
      ? '#c18a75'
      : id === 'school'
        ? '#8095b0'
        : id === 'office'
          ? '#65808f'
          : '#83a187',
  );
  if (id === 'house') {
    box(x + w - 47, y - 28, 18, 34, '#917563', 2);
    box(x + w - 49, y - 30, 22, 6, '#c7a98a', 2);
  }
  const winY = y + (id === 'shop' ? 68 : 80);
  window(x + 20, winY, 32, Math.min(35, h - 83));
  window(x + w - 52, winY, 32, Math.min(35, h - 83));
  if (id === 'house' || id === 'school') {
    for (const wx of [x + 15, x + w - 61]) {
      box(wx, winY + 42, 47, 10, '#a8866d', 2);
      for (let i = 0; i < 7; i++) {
        oval(wx + 5 + i * 6, winY + 41, 5, 4, '#6e9470');
        oval(wx + 7 + i * 6, winY + 38, 2, 2, i % 2 ? '#e8b4a4' : '#e9d399');
      }
    }
  }
  if (id === 'shop') {
    box(x + 9, y + 44, w - 18, 25, '#e8d6b7', 2);
    for (let i = 0; i < 9; i++) {
      box(x + 9 + (i * (w - 18)) / 9, y + 44, (w - 18) / 9, 25, i % 2 ? '#f0debb' : '#c28c78', 2);
    }
    line(x + 9, y + 43, x + w - 9, y + 43, '#947a63', 2);
  }
  const dx = x + w / 2;
  box(dx - 20, y + h - 44, 40, 39, '#78644f', 4);
  box(dx - 15, y + h - 41, 30, 36, gradient(dx, y + h - 41, 36, '#789aa0', '#3c626f'), 3);
  box(dx - 11, y + h - 37, 22, 20, '#a5cbcd66', 2);
  line(dx, y + h - 37, dx, y + h - 17, '#d0e2d255', 2);
  oval(dx + 9, y + h - 12, 2, 2, '#ead29c');
  box(dx - 25, y + h - 5, 50, 5, '#e6dac0', 2);
  box(dx - 28, y + h, 56, 4, '#a3aa98', 1);
  if(id==='devclub'){
    box(dx-26,y+75,52,48,'#281143',6,'#a6ed64');
    logo(dx-20,y+79,40,40);
  }
  sign(
    id === 'school' ? 'ESCOLA DEV' : b.name,
    dx,
    y + (id === 'shop' ? 21 : 47),
    id === 'school' ? 174 : 130,
    id === 'school' &&
      (state.completed.includes('css-color') || state.completed.includes('school-css-beginner-1'))
      ? '#67e8f9'
      : undefined,
  );
}
function lamp(x, y) {
  if(rasterScenery)return scenerySprite('lamp',x,y,[-22,-78,44,94],()=>lamp(x,y));
  shade(x, y + 2, 12, 5);
  box(x - 3, y - 43, 6, 45, '#42616a', 2);
  box(x - 8, y - 3, 16, 5, '#4c6b6d', 2);
  box(x - 11, y - 63, 22, 19, '#37515e', 5);
  box(x+lampBulb.x,y+lampBulb.y,lampBulb.width,lampBulb.height,gradient(x,y+lampBulb.y,lampBulb.height,'#fff0bc','#e4bd7b'),3);
  poly(
    [
      [x - 13, y - 62],
      [x, y - 72],
      [x + 13, y - 62],
    ],
    '#37515e',
  );
}
function bench(x, y) {
  if(rasterScenery)return scenerySprite('bench',x,y,[-42,-32,84,58],()=>bench(x,y));
  shade(x, y + 12, 31, 7);
  box(x - 27, y - 20, 54, 15, gradient(x, y - 20, 15, '#c49b77', '#9c775b'), 3);
  line(x - 24, y - 12, x + 24, y - 12, '#e3c19a', 1);
  box(x - 29, y + 1, 58, 11, '#ad8765', 3);
  line(x - 26, y + 3, x + 26, y + 3, '#e3c19a', 2);
  line(x - 22, y - 7, x - 22, y + 18, '#4f6867', 3);
  line(x + 22, y - 7, x + 22, y + 18, '#4f6867', 3);
}
// Usa o mesmo personagem no cenário, no retrato e nas miniaturas da loja.
function person(
  x,
  y,
  skin,
  shirt,
  walk = 0,
  direction = 'down',
  equipped = [],
  gender = 'male',
  hair = '#51423f',
  pants = '#385263',
  hairstyle = 'short',
  posture = 'standing',
) {
  const outfit = equipped;
  const hairModel = equippedModel(outfit, 'hairstyle');
  hairstyle = hairModel
    ? ['short', 'curly', 'bob', 'ponytail', 'mohawk', 'curly'][Math.max(0, hairModel.variant - 1)]
    : hairstyle;
  if (hairModel && !hairModel.common) hair = hairModel.color;
  pants = equippedModel(outfit, 'pants')?.color || pants;
  equipped = equippedBases(equipped);
  const step = walk ? Math.sin(walk) * 3 : 0;
  const bob = walk ? Math.abs(Math.sin(walk)) * 1.2 : 0;
  shade(x, y, 14, 5);
  g.save();
  g.translate(x, y - bob);
  if (hairstyle === 'bob' || (gender === 'female' && hairstyle === 'short')) {
    oval(-8, -40, 7, 20, hair);
    oval(8, -40, 7, 20, hair);
  }
  const side = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  box(-9, -15 + step, 7, 15, pants, 3);
  box(2, -15 - step, 7, 15, pants, 3);
  const trousers = equippedModel(outfit, 'pants');
  if (trousers?.variant > 1) {
    line(-7, -12 + step, -7, -3 + step, trousers.light, 1);
    line(6, -12 - step, 6, -3 - step, trousers.light, 1);
  }
  box(-10, -2 + step, 9, 5, '#233b47', 2);
  box(2, -2 - step, 10, 5, '#233b47', 2);
  box(-13, -32 - step, 6, 20, gradient(0, -32, 20, shirt, '#456274'), 3);
  box(8, -32 + step, 6, 20, gradient(0, -32, 20, shirt, '#456274'), 3);
  oval(-10, -12 - step, 3, 4, skin);
  oval(11, -12 + step, 3, 4, skin);
  box(-11, -33, 22, 21, gradient(0, -33, 22, shirt, '#30495a'), 6);
  box(-7, -32, 14, 5, '#ffffff24', 3);
  const clothing = equippedModel(outfit, 'shirt');
  if (clothing?.variant) {
    box(-9, -22, 18, 3, clothing.light, 1);
    text(['✦', '↗', '◇', '≈', '★', '◆'][clothing.variant - 1], 5, -25, clothing.light, 7);
    if (clothing.variant > 1) box(-7, -20, 14, 6, clothing.dark, 2);
    if (clothing.variant === 6) logo(-8, -32, 16, 16);
    if (gender === 'female' && clothing.variant > 1) {
      line(-8, -14, -5, -19, clothing.light, 1);
      line(8, -14, 5, -19, clothing.light, 1);
    }
  }
  box(-4, -37, 8, 7, skin, 2);
  oval(0, -45, 12, 14, hair);
  oval(side, -43, 10, 12, gradient(0, -55, 24, '#f9dbbf', skin));
  oval(-10, -43, 3, 4, skin);
  oval(10, -43, 3, 4, skin);
  g.beginPath();
  g.moveTo(-12, -47);
  g.bezierCurveTo(-13, -60, 9, -64, 12, -48);
  g.lineTo(6, -45);
  g.lineTo(3, -50);
  g.lineTo(-2, -45);
  g.closePath();
  g.fillStyle = hair;
  g.fill();
  if (hairstyle === 'curly')
    for (let i = 0; i < 7; i++) oval(-10 + i * 3.3, -53 - (i % 2) * 3, 4, 4, hair);
  if (hairstyle === 'ponytail') {
    oval(direction === 'left' ? 10 : -10, -50, 6, 7, hair);
    oval(direction === 'left' ? 14 : -14, -40, 5, 11, hair);
    box(-10, -54, 20, 3, '#75ac89', 2);
  }
  if (hairstyle === 'mohawk') {
    box(-4, -65, 8, 18, hair, 3);
    line(-3, -62, 3, -62, '#64ff36', 1);
  }
  if (hairstyle === 'bob') {
    oval(-11, -43, 4, 13, hair);
    oval(11, -43, 4, 13, hair);
  }
  if (direction === 'up') oval(0, -46, 11, 11, hair);
  else {
    if (side <= 0) oval(-4 + side, -43, 1.5, 2, '#283b42');
    if (side >= 0) oval(4 + side, -43, 1.5, 2, '#283b42');
    line(-2 + side, -37, 2 + side, -37, '#b87965', 1);
    oval(-6, -39, 2, 1, '#d6967f88');
    oval(6, -39, 2, 1, '#d6967f88');
  }
  if (equipped.includes('cap')) {
    withItemStyle(equippedModel(outfit, 'cap'), () => {
      oval(0, -53, 12, 6, '#d5b16b');
      box(-12, -57, 24, 7, '#d5b16b', 5);
      box(side > 0 ? 1 : -14, -51, 16, 3, '#b89254', 2);
      if (activeStyle) text('✦', 0, -52, activeStyle.light, 7);
      finishDetail(-11, -56, 22, 9);
    });
  }
  if (equipped.includes('headphones')) {
    withItemStyle(equippedModel(outfit, 'headphones'), () => {
      g.beginPath();
      g.arc(0, -47, 13, Math.PI, 0);
      g.strokeStyle = styledColor('#4a6876');
      g.lineWidth = 4;
      g.stroke();
      box(-15, -48, 6, 12, '#608a95', 3);
      box(9, -48, 6, 12, '#608a95', 3);
      finishDetail(-15, -49, 30, 13);
    });
  }
  const laptop=equippedModel(outfit,'laptop');
  if(laptop){
    const lx=side*7,ly=posture==='seated'?-7:-10;
    line(-10,-28,lx-17,ly+3,shirt,5);line(11,-28,lx+17,ly+3,shirt,5);
    drawLaptop(g,laptop,{x:lx,y:ly,scale:posture==='seated'?.68:.65,view:direction==='up'?'screen':'back',side:side!==0});
    oval(lx-17,ly+3,3,3,skin);oval(lx+17,ly+3,3,3,skin);
  }
  g.restore();
}
function shirtColor(state) {
  const model = equippedModel(state.equipped, 'shirt');
  if (model) return model.color;
  state = { ...state, equipped: state.equipped.map((id) => id.replace(/-female$/, '')) };
  return state.equipped.includes('shirt-mint')
    ? '#83bda1'
    : state.equipped.includes('shirt-orange')
      ? '#d78a67'
      : state.equipped.includes('shirt')
        ? '#a696d4'
        : state.shirt;
}
function drawPlayer(state, animation) {
  if (animation.hidePlayer) return;
  const vehicle=activeVehicle(state);
  if(vehicle&&!animation.seated){
    drawVehicle(g,vehicle,{x:state.position.x,y:state.position.y,scale:vehicleMapScale(vehicle),direction:animation.direction||'right',moving:!!animation.walk,time:animation.time||0,lowPower:rasterScenery,rider:{skin:state.skin,shirt:shirtColor(state)}});
    return;
  }
  if (animation.seated) {
    const seat = animation.seated;
    g.save();
    g.translate(seat.x, seat.y + 18);
    g.scale(1, 0.75);
    person(
      0,
      0,
      state.skin,
      shirtColor(state),
      0,
      'down',
      state.equipped,
      state.gender,
      state.hair,
      state.pants,
      state.hairstyle,
      'seated',
    );
    g.restore();
    line(seat.x - 7, seat.y + 12, seat.x - 12, seat.y + 18, state.pants || '#263c49', 5);
    line(seat.x + 7, seat.y + 12, seat.x + 12, seat.y + 18, state.pants || '#263c49', 5);
    return;
  }
  person(
    state.position.x,
    state.position.y,
    state.skin,
    shirtColor(state),
    animation.walk || 0,
    animation.direction || 'down',
    state.equipped,
    state.gender,
    state.hair,
    state.pants,
    state.hairstyle,
  );
}
export function drawAvatar(context, state, animation = {}) {
  g = context;
  g.save();
  if (!outdoor(state.position.map)) {
    g.translate(480, 330);
    g.scale(1.3, 1.3);
    g.translate(-480, -330);
  }
  const actors=[...onlineObjects(animation),{y:state.position.y,draw:()=>drawPlayer(state,animation)}];
  actors.sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw());
  drawOnlineNames(animation);
  drawLocalName(state,animation);
  g.restore();
}
function drawSeatHints(scene) {
  for (const seat of seats[scene] || []) {
    box(seat.x - 8, seat.y - 38, 16, 16, '#2e4855', 4);
    text('E', seat.x, seat.y - 26, '#f1dfb1', 10);
  }
}
let ground;
// O fundo da cidade é desenhado uma vez e reaproveitado nos quadros seguintes.
function makeGround() {
  ground = document.createElement('canvas');
  ground.width = W;
  ground.height = H;
  g = ground.getContext('2d');
  box(0, 0, W, H, gradient(0, 0, H, '#a3b48b', '#779d83'));
  for (let i = 0; i < 3600; i++) {
    const x = (i * 137) % 960,
      y = (i * 71) % 640;
    oval(x, y, 1 + (i % 3), 0.6, i % 2 ? '#d6dbac33' : '#417a6920');
  }
  for (let i = 0; i < 36; i++)
    oval((i * 151) % 960, (i * 113) % 640, 18 + (i % 37), 9 + (i % 23), '#c7ce9a0c');
  for (const [x, y, w, h] of [
    [0, 382, 960, 76],
    [449, 276, 78, 106],
    [180, 303, 32, 79],
    [759, 303, 32, 79],
  ]) {
    box(x - 4, y - 4, w + 8, h + 8, '#6b8e77', 3);
    box(x - 2, y - 2, w + 4, h + 4, '#f1e5c8', 3);
    box(x, y, w, h, '#c8bea7');
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    for (let yy = y + 2; yy < y + h; yy += 15)
      for (let xx = x - 20 + (yy % 30 ? 0 : 12); xx < x + w; xx += 25)
        box(xx, yy, 23, 13, gradient(xx, yy, 13, '#e1d6ba', '#c8bca3'), 3, '#abac9440');
    g.restore();
  }
  box(552, 298, 98, 73, '#adbda6', 14, '#edf0d077');
  box(558, 304, 86, 61, gradient(0, 304, 61, '#5e97a8', '#87c6c6'), 10);
  box(564, 310, 74, 49, '#9ad6ce', 8);
  oval(600, 335, 27, 15, '#bbdfcc44');
  bench(610, 480);
  bench(358, 343);
  for (const [x, y] of bushes) bush(x, y);
  for (let x = 72; x < 310; x += 18) {
    box(x, 249, 5, 28, '#d4c9ad', 2);
    oval(x + 2.5, 249, 2.5, 3, '#eee5c9');
  }
  line(74, 257, 311, 257, '#f2e6c9', 4);
  line(74, 270, 311, 270, '#bca98b', 3);
  for (let i = 0; i < 80; i++) {
    const x = 79 + ((i * 149) % 800),
      y = 107 + ((i * 83) % 489);
    if (
      (y > 375 && y < 465) ||
      (x > 365 && x < 655) ||
      (x > 80 && x < 315 && y > 300 && y < 490) ||
      (x > 660 && y > 280 && y < 500)
    )
      continue;
    line(x, y, x + 2, y - 6, '#4e8872', 1);
    for (let a = 0; a < 5; a++) {
      const r = (a * Math.PI * 2) / 5;
      oval(x + Math.cos(r) * 2.5, y - 6 + Math.sin(r) * 2.5, 2, 1.5, i % 2 ? '#e8d5a9' : '#edbfaf');
    }
    oval(x, y - 6, 1, 1, '#fff4c8');
  }
  // Pistas separadas das calçadas, com faixa central e travessias.
  box(0,382,960,76,'#3a4b59');
  box(456,458,58,27,'#d9d2bc');
  box(0,362,960,20,'#d9d2bc');box(0,458,960,20,'#d9d2bc');
  line(0,383,960,383,'#f2ebd2',3);line(0,457,960,457,'#f2ebd2',3);
  for(let x=0;x<960;x+=52)box(x,419,25,2,'#edcf81');
  for(let y=390;y<452;y+=15){box(365,y,24,7,'#f4f2df');box(610,y,24,7,'#f4f2df');}
  sign('DEV CITY', 602, 265, 102);
}
export function drawWorld(context, state, buildings, animation = {}) {
  rasterScenery=!!animation.lowPower;
  if (!ground) makeGround();
  g = context;
  g.clearRect(0, 0, W, H);
  g.drawImage(ground, 0, 0);
  drawStreetPassage(850,'PRAÇA',state.completed.includes('exam-javascript-beginner'),'→',420,{x:830,y:460});
  const objects = [
    {y:competitionBoards.city.y,draw:()=>drawCompetitionBoard('city',animation.competitionWinner)},
    ...streetLamps.city.map(([x,y])=>({y,draw:()=>lamp(x,y)})),
    ...trees.map(([x, y], i) => ({ y, draw: () => tree(x, y, i % 3 === 0) })),
    ...buildings.map((b) => ({ y: b.y + b.h, draw: () => facade(b, state) })),
    ...communityObjects(state,animation),
    { y: state.position.y, draw: () => drawPlayer(state, animation) },
  ];
  objects.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
  drawCommunityNames(state,animation);
  drawSeatHints('city');
  const t = animation.time || 0;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.ellipse(600, 334, 14 + i * 5 + Math.sin(t / 800) * 2, 7 + i * 3, 0, 0, Math.PI * 2);
    g.strokeStyle = '#def5e555';
    g.lineWidth = 1;
    g.stroke();
  }
  oval(600, 326, 8, 4, '#e6ebdb');
  box(597, 309, 6, 17, '#c8d9ce', 3);
  oval(600, 310, 7, 3, '#eff6dc');
  line(600, 309, 600, 302 + Math.sin(t / 250), '#effcea', 2);
  const light = g.createLinearGradient(0, 0, W, H);
  light.addColorStop(0, '#fff2c522');
  light.addColorStop(1, '#224b6910');
  box(0, 0, W, H, light);
}
function fence(x, from, to) {
  box(x - 9, from, 23, to - from, '#263e3826', 5);
  box(x - 5, from - 12, 5, to - from + 12, '#947558', 2);
  box(x + 3, from - 5, 5, to - from + 5, '#b59a77', 2);
  for (let y = from + 14; y <= to; y += 36) {
    box(x - 8, y - 23, 16, 26, '#8c6a4e', 3);
    box(x - 7, y - 23, 10, 25, gradient(x, y - 23, 25, '#ead4ad', '#b99a73'), 2);
    oval(x, y - 23, 8, 3, '#f2e1c2');
    line(x - 3, y - 18, x - 3, y - 2, '#fff1cc77', 1);
  }
}
let plazaGround;
export function drawPlaza(context, state, animation = {}) {
  rasterScenery=!!animation.lowPower;
  if (!plazaGround) {
    plazaGround = document.createElement('canvas');
    plazaGround.width = W;
    plazaGround.height = H;
    g = plazaGround.getContext('2d');
    box(0, 0, W, H, gradient(0, 0, H, '#b4c798', '#719d84'));
    for (let i = 0; i < 1800; i++) oval((i * 137) % W, (i * 71) % H, 1.5, 0.7, '#ecedbd32');
    box(40, 383, 820, 74, '#ede3ca', 36);
    box(438, 294, 84, 306, '#ede3ca', 28);
    oval(480, 420, 202, 80, '#6c968278');
    oval(480, 420, 193, 75, '#dfd5bd');
    oval(480, 420, 159, 60, '#eee4cd');
    for (let i = 0; i < 44; i++) {
      const a = (i * Math.PI * 2) / 44;
      line(
        480 + Math.cos(a) * 163,
        420 + Math.sin(a) * 64,
        480 + Math.cos(a) * 187,
        420 + Math.sin(a) * 75,
        '#b9b5a266',
      );
    }
    for (const [x, y] of [
      [230, 340],
      [735, 340],
      [230, 470],
      [735, 470],
    ]) {
      oval(x, y, 43, 26, '#dde2bf');
      oval(x, y, 36, 20, '#567f65');
      for (let i = 0; i < 17; i++) {
        const a = i * 2.4,
          r = 8 + (i % 4) * 6;
        oval(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r * 0.5,
          3,
          2,
          ['#f2bba9', '#f4d78f', '#d8bfeb'][i % 3],
        );
      }
    }
    box(0,502,960,28,'#e4decb');box(0,530,960,80,'#354554');box(0,610,960,30,'#e4decb');
    for(let x=0;x<960;x+=60)box(x,569,30,2,'#f5dc88');
    for(const x of [260,690])for(let y=537;y<608;y+=15)box(x,y,25,7,'#f4f2df');
    sign('JARDIM DO SABER', 480, 70, 180);
    text('JARDINS, FONTE E BIBLIOTECA', 480, 99, '#294c48', 11, 600);
  }
  g = context;
  g.clearRect(0, 0, W, H);
  g.drawImage(plazaGround, 0, 0);
  // Fonte em camadas, com pequenas ondas animadas.
  shade(480, 480, 75, 14);
  oval(480, 440, 69, 47, '#9dafa6');
  oval(480, 435, 65, 44, '#e5e1c9');
  oval(480, 433, 57, 36, gradient(0, 397, 74, '#6baeb7', '#acdace'));
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.ellipse(
      480,
      432,
      20 + i * 11 + Math.sin((animation.time || 0) / 650 + i) * 3,
      9 + i * 5,
      0,
      0,
      Math.PI * 2,
    );
    g.strokeStyle = '#f2fff066';
    g.lineWidth = 1.5;
    g.stroke();
  }
  box(475, 401, 10, 32, '#d1d4bc', 4);
  oval(480, 402, 24, 8, '#f2ead0');
  line(480, 400, 480, 378 + Math.sin((animation.time || 0) / 300) * 2, '#e5ffed', 3);
  drawStreetPassage(62,'DEVCITY',true,'←',570,{x:90,y:615});
  drawStreetPassage(898,'CENTRO',!!state.access?.downtown,'→',570,{x:870,y:615});
  const objects = [
    {y:competitionBoards.plaza.y,draw:()=>drawCompetitionBoard('plaza',animation.competitionWinner)},
    ...streetLamps.plaza.map(([x,y])=>({y,draw:()=>lamp(x,y)})),
    ...plazaTrees.map(([x, y], i) => ({ y, draw: () => tree(x, y, i % 2) })),
    ...plazaBenches.map(([x, y]) => ({ y: y + 18, draw: () => bench(x, y) })),
    ...plazaBuildings.map((b) => ({ y: b.y + b.h, draw: () => facade(b, state) })),
    ...communityObjects(state,animation),
    { y: state.position.y, draw: () => drawPlayer(state, animation) },
  ];
  objects.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
  drawCommunityNames(state,animation);
  drawSeatHints('plaza');
}
function gamerChair(x, y) {
  seat(x, y, true);
  box(x - 17, y - 46, 34, 49, gradient(x, y - 46, 49, '#29384f', '#172838'), 9);
  box(x - 11, y - 40, 22, 34, '#385e70', 7);
  line(x - 13, y - 37, x - 9, y - 12, '#80dfd0', 3);
  line(x + 13, y - 37, x + 9, y - 12, '#80dfd0', 3);
  box(x - 8, y - 37, 16, 8, '#182b3b', 3);
  box(x - 9, y - 12, 18, 6, '#77c7ba', 3);
  box(x - 15, y + 4, 30, 12, '#29465a', 5);
  for (const dx of [-14, 14]) oval(x + dx, y + 26, 3, 3, '#253b48');
  finishDetail(x - 15, y - 43, 30, 44);
}
function libraryContent() {
  rug(378, 334, 217, 132);
  for (const x of [242, 352, 462]) books(x, 205, 78);
  text('LEIA · EXPLORE · EVOLUA', 440, 292, '#6b725c', 11);
  desk(644, 280, true, true);
  seat(644, 349, true);
  text('ACERVO DIGITAL', 644, 236, '#e6dbc1', 9);
  for (const x of [335, 500]) {
    box(x - 60, 380, 120, 27, '#907052', 4);
    box(x - 63, 371, 126, 13, gradient(x, 371, 13, '#e2c6a0', '#b99a76'), 4);
    box(x - 22, 374, 40, 7, '#f3e6c7', 2);
    line(x - 2, 374, x - 2, 380, '#c8b395');
    seat(x, 436);
  }
  plant(708, 477);
  plant(239, 310);
  floorLamp(693, 404);
  text('cada página é um novo caminho.', 480, 493, '#725c48', 10, 400);
}
function books(x, y, w = 65) {
  shade(x + w / 2, y + 59, w / 2, 6);
  box(x, y, w, 63, gradient(x, y, 63, '#bc9d76', '#927353'), 3);
  box(x + 4, y + 5, w - 8, 54, '#715840', 2);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < Math.floor((w - 10) / 8); col++) {
      box(
        x + 7 + col * 8,
        y + 9 + row * 17,
        5,
        12,
        ['#bf9688', '#91b6ad', '#d3ba89', '#9c9dba'][col % 4],
        1,
      );
      line(x + 8 + col * 8, y + 12 + row * 17, x + 10 + col * 8, y + 12 + row * 17, '#f0e8d777', 1);
    }
    box(x + 3, y + 23 + row * 17, w - 6, 3, '#d9b58a', 1);
  }
  finishDetail(x, y, w, 63);
}
function rug(x, y, w, h, coral = false) {
  shade(x + w / 2, y + h - 3, w / 2, 7);
  box(x - 3, y - 3, w + 6, h + 6, coral ? '#b47e68' : '#5a8495', 5);
  box(x, y, w, h, coral ? '#e0b097' : '#abc4c1', 3);
  box(x + 7, y + 7, w - 14, h - 14, coral ? '#c78b77' : '#719ea8', 2);
  for (let xx = x + 17; xx < x + w - 12; xx += 25)
    for (let yy = y + 17; yy < y + h - 12; yy += 22) {
      if (activeStyle?.variant === 1) {
        line(xx - 7, yy, xx + 7, yy, activeStyle.light + '88', 2);
        continue;
      }
      if (activeStyle?.variant === 2) {
        oval(xx, yy, 4, 4, activeStyle.light + '88');
        continue;
      }
      if (activeStyle?.variant === 4) {
        line(xx - 7, yy + 3, xx, yy - 3, activeStyle.light + '88', 2);
        line(xx, yy - 3, xx + 7, yy + 3, activeStyle.light + '88', 2);
        continue;
      }
      if (activeStyle?.variant === 5) {
        text('✦', xx, yy + 4, activeStyle.light + 'aa', 12);
        continue;
      }
      poly(
        [
          [xx, yy - 6],
          [xx + 7, yy],
          [xx, yy + 6],
          [xx - 7, yy],
        ],
        coral ? '#efd7b16a' : '#dce5cf66',
      );
    }
  for (let i = 0; i < h; i += 5) {
    line(x - 4, y + i, x - 8, y + i, '#ddd7b0', 1);
    line(x + w + 4, y + i, x + w + 8, y + i, '#ddd7b0', 1);
  }
  finishDetail(x + 7, y + 7, w - 14, h - 14);
  if (activeStyle?.variant === 6) logo(x + w * 0.35, y + h * 0.2, w * 0.3, h * 0.6);
}
function seat(x, y, fancy = false) {
  shade(x, y + 16, 17, 6);
  if (fancy) {
    line(x, y + 13, x, y + 24, '#3b535e', 3);
    line(x - 14, y + 25, x + 14, y + 25, '#3b535e', 3);
    box(x - 14, y - 33, 28, 39, gradient(x, y - 33, 39, '#648597', '#334f66'), 8);
    box(x - 9, y - 26, 18, 23, '#809ba766', 5);
    line(x - 15, y - 3, x - 15, y + 11, '#354d5d', 4);
    line(x + 15, y - 3, x + 15, y + 11, '#354d5d', 4);
    box(x - 14, y + 4, 28, 12, '#527385', 5);
  } else {
    box(x - 12, y - 12, 24, 22, gradient(x, y - 12, 22, '#bfa384', '#90755c'), 4);
    line(x - 8, y + 8, x - 8, y + 22, '#785b46', 3);
    line(x + 8, y + 8, x + 8, y + 22, '#785b46', 3);
    box(x - 14, y + 5, 28, 9, '#d1b593', 3);
  }
}
function desk(x, y, fancy = false, wide = false, mechanical = false, styles = {}) {
  const w = fancy ? 88 : 70;
  withItemStyle(styles.desk || activeStyle, () => {
    shade(x, y + 28, w * 0.55, 8);
    box(x - w / 2 + 4, y + 7, w - 8, 26, fancy ? '#6e594b' : '#887258', 3);
    line(x - w / 2 + 7, y + 10, x - w / 2 + 7, y + 33, '#5b4b42', 4);
    line(x + w / 2 - 7, y + 10, x + w / 2 - 7, y + 33, '#5b4b42', 4);
    box(
      x - w / 2,
      y,
      w,
      14,
      gradient(x, y, 14, fancy ? '#c9a078' : '#dcc2a0', fancy ? '#9a7557' : '#b49573'),
      4,
    );
    line(x - w / 2 + 5, y + 3, x + w / 2 - 5, y + 3, '#efcfab77', 1);
    if (fancy) {
      box(x + 19, y + 15, 17, 16, '#ad8764', 2);
      oval(x + 27, y + 21, 1.5, 1.5, '#eadac0');
    }
    finishDetail(x - w / 2, y, w, 14);
  });
  const mw = wide ? 72 : 35;
  withItemStyle(styles.monitor || activeStyle, () => {
    box(x - mw / 2, y - (wide ? 34 : 28), mw, wide ? 32 : 26, '#2d4353', 4);
    box(
      x - mw / 2 + 3,
      y - (wide ? 31 : 25),
      mw - 6,
      wide ? 24 : 19,
      gradient(x, y - 31, 24, '#375578', '#6193a6'),
      2,
    );
    for (let i = 0; i < 4; i++)
      line(
        x - mw / 2 + 7 + (i % 2) * 3,
        y - 22 + i * 4,
        x - mw / 2 + 17 + i * 7,
        y - 22 + i * 4,
        ['#b1d5bd', '#cfb9dd', '#eccd94', '#88c9d0'][i],
        1,
      );
    line(x, y - 2, x, y + 3, '#32495a', 4);
    box(x - 9, y + 3, 18, 3, '#365162', 1);
    finishDetail(x - mw / 2, y - (wide ? 34 : 28), mw, wide ? 32 : 26);
  });
  if (mechanical) {
    g.save();
    g.translate(x - 4, y + 8);
    g.scale(0.82, 0.48);
    withItemStyle(styles.keyboard || activeStyle, () => keyboard(0, 0));
    g.restore();
  } else {
    box(x - 20, y + 7, 33, 5, '#e3ddc6', 2);
    for (let i = 0; i < 10; i++) line(x - 18 + i * 3, y + 8, x - 18 + i * 3, y + 10, '#a5b4ae', 1);
  }
  if (styles.mouse) {
    g.save();
    g.translate(x + 22, y + 9);
    g.scale(0.55, 0.4);
    withItemStyle(styles.mouse, () => mouse(0, 0));
    g.restore();
  } else oval(x + 20, y + 9, 3, 4, '#e9e3cc');
  if (styles.speaker) {
    for (const side of [-1, 1]) {
      g.save();
      g.translate(x + side * (w / 2 - 7), y + 3);
      g.scale(0.65, 0.65);
      withItemStyle(styles.speaker, () => speaker(0, 0));
      g.restore();
    }
  }
}
function bed(x, y) {
  shade(x + 48, y + 103, 49, 8);
  box(x, y, 96, 114, '#8a7765', 6);
  box(x + 3, y - 6, 90, 23, gradient(x, y, 20, '#b0a28a', '#807965'), 5);
  box(x + 5, y + 7, 86, 100, '#ecdfc4', 4);
  box(x + 10, y + 12, 34, 23, '#faf0d6', 6);
  box(x + 50, y + 12, 34, 23, '#faf0d6', 6);
  box(x + 5, y + 39, 86, 65, gradient(x, y + 39, 65, '#84acb5', '#577c93'), 5);
  box(x + 5, y + 39, 86, 11, '#acc9c9', 2);
  for (let i = 0; i < 4; i++)
    line(x + 14 + i * 19, y + 53, x + 14 + i * 19, y + 97, '#d0ddcf18', 2);
  if (activeStyle) {
    text('✦', x + 27, y + 28, activeStyle.dark, 12);
    text('✦', x + 67, y + 28, activeStyle.dark, 12);
    for (let i = 0; i < activeStyle.variant; i++)
      line(x + 14, y + 63 + i * 7, x + 82, y + 63 + i * 7, activeStyle.light + '88', 2);
  }
  finishDetail(x + 5, y + 40, 86, 64);
}
function sofa(x, y) {
  shade(x + 61, y + 43, 62, 9);
  box(x, y, 126, 45, '#997e70', 7);
  box(x + 4, y - 17, 118, 31, gradient(x, y - 17, 31, '#d1ad96', '#b18e7b'), 9);
  box(x + 7, y + 7, 54, 29, '#cfab96', 6);
  box(x + 65, y + 7, 54, 29, '#cfab96', 6);
  box(x - 2, y + 3, 14, 35, '#b3937e', 6);
  box(x + 114, y + 3, 14, 35, '#b3937e', 6);
  box(x + 14, y - 1, 22, 23, '#91a6a0', 6);
  box(x + 87, y - 1, 22, 23, '#d9be95', 6);
  finishDetail(x + 5, y - 15, 116, 49);
}
function floorLamp(x, y) {
  shade(x, y + 4, 15, 6);
  oval(x, y + 3, 14, 5, '#8e775e');
  line(x, y - 3, x, y - 56, '#947956', 4);
  poly(
    [
      [x - 11, y - 68],
      [x + 11, y - 68],
      [x + 21, y - 39],
      [x - 21, y - 39],
    ],
    gradient(x, y - 68, 29, '#ffe3b4', '#d6b07c'),
  );
  oval(x, y - 39, 21, 5, '#edd0a1');
  const glow = g.createRadialGradient(x, y - 40, 2, x, y - 40, 68);
  glow.addColorStop(0, '#ffe6a933');
  glow.addColorStop(1, '#ffe6a900');
  oval(x, y - 40, 68, 68, glow);
  finishDetail(x - 11, y - 67, 22, 25);
}
function poster(x, y, w = 82, h = 48) {
  box(x - 3, y - 3, w + 6, h + 6, '#72594a', 3);
  box(x, y, w, h, '#e8ddc1', 1);
  oval(x + w * 0.72, y + h * 0.32, 10, 10, '#d9ae77');
  poly(
    [
      [x + 2, y + h - 3],
      [x + 21, y + 17],
      [x + 42, y + h - 3],
    ],
    '#93b0a1',
  );
  poly(
    [
      [x + 22, y + h - 3],
      [x + 51, y + 24],
      [x + w - 2, y + h - 3],
    ],
    '#668d8b',
  );
  text('HELLO WORLD', x + w / 2, y + 14, '#3d625f', 7);
  finishDetail(x, y, w, h);
  if (activeStyle?.variant === 6) logo(x + w * 0.25, y + 5, w * 0.5, h - 10);
}
function roomBase(scene, state) {
  box(0, 0, W, H, gradient(0, 0, H, '#1c2e3d', '#101c29'));
  const glow = g.createRadialGradient(480, 300, 70, 480, 320, 520);
  glow.addColorStop(0, '#65797c40');
  glow.addColorStop(1, '#18263700');
  box(0, 0, W, H, glow);
  shade(480, 548, 295, 18);
  box(207, 149, 549, 391, '#142633', 6);
  const floor =
    scene === 'office'
      ? ['#c2ceca', '#a3b7b9']
      : scene === 'shop'
        ? ['#dfc4a1', '#bf9c7a']
        : ['#e2ccab', '#c1a182'];
  box(218, 188, 524, 337, floor[1]);
  g.save();
  g.beginPath();
  g.rect(218, 188, 524, 337);
  g.clip();
  for (let y = 190; y < 525; y += 18)
    for (let x = 198 + (y % 36 ? 0 : 39); x < 742; x += 78) {
      box(x, y, 76, 17, gradient(x, y, 17, ...floor), 1);
      line(x + 6, y + 7, x + 69, y + 7, '#7a684c0c');
      line(x + 9, y + 12, x + 62, y + 12, '#fff8dc12');
    }
  const fall = g.createLinearGradient(0, 188, 0, 525);
  fall.addColorStop(0, '#253f4933');
  fall.addColorStop(0.25, '#253f4900');
  box(218, 188, 524, 337, fall);
  g.restore();
  box(
    210,
    145,
    540,
    44,
    gradient(
      0,
      145,
      44,
      scene === 'office' ? '#b6ccd0' : '#d1d9c3',
      scene === 'office' ? '#829fa9' : '#98ada1',
    ),
    3,
  );
  box(214, 146, 532, 5, '#e9ead5', 2);
  box(214, 182, 532, 7, '#546f73', 2);
  box(210, 184, 8, 345, gradient(210, 184, 345, '#9cb2a6', '#496a71'));
  box(742, 184, 8, 345, gradient(742, 184, 345, '#9cb2a6', '#496a71'));
  box(210, 521, 243, 13, '#78968e', 3);
  box(507, 521, 243, 13, '#78968e', 3);
  box(454, 523, 52, 9, '#e3d0ae', 2);
  box(458, 532, 44, 3, '#a9b1a1', 1);
  const curtains = scene === 'house' && equippedBases(state.equipped).includes('curtains');
  withItemStyle(equippedModel(state.equipped, 'curtains'), () => {
    window(259, 152, 48, 28, curtains);
    window(653, 152, 48, 28, curtains);
  });
  poly(
    [
      [265, 190],
      [305, 190],
      [381, 340],
      [321, 340],
    ],
    '#fff2b81a',
  );
  poly(
    [
      [659, 190],
      [699, 190],
      [734, 323],
      [693, 323],
    ],
    '#fff2b817',
  );
}
function wardrobe(x, y) {
  shade(x + 34, y + 67, 35, 7);
  box(x, y, 68, 75, gradient(x, y, 75, '#c9a47c', '#957350'), 5);
  box(x + 4, y + 5, 28, 64, '#b8926d', 3, '#e3bd8f77');
  box(x + 36, y + 5, 28, 64, '#b8926d', 3, '#e3bd8f77');
  box(x + 8, y + 10, 20, 43, gradient(x, y, 43, '#bdd3cf', '#8eadaf'), 3);
  poly(
    [
      [x + 10, y + 12],
      [x + 26, y + 12],
      [x + 10, y + 44],
    ],
    '#edf0d655',
  );
  line(x + 29, y + 36, x + 29, y + 43, '#f1d5a6', 2);
  line(x + 40, y + 36, x + 40, y + 43, '#f1d5a6', 2);
  box(x + 6, y + 68, 56, 5, '#785b45', 1);
  finishDetail(x, y, 68, 75);
  if (activeStyle?.variant >= 3) {
    box(x + 8, y + 10, 20, 43, activeStyle.dark, 3);
    line(x + 15, y + 14, x + 15, y + 45, activeStyle.light, 2);
  }
}
function houseContent(state) {
  // Os modelos básicos pertencem ao cenário; cada compra substitui apenas seu slot.
  const ownedEquipment = state.equipped;
  const occupied = new Set(
    ownedEquipment.map(
      (id) =>
        itemModel(id)?.slot ||
        { 'gamer-chair': 'chair', cactus: 'plant', 'rug-coral': 'rug' }[baseItemId(id)] ||
        baseItemId(id),
    ),
  );
  const homeSlots = [
    'wardrobe',
    'bed',
    'rug',
    'desk',
    'monitor',
    'keyboard',
    'mouse',
    'speaker',
    'chair',
    'sofa',
    'shelf',
    'lamp',
    'plant',
    'mug',
    'computer',
    'table',
    'poster',
    'clock',
    'neon',
  ];
  state = {
    ...state,
    equipped: [
      ...ownedEquipment,
      ...homeSlots.filter((slot) => !occupied.has(slot)).map((slot) => `${slot}-common`),
    ],
  };
  const e = equippedBases(state.equipped);
  const styled = (slot, draw) => withItemStyle(equippedModel(state.equipped, slot), draw);
  if (e.includes('rug') || e.includes('rug-coral'))
    styled('rug', () => rug(405, 350, 194, 119, e.includes('rug-coral')));
  else rug(431, 402, 102, 42);
  styled('wardrobe', () => wardrobe(267, 240));
  styled('bed', () => bed(260, 358));
  // O setup usa slots separados para combinar mesa, monitor e teclado.
  desk(
    657,
    282,
    e.includes('desk'),
    e.includes('monitor'),
    e.includes('keyboard') && !equippedModel(state.equipped, 'keyboard')?.common,
    {
      desk: equippedModel(state.equipped, 'desk'),
      monitor: equippedModel(state.equipped, 'monitor'),
      keyboard: equippedModel(state.equipped, 'keyboard'),
      mouse: equippedModel(state.equipped, 'mouse'),
      speaker: equippedModel(state.equipped, 'speaker') || (e.includes('speaker') ? {} : null),
    },
  );
  if (e.includes('gamer-chair') && !equippedModel(state.equipped, 'chair')?.common)
    styled('chair', () => gamerChair(655, 348));
  else seat(655, 348, e.includes('chair'));
  if (e.includes('sofa')) styled('sofa', () => sofa(405, 259));
  // A decoração fica na faixa da parede, acima dos móveis.
  const wallItem = (slot, draw) =>
    withItemStyle(
      equippedModel(state.equipped, slot) ||
        (e.includes(slot) ? null : itemModel(`${slot}-common`)),
      draw,
    );
  wallItem('poster', () => poster(369, 153, 70, 29));
  wallItem('clock', () => {
    g.save();
    g.translate(491, 167);
    g.scale(0.78, 0.78);
    clock(0, 0);
    g.restore();
  });
  wallItem('neon', () => neon(596, 168));
  if (e.includes('shelf')) styled('shelf', () => books(537, 201, 60));
  if (e.includes('lamp')) styled('lamp', () => floorLamp(697, 410));
  if (e.includes('plant') || e.includes('cactus'))
    styled('plant', () => plant(705, 463, e.includes('cactus')));
  if (e.includes('bonsai')) bonsai(705, 463);
  if (e.includes('mug')) styled('mug', () => mug(693, 287));
  if (e.includes('books')) styled('books', () => books(610, 264, 30));
  if (e.includes('computer')) styled('computer', () => computer(724, 290));
  if (e.includes('table')) styled('table', () => sideTable(552, 431));
  plant(239, 216);
  text('NOTEBOOK', 657, 237, '#e6dbc1', 9);
  text('GUARDA-ROUPA', 301, 230, '#526b68', 9);
}
function schoolContent() {
  box(359, 199, 242, 55, '#826951', 4);
  box(365, 204, 230, 44, gradient(0, 204, 44, '#426e68', '#2e575b'), 3);
  text('HTML  /  CSS  /  JAVASCRIPT', 480, 224, '#ebefd3', 13);
  text('aprenda algo novo hoje.', 480, 241, '#b4c8b7', 9, 400);
  box(366, 252, 227, 4, '#b99e75', 2);
  for (let i = 0; i < 6; i++) {
    const x = 314 + (i % 3) * 145,
      y = 330 + Math.floor(i / 3) * 85;
    shade(x, y + 27, 37, 7);
    box(x - 31, y + 8, 62, 25, '#967557', 3);
    box(x - 35, y - 4, 70, 15, gradient(0, y - 4, 15, '#dec19a', '#b6926a'), 4);
    box(x - 17, y, 25, 8, '#f0e8d1', 2);
    line(x - 14, y + 3, x + 4, y + 3, '#bac3b1', 1);
    box(x + 20, y - 1, 4, 8, '#5e8086', 1);
    seat(x, y + 49);
  }
  books(235, 208);
  books(662, 208);
  plant(707, 487);
  person(480, 258, '#f1c6a8', '#aa91b7');
}
function officeContent() {
  rug(417, 343, 125, 111);
  desk(666, 290, true, true);
  seat(663, 349, true);
  desk(304, 389, true);
  seat(305, 447, true);
  desk(626, 389, true);
  seat(627, 447, true);
  person(308, 301, '#8d5524', '#799ca9');
  sign('RECRUTAMENTO', 308, 232, 112);
  sign('TERMINAL DE TICKETS', 657, 232, 147);
  books(420, 203, 119);
  plant(708, 485);
  plant(239, 213);
}
function shopContent() {
  books(251, 209, 63);
  books(654, 209, 63);
  rug(412, 385, 137, 70, true);
  person(480, 283, '#dba47b', '#c19074');
  shade(480, 327, 119, 10);
  box(372, 290, 216, 40, gradient(0, 290, 40, '#b69472', '#87684f'), 4);
  box(368, 284, 224, 17, gradient(0, 284, 17, '#e3c499', '#b99873'), 4);
  line(375, 287, 584, 287, '#f7deae77', 1);
  for (let x = 387; x < 579; x += 31) line(x, 306, x, 326, '#dfba8e44');
  box(542, 263, 30, 23, '#35515e', 3);
  box(546, 267, 22, 14, '#93bdae', 2);
  plant(243, 466);
  plant(714, 466);
  text('MÓVEIS & DECORAÇÃO', 480, 349, '#755d49', 10);
}
export function drawInterior(context, state, animation = {}) {
  rasterScenery=false;
  g = context;
  g.clearRect(0, 0, W, H);
  const scene = state.position.map;
  const styleScene = ({stadium:'office',devclub:"school","city-office":"office","us-office":"office","city-shop":"shop","us-shop":"shop"})[scene] || scene;
  g.save();
  g.translate(480, 330);
  g.scale(1.3, 1.3);
  g.translate(-480, -330);
  roomBase(styleScene, state);
  const titles = {
    house: 'SEU LAR · ESTÚDIO DEV',
    school: 'ESCOLA DEV · SALA DE AULA',
    office: 'TECHSOFT · FRONT-END',
    shop: 'ARMAZÉM DE DEVCITY',
    library: 'BIBLIOTECA · JARDIM DO SABER',
    devclub:'DEVCLUB · LABORATÓRIO DE PROGRAMAÇÃO',
    stadium:'ESTÁDIO DE COMPETIÇÃO',
    'city-office':'CODEWORKS · CONTRATOS EM REAIS',
    'us-office':'FULL STACK LAB · US$ 1 POR ENTREGA',
    'city-shop':'LOJA DO CENTRO · REAIS',
    'us-shop':'PREMIUM STORE · DÓLARES',
  };
  if (scene !== 'house' && scene !== 'stadium') sign(titles[scene], 480, 149, 270);
  if (scene === 'house') {houseContent(state);if(state.isCompetitionAdmin){competitionDesk(adminStation.x,adminStation.y,'ADMIN');text('E · ADMIN',452,432,'#f5d88a',10);}}
  else if(scene==='stadium'){
    drawStadiumInterior(stadiumAnimationTime(animation));
    for(const station of stations.stadium)competitionDesk(station.x,station.y,'COMPETIR');
  }
  else if (scene === 'devclub') {
    for(const {x,screen} of devClubComputers){
      // Cada mesa tem gabinete, monitor, suporte, teclado, mouse e cadeira.
      shade(x+38,322,64,12);box(x-14,305,104,16,'#c9a67d',4);box(x-10,321,8,35,'#876d57',2);box(x+75,321,8,35,'#876d57',2);
      box(x+83,280,18,34,'#283d50',3);box(x+87,285,9,3,'#64ff36',1);oval(x+92,302,4,4,'#172b3b');
      box(x,269,75,43,'#263c4e',5);box(x+5,274,65,31,'#102936',2);box(x+33,311,9,10,'#637d89',2);box(x+20,320,35,4,'#3c5563',2);
      text(screen,x+37,294,'#8ff4cb',screen.startsWith('TS')?8:12);box(x+4,328,59,11,'#e1e6d8',3);
      for(let i=0;i<10;i++)line(x+9+i*5,330,x+9+i*5,336,'#819797',1);
      oval(x+73,334,6,9,'#b4c9bd');seat(x+37,383,true);
    }

  }
  else if (styleScene === 'school') schoolContent();
  else if (styleScene === 'office') officeContent();
  else if (scene === 'library') libraryContent();
  else shopContent();
  if (animation.sleeping && scene === 'house') {
    box(293, 397, 30, 25, shirtColor(state), 9);
    oval(308, 385, 12, 13, state.skin);
    oval(308, 377, 12, 7, state.hair || '#51423f');
    line(301, 386, 305, 386, '#543e35', 1.5);
    line(311, 386, 315, 386, '#543e35', 1.5);
    withItemStyle(equippedModel(state.equipped, 'bed'), () => {
      box(277, 409, 62, 45, '#84acb5', 7);
      line(281, 414, 335, 414, '#c4dfdb', 3);
    });
    text('Z z z', 343, 365 - Math.sin((animation.time || 0) / 600) * 5, '#cde6ec', 16);
  } else {
    const actors=[...onlineObjects(animation),{y:state.position.y,draw:()=>drawPlayer(state,animation)}];
    actors.sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw());
    drawOnlineNames(animation);
    drawLocalName(state,animation);
  }
  const s = stations[scene]?.find(
    (s) =>
      Math.abs(state.position.x - (s.x + s.w / 2)) < s.w / 2 + 34 &&
      Math.abs(state.position.y - (s.y + s.h)) < 40,
  );
  for (const seat of seats[scene] || []) {
    box(seat.x - 8, seat.y - 38, 16, 16, '#2e4855', 4);
    text('E', seat.x, seat.y - 26, '#f1dfb1', 10);
  }
  if (s && !animation.sleeping) {
    oval(s.x + s.w / 2, s.y + s.h + 9, 15, 5, '#e3dc9a40');
    box(s.x + s.w / 2 - 10, s.y - 24, 20, 19, '#2e4855', 5);
    text('E', s.x + s.w / 2, s.y - 10, '#f1dfb1', 11);
  }
  text('↓ SAÍDA', 480, 548, '#cad8c4', 10);
  g.restore();
  text('UM PEQUENO MUNDO. GRANDES POSSIBILIDADES.', 480, 46, '#a0b9b6', 10, 500);
}
export function drawHomePreview(context, state) {
  drawInterior(context, { ...state, position: { x: 480, y: 490, map: 'house' } }, {});
}
export function drawPortrait(context, state) {
  g = context;
  g.clearRect(0, 0, 128, 128);
  box(0, 0, 128, 128, gradient(0, 0, 128, '#b5cec0', '#4d737e'), 22);
  oval(64, 118, 47, 14, '#233f4c22');
  g.save();
  g.translate(64, 122);
  g.scale(1.7, 1.7);
  person(
    0,
    0,
    state.skin,
    shirtColor(state),
    0,
    'down',
    state.equipped,
    state.gender,
    state.hair,
    state.pants,
    state.hairstyle,
  );
  g.restore();
}
export function drawItem(context, item) {
  g = context;
  g.save();g.scale((context.canvas?.width||160)/160,(context.canvas?.height||105)/105);
  g.clearRect(0, 0, 160, 105);
  box(0, 0, 160, 105, gradient(0, 0, 105, '#2e444f', '#1b2c37'), 12);
  g.save();
  g.translate(80, 65);
  withItemStyle(itemModel(item.id), () => {
    switch (baseItemId(item.id)) {
      case 'car':
      case 'motorcycle':
        drawVehicle(g,item,{x:0,y:8,scale:item.baseId==='car'?1.12:1.1});break;
      case 'laptop':drawLaptop(g,item,{y:-5,scale:1.7});break;
      case 'wardrobe':
        g.scale(0.75, 0.75);
        wardrobe(-34, -68);
        break;
      case 'computer':
        computer(0, 10);
        break;
      case 'mouse':
        g.scale(2.4, 2.4);
        mouse(0, 0);
        break;
      case 'table':
        sideTable(0, 0);
        break;
      case 'bed':
        g.scale(0.6, 0.6);
        bed(-48, -82);
        break;
      case 'keyboard':
        keyboard(0, 0);
        break;
      case 'mug':
        mug(0, 0);
        break;
      case 'clock':
        clock(0, -10);
        break;
      case 'neon':
        neon(0, -15);
        break;
      case 'bonsai':
        bonsai(0, 10);
        break;
      case 'books':
        books(-20, -25, 40);
        break;
      case 'speaker':
        speaker(-15, 0);
        speaker(15, 0);
        break;
      case 'plant':
        plant(0, 10);
        break;
      case 'cactus':
        plant(0, 10, true);
        break;
      case 'rug':
      case 'rug-coral':
        rug(-42, -35, 84, 43, item.id === 'rug-coral');
        break;
      case 'desk':
        desk(0, 0, true);
        break;
      case 'monitor':
        desk(0, 0, false, true);
        break;
      case 'chair':
        seat(0, 5, true);
        break;
      case 'gamer-chair':
        gamerChair(0, 5);
        break;
      case 'sofa':
        g.scale(0.8, 0.8);
        sofa(-63, -10);
        break;
      case 'lamp':
        floorLamp(0, 16);
        break;
      case 'shelf':
        books(-33, -39);
        break;
      case 'poster':
        poster(-40, -37);
        break;
      case 'curtains':
        window(-24, -37, 48, 33, true);
        break;
      default:
        person(
          0,
          21,
          '#dba47b',
          item.color || '#a696d4',
          0,
          'down',
          [item.id],
          item.gender === 'female' ? 'female' : 'male',
        );
    }
  });
  g.restore();
  if(item.collection==='DevClub'){
    box(126,7,27,27,'#281143',4,'#a6ed64');
    logo(129,10,21,21);
  }
  g.restore();
}

function keyboard(x, y) {
  box(x - 22, y - 5, 44, 12, '#364c59', 3);
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 9; col++) box(x - 19 + col * 4, y - 3 + row * 4, 3, 3, '#8fcbbd', 1);
  finishDetail(x - 23, y - 6, 46, 14);
}
function mug(x, y) {
  oval(x + 7, y - 4, 5, 5, '#e1ba88');
  box(x - 6, y - 13, 12, 15, '#e7c28e', 3);
  oval(x, y - 12, 6, 3, '#66483d');
  line(x - 2, y - 18, x + 1, y - 24, '#e6dfca66', 2);
  finishDetail(x - 6, y - 11, 12, 13);
  if (activeStyle?.variant === 6) logo(x - 5, y - 10, 10, 10);
}
function clock(x, y) {
  oval(x, y, 18, 18, '#dac9aa');
  oval(x, y, 15, 15, '#f3e9d4');
  line(x, y, x, y - 9, '#496168', 2);
  line(x, y, x + 8, y + 4, '#496168', 2);
  oval(x, y, 2, 2, '#496168');
  finishDetail(x - 14, y - 14, 28, 28);
}
function computer(x, y) {
  const item = activeStyle;
  shade(x, y + 9, 16, 5);
  box(x - 15, y - 48, 30, 57, item?.color || '#425666', 5);
  box(x - 10, y - 42, 20, 37, item?.dark || '#152838', 3);
  for (const yy of [-32, -15]) {
    oval(x, y + yy, 7, 7, item?.light || '#75ac89');
    oval(x, y + yy, 4, 4, item?.dark || '#152838');
  }
  oval(x + 7, y - 44, 2, 2, item?.light || '#75ac89');
  finishDetail(x - 15, y - 48, 30, 57);
}
function mouse(x, y) {
  const item = activeStyle;
  oval(x, y, 6, 9, item?.color || '#506677');
  line(x, y - 7, x, y - 2, item?.light || '#d6dfdc', 1);
  box(x - 1, y - 5, 2, 3, item?.dark || '#152838', 1);
  finishDetail(x - 6, y - 9, 12, 18);
}
function sideTable(x, y) {
  const item = activeStyle;
  shade(x, y + 23, 30, 7);
  box(x - 30, y - 8, 60, 20, item?.color || '#c9a47c', 5);
  for (const dx of [-25, 25]) box(x + dx - 2, y + 10, 5, 22, item?.dark || '#785b45', 2);
  box(x - 26, y - 12, 52, 7, item?.light || '#f2dfc0', 3);
  finishDetail(x - 30, y - 8, 60, 20);
}
function neon(x, y) {
  g.save();
  g.shadowColor = styledColor('#79f2de');
  g.shadowBlur = 12;
  box(x - 37, y - 14, 74, 25, '#254450', 4);
  text(activeStyle?.word || 'CODE', x, y + 4, '#91ffee', activeStyle ? 13 : 17);
  if (activeStyle?.variant === 6) logo(x - 15, y - 11, 30, 24);
  g.restore();
}
function bonsai(x, y) {
  box(x - 17, y - 3, 34, 12, '#8b7060', 4);
  line(x, y - 4, x - 4, y - 32, '#866647', 5);
  oval(x - 9, y - 33, 22, 9, '#6c9a76');
  oval(x + 7, y - 43, 19, 9, '#84b186');
}
function speaker(x, y) {
  box(x - 7, y - 20, 14, 24, '#344c5b', 3);
  oval(x, y - 3, 4, 5, '#172b35');
  oval(x, y - 14, 3, 3, '#a7c1b8');
  finishDetail(x - 7, y - 20, 14, 24);
}

export function drawRegionalWorld(context,state,animation={}) {
  rasterScenery=!!animation.lowPower;
  g=context;g.clearRect(0,0,960,640);const usa=state.position.map==='usa';
  box(0,0,960,640,usa?'#a4c8b1':'#8fb997');
  box(0,322,960,196,'#d4d9d6');
  box(0,345,960,150,'#354554');
  box(420,300,120,340,'#d4d9d6');box(440,345,80,295,'#354554');
  for(let x=0;x<960;x+=60)box(x,418,32,3,'#f5dc88');
  for(let y=350;y<640;y+=60)box(478,y,3,28,'#f5dc88');
  for(const x of [335,595])for(let y=350;y<490;y+=22)box(x,y,28,12,'#f4f4e9');
  for(const b of regionalBuildings[state.position.map]){
    if(b.id==='stadium'){
      box(b.x+b.w/2-43,518,86,b.y-518,'#d4d9d6',3);
      for(let step=0;step<3;step++)line(b.x+b.w/2-40,522+step*4,b.x+b.w/2+40,522+step*4,'#9aaeb8',1);
    }
    else box(b.x+b.w/2-22,b.y+b.h+10,44,322-(b.y+b.h+10),'#d4d9d6');
  }
  const drawBuilding=b=>{
    if(b.id==='stadium'){
      drawStadiumFacade(b,stadiumAnimationTime(animation));
    }else facade(b,state);
  };
  drawStreetPassage(62,usa?'CENTRO':'PRAÇA',true,'←');
  if(!usa)drawStreetPassage(898,'USA',!!state.access?.usa,'→');
  const people=[...regionalBuildings[state.position.map].map(b=>({y:b.y+b.h,draw:()=>drawBuilding(b)})),...(streetLamps[state.position.map]||[]).map(([x,y])=>({y,draw:()=>lamp(x,y)})),...regionalTrees.map(([x,y])=>({y,draw:()=>tree(x,y,0)})),{y:competitionBoards[state.position.map].y,draw:()=>drawCompetitionBoard(state.position.map,animation.competitionWinner)},...communityObjects(state,animation),{y:state.position.y,draw:()=>drawPlayer(state,animation)}];
  people.sort((a,b)=>a.y-b.y).forEach(object=>object.draw());
  drawCommunityNames(state,animation);
}

function drawStreetPassage(x,label,open,arrow,yCenter=420,marker={}){
  const markerX=marker.x??Math.max(90,Math.min(850,x)),top=marker.y??(yCenter===570?475:300),width=Math.max(62,label.length*6+20);
  box(markerX-width/2,top,width,20,'#253f49',5,'#a9bcac66');
  text(label,markerX,top+14,'#bde5ce',10);
  if(!open)text('Fechado',x,yCenter+5,'#ffe0c6',13);
}
let championPortrait=null;
function drawCompetitionBoard(map,winner){
 const {x,y}=competitionBoards[map];
 shade(x,y+6,110,9);
 for(const dx of [-68,68])box(x+dx-4,y-35,8,38,'#375267',3);
 box(x-96,y-94,192,82,'#29475c',7,'#bfa76b');box(x-89,y-87,178,68,'#0c2232',5,'#577a8e');
 text('REI DOS PROJETOS',x,y-75,'#e8cf80',9);
 if(winner){
  const key=JSON.stringify([winner.name,winner.portrait]);
  if(championPortrait?.key!==key){const context=g,canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;drawPortrait(canvas.getContext('2d'),{...winner.portrait,equipped:winner.portrait.equipped||[]});g=context;championPortrait={key,canvas};}
  g.drawImage(championPortrait.canvas,28,10,72,78,x-80,y-66,45,45);
  g.save();g.font='600 10px Segoe UI, sans-serif';let name=winner.name;while(name.length>1&&g.measureText(name).width>110)name=name.slice(0,-1);if(name!==winner.name)name=name.slice(0,-1)+'…';text(name,x+26,y-48,'#fff1c5',10);
  text('CAMPEÃO DO MÊS',x+26,y-34,'#a8d3e6',7);
  text(new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric',timeZone:'America/Sao_Paulo'}).format(winner.starts),x+26,y-23,'#bfd3dc',7);g.restore();
 }else{
  oval(x-59,y-44,17,17,'#725b37');text('★',x-59,y-37,'#f2d277',22);
  text('Aguardando',x+27,y-48,'#eff0d9',10);text('campeão do mês',x+27,y-32,'#abc9d8',9);
 }
 for(const sign of [-1,1]){
  const lampX=x+sign*109;
  g.save();g.globalCompositeOperation='screen';g.fillStyle='#ffe8a62b';g.beginPath();g.moveTo(lampX,y-7);g.lineTo(x+sign*68,y-86);g.lineTo(x-sign*12,y-32);g.closePath();g.fill();g.restore();
  box(lampX-9,y-7,18,8,'#273f52',3);box(lampX-6,y-13,12,9,'#ebd595',3);line(lampX,y-1,lampX-5,y+5,'#314859',2);
 }
}

function drawCommunityPerson(actor){
  person(actor.x,actor.y,actor.skin,actor.shirt,actor.walkPhase,actor.direction,actor.equipped,actor.gender,actor.hair,actor.pants,actor.hairstyle);
}
function stadiumGradient(y,height,top,bottom){
  const gradient=g.createLinearGradient(0,y,0,y+height);
  gradient.addColorStop(0,top);
  gradient.addColorStop(1,bottom);
  return gradient;
}
const stadiumReducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
function stadiumAnimationTime({time,lowPower}){
  return lowPower||stadiumReducedMotion?.matches||!Number.isFinite(time)?0:time;
}
function drawStadiumFacade({x,y,w,h},time){
  const center=x+w/2;
  shade(center,y+h-2,w*.54,9);
  box(x,y+8,w,h-10,stadiumGradient(y+8,h-10,'#385879','#111b33'),35,'#7c9fbe');
  oval(center,y+42,w*.48,40,stadiumGradient(y+2,80,'#8fa9c0','#2c4260'));
  oval(center,y+42,w*.442,34,'#101e34');
  oval(center,y+42,w*.417,28,'#354c70');
  oval(center,y+43,w*.368,22,'#0e192d');
  const roofSweep=(1-Math.cos(time/900))/2;
  for(let index=0;index<14;index++){
    const angle=Math.PI*(index+.5)/14;
    const left=center+Math.cos(angle)*w*.427;
    const top=y+43+Math.sin(angle)*28;
    line(left,top,left,top+15,'#86aec6',2);
    const brightness=Math.max(0,1-Math.abs(index/13-roofSweep)*5);
    const halo=Math.round(brightness*65).toString(16).padStart(2,'0');
    oval(left,top,4+brightness*3,3+brightness*2,'#6ceaff'+halo);
    oval(left,top,2+brightness,2+brightness,brightness>.55?'#e7ffff':'#63abc4');
  }
  for(const side of [-1,1]){
    const tower=center+side*(w/2-26);
    box(tower-13,y+6,26,69,stadiumGradient(y+6,69,'#597b9b','#263a59'),6,'#a2bbcf');
    box(tower-12,y+11,24,7,'#14283e',2);
    for(let lamp=0;lamp<3;lamp++)oval(tower-7+lamp*7,y+14,2.4,2.4,'#d1fcff');
    line(tower,y+22,tower,y+63,'#75ddf2',1);
  }
  box(center-43,y-3,86,28,'#102039',8,'#93f1ff');
  box(center-31,y,62,19,stadiumGradient(y,19,'#5898ac','#203a54'),4);
  line(center,y+2,center,y+17,'#b8e7ef',1);
  for(const side of [-1,1]){
    const tower=center+side*(w/2-26);
    const sway=Math.sin(time/1450+side)*24;
    const beam=stadiumGradient(y+14,61,'#b2f5ff45','#79dcff00');
    poly([[tower-5,y+14],[tower-22+sway,y+75],[tower+22+sway,y+75],[tower+5,y+14]],beam);
  }
  box(center-109,y+68,218,23,'#0a1529',7,'#557b9e');
  const marquee=stadiumGradient(y+69,19,'#244a69','#0d2037');
  box(center-105,y+71,210,17,marquee,5);
  const accent=30+roofSweep*60;
  box(center-accent,y+90,accent*2,2,'#7cddf1',1);
  text('ESTÁDIO DE COMPETIÇÃO',center,y+84,'#e6f8ff',13,750);
}
function drawStadiumInterior(time){
  box(204,156,552,333,stadiumGradient(156,333,'#334361','#0d172c'),19,'#6c85a7');
  box(246,229,468,232,stadiumGradient(229,232,'#213b58','#15273f'),19,'#577897');
  for(let index=0;index<8;index++)line(255,247+index*27,705,247+index*27,'#9ebfe326',1);
  for(const x of [227,733]){
    box(x-17,190,34,270,'#111d35',8,'#536a8e');
    for(let y=235;y<443;y+=23){
      for(const offset of [-7,7]){
        box(x+offset-5,y,10,13,'#495b83',3);
        box(x+offset-5,y,10,3,'#90a8cb',1);
      }
    }
    box(x-1,195,2,31,'#74e5ff');
  }
  box(258,154,444,72,'#080f21',10,'#6f9fca');
  box(265,161,430,58,stadiumGradient(161,58,'#275470','#12263e'),6);
  const sweep=(time%2800)/2800;
  box(270+sweep*393,164,18,51,'#7cecff17',3);
  for(let index=0;index<10;index++){
    const height=2+Math.round((Math.sin(time/250+index*.9)+1)*2);
    box(450+index*6,218-height,3,height,'#7eecf6',1);
  }
  for(const x of [283,677]){
    oval(x,190,5,5,'#ffc87d');
    oval(x,190,2,2,'#fff2ba');
  }
  text('ESTÁDIO DE COMPETIÇÃO',480,188,'#e9f8ff',17,750);
  text('COMPETIÇÃO MENSAL · PRÊMIO US$ 50',480,210,'#ffda91',11);
  box(264,229,432,3,'#68dff0',2);
  line(259,340,701,340,'#8bd8ef',1);
  for(const side of [-1,1]){
    const x=480+side*(30+sweep*188);
    box(x-12,338,24,4,'#a1faff',2);
  }
  for(const x of [277,683])box(x-12,450,24,3,'#8ce5f2',2);
}
function competitionDesk(x,y,label){
  if(label==='COMPETIR'){
    shade(x+40,y+61,54,8);
    box(x-7,y+39,94,19,stadiumGradient(y+39,19,'#476585','#182940'),5,'#53799b');
    box(x,y,80,44,'#10192b',5,'#73cfe6');
    box(x+5,y+5,70,32,stadiumGradient(y+5,32,'#28587b','#102a40'),3);
    line(x+11,y+12,x+67,y+12,'#89eaff66',1);
    text(label,x+40,y+28,'#bdffed',10,750);
    box(x+35,y+44,10,7,'#86a8b9',2);
    box(x+7,y+55,57,9,'#2b4058',3,'#7bbccf');
    box(x+70,y+54,10,12,'#2b4058',4,'#7bbccf');
    return;
  }
  shade(x+40,y+62,53,7);box(x-7,y+42,94,15,'#ae9377',4);box(x,y,80,44,'#193147',5,'#81a8b6');box(x+5,y+5,70,32,'#102833',3);
  text(label,x+40,y+25,label==='ADMIN'?'#f3d68a':'#9be4ca',10);box(x+34,y+44,12,8,'#648997',2);box(x+6,y+58,59,9,'#d2dfda',3);box(x+73,y+56,9,12,'#526c7c',4);
}
function onlineObjects(animation){return animation.hideNpcs?[]:(animation.players||[]).map(player=>({y:player.position.y,draw:()=>drawPlayer(player,{direction:player.direction,walk:player.walkPhase,time:animation.time,seated:player.seated})}));}
function drawOnlineNames(animation){
 if(animation.hideNpcs)return;
 for(const player of animation.players||[]){const width=Math.max(64,player.name.length*7+20),x=player.position.x,y=player.position.y-85;box(x-width/2,y,width,19,'#163e59ed',6,'#71d0f377');text(player.name,x,y+13,'#b9edff',10);}
}
function communityObjects(state,animation){return animation.hideNpcs?[]:[...onlineObjects(animation),...(animation.npcs||[]).map(actor=>({y:actor.y,draw:()=>drawCommunityPerson(actor)})),...(animation.traffic??trafficAt(state.position.map||'city',animation.time||0)).map(car=>({y:car.y,draw:()=>drawVehicle(g,car.item,{...car,lowPower:rasterScenery,moving:car.moving??true,rider:car.item.baseId==='car'?null:{shirt:'#4a6680'}})}))];}
function drawCommunityNames(state,animation){
  if(animation.hideNpcs)return;
  drawLocalName(state,animation);
  drawOnlineNames(animation);
  const playerWidth=Math.max(70,(state.name||'').length*7+22);
  const placed=[{left:state.position.x-playerWidth/2,top:state.position.y-83,width:playerWidth,height:26}];
  for(const actor of [...(animation.npcs||[])].sort((a,b)=>b.y-a.y)){
    const width=Math.max(54,actor.name.length*7+18),left=actor.x-width/2;let top=actor.y-83;
    while(placed.some(box=>left<box.left+box.width&&left+width>box.left&&top<box.top+(box.height||20)&&top+20>box.top))top-=23;
    placed.push({left,top,width});
    box(left,top,width,19,'#152c38e8',6,'#9bc9b94d');text(actor.name,actor.x,top+13,'#eff8ea',10);
    if(!state.activeVehicle&&Math.hypot(actor.x-state.position.x,actor.y-state.position.y)<=52){box(left+width+3,top,17,19,'#a7e9b8',5);text('E',left+width+11.5,top+13,'#13372c',10);}
  }
}
function drawLocalName(state,animation){
 if(animation.hidePlayer)return;
 const x=animation.seated?.x??state.position.x,y=animation.seated?animation.seated.y-63:state.position.y-83;
 sign(state.name,x,y,Math.min(180,Math.max(65,state.name.length*7+18)),'#fff8dc');
}
export function drawCommunityActors(context,state,animation={}){
  g=context;
  const people=[...communityObjects(state,animation),{y:state.position.y,draw:()=>drawPlayer(state,animation)}];
  people.sort((a,b)=>a.y-b.y).forEach(person=>person.draw());drawCommunityNames(state,animation);
}
