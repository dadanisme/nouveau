// Generates the two hero illustrations (flat vector, faceless figures: one man, one woman, optional child) into public/art/.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(root, 'public/art');
const ACC = '#E24A00';

const C = {
  skin: '#D8A98A', skinShade: '#BE8C6C',
  manHair: '#3A322F', womanHair: '#5A3E31', kidHair: '#6A4A38',
  manShirt: '#5F7A8E', manPants: '#3F4B58', manShoe: '#2A2D32',
  dress: '#8CA593', womanShoe: '#4A4A50',
  kidTee: '#A79BC0', kidPants: '#6E7B8B', kidShoe: '#3A3A3C',
};

// ---------- the shared phone, original local coordinates 360-640 x 140-700 ----------
const phoneInner = (avatars) => `
    <rect x="360" y="140" width="280" height="560" rx="50" fill="${ACC}"/>
    <rect x="376" y="156" width="248" height="528" rx="36" fill="#FFFFFF"/>
    <rect x="392" y="196" width="100" height="14" rx="7" fill="#1C1C1E"/>
    ${avatars}
    <g clip-path="url(#bar)">
      <rect x="392" y="240" width="216" height="22" fill="#E5E5EA"/>
      <rect x="392" y="240" width="92" height="22" fill="${ACC}"/>
      <rect x="487" y="240" width="56" height="22" fill="#636366"/>
      <rect x="546" y="240" width="38" height="22" fill="#AEAEB2"/>
    </g>
    <circle cx="397" cy="285" r="5" fill="${ACC}"/><rect x="408" y="281" width="30" height="8" rx="4" fill="#C7C7CC"/>
    <circle cx="456" cy="285" r="5" fill="#636366"/><rect x="467" y="281" width="30" height="8" rx="4" fill="#C7C7CC"/>
    <circle cx="515" cy="285" r="5" fill="#AEAEB2"/><rect x="526" y="281" width="30" height="8" rx="4" fill="#C7C7CC"/>
    ${[
      [312, ACC, 88, 56, 40, 556],
      [392, '#D1D1D6', 70, 48, 32, 564],
      [472, '#D1D1D6', 96, 62, 44, 552],
      [552, '#D1D1D6', 64, 44, 36, 560],
    ]
      .map(
        ([y, ic, w1, w2, w3, x3]) => `
    <g>
      <rect x="392" y="${y}" width="216" height="68" rx="18" fill="#F2F2F7"/>
      <circle cx="426" cy="${y + 34}" r="20" fill="${ic}"/><circle cx="426" cy="${y + 34}" r="7" fill="#FFFFFF"/>
      <rect x="458" y="${y + 20}" width="${w1}" height="12" rx="6" fill="#3A3A3C"/><rect x="458" y="${y + 40}" width="${w2}" height="9" rx="4.5" fill="#AEAEB2"/>
      <rect x="${x3}" y="${y + 27}" width="${w3}" height="12" rx="6" fill="#636366"/>
    </g>`,
      )
      .join('')}
    <rect x="470" y="666" width="60" height="6" rx="3" fill="#D1D1D6"/>`;
const barClip = `<clipPath id="bar"><rect x="392" y="240" width="216" height="22" rx="11"/></clipPath>`;

// ---------- hand: gripping the phone's side edge. Local frame: phone edge at x=0, hand extends to the left (-x); mirrored for the right side ----------
// palm sits behind the phone (fingers wrap round the back); the thumb lies over the bezel, with the thenar pad at its root.
const handBack = () => `<path d="M-70 -24 L-24 -36 Q22 -40 26 -8 L26 24 Q22 48 -14 46 L-64 36 Q-74 33 -74 24 L-74 -12 Q-74 -20 -70 -24 Z" fill="${C.skin}" stroke="${C.skin}" stroke-width="6" stroke-linejoin="round"/>`;
const handFront = () => `
  <ellipse cx="-40" cy="10" rx="32" ry="28" fill="${C.skin}"/>
  <path d="M-40 2 L-10 -16 L26 -44" fill="none" stroke="${C.skin}" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M-20 -2 L4 -16" fill="none" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round"/>`;
const placeHand = (edgeX, y, side, k, inner) => {
  const t = side === 'left' ? `translate(${edgeX} ${y}) scale(${k})` : `translate(${edgeX} ${y}) scale(${-k} ${k})`;
  return `<g transform="${t}">${inner}</g>`;
};

