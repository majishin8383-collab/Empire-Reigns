/* Empire Reigns — game.world.js
   Build: ER-20260109d2d
   Purpose: world assets (building SVGs) + mounting
*/
(() => {
  const ER = (window.ER = window.ER || {});
  const U  = ER.util;

  // NOTE: This is ONLY the artwork markup. No game logic here.
  const SVG_BODIES = {
    office: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="112" cy="170" rx="76" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M40 85 L110 35 L182 85 L170 96 L110 55 L52 96 Z"
              fill="rgba(255,210,120,.14)" stroke="rgba(255,245,220,.28)" stroke-width="3" stroke-linejoin="round"/>
        <path d="M56 92 L110 58 L166 92" stroke="rgba(0,0,0,.18)" stroke-width="4" stroke-linecap="round" opacity=".35"/>
        <rect x="52" y="88" width="116" height="78" rx="20"
              fill="rgba(255,245,220,.08)" stroke="rgba(255,245,220,.26)" stroke-width="3"/>
        <rect x="58" y="94" width="104" height="66" rx="18"
              fill="rgba(0,0,0,.10)" opacity=".55"/>
        <rect x="70" y="150" width="80" height="16" rx="10"
              fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.18)" stroke-width="3"/>
        <rect x="98" y="118" width="28" height="48" rx="12"
              fill="rgba(0,0,0,.25)" stroke="rgba(255,245,220,.22)" stroke-width="3"/>
        <circle cx="121" cy="143" r="2.3" fill="rgba(255,210,120,.35)"/>

        <g opacity=".95">
          <rect x="68" y="110" width="28" height="22" rx="10"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
          <path d="M82 110 V132" stroke="rgba(255,245,220,.18)" stroke-width="3" opacity=".7"/>
          <path d="M68 121 H96" stroke="rgba(255,245,220,.16)" stroke-width="3" opacity=".7"/>
          <rect x="136" y="110" width="28" height="22" rx="10"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
          <path d="M150 110 V132" stroke="rgba(255,245,220,.18)" stroke-width="3" opacity=".7"/>
          <path d="M136 121 H164" stroke="rgba(255,245,220,.16)" stroke-width="3" opacity=".7"/>
        </g>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="64" y="138" width="26" height="18" rx="9"
                fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
          <rect x="140" y="138" width="26" height="18" rx="9"
                fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <circle cx="56" cy="132" r="10" fill="rgba(120,220,180,.10)" stroke="rgba(120,220,180,.20)" stroke-width="3"/>
          <path d="M56 125 V139" stroke="rgba(255,245,220,.18)" stroke-width="3"/>
          <path d="M49 132 H63" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <path d="M74 86 C92 70, 128 70, 146 86" fill="none" stroke="rgba(255,210,120,.20)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="110" cy="72" r="4" fill="rgba(255,210,120,.26)"/>
        </g>

        <rect x="62" y="78" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="93" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">OFFICE</text>
        <text x="110" y="106" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `,
    warehouse: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="110" cy="172" rx="84" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M56 72 L110 36 L164 72 L164 86 L56 86 Z"
              fill="rgba(255,140,170,.10)" stroke="rgba(255,245,220,.26)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="52" y="84" width="116" height="84" rx="22"
              fill="rgba(255,245,220,.06)" stroke="rgba(255,245,220,.24)" stroke-width="3"/>
        <rect x="64" y="108" width="92" height="60" rx="18"
              fill="rgba(0,0,0,.24)" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        <path d="M110 108 V168" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
        <g opacity=".9">
          <rect x="70" y="92" width="22" height="16" rx="8"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
          <rect x="128" y="92" width="22" height="16" rx="8"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
        </g>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="42" y="148" width="18" height="14" rx="7" fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
          <rect x="160" y="148" width="18" height="14" rx="7" fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <path d="M40 138 H70" stroke="rgba(120,220,180,.18)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="40" cy="138" r="5" fill="rgba(120,220,180,.18)"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <path d="M178 120 C190 110, 196 122, 188 134" fill="none" stroke="rgba(255,210,120,.18)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="188" cy="136" r="5" fill="rgba(255,210,120,.18)"/>
        </g>

        <rect x="62" y="64" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="79" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">WAREHOUSE</text>
        <text x="110" y="92" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `,
    workshop: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="110" cy="172" rx="84" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M54 78 L110 42 L166 78 L154 90 L110 62 L66 90 Z"
              fill="rgba(120,220,180,.10)" stroke="rgba(255,245,220,.26)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="52" y="88" width="116" height="80" rx="22"
              fill="rgba(255,245,220,.06)" stroke="rgba(255,245,220,.24)" stroke-width="3"/>
        <rect x="74" y="110" width="72" height="58" rx="18"
              fill="rgba(0,0,0,.24)" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        <g opacity=".65">
          <path d="M80 122 H140" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
          <path d="M80 134 H140" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
          <path d="M80 146 H140" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
        </g>

        <circle cx="68" cy="120" r="12" fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
        <path d="M64 120 L72 128" stroke="rgba(255,245,220,.75)" stroke-width="3" stroke-linecap="round"/>
        <path d="M72 114 L78 120" stroke="rgba(255,245,220,.75)" stroke-width="3" stroke-linecap="round"/>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="40" y="148" width="22" height="14" rx="7"
                fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <path d="M170 92 V116" stroke="rgba(255,245,220,.14)" stroke-width="3" stroke-linecap="round"/>
          <circle cx="170" cy="124" r="10" fill="rgba(255,210,120,.12)" stroke="rgba(255,210,120,.20)" stroke-width="3"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <path d="M152 68 C162 54, 176 54, 186 68" fill="none" stroke="rgba(255,210,120,.18)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="169" cy="52" r="4" fill="rgba(255,210,120,.20)"/>
        </g>

        <rect x="62" y="80" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="95" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">WORKSHOP</text>
        <text x="110" y="108" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `,
    market: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="110" cy="172" rx="84" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M58 80 H162 L154 104 H66 Z"
              fill="rgba(255,210,120,.14)" stroke="rgba(255,245,220,.26)" stroke-width="3" stroke-linejoin="round"/>
        <g opacity=".42">
          <path d="M72 80 L68 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M92 80 L88 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M112 80 L108 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M132 80 L128 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M152 80 L148 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
        </g>

        <rect x="60" y="102" width="104" height="66" rx="22"
              fill="rgba(255,245,220,.06)" stroke="rgba(255,245,220,.24)" stroke-width="3"/>
        <rect x="76" y="120" width="50" height="30" rx="14"
              fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
        <rect x="134" y="118" width="22" height="50" rx="14"
              fill="rgba(0,0,0,.22)" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        <circle cx="150" cy="144" r="2.3" fill="rgba(255,210,120,.35)"/>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="78" y="112" width="26" height="10" rx="5" fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <rect x="168" y="132" width="16" height="22" rx="8" fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.18)" stroke-width="3"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <rect x="60" y="102" width="104" height="66" rx="22" fill="none" stroke="rgba(255,210,120,.18)" stroke-width="4"/>
        </g>

        <rect x="62" y="64" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="79" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">MARKET</text>
        <text x="110" y="92" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `
  };

  function mountBuildingSvgs(){
    const bOffice = U.$("bOffice");
    const bWarehouse = U.$("bWarehouse");
    const bGarage = U.$("bGarage");
    const bShop = U.$("bShop");

    if (!bOffice || !bWarehouse || !bGarage || !bShop) return;

    bOffice.innerHTML = SVG_BODIES.office;
    bWarehouse.innerHTML = SVG_BODIES.warehouse;
    bGarage.innerHTML = SVG_BODIES.workshop;
    bShop.innerHTML = SVG_BODIES.market;
  }

  ER.world = { mountBuildingSvgs };
})();
