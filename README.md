# Biblioteca EspÃ­rita

Sistema de biblioteca com interface migrada do HTML original do Qwen fornecido pelo usuÃ¡rio, em React, TypeScript, Vite e Tailwind CSS.

**Estado:** 19 telas implementadas, com operaÃ§Ã£o local para acervo, leitores, emprÃ©stimos, devoluÃ§Ãµes e gestÃ£o. Sem dados fictÃ­cios prÃ©-carregados.

## Hospedagem

EndereÃ§o: https://mistyrose-antelope-705522.hostingersite.com

Site separado na Hostinger, criado em 05/11/2026. PublicaÃ§Ã£o estÃ¡tica do diretÃ³rio `dist/`, sem necessidade de processo Node.js em produÃ§Ã£o. Nenhum backend estÃ¡ conectado.

VerificaÃ§Ã£o remota reproduzÃ­vel apÃ³s a publicaÃ§Ã£o: `node scripts/verify-deployment.mjs`.

VersÃ£o com visual Qwen publicada e verificada em 05/11/2026: HTTP 200, acesso local e dashboard renderizados, nenhum erro JavaScript e consulta real de ISBN funcionando. As 19 telas preservam a referÃªncia visual, com adaptaÃ§Ã£o desktop e dados reais locais.

## Como usar

Abra o site e escolha â€œContinuar no modo localâ€ na tela de acesso. Cadastre uma obra e um leitor e registre um emprÃ©stimo. A devoluÃ§Ã£o libera o exemplar imediatamente. AÃ§Ãµes rÃ¡pidas, configuraÃ§Ãµes e menu lateral dÃ£o acesso aos mÃ³dulos; telas de resultado sÃ£o abertas pelo fluxo correspondente. O botÃ£o Entrar nÃ£o simula autenticaÃ§Ã£o.

No computador, o sistema ocupa a janela com menu lateral, cards e formulÃ¡rios distribuÃ­dos em colunas. No celular, mantÃ©m a navegaÃ§Ã£o inferior e o layout compacto.

No primeiro acesso, informe seu nome e escolha uma senha com pelo menos 8 caracteres; o botÃ£o muda para â€œCriar administradorâ€. Depois, use os mesmos dados em â€œEntrarâ€. A senha Ã© protegida por derivaÃ§Ã£o criptogrÃ¡fica no navegador. Esta conta Ã© local ao navegador atual: nÃ£o serve para compartilhar o sistema entre computadores nem substitui um backend seguro. Use a tela SincronizaÃ§Ã£o para exportar um backup JSON. A restauraÃ§Ã£o de backups ainda nÃ£o foi implementada.

Scanner: cÃ¢mera real em navegadores que suportam BarcodeDetector, com alternativa de digitaÃ§Ã£o manual. Consulta bibliogrÃ¡fica real pela Open Library. A captura por hardware ainda exige verificaÃ§Ã£o em um celular compatÃ­vel. OCR remoto nÃ£o configurado; transcriÃ§Ã£o manual e revisÃ£o estÃ£o disponÃ­veis.

## InstalaÃ§Ã£o e execuÃ§Ã£o

Requisito: Node.js 22.12 ou superior; build validado com Node.js 24.

```sh
npm ci
npm run dev
```

Para gerar e conferir a versÃ£o de produÃ§Ã£o:

```sh
npm run build
npm run preview
```

No PowerShell com execuÃ§Ã£o de scripts bloqueada, use `npm.cmd` no lugar de `npm`.

## Testes e manutenÃ§Ã£o

```sh
npm test
npm run format
```

Os testes usam Microsoft Edge instalado no Windows e iniciam o Vite em `127.0.0.1:4173`. Para outros ambientes, ajuste `channel` e o comando de `webServer` em `playwright.config.ts`. As respostas externas sÃ£o controladas nos testes determinÃ­sticos; uma consulta real de ISBN tambÃ©m foi verificada separadamente. Capturas locais ficam em `artifacts/` e nÃ£o sÃ£o publicadas.

## ConfiguraÃ§Ã£o

Nenhuma variÃ¡vel Ã© necessÃ¡ria para o modo local. Para preparar OCR, consulte `.env.example` e o contrato em PROJECT.md. VariÃ¡veis `VITE_*` sÃ£o pÃºblicas; nunca coloque senhas ou chaves privadas nelas. A ativaÃ§Ã£o do endpoint requer backend autenticado ainda nÃ£o implementado.

Para atualizar a Hostinger, execute o build e publique apenas `dist/` no site acima. O arquivo `public/.htaccess`, copiado para `dist/`, prepara o fallback de rotas para hospedagem Apache/LiteSpeed. NÃ£o envie fontes, documentaÃ§Ã£o ou credenciais para a raiz pÃºblica.

## DocumentaÃ§Ã£o

- `AGENTS.md`: regras permanentes de desenvolvimento.
- `PROJECT.md`: arquitetura, inventÃ¡rio das 19 telas e contratos de integraÃ§Ã£o.
- `DESIGN_SYSTEM.md`: tokens originais do Qwen, componentes e adaptaÃ§Ãµes desktop.
- `TASKS.md`: progresso e pendÃªncias.
- `.env.example`: registro das pendÃªncias de configuraÃ§Ã£o.

VerificaÃ§Ã£o: build TypeScript/Vite; cinco testes com regras de negÃ³cio, ciclo completo de circulaÃ§Ã£o, persistÃªncia, 19 rotas em sete larguras, falhas de serviÃ§os, revisÃ£o manual e preservaÃ§Ã£o de armazenamento invÃ¡lido. Dashboard mobile/desktop e tela de acesso inspecionados por captura. AutenticaÃ§Ã£o compartilhada no servidor, banco remoto, OCR real, sincronizaÃ§Ã£o e notificaÃ§Ãµes externas permanecem pendentes; o cadastro/login local jÃ¡ estÃ¡ disponÃ­vel.


## ReferÃªncia visual e manutenÃ§Ã£o

ReferÃªncia: https://chat.qwen.ai/s/deploy/t_0aeb803d-9c06-4dfc-8d6d-1a1e963a36cb. HTML arquivado em `reference/qwen/frame-2.html`, com 19 telas. `src/qwen/templates` contÃ©m os fragmentos convertidos em componentes React por `Template.tsx`; `Screen.tsx`, `Forms.tsx` e `Analysis.tsx` conectam as operaÃ§Ãµes reais. Scripts originais e simulaÃ§Ãµes nÃ£o sÃ£o executados.

Para regenerar templates e CSS a partir da referÃªncia arquivada: `node scripts/prepare-qwen.mjs`. AlteraÃ§Ãµes de extraÃ§Ã£o devem ser feitas nesse script; estilos responsivos ficam em `src/qwen/styles.css`. Depois execute os testes e o build. NÃ£o publique `reference/`, `artifacts/` ou dados de teste.

