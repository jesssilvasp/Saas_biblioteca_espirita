import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = await readFile('reference/qwen/frame-2.html', 'utf8');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let result;
try {
  const page = await browser.newPage();
  result = await page.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    const css = [...doc.querySelectorAll('style')].map(s => s.textContent).filter(s => s.includes('tailwindcss v3') || s.includes('.phone-frame') || s.includes('@keyframes scanLine')).join('\n');
    const originals = {}, templates = {};
    const slot = (node, name) => { node.innerHTML = ''; node.dataset.slot = name; };
    const bind = (node, name) => { node.textContent = ''; node.dataset.bind = name; };
    const action = (node, name) => { node.removeAttribute('onclick'); node.dataset.action = name; };
    const text = (root, value) => [...root.querySelectorAll('*')].find(n => n.children.length === 0 && n.textContent.trim() === value);
    const fields = (root, names) => [...root.querySelectorAll('input:not([type=checkbox]),textarea')].forEach((n, i) => { n.dataset.field = names[i]; n.removeAttribute('value'); if (n.tagName === 'TEXTAREA') n.textContent = ''; });
    for (const screen of doc.querySelectorAll('.screen')) {
      originals[screen.id] = screen.outerHTML;
      screen.classList.remove('active'); screen.classList.add('qwen-screen');
      const body = screen.querySelector('.scroll-container');
      if (body) body.classList.add('screen-body');
      if (screen.id !== 'screen-login' && screen.id !== 'screen-dashboard') {
        screen.firstElementChild.classList.add('screen-header');
        const title = screen.firstElementChild.querySelector('h2'); if (title) { const h = doc.createElement('h1'); h.innerHTML = title.innerHTML; h.className = title.className; title.replaceWith(h); }
      }
      switch (screen.id) {
        case 'screen-login':
          fields(screen, ['username', 'password']);
          text(screen, 'Esqueci a senha').dataset.action = 'forgot-password';
          screen.querySelector('input[type=checkbox]').dataset.field = 'remember';
          break;
        case 'screen-dashboard': {
          screen.querySelector('.gradient-header').classList.add('dashboard-header');
          [...screen.querySelectorAll('.dashboard-header > .grid > div > p:first-child')].forEach((node,i)=>bind(node,['book-count','active-count','late-count'][i]));
          [...screen.querySelectorAll('.gradient-header button span')].forEach((n,i)=>bind(n,i ? 'notification-count' : 'local-events'));
          bind(text(screen, '5 devoluções atrasadas'), 'late-alert'); bind(text(screen, 'Último atraso: 12 dias'), 'late-description');
          bind(text(screen, '8 obras aguardando análise'), 'pending-alert'); text(screen, '3 doações recentes').textContent = 'Avaliação doutrinária pendente';
          slot(text(screen, 'Empréstimos Ativos').parentElement.nextElementSibling, 'dashboard-loans');
          slot(text(screen, 'Movimentações Recentes').parentElement.nextElementSibling, 'history');
          slot(text(screen, 'Novos Cadastros').parentElement.nextElementSibling, 'new-books');
          action(text(screen, 'Histórico'), 'history'); action(text(screen, 'Ver acervo'), 'go:screen-acervo');
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.trim()==='Ver todos'), 'go:screen-notifications');
          screen.querySelector('.bottom-nav').remove();
          break;
        }
        case 'screen-scanner':
          screen.children[1].classList.add('capture-body');
          slot(screen.querySelector('.aspect-square'), 'camera');
          [...screen.querySelectorAll('button')].filter(n => n.getAttribute('onclick') === 'simulateScan()').forEach(n=>{ action(n,'camera'); n.innerHTML='<i class="fas fa-camera"></i> Ativar câmera'; });
          action(screen.querySelector('button:has(.fa-keyboard)'), 'manual-code');
          screen.children[1].insertAdjacentHTML('beforeend','<div data-slot="manual-code" class="w-full mt-4"></div>');
          break;
        case 'screen-scan-result':
          screen.querySelector('.bg-blue-50 p').innerHTML = 'Consulta bibliográfica por ISBN. <span class="font-medium">Revise os dados antes de salvar.</span>';
          bind(text(screen, '978-85-7328-302-8'), 'isbn');
          fields(screen, ['title','author','publisher','edition','year','subtitle','notes']);
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.includes('Confirmar e Salvar')), 'save-scanned-book');
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.includes('Editar manualmente')), 'edit-scanned-book');
          break;
        case 'screen-acervo': {
          screen.querySelector('input').dataset.field='query';
          action(screen.querySelector('button:has(.fa-filter)'), 'filter');
          slot(body.children[0], 'catalog-filters');
          [...body.children].slice(1).forEach(n=>n.remove());
          body.insertAdjacentHTML('beforeend','<div data-slot="catalog" class="record-grid space-y-2"></div>'); break;
        }
        case 'screen-livro-detalhe': {
          bind(text(screen,'O Evangelho Segundo o Espiritismo'),'book-title'); bind(text(screen,'Allan Kardec'),'book-author'); bind(text(screen,'IDE • 1ª edição • 2015'),'book-publisher');
          [...screen.querySelectorAll('span')].filter(n=>n.textContent==='CDE 100').forEach(n=>bind(n,'book-cde'));
          bind(text(screen,'Evangelho'),'book-category'); bind(text(screen,'04'),'book-location'); bind(text(screen,'B'),'book-shelf'); bind(text(screen,'CDE 100'),'book-cde'); bind(text(screen,'3 total'),'copy-count');
          slot(body.children[2].querySelector('.space-y-2'),'copies');
          action(screen.querySelector('button:has(.fa-ellipsis-v)'),'edit-book');
          action(screen.querySelector('button:has(.fa-history)'),'book-history');
          action(screen.querySelector('button:has(.fa-arrow-up)'),'lend-book'); break;
        }
        case 'screen-cadastro-livro':
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.includes('Cadastro manual')),'manual-book');
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.includes('Buscar por ISBN')),'go:screen-scanner');
          body.insertAdjacentHTML('beforeend','<div data-slot="book-form"></div>'); break;
        case 'screen-cadastro-leitor':
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.includes('Cadastro manual')),'manual-reader');
          body.insertAdjacentHTML('beforeend','<div data-slot="reader-form"></div><div data-slot="readers"></div>'); break;
        case 'screen-ficha-ocr':
          screen.children[1].classList.add('capture-body');
          slot(screen.querySelector('.aspect-\\[3\\/4\\]'),'card-image');
          action(screen.querySelector('button[onclick="simulateOCR()"]'),'capture-card');
          screen.children[1].insertAdjacentHTML('beforeend','<div class="w-full mt-4" data-slot="ocr-actions"></div>'); break;
        case 'screen-ocr-result':
          slot(body.children[0], 'duplicate-reader');
          fields(screen, ['name','phone','email','address','birthDate']);
          bind(text(screen,'Dados Extraídos via OCR'),'ocr-source');
          [...screen.querySelectorAll('input+span')].forEach(n=>n.remove());
          text(screen,'⚠️ Número pode estar incorreto — confira').textContent='Confira o endereço antes de salvar.';
          action([...screen.querySelectorAll('button')].find(n=>n.textContent.includes('Confirmar e Salvar')),'save-ocr-reader');
          body.insertAdjacentHTML('beforeend','<div data-slot="review-check"></div>'); break;
        case 'screen-emprestimo':
          slot(body.children[1], 'loan-book'); slot(body.children[2], 'loan-reader');
          fields(screen, ['borrowedDate','dueDate','loanNotes']);
          action(screen.querySelector('button:has(.fa-check-circle)'),'save-loan'); break;
        case 'screen-devolucao':
          text(screen, 'Devoluções pendentes hoje').textContent = 'Devoluções pendentes';
          [...body.querySelectorAll('button')].forEach((n,i)=>action(n,i ? 'return-search' : 'return-scan'));
          slot(body.children[1].querySelector('.space-y-2'),'pending-returns');
          body.children[0].insertAdjacentHTML('beforeend','<div data-slot="return-search" class="mt-4"></div>'); break;
        case 'screen-devolucao-result':
          bind(text(screen,'O Evangelho Segundo o Espiritismo'),'return-title'); bind(text(screen,'Allan Kardec'),'return-author'); bind(text(screen,'Tombo #0235'),'return-code');
          [...body.querySelectorAll('.grid>div')].forEach((n,i)=>bind(n.lastElementChild,['return-reader','return-start','return-due','return-status'][i]));
          action(body.querySelector('button'),'confirm-return'); break;
        case 'screen-analise':
          slot(body, 'analysis'); break;
        case 'screen-emprestimos-lista':
          slot(screen.children[1], 'loan-filters');
          slot(body, 'loans'); break;
        case 'screen-atrasados': slot(body, 'overdue'); break;
        case 'screen-sync':
          text(screen,'3 operações pendentes').textContent='Armazenamento local';
          text(screen,'Aguardando conexão para sincronizar').textContent='Sincronização remota ainda não conectada';
          slot(body.children[1],'sync-records');
          action(body.querySelector('button'),'sync');
          text(screen,'Última sincronização: hoje, 09:45').textContent='Nenhuma sincronização remota realizada';
          text(screen,'LibraryIntegrationService v1.0 (Mock)').textContent='Dados salvos somente neste navegador';
          body.insertAdjacentHTML('beforeend','<div data-slot="backup"></div>'); break;
        case 'screen-notifications': slot(body,'notifications'); break;
        case 'screen-config': {
          text(screen,'Perfil: Bibliotecário').textContent='Modo local · sem autenticação';
          text(screen,'LibraryIntegrationService (Mock)').textContent='Integrações pendentes';
          const groups = [...body.querySelectorAll('button')];
          ['integration','permissions','privacy','go:screen-sync','history','about','logout'].forEach((a,i)=>action(groups[i],a));
          const architecture=body.lastElementChild;
          architecture.querySelector('.space-y-1\\.5').innerHTML='<p>• React + TypeScript + Vite + Tailwind CSS</p><p>• Armazenamento local neste navegador</p><p>• Autenticação e banco remoto pendentes</p><p>• OCR e sincronização dependem de integração</p>';
          body.insertAdjacentHTML('beforeend','<div data-slot="settings"></div>'); break;
        }
      }
      [...screen.querySelectorAll('*')].forEach((node, index) => {
        if (node.tagName === 'I') node.setAttribute('aria-hidden','true');
        for (const attr of [...node.attributes]) {
          if (attr.name.startsWith('on')) {
            if (attr.name === 'onclick' && !node.dataset.action) {
              const match=attr.value.match(/^showScreen\('([^']+)'\)$/);
              node.dataset.action=match ? 'go:'+match[1] : ({'doLogin()':'login','doLogout()':'logout','togglePass()':'toggle-password'}[attr.value] || 'unavailable');
            }
            node.removeAttribute(attr.name);
          }
        }
        if (node.matches('script,iframe,object,embed')) {node.remove(); return;}
        if (node.matches('button') && !node.dataset.action) node.dataset.action='unavailable';
        if (node.matches('button') && !node.textContent.trim()) node.setAttribute('aria-label', node.querySelector('.fa-arrow-left') ? 'Voltar' : node.querySelector('i')?.className.replace(/fas|fa-/g,'').trim() || 'Ação');
        if (node.matches('input,textarea,select')) {
          node.removeAttribute('value');
          if (node.tagName==='TEXTAREA') node.textContent='';
          const label=node.parentElement.querySelector('label') || node.parentElement.parentElement.querySelector('label');
          if (label && !label.contains(node)) {const id=screen.id+'-field-'+index;node.id=id;label.setAttribute('for',id);}
          if (!node.getAttribute('aria-label') && !node.id) node.setAttribute('aria-label',node.getAttribute('placeholder') || 'Campo');
        }
      });
      templates[screen.id]=screen.outerHTML;
    }
    return {css, originals, templates};
  }, source);
} finally { await browser.close(); }
await mkdir('src/qwen/templates',{recursive:true});
await mkdir('reference/qwen/screens',{recursive:true});
await writeFile('src/qwen/original.css',result.css);
for(const [id,html] of Object.entries(result.originals)) await writeFile(`reference/qwen/screens/${id}.html`,html);
for(const [id,html] of Object.entries(result.templates)) await writeFile(`src/qwen/templates/${id}.html`,html);
console.log(JSON.stringify({screens:Object.keys(result.templates),cssBytes:result.css.length}));
