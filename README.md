# Image Creator Tool 🎨✨

![Image Creator Tool Banner](https://cdn.discordapp.com/attachments/1051124532263530576/1352149362180100116/image.png?ex=67dcf6b9&is=67dba539&hm=e165d3e20ff547b6652491a9d4456a56cddc0914d2ec285b81a090d551f99975&)

> **Uma ferramenta poderosa e intuitiva para criar imagens e animações com camadas, exportação de código e suporte a múltiplas linguagens.**

---

## 🚀 Sobre o Projeto

O **Image Creator Tool** é um editor gráfico baseado em HTML5 Canvas (usando Fabric.js) que combina criatividade e tecnologia. Desenvolvido para artistas, designers e programadores, ele permite criar imagens estáticas ou animações em GIF com uma interface moderna e funcionalidades avançadas como:

- **Camadas**: Organize elementos com facilidade.
- **Animações**: Crie GIFs com uma timeline interativa.
- **Exportação**: Gere código em linguagens como Python, JavaScript, Lua e mais.
- **Personalização**: Ajuste propriedades como opacidade, sombra, desfoque e muito mais.

---

## 🛠️ Tecnologias Utilizadas

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Fabric.js](https://img.shields.io/badge/Fabric.js-5A67D8?style=for-the-badge&logo=fabric&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🌟 Funcionalidades

| **Funcionalidade**            | **Descrição**                                                                 |
|-------------------------------|-------------------------------------------------------------------------------|
| **Adicionar Elementos**       | Inclua textos, formas (círculo, retângulo, triângulo, estrela, linha) e imagens. |
| **Camadas**                   | Gerencie a ordem e visibilidade dos elementos com um painel dedicado.         |
| **Animações**                 | Crie keyframes e exporte como GIF com a timeline integrada.                   |
| **Propriedades Avançadas**    | Ajuste cor, opacidade, sombra, desfoque, brilho, contraste e mais.            |
| **Exportação de Código**      | Gere scripts em Python, JavaScript, Lua, PHP, C#, C++, HTML ou CSS.           |
| **Zoom e Pan**                | Navegue pelo canvas com zoom (roda do mouse) e pan (Alt + arrastar).          |
| **Desfazer/Refazer**          | Histórico completo de ações para corrigir ou revisitar alterações.            |
| **Responsividade**            | Interface adaptada para desktop e mobile com sidebar retrátil.                |

---

## 📋 Como Funciona o Editor

O editor é dividido em quatro áreas principais no arquivo `editor.html`, integradas ao `script.js`:

1. **Toolbar Superior**  
   - **Desfazer/Refazer**: Controle o histórico de ações.
   - **Carregar Template**: Abra modelos pré-definidos (JSON).
   - **Salvar/Carregar Projeto**: Exporte ou importe projetos em JSON.
   - **Exportar Código**: Gere um ZIP com scripts e imagens.

2. **Painel de Ferramentas (Esquerda)**  
   - Adicione elementos ao canvas (texto, formas, imagens).
   - Ferramentas de manipulação: centralizar, alinhar, duplicar, agrupar/desagrupar, zoom.

3. **Canvas Central**  
   - Área de criação com suporte a drag-and-drop de imagens.
   - Interaja com elementos via clique, duplo clique (edição de texto) e teclado (Ctrl+Z, Delete, etc.).

4. **Painel de Propriedades e Camadas (Direita)**  
   - Ajuste propriedades detalhadas do elemento selecionado.
   - Gerencie camadas com botões para mover, ocultar ou excluir.

5. **Timeline (Abaixo do Canvas)**  
   - Adicione keyframes para animações.
   - Reproduza ou pare a animação com controles dedicados.

---

## ⚙️ Como Usar

### 1. Acesse o Editor
- **Online**: Visite [gui-edit-v2.redebots.shop](https://gui-edit-v2.redebots.shop/).
- **Local**: Clone o repositório e abra `index.html` ou `editor.html` em um navegador.

```bash
git clone https://github.com/LucasDesignerF/image-creator-tool.git
cd image-creator-tool
npx http-server -c-1
```

Acesse `http://localhost:8080`.

### 2. Crie um Projeto
- Use o botão **"Adicionar"** no painel de ferramentas para incluir elementos.
- Arraste imagens diretamente para o canvas ou clique em **"Carregar Imagem"**.
- Ajuste propriedades no painel direito.

### 3. Anime
- Defina o número de frames em **"Frames de Animação"**.
- Clique nos círculos da timeline para adicionar keyframes.
- Use **"Play"** para visualizar a animação.

### 4. Exporte
- Clique em **"Exportar"** e escolha uma linguagem no menu suspenso.
- Um arquivo ZIP será gerado com o código e imagens usadas.

---

## 🖌️ Como Editar o Código

### Estrutura do Projeto
```
image-creator-tool/
├── index.html         # Página inicial
├── editor.html        # Interface do editor
├── script.js          # Lógica principal do editor (Fabric.js)
├── assets/            # Templates e recursos
│   ├── favicon.png
│   └── templates/
└── service-worker.js  # Cache offline (opcional)
```

### Passos para Editar
1. **Personalizar o Estilo**  
   - Edite o `<style>` em `editor.html` ou `index.html` para ajustar cores, gradientes ou layouts.
   - Exemplo: mude o gradiente do fundo em `body` para outro estilo:
     ```css
     background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
     ```

2. **Adicionar Novas Formas**  
   - No `script.js`, expanda a função `addShape`:
     ```javascript
     addEvent('addPentagon', 'click', () => addShape('polygon', {
         points: [
             { x: 0, y: -50 }, { x: 47, y: -15 }, { x: 29, y: 40 },
             { x: -29, y: 40 }, { x: -47, y: -15 }
         ],
         left: 150, top: 150, fill: '#ff00ff', opacity: 1
     }));
     ```
   - Adicione o botão correspondente em `editor.html`:
     ```html
     <button id="addPentagon" class="btn-3d"><i class="fas fa-shapes"></i> Pentágono</button>
     ```

3. **Novas Linguagens de Exportação**  
   - No evento `exportCode` em `script.js`, adicione suporte para outra linguagem:
     ```javascript
     if (lang === 'javascript') {
         code = 'const canvas = document.createElement("canvas");\n';
         code += `canvas.width = ${maxWidth}; canvas.height = ${maxHeight};\n`;
         code += 'const ctx = canvas.getContext("2d");\n';
         objects.forEach((obj, i) => {
             code += `ctx.fillStyle = "${obj.fill}";\n`;
             if (obj.type === 'rect') {
                 code += `ctx.fillRect(${obj.left}, ${obj.top}, ${obj.width}, ${obj.height});\n`;
             }
         });
         zip.file('script.js', code);
     }
     ```

4. **Rodar Localmente**  
   - Após editar, use `npx http-server -c-1` para testar.

---

## 🌐 Links Úteis

- **GitHub**: [LucasDesignerF/image-creator-tool](https://github.com/LucasDesignerF/image-creator-tool)
- **Site**: [gui-edit-v2.redebots.shop](https://gui-edit-v2.redebots.shop/)
- **Comunidade no Discord**: [Code Projects](https://discord.gg/x74fnzcz2S)

---

## 🤝 Contribua

Quer ajudar a melhorar o Image Creator Tool? Siga esses passos:
1. Faça um fork do repositório.
2. Crie uma branch para sua feature: `git checkout -b minha-feature`.
3. Commit suas mudanças: `git commit -m "Adiciona minha feature"`.
4. Envie para o repositório: `git push origin minha-feature`.
5. Abra um Pull Request!

---

## 📸 Demonstração

![Demonstração do Editor](https://cdn.discordapp.com/attachments/1051124532263530576/1352149362180100116/image.png?ex=67dcf6b9&is=67dba539&hm=e165d3e20ff547b6652491a9d4456a56cddc0914d2ec285b81a090d551f99975&)

---

## 📜 Licença

Esse projeto é licenciado sob a [MIT License](LICENSE). Sinta-se à vontade para usar, modificar e distribuir!

---

Feito com 💜 por [LucasDesignerF](https://github.com/LucasDesignerF). Junte-se à comunidade no [Discord](https://discord.gg/x74fnzcz2S) para discutir ideias e projetos!