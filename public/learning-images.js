const svg = (width, height, drawing) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${drawing}</svg>`,
).replace(/'/g, '%27');

const avatar = svg(240, 240, `
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#d4f4df"/><stop offset="1" stop-color="#a3c9e3"/></linearGradient></defs>
  <rect width="240" height="240" rx="32" fill="url(#bg)"/>
  <circle cx="120" cy="102" r="58" fill="#ffffff" opacity=".4"/>
  <path d="M49 226v-26c0-43 142-43 142 0v26" fill="#234453"/>
  <path d="M99 159h42v28l-21 17-21-17" fill="#c58d68"/>
  <ellipse cx="120" cy="111" rx="43" ry="53" fill="#e6b58c"/>
  <path d="M77 110V84c0-54 87-57 87 0v26l-13-24c-31 4-47-5-55-13l-7 37" fill="#29313c"/>
  <circle cx="104" cy="113" r="4" fill="#283540"/><circle cx="136" cy="113" r="4" fill="#283540"/>
  <path d="M108 137q12 12 24 0" fill="none" stroke="#9b584b" stroke-width="4" stroke-linecap="round"/>
  <path d="M65 210h24m62 0h24" stroke="#78d5a3" stroke-width="4"/>
`);
const city = (wide) => svg(wide ? 640 : 320, 240, `
  <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#b1daf0"/><stop offset="1" stop-color="#eaf5df"/></linearGradient></defs>
  <rect width="640" height="240" fill="url(#sky)"/>
  <circle cx="${wide ? 550 : 267}" cy="40" r="24" fill="#fff3b0"/>
  <path d="M0 150Q110 87 220 140T440 130T660 143V240H0" fill="#99c7a3"/>
  <path d="M0 193H640V240H0" fill="#659a7d"/>
  <path d="M0 220H640" stroke="#cce2be" stroke-width="25"/>
  <g stroke="#476b7c" stroke-width="3">
    <rect x="30" y="91" width="84" height="103" rx="5" fill="#ead6b6"/>
    <rect x="137" y="65" width="100" height="129" rx="5" fill="#b7d5d9"/>
    <rect x="262" y="111" width="88" height="83" rx="5" fill="#d8bdcf"/>
    ${wide ? '<rect x="382" y="81" width="100" height="113" rx="5" fill="#cbdcc0"/><rect x="510" y="102" width="85" height="92" rx="5" fill="#e8cca8"/>' : ''}
  </g>
  <g fill="#426d84"><path d="M45 107h18v23H45zm33 0h18v23H78zm-33 38h18v23H45zm33 0h18v23H78zM153 84h20v25h-20zm37 0h20v25h-20zm-37 42h20v25h-20zm37 0h20v25h-20z"/></g>
  <rect x="171" y="164" width="30" height="30" fill="#456476"/>
  <g fill="#3d805e"><circle cx="124" cy="166" r="22"/><circle cx="${wide ? 365 : 308}" cy="173" r="23"/></g>
  <g stroke="#78674e" stroke-width="6"><path d="M124 178v25m${wide ? 241 : 184} -25v25"/></g>
`);
const project = svg(320, 180, `
  <rect width="320" height="180" rx="16" fill="#162c3b"/>
  <rect x="20" y="18" width="280" height="144" rx="9" fill="#f1f7f3"/>
  <path d="M20 44h280V27q0-9-9-9H29q-9 0-9 9" fill="#53766e"/>
  <g fill="#c0e0c7"><circle cx="32" cy="31" r="3"/><circle cx="43" cy="31" r="3"/><circle cx="54" cy="31" r="3"/></g>
  <rect x="35" y="60" width="103" height="12" rx="3" fill="#254a48"/>
  <rect x="35" y="82" width="165" height="6" rx="3" fill="#a0b7ac"/><rect x="35" y="95" width="129" height="6" rx="3" fill="#a0b7ac"/>
  <rect x="35" y="115" width="67" height="24" rx="5" fill="#28a866"/>
  <rect x="219" y="61" width="61" height="78" rx="8" fill="#d0e7d7"/>
  <path d="m237 88-8 10 8 10m25-20 8 10-8 10m-8-25-9 30" fill="none" stroke="#3a8262" stroke-width="3"/>
`);

export const learningImages = {
  'avatar.png': avatar,
  'cidade.png': city(true),
  'projeto.png': project,
  'grande.png': city(true),
  'pequena.png': city(false),
};

// Resolve os arquivos didáticos somente na prévia, sem alterar o código entregue pelo aluno.
export function resolveLearningImages(html) {
  const resolve = (url) => learningImages[url.replace(/^\.\//, '')] || url;
  return html.replace(/<(?:img|source)\b[^>]*>/gi, (tag) => tag.replace(
    /\b(src|srcset)\s*=\s*(?:(["'])(.*?)\2|([^\s"'=<>`]+))/gi,
    (_attribute, name, quoted, quotedValue, unquotedValue) => {
      const value = quotedValue ?? unquotedValue;
      const quote = quoted || '"';
      const resolved = name.toLowerCase() === 'srcset' && !value.startsWith('data:')
        ? value.split(',').map((candidate) => candidate.trim().replace(/^\S+/, resolve)).join(', ')
        : resolve(value);
      return `${name}=${quote}${resolved}${quote}`;
    },
  ));
}
