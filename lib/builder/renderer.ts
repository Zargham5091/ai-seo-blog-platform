export interface RenderOptions {
    props: Record<string, unknown>;
    globalTheme?: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
        textColor: string;
        fontHeading: string;
        fontBody: string;
        borderRadius: string;
    };
}

export function renderTemplate(htmlTemplate: string, options: RenderOptions): string {
    const {props, globalTheme} = options;
    const mergedProps: Record<string, unknown> = {...globalTheme, ...props};
    let output = htmlTemplate ?? '';

    // 1. Array blocks
    output = output.replace(
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, key, inner) => {
            const value = mergedProps[key];
            if (!Array.isArray(value)) return '';
            return value.map((item) => {
                if (typeof item === 'object' && item !== null) {
                    return inner.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) =>
                        escapeHtml(String((item as Record<string, unknown>)[k] ?? ''))
                    );
                }
                return inner.replace(/\{\{(\w+)\}\}/g, () => escapeHtml(String(item)));
            }).join('');
        }
    );

    // 2. Truthy blocks
    output = output.replace(
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, key, inner) => (isTruthy(mergedProps[key]) ? inner : '')
    );

    // 3. Falsy blocks
    output = output.replace(
        /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, key, inner) => (!isTruthy(mergedProps[key]) ? inner : '')
    );

    // 4. Color values
    output = output.replace(/\{\{color:(\w+)\}\}/g, (_match, key) => {
        const value = mergedProps[key];
        return typeof value === 'string' && value.startsWith('#') ? value : '#000000';
    });

    // 5. Raw HTML
    output = output.replace(/\{\{html:(\w+)\}\}/g, (_match, key) => {
        const value = mergedProps[key];
        return typeof value === 'string' ? value : '';
    });

    // 6. Simple substitutions
    output = output.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        const value = mergedProps[key];
        if (value === undefined || value === null) return '';
        return escapeHtml(String(value));
    });

    return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation system
// ─────────────────────────────────────────────────────────────────────────────

const ANIMATION_CSS = `
.sc-anim-fade-up     { opacity:0; transform:translateY(32px); }
.sc-anim-fade-in     { opacity:0; }
.sc-anim-slide-left  { opacity:0; transform:translateX(40px); }
.sc-anim-slide-right { opacity:0; transform:translateX(-40px); }
.sc-anim-zoom-in     { opacity:0; transform:scale(0.85); }
.sc-anim-bounce      { opacity:0; transform:scale(0.7); }
.sc-anim-flip-up     { opacity:0; transform:perspective(400px) rotateX(30deg) translateY(20px); }
[class*="sc-anim-"]  { transition-property:opacity,transform; transition-timing-function:ease; }
[class*="sc-anim-"].sc-visible { opacity:1 !important; transform:none !important; }
`;

const ANIMATION_JS = `
(function(){
  var els=document.querySelectorAll('[data-sc-anim]');
  if(!els.length)return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var el=e.target,parts=(el.dataset.scAnim||'').split('|');
        el.style.transitionDuration=parts[1]||'0.6s';
        el.style.transitionDelay=parts[2]||'0s';
        el.classList.add('sc-visible');
        io.unobserve(el);
      }
    });
  },{threshold:0.1});
  els.forEach(function(el){io.observe(el);});
})();
`;

