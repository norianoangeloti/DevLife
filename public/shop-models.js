// As mesmas definições dão nome e aparência aos modelos na loja, casa e retrato.
const finishes = [
  { name: 'Areia', color: '#d4b28c', dark: '#85694e', light: '#f2dfc0' },
  { name: 'Bosque', color: '#74a68d', dark: '#365f53', light: '#c4dfb5' },
  { name: 'Lavanda', color: '#ae98cc', dark: '#63527e', light: '#e4d3f2' },
  { name: 'Oceano', color: '#73b6cb', dark: '#345b7b', light: '#c7edf0' },
  { name: 'Aurora', color: '#d594aa', dark: '#79465d', light: '#f8c7d6' },
];
const families = [
  // tipo, arte de origem, categoria, nome, preço inicial, nível inicial
  ['bed', 'bed', 'Móveis', 'Cama', 300, 2],
  ['sofa', 'sofa', 'Móveis', 'Sofá', 430, 4],
  ['rug', 'rug', 'Móveis', 'Tapete trama', 120, 2],
  ['shelf', 'shelf', 'Móveis', 'Estante', 240, 3],
  ['chair', 'gamer-chair', 'Móveis', 'Cadeira gamer', 340, 4],
  ['desk', 'desk', 'Setup', 'Mesa', 300, 3],
  ['monitor', 'monitor', 'Setup', 'Monitor', 420, 5],
  ['keyboard', 'keyboard', 'Setup', 'Teclado mecânico', 180, 2],
  ['speaker', 'speaker', 'Setup', 'Caixas de som', 230, 3],
  ['shirt', 'shirt', 'Roupas', 'Moletom bordado', 95, 1],
  ['cap', 'cap', 'Roupas', 'Boné', 65, 1],
  ['headphones', 'headphones', 'Roupas', 'Fone', 140, 2],
  ['plant', 'plant', 'Decoração', 'Planta', 80, 1],
  ['lamp', 'lamp', 'Decoração', 'Luminária', 110, 2],
  ['poster', 'poster', 'Decoração', 'Quadro', 75, 1],
  ['curtains', 'curtains', 'Decoração', 'Cortinas', 120, 2],
  ['mug', 'mug', 'Decoração', 'Caneca', 45, 1],
  ['clock', 'clock', 'Decoração', 'Relógio', 90, 2],
  ['neon', 'neon', 'Decoração', 'Letreiro', 260, 4],
  ['books', 'books', 'Decoração', 'Coleção de livros', 130, 2],
];
const details = {
  bed: 'Cabeceira acolchoada e roupa de cama. Continua disponível para dormir com E.',
  sofa: 'Dois lugares com almofadas e acabamento da coleção.',
  rug: 'Tapete geométrico grande para o centro da casa.',
  shelf: 'Prateleiras com livros organizados na parede.',
  chair: 'Encosto alto com costuras e detalhes coloridos. Substitui a cadeira da mesa.',
  desk: 'Mesa com gavetas e acabamento colorido. Mantém o computador e acessórios.',
  monitor: 'Tela panorâmica com moldura e interface da coleção.',
  keyboard: 'Teclas coloridas sobre a mesa. Substitui o teclado padrão.',
  speaker: 'Par de caixas com detalhes na cor da coleção.',
  shirt: 'Moletom com faixa e bordado. Muda o personagem no mapa e no retrato.',
  cap: 'Boné com aba e bordado da coleção.',
  headphones: 'Fone com arco e conchas na cor da coleção.',
  plant: 'Folhagens em um vaso decorado para o canto da casa.',
  lamp: 'Luminária de piso com cúpula colorida e luz quente.',
  poster: 'Paisagem ilustrada com moldura e cores da coleção.',
  curtains: 'Cortinas coloridas nas duas janelas da casa.',
  mug: 'Caneca estampada ao lado do computador.',
  clock: 'Relógio de parede com moldura colorida.',
  neon: 'Letreiro luminoso com a mensagem da coleção.',
  books: 'Livros com lombadas coloridas sobre a mesa.',
};
export const legacyShopModels = families.flatMap(([slot, baseId, category, name, price, level]) =>
  finishes.map((finish, index) => ({
    id: `${slot}-${finish.name.toLowerCase()}`,
    category,
    slot,
    baseId,
    price: Math.round((price * 0.94 * [1, 1.35, 1.75, 2.3, 3][index]) / 5) * 5,
    minLevel: level + [0, 4, 10, 17, 25][index],
    gender: category === 'Roupas' ? 'male' : 'all',
    description: details[slot],
    ...finish,
    // A etiqueta da coleção integra o nome do item.
    name: `${name} ${finish.name}`,
    variant: index + 1,
    word: ['CREATE', 'GROW', 'DREAM', 'BUILD', 'SHINE'][index],
  })),
);
export const itemTiers = [
  {
    id: 'trainee',
    name: 'do Estagiário',
    level: 5,
    color: '#75ac89',
    dark: '#365f53',
    light: '#c4dfb5',
  },
  { id: 'dev', name: 'do Dev', level: 10, color: '#22c55e', dark: '#14532d', light: '#bbf7d0' },
  {
    id: 'professional',
    name: 'do Profissional',
    level: 20,
    color: '#3b82f6',
    dark: '#1e3a8a',
    light: '#bfdbfe',
  },
  {
    id: 'specialist',
    name: 'do Especialista',
    level: 30,
    color: '#a855f7',
    dark: '#581c87',
    light: '#e9d5ff',
  },
  {
    id: 'future',
    name: 'Futurístico',
    level: 50,
    color: '#121923',
    dark: '#060a10',
    light: '#64ff36',
  },
  {
    id: 'master',
    name: 'do Mestre',
    level: 100,
    color: '#101014',
    dark: '#030305',
    light: '#d5d8e1',
  },
];
export const itemFamilies = [
  ['wardrobe', 'wardrobe', 'Móveis', 'Armário', 300],
  ['sofa', 'sofa', 'Móveis', 'Sofá', 380],
  ['shelf', 'shelf', 'Móveis', 'Estante', 220],
  ['chair', 'gamer-chair', 'Móveis', 'Cadeira', 320],
  ['desk', 'desk', 'Setup', 'Mesa de computador', 280],
  ['computer', 'computer', 'Setup', 'Computador', 450],
  ['keyboard', 'keyboard', 'Setup', 'Teclado', 150],
  ['mouse', 'mouse', 'Setup', 'Mouse', 80],
  ['speaker', 'speaker', 'Setup', 'Caixa de som', 180],
  ['table', 'table', 'Móveis', 'Mesa', 240],
  ['monitor', 'monitor', 'Setup', 'Monitor', 360],
  ['lamp', 'lamp', 'Decoração', 'Luminária', 95],
  ['clock', 'clock', 'Decoração', 'Relógio', 75],
  ['neon', 'neon', 'Decoração', 'Letreiro', 200],
  ['cap', 'cap', 'Roupas', 'Boné', 65],
  ['bed', 'bed', 'Móveis', 'Cama', 350],
  ['rug', 'rug', 'Móveis', 'Tapete', 100],
  ['poster', 'poster', 'Decoração', 'Quadro', 65],
  ['curtains', 'curtains', 'Decoração', 'Janela', 120],
  ['mug', 'mug', 'Decoração', 'Caneca', 40],
  ['plant', 'cactus', 'Decoração', 'Jarro com cacto', 65],
  ['headphones', 'headphones', 'Roupas', 'Headset', 125],
  ['pants', 'pants', 'Roupas', 'Calça', 80],
  ['shirt', 'shirt', 'Roupas', 'Blusa', 85],
  ['hairstyle', 'hairstyle', 'Roupas', 'Cabelo', 70],
];
export const commonItems = itemFamilies.map(([slot, baseId, category, name]) => ({
  id: `${slot}-common`,
  slot,
  baseId,
  category,
  name: `${name} comum`,
  price: 0,
  minLevel: 1,
  minXp: 0,
  color: slot === 'shirt' || slot === 'pants' ? '#ffffff' : '#c9a47c',
  dark: '#785b45',
  light: '#f2dfc0',
  gender: 'all',
  variant: 0,
  common: true,
  description: 'Modelo inicial que já acompanha seu personagem e sua casa.',
}));
export const shopModels = itemFamilies.flatMap(([slot, baseId, category, name, price]) =>
  itemTiers.map((tier, index) => ({
    ...tier,
    id: `${slot}-${tier.id}`,
    slot,
    baseId,
    category,
    name: `${name} ${index === 4 && ['shelf', 'chair', 'desk', 'speaker', 'table', 'lamp', 'bed', 'curtains', 'mug', 'pants', 'shirt'].includes(slot) ? 'Futurística' : tier.name}`,
    price: Math.round((price * 0.94 * [1, 2, 4, 7, 12, 16][index]) / 5) * 5 * (tier.id === 'master' ? 100 : 1),
    ...(tier.id === 'master' ? {region:'downtown', currency:'brl', collection:'DevClub'} : {}),
    minLevel: tier.level,
    gender: slot === 'shirt' || slot === 'pants' ? 'male' : 'all',
    variant: index + 1,
    word: ['JS', 'HTML', 'CSS', 'DEV', 'FUTURO', 'DevClub'][index],
    description:
      index === 0
        ? 'Modelo comum com acabamento verde.'
        : index === 4
          ? 'Design futurístico preto com detalhes luminosos verde neon.'
          : 'Design aprimorado com novos detalhes, materiais e acabamento.',
  })),
);
export const regionalItems = ['downtown','usa'].flatMap(region => [
  ['shirt','shirt','Roupas',region==='usa'?'Jaqueta Signature':'Jaqueta Urban',region==='usa'?1200:18000],
  ['pants','pants','Roupas',region==='usa'?'Calça de alfaiataria':'Calça cargo',region==='usa'?900:12000],
  ['computer','computer','Setup',region==='usa'?'Workstation Titan':'Desktop Ryzen',region==='usa'?5000:350000],
  ['monitor','monitor','Setup',region==='usa'?'Monitor OLED 49':'Monitor QHD 27',region==='usa'?2500:150000],
  ['laptop','laptop','Setup',region==='usa'?'Notebook Aurora Pro':'Notebook Urban',region==='usa'?6500:450000],
  ['vehicle','car','Veículos',region==='usa'?'Carro Gran Turismo':'Carro compacto',region==='usa'?15000:1800000],
  ['vehicle','motorcycle','Veículos',region==='usa'?'Moto Super Sport':'Moto urbana',region==='usa'?8000:850000],
].map(([slot,baseId,category,name,price],index)=>({id:`${region}-${baseId}`,region,currency:region==='usa'?'usd':'brl',slot,baseId,category,name,price,minLevel:1,minXp:0,gender:'all',variant:region==='usa'?5:3,color:region==='usa'?'#b69bdb':'#509ec4',dark:'#27394a',light:'#e0f4f1',word:region==='usa'?'PRO':'DEV',description:slot==='laptop'?(region==='usa'?'Notebook premium com acabamento Aurora e teclado RGB. B para segurar; N para abrir.':'Notebook portátil para estudar em qualquer lugar. B para segurar; N para abrir.'):region==='usa'?'Linha premium internacional.':'Design urbano para sua nova fase.'})));
const modelById = new Map(
  [...legacyShopModels, ...commonItems, ...shopModels, ...regionalItems].map((item) => [item.id, item]),
);
export const itemModel = (id) => modelById.get(id.replace(/-female$/, ''));
export const baseItemId = (id) => itemModel(id)?.baseId || id.replace(/-female$/, '');
export const equippedBases = (equipped) => equipped.map(baseItemId);
export const equippedModel = (equipped, slot) =>
  equipped.map(itemModel).find((item) => item?.slot === slot);
