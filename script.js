// Inicialização do Canvas com Fabric.js
const canvas = new fabric.Canvas('canvas', {
    width: 800,
    height: 400,
    backgroundColor: '#333',
});

// Variáveis globais
let selectedObject = null;

// Função para adicionar texto
document.getElementById('addText').addEventListener('click', () => {
    const text = new fabric.Text('Sample Text', {
        left: 100,
        top: 100,
        fontSize: 24,
        fill: '#ffffff',
        selectable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    selectedObject = text;
    updateProperties();
});

// Função para adicionar forma (círculo como exemplo)
document.getElementById('addShape').addEventListener('click', () => {
    const circle = new fabric.Circle({
        radius: 50,
        left: 150,
        top: 150,
        fill: '#ff0000',
        selectable: true,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    selectedObject = circle;
    updateProperties();
});

// Upload de imagem base
document.getElementById('uploadImage').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                img.scaleToWidth(800);
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            });
        };
        reader.readAsDataURL(file);
    };
    input.click();
});

// Carregar templates pré-definidos
document.getElementById('loadTemplate').addEventListener('change', (e) => {
    const template = e.target.value;
    if (!template) return;
    fetch(`assets/templates/${template}.json`)
        .then(response => response.json())
        .then(data => {
            canvas.clear();
            canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
        });
});

// Atualizar propriedades do objeto selecionado
canvas.on('selection:created', (e) => {
    selectedObject = e.target;
    updateProperties();
});
canvas.on('selection:updated', (e) => {
    selectedObject = e.target;
    updateProperties();
});

function updateProperties() {
    if (!selectedObject) return;
    document.getElementById('textInput').value = selectedObject.text || '';
    document.getElementById('fontSize').value = selectedObject.fontSize || 24;
    document.getElementById('color').value = selectedObject.fill || '#ffffff';
    document.getElementById('animationFrames').value = selectedObject.animationFrames || 1;
}

// Aplicar mudanças nas propriedades
document.getElementById('textInput').addEventListener('input', (e) => {
    if (selectedObject && selectedObject.type === 'text') {
        selectedObject.set('text', e.target.value);
        canvas.renderAll();
    }
});
document.getElementById('fontSize').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('fontSize', parseInt(e.target.value));
        canvas.renderAll();
    }
});
document.getElementById('color').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('fill', e.target.value);
        canvas.renderAll();
    }
});
document.getElementById('animationFrames').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.animationFrames = parseInt(e.target.value);
        canvas.renderAll();
    }
});

// Salvar projeto no localStorage
document.getElementById('saveProject').addEventListener('click', () => {
    const project = canvas.toJSON(['animationFrames']); // Inclui propriedade customizada
    localStorage.setItem('imageCreatorProject', JSON.stringify(project));
    alert('Projeto salvo com sucesso!');
});