/** Arm: thick sleeve stroke shoulder -> elbow -> wrist. */
const arm = (s, e, w, col, width) => `<path d="M${s[0]} ${s[1]} Q${e[0]} ${e[1]} ${w[0]} ${w[1]}" fill="none" stroke="${col}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---------- figures (local frame: feet centre at the origin, y up is negative) ----------
const hangingHand = (x, y, k = 1) => `<rect x="${x - 19 * k}" y="${y}" width="${38 * k}" height="${56 * k}" rx="${19 * k}" fill="${C.skin}"/>`;

const man = ({ cx, G, s, outer }) => `
  <g transform="translate(${cx} ${G}) scale(${s})">
    ${arm([outer * 98, -676], [outer * 116, -540], [outer * 118, -440], C.manShirt, 44)}
    ${hangingHand(outer * 118, -446)}
    <rect x="-66" y="-446" width="58" height="420" rx="22" fill="${C.manPants}"/>
    <rect x="8" y="-446" width="58" height="420" rx="22" fill="${C.manPants}"/>
    <rect x="-80" y="-30" width="76" height="30" rx="15" fill="${C.manShoe}"/>
    <rect x="4" y="-30" width="76" height="30" rx="15" fill="${C.manShoe}"/>
    <path d="M-108 -650 Q-108 -724 -46 -728 H46 Q108 -724 108 -650 V-388 Q108 -372 92 -372 H-92 Q-108 -372 -108 -388 Z" fill="${C.manShirt}"/>
    <rect x="-19" y="-752" width="38" height="40" rx="12" fill="${C.skin}"/>
    <circle cx="0" cy="-792" r="54" fill="${C.skin}"/>
    <path d="M-57 -790 A57 57 0 0 1 57 -790 Q50 -814 0 -817 Q-50 -814 -57 -790 Z" fill="${C.manHair}"/>
  </g>`;

const woman = ({ cx, G, s, outer }) => `
  <g transform="translate(${cx} ${G}) scale(${s})">
    ${arm([outer * 80, -682], [outer * 100, -566], [outer * 98, -470], C.dress, 38)}
    ${hangingHand(outer * 98, -474, 0.92)}
    <rect x="-42" y="-260" width="36" height="236" rx="16" fill="${C.skin}"/>
    <rect x="6" y="-260" width="36" height="236" rx="16" fill="${C.skin}"/>
    <rect x="-52" y="-26" width="52" height="26" rx="13" fill="${C.womanShoe}"/>
    <rect x="0" y="-26" width="52" height="26" rx="13" fill="${C.womanShoe}"/>
    <path d="M-88 -640 Q-88 -708 -42 -712 H42 Q88 -708 88 -640 L68 -470 L134 -262 Q138 -236 112 -236 H-112 Q-138 -236 -134 -262 L-68 -470 Z" fill="${C.dress}"/>
    <rect x="-17" y="-736" width="34" height="38" rx="12" fill="${C.skin}"/>
    <!-- hair: tied in a low ponytail that falls over the far shoulder -->
    <path d="M36 -782 C84 -778 116 -728 104 -640 C98 -604 66 -616 66 -650 C64 -700 52 -730 26 -744 Z" fill="${C.womanHair}"/>
    <circle cx="50" cy="-752" r="9" fill="${C.manHair}"/>
    <circle cx="0" cy="-778" r="50" fill="${C.skin}"/>
    <path d="M-57 -774 A57 57 0 0 1 57 -774 Q60 -802 24 -810 Q-24 -818 -57 -774 Z" fill="${C.womanHair}"/>
  </g>`;

const child = ({ cx, G, s, tilt }) => `
  <g transform="translate(${cx} ${G}) scale(${s})">
    <rect x="-54" y="-340" width="50" height="316" rx="22" fill="${C.kidPants}"/>
    <rect x="4" y="-340" width="50" height="316" rx="22" fill="${C.kidPants}"/>
    <rect x="-70" y="-30" width="68" height="30" rx="15" fill="${C.kidShoe}"/>
    <rect x="2" y="-30" width="68" height="30" rx="15" fill="${C.kidShoe}"/>
    ${arm([-66, -604], [-84, -480], [-82, -400], C.kidTee, 44)}
    ${hangingHand(-82, -410)}
    <path d="M-84 -590 Q-84 -652 -36 -656 H36 Q84 -652 84 -590 V-326 Q84 -312 70 -312 H-70 Q-84 -312 -84 -326 Z" fill="${C.kidTee}"/>
    <g transform="rotate(${tilt} 0 -660)">
      <rect x="-20" y="-676" width="40" height="34" rx="12" fill="${C.skin}"/>
      <circle cx="0" cy="-728" r="66" fill="${C.skin}"/>
      <path d="M-69 -726 A69 69 0 0 1 69 -726 Q60 -764 24 -770 Q-10 -772 -69 -726 Z" fill="${C.kidHair}"/>
      <path d="M-4 -792 Q8 -812 22 -800 Q12 -788 -4 -792 Z" fill="${C.kidHair}"/>
    </g>
  </g>`;

const svgWrap = (vb, label, body) => {
  const [x, y, w, h] = vb.split(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}" role="img" aria-label="${label}">
  <defs>${barClip}</defs>
${body}
</svg>
`;
};