function wrapWithAnimation(html: string, animationPreset: string | undefined): string {
    if (!animationPreset) return html;
    const presetId = animationPreset.split('|')[0];
    if (!presetId) return html;
    return `<div class="sc-anim-${escapeHtml(presetId)}" data-sc-anim="${escapeHtml(animationPreset)}">${html}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder interaction JS — injected into every iframe
// Handles: click-to-select, dblclick-to-edit, canvas drag-to-reorder,
//          external drop (drag from library), blue drop-line indicator
// ─────────────────────────────────────────────────────────────────────────────

const BUILDER_INTERACTION_JS = `
(function(){
  var PRIMARY = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#4F46E5';
 
  // ── Drop-line element ──────────────────────────────────────────────────────
  var dropLine = document.createElement('div');
  dropLine.id = 'sc-drop-line';
  Object.assign(dropLine.style, {
    position:'fixed', left:'0', right:'0', height:'3px', zIndex:'9999',
    background: PRIMARY || '#4F46E5',
    boxShadow: '0 0 6px ' + (PRIMARY || '#4F46E5'),
    pointerEvents:'none', display:'none', borderRadius:'2px',
    transition:'top 80ms ease',
  });
  document.body.appendChild(dropLine);
 
  function showDropLine(y) {
    dropLine.style.top = y + 'px';
    dropLine.style.display = 'block';
  }
  function hideDropLine() { dropLine.style.display = 'none'; }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
  function getComponents() {
    return Array.from(document.querySelectorAll('.builder-component'));
  }
 
  // Find which component the cursor is nearest to (returns {el, position:'before'|'after'})
  function getDropTarget(clientY) {
    var comps = getComponents();
    if (!comps.length) return null;
    for (var i = 0; i < comps.length; i++) {
      var rect = comps[i].getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (clientY < mid) return { el: comps[i], position: 'before', index: i };
    }
    return { el: comps[comps.length - 1], position: 'after', index: comps.length - 1 };
  }
 
  function getDropLineY(target) {
    if (!target) return 0;
    var rect = target.el.getBoundingClientRect();
    return target.position === 'before' ? rect.top - 2 : rect.bottom + 2;
  }
 
  // ── Click & double-click ───────────────────────────────────────────────────
  getComponents().forEach(function(el) {
    // Single click → select
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      getComponents().forEach(function(c) { c.classList.remove('selected'); });
      el.classList.add('selected');
      window.parent.postMessage({
        type: 'COMPONENT_SELECTED',
        instanceId: el.getAttribute('data-instance')
      }, '*');
    });
 
    // Double click → open edit panel
    el.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      window.parent.postMessage({
        type: 'COMPONENT_DBLCLICK',
        instanceId: el.getAttribute('data-instance')
      }, '*');
    });
 
    // ── Canvas drag-to-reorder ───────────────────────────────────────────────
    el.setAttribute('draggable', 'true');
 
    el.addEventListener('dragstart', function(e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/sc-instance', el.getAttribute('data-instance') || '');
      el.style.opacity = '0.4';
      // Small drag image
      var ghost = el.cloneNode(true);
      Object.assign(ghost.style, {
        position:'fixed', top:'-9999px', left:'-9999px',
        width: Math.min(el.offsetWidth, 320) + 'px',
        opacity:'0.9', pointerEvents:'none', zIndex:'-1',
      });
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 20);
      setTimeout(function() { document.body.removeChild(ghost); }, 0);
    });
 
    el.addEventListener('dragend', function() {
      el.style.opacity = '';
      hideDropLine();
    });
  });
 
  // ── DragOver on body (for both canvas reorder + external library drop) ─────
  document.body.addEventListener('dragover', function(e) {
    e.preventDefault();
    var target = getDropTarget(e.clientY);
    if (target) showDropLine(getDropLineY(target));
  });
 
  document.body.addEventListener('dragleave', function(e) {
    // Only hide if leaving the document entirely
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      hideDropLine();
    }
  });
 
  // ── Drop on canvas ─────────────────────────────────────────────────────────
  document.body.addEventListener('drop', function(e) {
    e.preventDefault();
    hideDropLine();
 
    var target = getDropTarget(e.clientY);
    var insertBeforeId = null;
    if (target) {
      insertBeforeId = target.position === 'before'
        ? target.el.getAttribute('data-instance')
        : (getComponents()[target.index + 1]?.getAttribute('data-instance') ?? null);
    }
 
    // Was it a canvas reorder?
    var fromId = e.dataTransfer.getData('text/sc-instance');
    if (fromId) {
      window.parent.postMessage({
        type: 'COMPONENT_REORDER',
        fromId: fromId,
        insertBeforeId: insertBeforeId,
      }, '*');
      return;
    }
 
    // Was it a library drag-in?
    var libKey = e.dataTransfer.getData('text/sc-library-key');
    if (libKey) {
      window.parent.postMessage({
        type: 'COMPONENT_DROP_EXTERNAL',
        componentKey: libKey,
        insertBeforeId: insertBeforeId,
      }, '*');
    }
  });
 
  // ── Body click → deselect ─────────────────────────────────────────────────
  document.body.addEventListener('click', function() {
    window.parent.postMessage({type: 'COMPONENT_DESELECTED'}, '*');
  });
 
  // ── Listen for parent messages ──────────────────────────────────────────────
  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data) return;
 
    // Highlight selected from layer strip click
    if (data.type === 'BUILDER_SELECT') {
      getComponents().forEach(function(c) { c.classList.remove('selected'); });
      var el = document.querySelector('[data-instance="' + data.instanceId + '"]');
      if (el) el.classList.add('selected');
    }
 
    // Prop-only update — patch template variables without full rewrite
    // This keeps drag state alive during editing
    if (data.type === 'UPDATE_PROPS') {
      var comp = document.querySelector('[data-instance="' + data.instanceId + '"]');
      if (!comp) return;
      // Store new propValues on the element for reference
      comp._scProps = data.propValues;
      // Find all [data-prop] elements inside and update their content
      var propEls = comp.querySelectorAll('[data-prop]');
      propEls.forEach(function(el) {
        var key = el.getAttribute('data-prop');
        if (key && data.propValues[key] !== undefined) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = data.propValues[key];
          } else if (el.tagName === 'IMG') {
            el.src = data.propValues[key];
          } else if (el.tagName === 'A') {
            if (el.getAttribute('data-prop-attr') === 'href') el.href = data.propValues[key];
            else el.textContent = data.propValues[key];
          } else {
            el.textContent = data.propValues[key];
          }
        }
      });
      // Also update inline style color props
      var colorEls = comp.querySelectorAll('[data-prop-color]');
      colorEls.forEach(function(el) {
        var key = el.getAttribute('data-prop-color');
        if (key && data.propValues[key]) el.style.color = data.propValues[key];
      });
    }
  });
 
  ${ANIMATION_JS}
})();
`;

// ─────────────────────────────────────────────────────────────────────────────
// buildIframeDocument
// ─────────────────────────────────────────────────────────────────────────────

export function buildIframeDocument(options: {
    components: {
        instanceId: string;
        htmlTemplate: string;
        cssCode?: string;
        jsCode?: string;
        propValues: Record<string, unknown>;
        animationPreset?: string;
    }[];
    globalTheme: RenderOptions['globalTheme'];
    globalCSS?: string;
    navbar?: { html: string };
    footer?: { html: string };
    integrations?: {
        googleAnalyticsId?: string;
        customHeadCode?: string;
        customBodyCode?: string;
    };
}): string {
    const {components, globalTheme, globalCSS, navbar, footer, integrations} = options;

    const theme = globalTheme ?? {
        primaryColor: '#4F46E5',
        secondaryColor: '#0EA5E9',
        accentColor: '#22C55E',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        fontHeading: 'Playfair Display',
        fontBody: 'Source Sans Pro',
        borderRadius: 'md',
    };

    const renderedComponents = components.map((comp) => {
        const inner = renderTemplate(comp.htmlTemplate, {props: comp.propValues, globalTheme: theme});
        const animated = wrapWithAnimation(inner, comp.animationPreset);
        return `<div data-instance="${comp.instanceId}" class="builder-component">\n${animated}\n</div>`;
    });

    const componentCSS = components.filter(c => c.cssCode).map(c => `/* ${c.instanceId} */\n${c.cssCode}`).join('\n');
    const componentJS = components.filter(c => c.jsCode).map(c => `/* ${c.instanceId} */\n(function(){\n${c.jsCode}\n})();`).join('\n');

    const borderRadiusMap: Record<string, string> = {none: '0px', sm: '4px', md: '8px', lg: '16px', full: '9999px'};

    const gaScript = integrations?.googleAnalyticsId
        ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${integrations.googleAnalyticsId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${integrations.googleAnalyticsId}');</script>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontHeading)}:wght@400;600;700;900&family=${encodeURIComponent(theme.fontBody)}:wght@400;500;600&display=swap" rel="stylesheet"/>
${gaScript}
${integrations?.customHeadCode ?? ''}
<style>
  :root {
    --color-primary:${theme.primaryColor};--color-secondary:${theme.secondaryColor};
    --color-accent:${theme.accentColor};--color-bg:${theme.backgroundColor};
    --color-text:${theme.textColor};--font-heading:'${theme.fontHeading}',serif;
    --font-body:'${theme.fontBody}',sans-serif;--radius:${borderRadiusMap[theme.borderRadius] ?? '8px'};
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:var(--font-body);background-color:var(--color-bg);color:var(--color-text);line-height:1.6;}
  h1,h2,h3,h4,h5,h6{font-family:var(--font-heading);line-height:1.2;}
  a{color:var(--color-primary);text-decoration:none;}
  img{max-width:100%;height:auto;display:block;}
  .builder-component{
    position:relative;
    cursor:grab;
    transition:opacity 0.15s ease;
  }
  .builder-component:hover{
    outline:2px solid var(--color-primary);
    outline-offset:2px;
  }
  .builder-component.selected{
    outline:2px solid var(--color-primary)!important;
    outline-offset:2px;
    box-shadow:0 0 0 4px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  .builder-component[draggable="true"]:active{ cursor:grabbing; }
  ${ANIMATION_CSS}
  ${componentCSS}
  ${globalCSS ?? ''}
</style>
</head>
<body>
${navbar?.html ?? ''}
<main>
${renderedComponents.join('\n')}
</main>
${footer?.html ?? ''}
<script>
${BUILDER_INTERACTION_JS}
${componentJS ? `(function(){\n${componentJS}\n})();` : ''}
</script>
${integrations?.customBodyCode ?? ''}
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// buildPublishableHTML — strips all builder chrome, adds full SEO meta
// ─────────────────────────────────────────────────────────────────────────────

export function buildPublishableHTML(options: Parameters<typeof buildIframeDocument>[0] & {
    siteTitle: string;
    seoMeta?: { title?: string; description?: string; ogImage?: string; canonicalUrl?: string; noIndex?: boolean };
}): string {
    const {siteTitle, seoMeta} = options;
    const title = escapeHtml(seoMeta?.title ?? siteTitle);
    const description = seoMeta?.description ? escapeHtml(seoMeta.description) : '';
    const ogImage = seoMeta?.ogImage ? escapeHtml(seoMeta.ogImage) : '';
    const canonical = seoMeta?.canonicalUrl ? escapeHtml(seoMeta.canonicalUrl) : '';

    const meta = [
        `<title>${title}</title>`,
        seoMeta?.noIndex ? '<meta name="robots" content="noindex,nofollow"/>' : '',
        description ? `<meta name="description" content="${description}"/>` : '',
        `<meta property="og:title" content="${title}"/>`,
        description ? `<meta property="og:description" content="${description}"/>` : '',
        ogImage ? `<meta property="og:image" content="${ogImage}"/>` : '',
        `<meta property="og:type" content="website"/>`,
        `<meta name="twitter:card" content="summary_large_image"/>`,
        `<meta name="twitter:title" content="${title}"/>`,
        description ? `<meta name="twitter:description" content="${description}"/>` : '',
        ogImage ? `<meta name="twitter:image" content="${ogImage}"/>` : '',
        canonical ? `<link rel="canonical" href="${canonical}"/>` : '',
        '<!-- Generated by SiteCraft Pro -->',
    ].filter(Boolean).join('\n');

    // Build the full HTML first
    let html = buildIframeDocument(options);

    // Strip builder chrome reliably — find the entire BUILDER_INTERACTION script block
    // Use a simpler marker-based approach instead of fragile regex
    const scriptStart = html.indexOf('<script>\n' + BUILDER_INTERACTION_JS.slice(0, 30));
    if (scriptStart !== -1) {
        const scriptEnd = html.indexOf('</script>', scriptStart) + '</script>'.length;
        html = html.slice(0, scriptStart) + html.slice(scriptEnd);
    }

    // Strip remaining builder artifacts
    html = html
        .replace(/window\.parent\.postMessage\([^;]+;/g, '')
        .replace(/ draggable="true"/g, '')
        .replace(/cursor:grab;/g, '')
        .replace(/cursor:grabbing;/g, '')
        .replace(/class="builder-component"/g, 'class="sc-component"')
        .replace(/data-instance="[^"]*"/g, '');

    // Inject SEO meta tags
    html = html.replace('</head>', `${meta}\n</head>`);

    return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function isTruthy(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
}

// /**
//  * lib/builder/renderer.ts
//  *
//  * Adds:
//  *  1. dblclick on canvas component → COMPONENT_DBLCLICK message → opens edit panel
//  *  2. Drag-to-reorder within canvas → COMPONENT_REORDER message with {fromId, toId, position}
//  *  3. Blue drop-line indicator between components while dragging
//  *  4. External drop support → COMPONENT_DROP_EXTERNAL {insertBeforeId} for library drag-in
//  */
//
// export interface RenderOptions {
//     props: Record<string, unknown>;
//     globalTheme?: {
//         primaryColor: string;
//         secondaryColor: string;
//         accentColor: string;
//         backgroundColor: string;
//         textColor: string;
//         fontHeading: string;
//         fontBody: string;
//         borderRadius: string;
//     };
// }
//
// export function renderTemplate(htmlTemplate: string, options: RenderOptions): string {
//     const {props, globalTheme} = options;
//     const mergedProps: Record<string, unknown> = {...globalTheme, ...props};
//     let output = htmlTemplate ?? '';
//
//     // 1. Array blocks
//     output = output.replace(
//         /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
//         (_match, key, inner) => {
//             const value = mergedProps[key];
//             if (!Array.isArray(value)) return '';
//             return value.map((item) => {
//                 if (typeof item === 'object' && item !== null) {
//                     return inner.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) =>
//                         escapeHtml(String((item as Record<string, unknown>)[k] ?? ''))
//                     );
//                 }
//                 return inner.replace(/\{\{(\w+)\}\}/g, () => escapeHtml(String(item)));
//             }).join('');
//         }
//     );
//
//     // 2. Truthy blocks
//     output = output.replace(
//         /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
//         (_match, key, inner) => (isTruthy(mergedProps[key]) ? inner : '')
//     );
//
//     // 3. Falsy blocks
//     output = output.replace(
//         /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
//         (_match, key, inner) => (!isTruthy(mergedProps[key]) ? inner : '')
//     );
//
//     // 4. Color values
//     output = output.replace(/\{\{color:(\w+)\}\}/g, (_match, key) => {
//         const value = mergedProps[key];
//         return typeof value === 'string' && value.startsWith('#') ? value : '#000000';
//     });
//
//     // 5. Raw HTML
//     output = output.replace(/\{\{html:(\w+)\}\}/g, (_match, key) => {
//         const value = mergedProps[key];
//         return typeof value === 'string' ? value : '';
//     });
//
//     // 6. Simple substitutions
//     output = output.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
//         const value = mergedProps[key];
//         if (value === undefined || value === null) return '';
//         return escapeHtml(String(value));
//     });
//
//     return output;
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Animation system
// // ─────────────────────────────────────────────────────────────────────────────
//
// const ANIMATION_CSS = `
// .sc-anim-fade-up     { opacity:0; transform:translateY(32px); }
// .sc-anim-fade-in     { opacity:0; }
// .sc-anim-slide-left  { opacity:0; transform:translateX(40px); }
// .sc-anim-slide-right { opacity:0; transform:translateX(-40px); }
// .sc-anim-zoom-in     { opacity:0; transform:scale(0.85); }
// .sc-anim-bounce      { opacity:0; transform:scale(0.7); }
// .sc-anim-flip-up     { opacity:0; transform:perspective(400px) rotateX(30deg) translateY(20px); }
// [class*="sc-anim-"]  { transition-property:opacity,transform; transition-timing-function:ease; }
// [class*="sc-anim-"].sc-visible { opacity:1 !important; transform:none !important; }
// `;
//
// const ANIMATION_JS = `
// (function(){
//   var els=document.querySelectorAll('[data-sc-anim]');
//   if(!els.length)return;
//   var io=new IntersectionObserver(function(entries){
//     entries.forEach(function(e){
//       if(e.isIntersecting){
//         var el=e.target,parts=(el.dataset.scAnim||'').split('|');
//         el.style.transitionDuration=parts[1]||'0.6s';
//         el.style.transitionDelay=parts[2]||'0s';
//         el.classList.add('sc-visible');
//         io.unobserve(el);
//       }
//     });
//   },{threshold:0.1});
//   els.forEach(function(el){io.observe(el);});
// })();
// `;
//
// function wrapWithAnimation(html: string, animationPreset: string | undefined): string {
//     if (!animationPreset) return html;
//     const presetId = animationPreset.split('|')[0];
//     if (!presetId) return html;
//     return `<div class="sc-anim-${escapeHtml(presetId)}" data-sc-anim="${escapeHtml(animationPreset)}">${html}</div>`;
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Builder interaction JS — injected into every iframe
// // Handles: click-to-select, dblclick-to-edit, canvas drag-to-reorder,
// //          external drop (drag from library), blue drop-line indicator
// // ─────────────────────────────────────────────────────────────────────────────
//
// const BUILDER_INTERACTION_JS = `
// (function(){
//   var PRIMARY = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#4F46E5';
//
//   // ── Drop-line element ──────────────────────────────────────────────────────
//   var dropLine = document.createElement('div');
//   dropLine.id = 'sc-drop-line';
//   Object.assign(dropLine.style, {
//     position:'fixed', left:'0', right:'0', height:'3px', zIndex:'9999',
//     background: PRIMARY || '#4F46E5',
//     boxShadow: '0 0 6px ' + (PRIMARY || '#4F46E5'),
//     pointerEvents:'none', display:'none', borderRadius:'2px',
//     transition:'top 80ms ease',
//   });
//   document.body.appendChild(dropLine);
//
//   function showDropLine(y) {
//     dropLine.style.top = y + 'px';
//     dropLine.style.display = 'block';
//   }
//   function hideDropLine() { dropLine.style.display = 'none'; }
//
//   // ── Helpers ────────────────────────────────────────────────────────────────
//   function getComponents() {
//     return Array.from(document.querySelectorAll('.builder-component'));
//   }
//
//   // Find which component the cursor is nearest to (returns {el, position:'before'|'after'})
//   function getDropTarget(clientY) {
//     var comps = getComponents();
//     if (!comps.length) return null;
//     for (var i = 0; i < comps.length; i++) {
//       var rect = comps[i].getBoundingClientRect();
//       var mid = rect.top + rect.height / 2;
//       if (clientY < mid) return { el: comps[i], position: 'before', index: i };
//     }
//     return { el: comps[comps.length - 1], position: 'after', index: comps.length - 1 };
//   }
//
//   function getDropLineY(target) {
//     if (!target) return 0;
//     var rect = target.el.getBoundingClientRect();
//     return target.position === 'before' ? rect.top - 2 : rect.bottom + 2;
//   }
//
//   // ── Click & double-click ───────────────────────────────────────────────────
//   getComponents().forEach(function(el) {
//     // Single click → select
//     el.addEventListener('click', function(e) {
//       e.stopPropagation();
//       getComponents().forEach(function(c) { c.classList.remove('selected'); });
//       el.classList.add('selected');
//       window.parent.postMessage({
//         type: 'COMPONENT_SELECTED',
//         instanceId: el.getAttribute('data-instance')
//       }, '*');
//     });
//
//     // Double click → open edit panel
//     el.addEventListener('dblclick', function(e) {
//       e.stopPropagation();
//       window.parent.postMessage({
//         type: 'COMPONENT_DBLCLICK',
//         instanceId: el.getAttribute('data-instance')
//       }, '*');
//     });
//
//     // ── Canvas drag-to-reorder ───────────────────────────────────────────────
//     el.setAttribute('draggable', 'true');
//
//     el.addEventListener('dragstart', function(e) {
//       e.dataTransfer.effectAllowed = 'move';
//       e.dataTransfer.setData('text/sc-instance', el.getAttribute('data-instance') || '');
//       el.style.opacity = '0.4';
//       // Small drag image
//       var ghost = el.cloneNode(true);
//       Object.assign(ghost.style, {
//         position:'fixed', top:'-9999px', left:'-9999px',
//         width: Math.min(el.offsetWidth, 320) + 'px',
//         opacity:'0.9', pointerEvents:'none', zIndex:'-1',
//       });
//       document.body.appendChild(ghost);
//       e.dataTransfer.setDragImage(ghost, 40, 20);
//       setTimeout(function() { document.body.removeChild(ghost); }, 0);
//     });
//
//     el.addEventListener('dragend', function() {
//       el.style.opacity = '';
//       hideDropLine();
//     });
//   });
//
//   // ── DragOver on body (for both canvas reorder + external library drop) ─────
//   document.body.addEventListener('dragover', function(e) {
//     e.preventDefault();
//     var target = getDropTarget(e.clientY);
//     if (target) showDropLine(getDropLineY(target));
//   });
//
//   document.body.addEventListener('dragleave', function(e) {
//     // Only hide if leaving the document entirely
//     if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
//       hideDropLine();
//     }
//   });
//
//   // ── Drop on canvas ─────────────────────────────────────────────────────────
//   document.body.addEventListener('drop', function(e) {
//     e.preventDefault();
//     hideDropLine();
//
//     var target = getDropTarget(e.clientY);
//     var insertBeforeId = null;
//     if (target) {
//       insertBeforeId = target.position === 'before'
//         ? target.el.getAttribute('data-instance')
//         : (getComponents()[target.index + 1]?.getAttribute('data-instance') ?? null);
//     }
//
//     // Was it a canvas reorder?
//     var fromId = e.dataTransfer.getData('text/sc-instance');
//     if (fromId) {
//       window.parent.postMessage({
//         type: 'COMPONENT_REORDER',
//         fromId: fromId,
//         insertBeforeId: insertBeforeId,
//       }, '*');
//       return;
//     }
//
//     // Was it a library drag-in?
//     var libKey = e.dataTransfer.getData('text/sc-library-key');
//     if (libKey) {
//       window.parent.postMessage({
//         type: 'COMPONENT_DROP_EXTERNAL',
//         componentKey: libKey,
//         insertBeforeId: insertBeforeId,
//       }, '*');
//     }
//   });
//
//   // ── Body click → deselect ─────────────────────────────────────────────────
//   document.body.addEventListener('click', function() {
//     window.parent.postMessage({type: 'COMPONENT_DESELECTED'}, '*');
//   });
//
//   // ── Listen for parent messages ──────────────────────────────────────────────
//   window.addEventListener('message', function(e) {
//     var data = e.data;
//     if (!data) return;
//
//     // Highlight selected from layer strip click
//     if (data.type === 'BUILDER_SELECT') {
//       getComponents().forEach(function(c) { c.classList.remove('selected'); });
//       var el = document.querySelector('[data-instance="' + data.instanceId + '"]');
//       if (el) el.classList.add('selected');
//     }
//
//     // Prop-only update — patch template variables without full rewrite
//     // This keeps drag state alive during editing
//     if (data.type === 'UPDATE_PROPS') {
//       var comp = document.querySelector('[data-instance="' + data.instanceId + '"]');
//       if (!comp) return;
//       // Store new propValues on the element for reference
//       comp._scProps = data.propValues;
//       // Find all [data-prop] elements inside and update their content
//       var propEls = comp.querySelectorAll('[data-prop]');
//       propEls.forEach(function(el) {
//         var key = el.getAttribute('data-prop');
//         if (key && data.propValues[key] !== undefined) {
//           if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
//             el.value = data.propValues[key];
//           } else if (el.tagName === 'IMG') {
//             el.src = data.propValues[key];
//           } else if (el.tagName === 'A') {
//             if (el.getAttribute('data-prop-attr') === 'href') el.href = data.propValues[key];
//             else el.textContent = data.propValues[key];
//           } else {
//             el.textContent = data.propValues[key];
//           }
//         }
//       });
//       // Also update inline style color props
//       var colorEls = comp.querySelectorAll('[data-prop-color]');
//       colorEls.forEach(function(el) {
//         var key = el.getAttribute('data-prop-color');
//         if (key && data.propValues[key]) el.style.color = data.propValues[key];
//       });
//     }
//   });
//
//   ${ANIMATION_JS}
// })();
// `;
//
// // ─────────────────────────────────────────────────────────────────────────────
// // buildIframeDocument
// // ─────────────────────────────────────────────────────────────────────────────
//
// export function buildIframeDocument(options: {
//     components: {
//         instanceId: string;
//         htmlTemplate: string;
//         cssCode?: string;
//         jsCode?: string;
//         propValues: Record<string, unknown>;
//         animationPreset?: string;
//     }[];
//     globalTheme: RenderOptions['globalTheme'];
//     globalCSS?: string;
//     navbar?: { html: string };
//     footer?: { html: string };
//     integrations?: {
//         googleAnalyticsId?: string;
//         customHeadCode?: string;
//         customBodyCode?: string;
//     };
// }): string {
//     const {components, globalTheme, globalCSS, navbar, footer, integrations} = options;
//
//     const theme = globalTheme ?? {
//         primaryColor: '#4F46E5',
//         secondaryColor: '#0EA5E9',
//         accentColor: '#22C55E',
//         backgroundColor: '#ffffff',
//         textColor: '#111827',
//         fontHeading: 'Playfair Display',
//         fontBody: 'Source Sans Pro',
//         borderRadius: 'md',
//     };
//
//     const renderedComponents = components.map((comp) => {
//         const inner = renderTemplate(comp.htmlTemplate, {props: comp.propValues, globalTheme: theme});
//         const animated = wrapWithAnimation(inner, comp.animationPreset);
//         return `<div data-instance="${comp.instanceId}" class="builder-component">\n${animated}\n</div>`;
//     });
//
//     const componentCSS = components.filter(c => c.cssCode).map(c => `/* ${c.instanceId} */\n${c.cssCode}`).join('\n');
//     const componentJS = components.filter(c => c.jsCode).map(c => `/* ${c.instanceId} */\n(function(){\n${c.jsCode}\n})();`).join('\n');
//
//     const borderRadiusMap: Record<string, string> = {none: '0px', sm: '4px', md: '8px', lg: '16px', full: '9999px'};
//
//     const gaScript = integrations?.googleAnalyticsId
//         ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${integrations.googleAnalyticsId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${integrations.googleAnalyticsId}');</script>`
//         : '';
//
//     return `<!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8"/>
// <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
// <script src="https://cdn.tailwindcss.com"></script>
// <link rel="preconnect" href="https://fonts.googleapis.com"/>
// <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontHeading)}:wght@400;600;700;900&family=${encodeURIComponent(theme.fontBody)}:wght@400;500;600&display=swap" rel="stylesheet"/>
// ${gaScript}
// ${integrations?.customHeadCode ?? ''}
// <style>
//   :root {
//     --color-primary:${theme.primaryColor};--color-secondary:${theme.secondaryColor};
//     --color-accent:${theme.accentColor};--color-bg:${theme.backgroundColor};
//     --color-text:${theme.textColor};--font-heading:'${theme.fontHeading}',serif;
//     --font-body:'${theme.fontBody}',sans-serif;--radius:${borderRadiusMap[theme.borderRadius] ?? '8px'};
//   }
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   html{scroll-behavior:smooth;}
//   body{font-family:var(--font-body);background-color:var(--color-bg);color:var(--color-text);line-height:1.6;}
//   h1,h2,h3,h4,h5,h6{font-family:var(--font-heading);line-height:1.2;}
//   a{color:var(--color-primary);text-decoration:none;}
//   img{max-width:100%;height:auto;display:block;}
//   .builder-component{
//     position:relative;
//     cursor:grab;
//     transition:opacity 0.15s ease;
//   }
//   .builder-component:hover{
//     outline:2px solid var(--color-primary);
//     outline-offset:2px;
//   }
//   .builder-component.selected{
//     outline:2px solid var(--color-primary)!important;
//     outline-offset:2px;
//     box-shadow:0 0 0 4px color-mix(in srgb, var(--color-primary) 15%, transparent);
//   }
//   .builder-component[draggable="true"]:active{ cursor:grabbing; }
//   ${ANIMATION_CSS}
//   ${componentCSS}
//   ${globalCSS ?? ''}
// </style>
// </head>
// <body>
// ${navbar?.html ?? ''}
// <main>
// ${renderedComponents.join('\n')}
// </main>
// ${footer?.html ?? ''}
// <script>
// ${BUILDER_INTERACTION_JS}
// ${componentJS ? `(function(){\n${componentJS}\n})();` : ''}
// </script>
// ${integrations?.customBodyCode ?? ''}
// </body>
// </html>`;
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // buildPublishableHTML — strips all builder chrome, adds full SEO meta
// // ─────────────────────────────────────────────────────────────────────────────
//
// export function buildPublishableHTML(options: Parameters<typeof buildIframeDocument>[0] & {
//     siteTitle: string;
//     seoMeta?: { title?: string; description?: string; ogImage?: string; canonicalUrl?: string; noIndex?: boolean };
// }): string {
//     const {siteTitle, seoMeta} = options;
//     const title = escapeHtml(seoMeta?.title ?? siteTitle);
//     const description = seoMeta?.description ? escapeHtml(seoMeta.description) : '';
//     const ogImage = seoMeta?.ogImage ? escapeHtml(seoMeta.ogImage) : '';
//     const canonical = seoMeta?.canonicalUrl ? escapeHtml(seoMeta.canonicalUrl) : '';
//
//     const meta = [
//         `<title>${title}</title>`,
//         seoMeta?.noIndex ? '<meta name="robots" content="noindex,nofollow"/>' : '',
//         description ? `<meta name="description" content="${description}"/>` : '',
//         `<meta property="og:title" content="${title}"/>`,
//         description ? `<meta property="og:description" content="${description}"/>` : '',
//         ogImage ? `<meta property="og:image" content="${ogImage}"/>` : '',
//         `<meta property="og:type" content="website"/>`,
//         `<meta name="twitter:card" content="summary_large_image"/>`,
//         `<meta name="twitter:title" content="${title}"/>`,
//         description ? `<meta name="twitter:description" content="${description}"/>` : '',
//         ogImage ? `<meta name="twitter:image" content="${ogImage}"/>` : '',
//         canonical ? `<link rel="canonical" href="${canonical}"/>` : '',
//         '<!-- Generated by SiteCraft Pro -->',
//     ].filter(Boolean).join('\n');
//
//     // Strip all builder interaction code and chrome
//     return buildIframeDocument(options)
//         .replace(/<script>\s*\(function\(\)\{[\s\S]*?BUILDER_INTERACTION[\s\S]*?\}\)\(\);[\s\S]*?<\/script>/g, '')
//         .replace(/window\.parent\.postMessage[\s\S]*?;/g, '')
//         .replace(/builder-preview-mode/g, '')
//         .replace(/draggable="true"/g, '')
//         .replace(/cursor:grab[^;]*;/g, '')
//         .replace('</head>', `${meta}\n</head>`);
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
//
// function escapeHtml(str: string): string {
//     return str
//         .replace(/&/g, '&amp;').replace(/</g, '&lt;')
//         .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
// }
//
// function isTruthy(value: unknown): boolean {
//     if (Array.isArray(value)) return value.length > 0;
//     return Boolean(value);
// }
