# Biblioteca Espírita

## Objetivo

Implementar a Biblioteca Espírita com as 19 telas e funções solicitadas. O pedido mais recente substitui a identidade provisória: reproduzir a referência Qwen fornecida, com desktop responsivo. O HTML das 19 telas foi recuperado e arquivado em reference/qwen/frame-2.html.

## Estado atual

As 19 telas estão implementadas. Cadastros, exemplares, empréstimos, devoluções, atrasos, histórico, avaliações, preferências e notificações funcionam com armazenamento neste navegador. Não há dados fictícios pré-carregados. A conta segura, o banco remoto, o OCR e a sincronização ainda dependem de backend. Site: https://mistyrose-antelope-705522.hostingersite.com.

## Requisitos

Interface mobile-first, com navegação inferior no celular e menu completo. Conforme pedido posterior do usuário, desktop usa área de trabalho ampla, navegação lateral e colunas, sem moldura de celular. Paletas `spirit` e `warm`, documentadas em DESIGN_SYSTEM.md.

Destinos solicitados: Login; Dashboard; Scanner; Resultado do scanner; Acervo; Detalhes do livro; Cadastro de livro; Cadastro de leitor; Digitalização de ficha; Resultado do OCR; Empréstimo; Devolução; Resultado da devolução; Análise de obras; Lista de empréstimos; Atrasados; Sincronização; Notificações; Configurações.

Preparar autenticação segura, livros e exemplares, leitores, empréstimos e devoluções, atrasos, leitura de ISBN/códigos de barras pela câmera, metadados por ISBN, OCR com revisão humana, classificação CDE, localização física, avaliação doutrinária, histórico, notificações e sincronização.

## Arquitetura

React + TypeScript + Vite + Tailwind CSS. React Router com HashRouter permite links diretos na hospedagem estática. Fonte Inter e ícones Font Awesome 6.5, como no original. Zod valida dados persistidos e respostas externas.

- `src/qwen/templates`: 19 estruturas originais, sem scripts ou handlers inline; convertidas para elementos React por Template.tsx.
- `src/qwen/Screen.tsx`: controlador das telas e associação aos dados locais. Forms.tsx e Analysis.tsx encapsulam formulários e análise humana; Layout.tsx e ui.tsx contêm navegação e componentes.
- `src/qwen/original.css`: CSS recuperado do original. styles.css aplica tokens e adaptação desktop.
- `scripts/prepare-qwen.mjs`: extração reproduzível dos templates sanitizados a partir da referência arquivada.
- `src/routes/QwenRoutes.tsx`: registro dos destinos; src/qwen/navigation.ts conserva o mapeamento dos 19 IDs originais.
- `src/services/library.ts`: regras de circulação e persistência versionada em localStorage.
- `src/services/integrations.ts`: consulta ISBN real e adaptador OCR opcional.
- `src/hooks`: contexto de dados e ciclo de vida da câmera.
- `src/types`: esquemas e tipos de livros, exemplares, leitores e empréstimos.
- `src/routes`: inventário de rotas.
- `tests`: regras de negócio, fluxo no navegador, estados de erro e responsividade.

Persistência: chave `biblioteca-espirita:v1`, com versão de esquema. A gravação acontece antes da confirmação visual; erros de armazenamento são exibidos e dados inválidos não são apagados. Abas recebem atualizações por evento storage, mas não há transações entre abas nem suporte multiusuário. Usar uma aba para operações de circulação. Limpar o armazenamento remove os dados. Exportação JSON disponível; importação/restauração ainda pendente.

## Inventário das 19 telas

1. `/login`: acesso local explícito; autenticação remota pendente.
2. `/`: dashboard com indicadores dos registros reais locais.
3. `/scanner`: câmera e entrada manual de ISBN/código de exemplar.
4. `/scanner/resultado?isbn=...`: metadados e tratamento de falhas.
5. `/acervo`: busca e filtros.
6. `/livros/:id`: detalhes, localização e exemplares.
7. `/livros/novo`: cadastro e edição por `?editar=id`.
8. `/leitores/novo`: cadastro, lista e edição de leitores.
9. `/digitalizar`: seleção de imagem e integração OCR pendente.
10. `/ocr/resultado`: revisão de dados OCR ou transcrição manual.
11. `/emprestimo`: registro por exemplar e leitor.
12. `/devolucao`: busca e confirmação de recebimento.
13. `/devolucao/resultado/:id`: comprovante local da devolução.
14. `/analise`: parecer humano e estado da avaliação.
15. `/emprestimos`: ativos, devolvidos e histórico.
16. `/atrasados`: prazos vencidos, calculados por data local.
17. `/sincronizacao`: estado local e exportação JSON.
18. `/notificacoes`: movimentações, atrasos e marcação de leitura.
19. `/configuracoes`: nome da biblioteca e prazo padrão.

## Integrações e pendências

**ISBN:** consulta pública real à [Open Library Search API](https://openlibrary.org/dev/docs/api/search), sem chave. Título/autoria e metadados de obra exigem revisão humana: editora e primeira publicação podem não corresponder à edição física. Há validação de ISBN-10/13, limite de 15 segundos e cadastro manual em falhas. O serviço externo pode limitar requisições ou mudar sua disponibilidade.

**Câmera:** `getUserMedia` + [BarcodeDetector](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) em navegadores compatíveis e contexto seguro. A câmera inicia somente por ação do usuário e encerra ao sair da tela. EAN-13/8, Code 128 e Code 39 são habilitados conforme suporte detectado. Código de exemplar local é pesquisado antes de validar ISBN. Hardware real ainda precisa ser testado no celular.

**OCR:** `VITE_OCR_ENDPOINT` opcional, HTTPS na mesma origem. Ficha de leitor, conforme a referência Qwen. POST multipart com campos `image` e `documentType=reader`; cookies de mesma origem. Resposta JSON com strings `name`, `phone`, `email`, `address`, `birthDate`. Limite de 30 segundos. Backend ainda não implementado: deverá autenticar, autorizar, proteger contra CSRF, validar imagem/tamanho, limitar requisições e chamar o provedor OCR com credencial privada. Botão desabilitado sem endpoint. Revisão humana obrigatória antes do cadastro. Imagens não são persistidas no localStorage.

**Autenticação local:** o primeiro acesso permite criar um administrador com nome e senha escolhidos pelo usuário. A senha é derivada com PBKDF2/SHA-256 e salt aleatório, e somente o registro derivado fica no localStorage; o texto da senha não é persistido. O login funciona neste navegador e há sessão local. Isso não é autenticação multiusuário: outro computador não verá essa conta. Para produção compartilhada, a próxima etapa é backend Hostinger/MySQL com hash no servidor, sessões HttpOnly, recuperação de senha, autorização e auditoria.

**Sincronização:** requer IDs duráveis, versão de registro, idempotência, resolução de conflitos e fila de operações. Não existe envio remoto nesta etapa. E-mail e push também permanecem pendentes.


## Fidelidade e compatibilidade

A estrutura, cores, ícones, textos funcionais e estilos das 19 telas vêm do HTML Qwen. Registros e números fictícios foram substituídos por dados locais e estados vazios; ações simuladas foram substituídas por operações reais ou avisos de integração pendente. Login mantém o desenho, com acesso local explícito separado. Desktop não usa moldura de celular por pedido do usuário. Não se afirma identidade pixel a pixel nos conteúdos dinâmicos.

Campos opcionais de edição/subtítulo/categoria/prateleira/doação, endereço/nascimento do leitor e notas do empréstimo preservam compatibilidade com os registros locais existentes, sem apagar ou reinicializar o acervo.