const G = 900;                       // ground line
const PS = 0.9;                      // phone scale
const phoneAt = (PX, PY, avatars) => `<g id="phone" transform="translate(${PX} ${PY}) scale(${PS}) translate(-500 -420)">${phoneInner(avatars)}</g>`;
const avatarsFor = (n) => Array.from({ length: n }, (_, i) => `<circle cx="${600 - i * 20}" cy="203" r="13" fill="${['#636366', '#AEAEB2', '#8E8E93'][i]}" stroke="#FFFFFF" stroke-width="3"/>`).join('');
const px = (PX, x) => PX + PS * (x - 500);
const phoneCy = G - 540;
const py = (y) => phoneCy + PS * (y - 420);
const handY = G - 480;

// ---------- couple: man + woman ----------
{
  const PX = 600;
  const eL = px(PX, 360), eR = px(PX, 640);
  const M = { cx: 262, G, s: 1, outer: -1 };
  const W = { cx: 938, G, s: 0.95, outer: 1 };
  const mSh = [M.cx + 90, G - 662], wSh = [W.cx - 72 * W.s, G - 650 * W.s];
  const body = `
  <circle cx="${PX}" cy="470" r="440" fill="#FDEBDF"/>
  <ellipse cx="${PX}" cy="${G + 6}" rx="500" ry="24" fill="#E5E5EA"/>
  ${man(M)}
  ${woman(W)}
  <!-- reaching arms and the palms (behind the phone) -->
  ${arm(mSh, [M.cx + 150, G - 520], [eL - 58, handY], C.manShirt, 44)}
  ${arm(wSh, [W.cx - 130, G - 530], [eR + 56, handY + 14], C.dress, 38)}
  ${placeHand(eL, handY, 'left', 1, handBack())}
  ${placeHand(eR, handY + 14, 'right', 0.9, handBack())}
  ${phoneAt(PX, phoneCy, avatarsFor(2))}
  ${placeHand(eL, handY, 'left', 1, handFront())}
  ${placeHand(eR, handY + 14, 'right', 0.9, handFront())}`;
  fs.writeFileSync(path.join(OUT, 'hero-couple.svg'), svgWrap('90 10 1020 930', 'A man and a woman holding one phone together, showing a shared family list', body));
}

// ---------- family: man + woman + child ----------
{
  const PX = 640;
  const eL = px(PX, 360), eR = px(PX, 640);
  const M = { cx: 196, G, s: 1, outer: -1 };
  const K = { cx: 392, G, s: 0.46, tilt: 12 };
  const W = { cx: 1070, G, s: 0.95, outer: 1 };
  const mSh = [M.cx + 90, G - 662], wSh = [W.cx - 72 * W.s, G - 650 * W.s];
  const kHandY = G - 330;
  const kSh = [K.cx + 66 * K.s, G - 604 * K.s];
  const body = `
  <circle cx="${PX}" cy="470" r="450" fill="#FDEBDF"/>
  <ellipse cx="${PX}" cy="${G + 6}" rx="560" ry="24" fill="#E5E5EA"/>
  ${man(M)}
  ${woman(W)}
  ${child(K)}
  ${arm(mSh, [M.cx + 150, G - 520], [eL - 58, handY], C.manShirt, 44)}
  ${arm(wSh, [W.cx - 130, G - 530], [eR + 56, handY + 14], C.dress, 38)}
  ${arm([K.cx + 70 * K.s, G - 600 * K.s], [K.cx + 120 * K.s, G - 560 * K.s], [eL - 34, kHandY], C.kidTee, 26)}
  ${placeHand(eL, handY, 'left', 1, handBack())}
  ${placeHand(eR, handY + 14, 'right', 0.9, handBack())}
  ${placeHand(eL, kHandY, 'left', 0.45, handBack())}
  ${phoneAt(PX, phoneCy, avatarsFor(3))}
  ${placeHand(eL, handY, 'left', 1, handFront())}
  ${placeHand(eR, handY + 14, 'right', 0.9, handFront())}
  ${placeHand(eL, kHandY, 'left', 0.45, handFront())}`;
  fs.writeFileSync(path.join(OUT, 'hero-family.svg'), svgWrap('20 0 1180 950', 'A man, a woman and a child holding one phone together, showing a shared family list', body));
}
console.log('heroes written');
