# Identidade visual — Biblioteca Espírita

Fonte oficial: [página Qwen](https://chat.qwen.ai/s/deploy/t_0aeb803d-9c06-4dfc-8d6d-1a1e963a36cb), recuperada em reference/qwen/frame-2.html. Substitui a identidade verde provisória. CSS original em src/qwen/original.css; adaptações em src/qwen/styles.css.

## Tokens originais

| Nível | spirit | warm |
| --- | --- | --- |
| 50 | #f0f7ff | #fdf8f0 |
| 100 | #e0effe | #f9edd9 |
| 200 | #b9dffd | #f3d8b0 |
| 300 | #7cc5fc | #ecbe7e |
| 400 | #36a8f8 | #e49e4b |
| 500 | #0c8de9 | #df8529 |
| 600 | #006fc7 | #d06b1f |
| 700 | #0159a1 | #ad501c |
| 800 | #064b85 | #8a401e |
| 900 | #0b3f6e | #70361b |
| 950 | #072849 | — |

Gradiente de cabeçalho: 135deg, #064b85 → #0c8de9 → #0159a1. Inter (400/500/600/700) e Font Awesome 6.5 empacotados localmente. Textos auxiliares de 10–12px, texto funcional de 14px e títulos conforme as classes originais. Cards brancos arredondados, raios de 12–16px, bordas cinza suaves e ações coloridas preservadas dos templates.

## Responsividade e comportamento

- Até 900px: navegação inferior com cinco ações; telas fluidas sem moldura, respeitando a área segura.
- Acima de 900px: menu lateral de 214–244px, área de conteúdo até 1300px, cards e formulários em colunas.
- Acima de 1280px: oito ações rápidas na mesma linha. Login permanece centralizado em fundo azul.
- Animações originais preservadas; prefers-reduced-motion reduz movimento.
- Ícones decorativos ocultos dos leitores de tela, botões com nomes acessíveis, campos com rótulos e foco visível.

## Diferenças necessárias

Dados e contadores usam o acervo real local. Estados vazios, avisos de serviço pendente e link de acesso local explícito substituem simulações do protótipo. OCR corresponde à ficha de leitor do original. Não há capas editoriais inventadas nem autenticação fictícia.

## Verificação

As 19 telas foram testadas em 320, 390, 768, 901, 1024, 1366 e 1440px sem transbordamento horizontal. Capturas de login e dashboard mobile/desktop inspecionadas em artifacts/qwen-*.png. A referência arquivada sustenta a preservação de estilos e estrutura; não houve comparação pixel a pixel das 19 telas. Câmera física ainda não validada.
