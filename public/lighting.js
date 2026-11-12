import {streetLamps,lampBulb,outdoor,competitionBoards} from './navigation.js';
let mobileLightLayer=null,mobileLightKey='';
export function drawLighting(context, scene, buildings, strength = 0, lowPower = false) {
  if (!strength) return;
  const g = context;
  const outside = outdoor(scene);
  g.save();
  g.fillStyle = `rgba(8,18,49,${strength * (outside ? 0.58 : 0.35)})`;
  g.fillRect(0, 0, 960, 640);
  if(lowPower){
    const level=Math.round(strength*30)/30;
    const key=`${scene}:${level}:${buildings.map(b=>`${b.id},${b.x},${b.y},${b.w}`).join(';')}`;
    if(!mobileLightLayer){mobileLightLayer=document.createElement('canvas');mobileLightLayer.width=960;mobileLightLayer.height=640;}
    if(key!==mobileLightKey){
      const layer=mobileLightLayer.getContext('2d');layer.clearRect(0,0,960,640);
      layer.save();paintLights(layer,scene,buildings,level);layer.restore();mobileLightKey=key;
    }
    g.globalCompositeOperation='screen';g.drawImage(mobileLightLayer,0,0);
  }else paintLights(g,scene,buildings,strength);
  g.restore();
}
function paintLights(g,scene,buildings,strength){
  const outside=outdoor(scene);
  g.globalCompositeOperation = 'screen';
  const glow = (x, y, radius, power = 0.6) => {
    const gradient = g.createRadialGradient(x, y, 2, x, y, radius);
    gradient.addColorStop(0, `rgba(255,218,139,${power * strength})`);
    gradient.addColorStop(0.45, `rgba(255,195,111,${power * strength * 0.3})`);
    gradient.addColorStop(1, 'rgba(255,195,111,0)');
    g.fillStyle = gradient;
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fill();
  };
  if (outside) {
    const board=competitionBoards[scene];
    if(board){glow(board.x-109,board.y-10,45,.9);glow(board.x+109,board.y-10,45,.9);glow(board.x,board.y-52,100,.35);}
    for (const [x, y] of streetLamps[scene] || []) {
      glow(x, y - 15, 95, 0.7);
      glow(x+lampBulb.x+lampBulb.width/2,y+lampBulb.y+lampBulb.height/2,30,0.9);
      g.fillStyle = `rgba(255,242,183,${strength})`;
      g.fillRect(x+lampBulb.x+1,y+lampBulb.y+1,lampBulb.width-2,lampBulb.height-2);
    }
    for (const b of buildings) {
      const winY = b.y + (b.id === 'shop' ? 68 : 80);
      for (const x of [b.x + 36, b.x + b.w - 36]) {
        glow(x, winY + 14, 48, 0.5);
        g.fillStyle = `rgba(255,221,153,${strength * 0.65})`;
        g.fillRect(x - 12, winY + 4, 24, 22);
      }
    }
  } else {
    const point = (x, y) => [480 + (x - 480) * 1.3, 330 + (y - 330) * 1.3];
    const [x, y] = point(480, 330);
    glow(x, y, 280, 0.52);
    for (const source of [
      [280, 177],
      [677, 177],
      [650, 275],
    ]) {
      const [sx, sy] = point(...source);
      glow(sx, sy, 85, 0.5);
    }
    if (scene === 'house') {
      const [bx, by] = point(310, 395);
      glow(bx, by, 110, 0.35);
    }
  }
}
