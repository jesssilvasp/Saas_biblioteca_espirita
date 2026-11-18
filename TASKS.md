# Tarefas e progresso

- [x] Verificar a pasta de trabalho: vazia no início da tarefa.
- [x] Registrar requisitos, arquitetura prevista e regras permanentes.
- [x] Registrar autorização para identidade visual nova, sem dependência do código Qwen.
- [x] Inventariar os 19 destinos funcionais.
- [x] Implementar e documentar o novo design system.
- [x] Configurar React, TypeScript, Vite e Tailwind CSS.
- [x] Criar página temporária para validar a implantação.
- [x] Criar site separado com endereço temporário na Hostinger, conforme escolha do usuário.
- [x] Publicar `dist/` e verificar HTTP 200 por HTTPS.
- [x] Executar build TypeScript/Vite da base inicial.
- [x] Documentar instalação, execução e publicação da base inicial.
- [x] Implementar as 19 telas listadas em PROJECT.md, com estados honestos de integração.
- [x] Organizar componentes, páginas, serviços, hooks, tipos e rotas.
- [x] Implementar cadastros e edição de livros/leitores, exemplares, empréstimos e devoluções locais.
- [x] Implementar atrasos, análise humana, histórico, notificações locais e preferências.
- [x] Integrar consulta real de ISBN e preparar câmera com fallback manual.
- [x] Preparar adaptador OCR e revisão humana, documentando dependências.
- [x] Implementar exportação de backup JSON.
- [x] Verificar navegação e estados interativos no Edge.
- [x] Executar build TypeScript/Vite após implementar as telas.
- [x] Verificar 19 rotas em 320, 390, 768 e 1440 px e inspecionar capturas mobile/desktop.
- [x] Atualizar README.md, PROJECT.md, DESIGN_SYSTEM.md e .env.example.
- [x] Publicar a nova interface na Hostinger e verificar a versão remota.

## Próxima etapa: backend e validação em dispositivo

### Ajuste de layout solicitado

- [x] Substituir a moldura de celular no desktop por uma área de trabalho responsiva.
- [x] Implementar menu lateral no computador e preservar navegação mobile.
- [x] Distribuir dashboard, acervo e formulários em colunas no desktop.
- [x] Verificar 19 rotas em sete larguras, incluindo 901, 1024 e 1366 px.
- [x] Conferir capturas desktop e navegação lateral; fluxos locais continuam passando.
- [x] Publicar e verificar a atualização responsiva na Hostinger: HTTP 200 e nenhum erro JavaScript no Edge.

- [ ] Escolher e implementar autenticação segura e autorização por biblioteca.
- [ ] Implementar banco remoto, migrações e transações de circulação.
- [ ] Implementar e validar serviço OCR autenticado.
- [ ] Implementar sincronização remota e resolução de conflitos.
- [ ] Implementar restauração validada de backup.
- [ ] Implementar envio de e-mails/push, se definido para o produto.
- [ ] Testar a câmera com livros físicos em celular compatível.

## Evidências desta etapa

Cinco testes Playwright aprovados: regras de ISBN/circulação; cadastro/edição/empréstimo/devolução/persistência; 19 rotas em quatro larguras; falhas de scanner/API e transcrição; preservação de dados locais inválidos. Consulta real de ISBN à Open Library respondendo com metadados. Testes usam dados sintéticos apenas em contextos isolados, nunca no site publicado.

Publicação de 05/11/2026 verificada no Edge: HTTP 200, dashboard renderizado, acervo inicialmente vazio, nenhum erro JavaScript e consulta real de ISBN retornando `Fantastic Mr Fox` a partir do site publicado. Capturas `artifacts/published-desktop.png` e `artifacts/published-mobile.png`.


## Migração para a referência Qwen — 05/11/2026

O usuário forneceu o link original e pediu fidelidade visual, mantendo desktop responsivo. Essa solicitação substitui a identidade provisória descrita nas etapas anteriores.

- [x] Recuperar HTML e identificar os 19 IDs originais.
- [x] Migrar estruturas, Inter, Font Awesome, cores spirit/warm, gradientes e estilos.
- [x] Conectar templates React aos serviços locais, preservando dados existentes.
- [x] Corrigir OCR para ficha de leitor e incluir revisão humana.
- [x] Adaptar desktop com navegação lateral e colunas.
- [x] Aprovar cinco testes, incluindo 19 telas em sete larguras, ciclo de circulação, falhas e integridade de armazenamento.
- [x] Inspecionar capturas de login e dashboard mobile/desktop.
- [x] Atualizar documentação da referência, arquitetura e integrações.
- [x] Publicar versão Qwen e verificar site remoto.

Publicação Qwen verificada em 05/11/2026: HTTP 200, login e dashboard renderizados, acervo inicial vazio e nenhum erro JavaScript no Edge. Consulta real por ISBN retornou Fantastic Mr Fox. Capturas remotas em artifacts/published-desktop.png e artifacts/published-mobile.png. Build TypeScript/Vite concluído sem erros; os cinco casos Playwright passaram após a regeneração final dos templates.

## Primeiro administrador local — 16/11/2026

- [x] Permitir criação do primeiro administrador na tela de acesso.
- [x] Derivar senha com PBKDF2/SHA-256 e salt aleatório no navegador.
- [x] Permitir login, sessão e logout local.
- [x] Manter aviso explícito de que a conta não é compartilhada entre computadores.
- [ ] Migrar a autenticação para backend Hostinger/MySQL com sessões HttpOnly e permissões reais.

Limitações: não realizada comparação pixel a pixel de todas as telas. Dados fictícios e simulações do protótipo não são reproduzidos como reais. Câmera física, autenticação, banco remoto, OCR e sincronização continuam pendentes.