// Exportar código e elementos
document.getElementById('exportCode').addEventListener('click', () => {
    const lang = document.getElementById('exportLang').value;
    const objects = canvas.getObjects();
    let code = '';
    const elements = [];

    // Gerar elementos e animações
    objects.forEach((obj, index) => {
        const frames = obj.animationFrames || 1;
        if (obj.type === 'text') {
            elements.push({ type: 'text', text: obj.text, x: obj.left, y: obj.top, size: obj.fontSize, color: obj.fill, frames });
        } else if (obj.type === 'circle') {
            elements.push({ type: 'circle', radius: obj.radius, x: obj.left, y: obj.top, color: obj.fill, frames });
        }
    });

    // Gerar código baseado na linguagem
    switch (lang) {
        case 'python':
            code = `from PIL import Image, ImageDraw, ImageFont\n\n`;
            code += `def create_image():\n    img = Image.open("base.png")\n    draw = ImageDraw.Draw(img)\n`;
            elements.forEach((el) => {
                if (el.type === 'text') {
                    code += `    font = ImageFont.truetype("arial.ttf", ${el.size})\n`;
                    code += `    draw.text((${el.x}, ${el.y}), "${el.text}", fill="${el.color}", font=font)\n`;
                } else if (el.type === 'circle') {
                    code += `    draw.ellipse((${el.x}, ${el.y}, ${el.x + el.radius * 2}, ${el.y + el.radius * 2}), fill="${el.color}")\n`;
                }
            });
            code += `    img.save("output.png")\n\ncreate_image()`;
            break;
        case 'javascript':
            code = `const { createCanvas, loadImage } = require('canvas');\n\n`;
            code += `async function createImage() {\n    const canvas = createCanvas(800, 400);\n    const ctx = canvas.getContext('2d');\n    const img = await loadImage('base.png');\n    ctx.drawImage(img, 0, 0);\n`;
            elements.forEach((el) => {
                if (el.type === 'text') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.font = "${el.size}px Arial";\n`;
                    code += `    ctx.fillText("${el.text}", ${el.x}, ${el.y});\n`;
                } else if (el.type === 'circle') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.beginPath();\n`;
                    code += `    ctx.arc(${el.x + el.radius}, ${el.y + el.radius}, ${el.radius}, 0, Math.PI * 2);\n    ctx.fill();\n`;
                }
            });
            code += `    const fs = require('fs');\n    fs.writeFileSync('output.png', canvas.toBuffer('image/png'));\n}\n\ncreateImage();`;
            break;
        case 'lua':
            code = `-- Lua code for MTA or similar\n`;
            code += `function createImage()\n    local img = dxCreateTexture("base.png")\n`;
            elements.forEach((el) => {
                if (el.type === 'text') {
                    code += `    dxDrawText("${el.text}", ${el.x}, ${el.y}, ${el.x}, ${el.y}, tocolor(${hexToRGB(el.color)}), 1, "arial")\n`;
                } else if (el.type === 'circle') {
                    code += `    dxDrawCircle(${el.x + el.radius}, ${el.y + el.radius}, ${el.radius}, tocolor(${hexToRGB(el.color)}))\n`;
                }
            });
            code += `end\naddEventHandler("onClientRender", root, createImage)`;
            break;
        case 'csharp':
            code = `using System.Drawing;\n\n`;
            code += `class ImageCreator {\n    static void Main() {\n        using (var img = Image.FromFile("base.png"))\n        using (var g = Graphics.FromImage(img)) {\n`;
            elements.forEach((el) => {
                if (el.type === 'text') {
                    code += `            g.DrawString("${el.text}", new Font("Arial", ${el.size}), new SolidBrush(ColorTranslator.FromHtml("${el.color}")), ${el.x}, ${el.y});\n`;
                } else if (el.type === 'circle') {
                    code += `            g.FillEllipse(new SolidBrush(ColorTranslator.FromHtml("${el.color}")), ${el.x}, ${el.y}, ${el.radius * 2}, ${el.radius * 2});\n`;
                }
            });
            code += `            img.Save("output.png");\n        }\n    }\n}`;
            break;
        case 'java':
            code = `import java.awt.*;\nimport java.awt.image.BufferedImage;\nimport javax.imageio.ImageIO;\nimport java.io.File;\n\n`;
            code += `public class ImageCreator {\n    public static void main(String[] args) throws Exception {\n        BufferedImage img = ImageIO.read(new File("base.png"));\n        Graphics2D g = img.createGraphics();\n`;
            elements.forEach((el) => {
                if (el.type === 'text') {
                    code += `        g.setFont(new Font("Arial", Font.PLAIN, ${el.size}));\n`;
                    code += `        g.setColor(Color.decode("${el.color}"));\n`;
                    code += `        g.drawString("${el.text}", ${el.x}, ${el.y});\n`;
                } else if (el.type === 'circle') {
                    code += `        g.setColor(Color.decode("${el.color}"));\n`;
                    code += `        g.fillOval(${el.x}, ${el.y}, ${el.radius * 2}, ${el.radius * 2});\n`;
                }
            });
            code += `        g.dispose();\n        ImageIO.write(img, "png", new File("output.png"));\n    }\n}`;
            break;
        case 'php':
            code = `<?php\n`;
            code += `$img = imagecreatefrompng("base.png");\n`;
            elements.forEach((el) => {
                if (el.type === 'text') {
                    code += `$color = imagecolorallocate($img, ${hexToRGB(el.color)});\n`;
                    code += `imagettftext($img, ${el.size}, 0, ${el.x}, ${el.y}, $color, "arial.ttf", "${el.text}");\n`;
                } else if (el.type === 'circle') {
                    code += `$color = imagecolorallocate($img, ${hexToRGB(el.color)});\n`;
                    code += `imagefilledellipse($img, ${el.x + el.radius}, ${el.y + el.radius}, ${el.radius * 2}, ${el.radius * 2}, $color);\n`;
                }
            });
            code += `imagepng($img, "output.png");\nimagedestroy($img);\n?>`;
            break;
    }

    // Criar ZIP com código, elementos e GIF (se aplicável)
    const zip = new JSZip();
    const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'lua' ? 'lua' : lang === 'csharp' ? 'cs' : lang === 'java' ? 'java' : 'php';
    zip.file(`script.${ext}`, code);
    elements.forEach((el, i) => {
        zip.file(`element_${i}_${el.type}.json`, JSON.stringify(el));
    });

    // Suporte a GIF (simples: duplicar frames com deslocamento)
    const hasAnimation = elements.some(el => el.frames > 1);
    if (hasAnimation) {
        const gifFrames = [];
        elements.forEach((el) => {
            for (let i = 0; i < el.frames; i++) {
                const tempCanvas = fabric.util.createCanvasElement();
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (canvas.backgroundImage) {
                    tempCtx.drawImage(canvas.backgroundImage.getElement(), 0, 0, 800, 400);
                }
                if (el.type === 'text') {
                    tempCtx.font = `${el.size}px Arial`;
                    tempCtx.fillStyle = el.color;
                    tempCtx.fillText(el.text, el.x + i * 10, el.y); // Deslocamento simples
                } else if (el.type === 'circle') {
                    tempCtx.fillStyle = el.color;
                    tempCtx.beginPath();
                    tempCtx.arc(el.x + el.radius + i * 10, el.y + el.radius, el.radius, 0, Math.PI * 2);
                    tempCtx.fill();
                }
                gifFrames.push(tempCanvas.toDataURL('image/png'));
            }
        });
        // Aqui seria necessário uma lib como gif.js para criar o GIF no cliente
        // Por simplicidade, adicionamos apenas o primeiro frame como exemplo
        zip.file('output.gif', gifFrames[0].split(',')[1], { base64: true });
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'image_project.zip');
    });
});

// Função auxiliar para converter hex para RGB
function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

// Dependências externas
const scriptZip = document.createElement('script');
scriptZip.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(scriptZip);

const scriptFileSaver = document.createElement('script');
scriptFileSaver.src = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';
document.head.appendChild(scriptFileSaver);
