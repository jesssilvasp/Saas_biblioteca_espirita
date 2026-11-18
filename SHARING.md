# Pacote para compartilhar com desenvolvedores

Este projeto foi preparado sem cadastros pessoais. Livros, leitores, empréstimos e o administrador local ficam no `localStorage` do navegador, portanto não são enviados neste pacote.

Para começar do zero:

1. Execute `npm ci`.
2. Execute `npm.cmd run dev` no Windows ou `npm run dev` em macOS/Linux.
3. Abra o endereço mostrado pelo Vite.
4. Na primeira tela, crie o administrador local com um nome e uma senha próprios.

O pacote não inclui `node_modules`, `dist`, capturas, relatórios de teste, arquivos `.env`, `.git` ou credenciais. O modo local não compartilha dados entre computadores; autenticação e banco multiusuário ainda precisam ser conectados ao backend.

Se um navegador já tiver dados antigos, abra as ferramentas do navegador e remova os dados do site, ou execute no console:

```js
Object.keys(localStorage).filter((key) => key.startsWith("biblioteca-espirita:")).forEach((key) => localStorage.removeItem(key));
```
