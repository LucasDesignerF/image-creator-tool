// Inicialização do Canvas com Fabric.js
const canvas = new fabric.Canvas('canvas', {
    width: 800,
    height: 400,
    backgroundColor: '#333',
    preserveObjectStacking: true,
});

// Variáveis globais
let selectedObject = null;
let history = [];
let historyIndex = -1;

// Função para salvar estado no histórico
function saveState() {
    history = history.slice(0, historyIndex + 1);
    history.push(canvas.toJSON(['animationFrames', 'opacity', 'filters']));
    historyIndex++;
}

// Função para desfazer
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        canvas.loadFromJSON(history[historyIndex], canvas.renderAll.bind(canvas));
    }
}

// Função para adicionar texto
document.getElementById('addText').addEventListener('click', () => {
    const text = new fabric.Text('Sample Text', {
        left: 100,
        top: 100,
        fontSize: 24,
        fill: '#ffffff',
        opacity: 1,
        selectable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    selectedObject = text;
    updateProperties();
    saveState();
});

// Funções para adicionar formas geométricas
document.getElementById('addCircle').addEventListener('click', () => {
    const circle = new fabric.Circle({
        radius: 50,
        left: 150,
        top: 150,
        fill: '#ff0000',
        opacity: 1,
        selectable: true,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    selectedObject = circle;
    updateProperties();
    saveState();
});

document.getElementById('addRect').addEventListener('click', () => {
    const rect = new fabric.Rect({
        width: 100,
        height: 100,
        left: 150,
        top: 150,
        fill: '#00ff00',
        opacity: 1,
        selectable: true,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    selectedObject = rect;
    updateProperties();
    saveState();
});

document.getElementById('addTriangle').addEventListener('click', () => {
    const triangle = new fabric.Triangle({
        width: 100,
        height: 100,
        left: 150,
        top: 150,
        fill: '#0000ff',
        opacity: 1,
        selectable: true,
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    selectedObject = triangle;
    updateProperties();
    saveState();
});

document.getElementById('addStar').addEventListener('click', () => {
    const star = new fabric.Polygon([
        { x: 0, y: -50 }, { x: 14, y: -15 }, { x: 47, y: -15 }, { x: 23, y: 10 }, { x: 29, y: 45 },
        { x: 0, y: 25 }, { x: -29, y: 45 }, { x: -23, y: 10 }, { x: -47, y: -15 }, { x: -14, y: -15 }
    ], {
        left: 150,
        top: 150,
        fill: '#ffff00',
        opacity: 1,
        selectable: true,
        scaleX: 1,
        scaleY: 1,
    });
    canvas.add(star);
    canvas.setActiveObject(star);
    selectedObject = star;
    updateProperties();
    saveState();
});

// Upload de imagem base (dinâmico)
document.getElementById('uploadImage').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                const imgWidth = img.width;
                const imgHeight = img.height;
                const maxCanvasWidth = 2000;
                let canvasWidth = imgWidth;
                let canvasHeight = imgHeight;
                let scaleFactor = 1;

                if (imgWidth > maxCanvasWidth) {
                    scaleFactor = maxCanvasWidth / imgWidth;
                    canvasWidth = maxCanvasWidth;
                    canvasHeight = imgHeight * scaleFactor;
                }

                // Ajusta o canvas ao formato da imagem
                canvas.setWidth(canvasWidth);
                canvas.setHeight(canvasHeight);

                img.set({
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                    left: 0,
                    top: 0,
                    selectable: false,
                });

                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                    left: 0,
                    top: 0,
                });
                saveState();
            }, { crossOrigin: 'anonymous' });
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
            saveState();
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
    document.getElementById('width').value = selectedObject.width * (selectedObject.scaleX || 1) || 100;
    document.getElementById('height').value = selectedObject.height * (selectedObject.scaleY || 1) || 100;
    document.getElementById('color').value = selectedObject.fill || '#ffffff';
    document.getElementById('opacity').value = (selectedObject.opacity || 1) * 100;
    document.getElementById('blur').value = selectedObject.filters?.find(f => f instanceof fabric.Image.filters.Blur)?.blur || 0;
    document.getElementById('animationFrames').value = selectedObject.animationFrames || 1;
}

// Aplicar mudanças nas propriedades
document.getElementById('textInput').addEventListener('input', (e) => {
    if (selectedObject && selectedObject.type === 'text') {
        selectedObject.set('text', e.target.value);
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('fontSize').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('fontSize', parseInt(e.target.value));
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('width').addEventListener('input', (e) => {
    if (selectedObject) {
        const lockAspect = document.getElementById('lockAspect').checked;
        const newWidth = parseInt(e.target.value);
        if (lockAspect) {
            const ratio = newWidth / (selectedObject.width * selectedObject.scaleX);
            selectedObject.scaleX = ratio;
            selectedObject.scaleY = ratio;
            document.getElementById('height').value = selectedObject.height * ratio;
        } else {
            selectedObject.scaleX = newWidth / selectedObject.width;
        }
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('height').addEventListener('input', (e) => {
    if (selectedObject) {
        const lockAspect = document.getElementById('lockAspect').checked;
        const newHeight = parseInt(e.target.value);
        if (lockAspect) {
            const ratio = newHeight / (selectedObject.height * selectedObject.scaleY);
            selectedObject.scaleX = ratio;
            selectedObject.scaleY = ratio;
            document.getElementById('width').value = selectedObject.width * ratio;
        } else {
            selectedObject.scaleY = newHeight / selectedObject.height;
        }
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('color').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('fill', e.target.value);
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('opacity').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('opacity', parseInt(e.target.value) / 100);
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('blur').addEventListener('input', (e) => {
    if (selectedObject) {
        const blurValue = parseFloat(e.target.value);
        if (!selectedObject.filters) selectedObject.filters = [];
        const existingBlur = selectedObject.filters.find(f => f instanceof fabric.Image.filters.Blur);
        if (existingBlur) {
            existingBlur.blur = blurValue;
        } else if (blurValue > 0) {
            selectedObject.filters.push(new fabric.Image.filters.Blur({ blur: blurValue }));
        } else {
            selectedObject.filters = selectedObject.filters.filter(f => !(f instanceof fabric.Image.filters.Blur));
        }
        selectedObject.applyFilters();
        canvas.renderAll();
        saveState();
    }
});
document.getElementById('animationFrames').addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.animationFrames = parseInt(e.target.value);
        canvas.renderAll();
        saveState();
    }
});

// Centralizar elemento
document.getElementById('centerElement').addEventListener('click', () => {
    if (selectedObject) {
        selectedObject.center();
        canvas.renderAll();
        saveState();
    }
});

// Alinhar elementos (primeiro selecionado ao segundo)
document.getElementById('alignElements').addEventListener('click', () => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 2) {
        const [first, second] = activeObjects;
        first.set({
            left: second.left,
            top: second.top,
        });
        canvas.renderAll();
        saveState();
    } else {
        alert('Selecione exatamente dois elementos para alinhar.');
    }
});

// Deletar elemento com tecla Delete
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedObject) {
        canvas.remove(selectedObject);
        selectedObject = null;
        canvas.renderAll();
        saveState();
    } else if (e.ctrlKey && e.key === 'z') {
        undo();
    }
});

// Salvar projeto no localStorage
document.getElementById('saveProject').addEventListener('click', () => {
    const project = canvas.toJSON(['animationFrames', 'opacity', 'filters']);
    localStorage.setItem('imageCreatorProject', JSON.stringify(project));
    alert('Projeto salvo com sucesso!');
});

// Exportar código e elementos
document.getElementById('exportCode').addEventListener('click', () => {
    const lang = document.getElementById('exportLang').value;
    const objects = canvas.getObjects();
    let code = '';
    const elements = [];

    objects.forEach((obj) => {
        const frames = obj.animationFrames || 1;
        const opacity = obj.opacity || 1;
        const blur = obj.filters?.find(f => f instanceof fabric.Image.filters.Blur)?.blur || 0;
        if (obj.type === 'text') {
            elements.push({ type: 'text', text: obj.text, x: obj.left, y: obj.top, size: obj.fontSize, color: obj.fill, frames, opacity, blur });
        } else if (obj.type === 'circle') {
            elements.push({ type: 'circle', radius: obj.radius, x: obj.left, y: obj.top, color: obj.fill, frames, opacity, blur });
        } else if (obj.type === 'rect') {
            elements.push({ type: 'rect', width: obj.width * obj.scaleX, height: obj.height * obj.scaleY, x: obj.left, y: obj.top, color: obj.fill, frames, opacity, blur });
        } else if (obj.type === 'triangle') {
            elements.push({ type: 'triangle', width: obj.width * obj.scaleX, height: obj.height * obj.scaleY, x: obj.left, y: obj.top, color: obj.fill, frames, opacity, blur });
        } else if (obj.type === 'polygon') {
            elements.push({ type: 'star', points: obj.points, x: obj.left, y: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, color: obj.fill, frames, opacity, blur });
        }
    });

    switch (lang) {
        case 'python':
            code = `from PIL import Image, ImageDraw, ImageFont, ImageFilter\n\n`;
            code += `def create_image():\n    img = Image.open("base.png")\n    draw = ImageDraw.Draw(img, "RGBA")\n`;
            elements.forEach((el) => {
                const alpha = Math.round(el.opacity * 255).toString(16).padStart(2, '0');
                if (el.type === 'text') {
                    code += `    font = ImageFont.truetype("arial.ttf", ${el.size})\n`;
                    code += `    draw.text((${el.x}, ${el.y}), "${el.text}", fill="${el.color}${alpha}", font=font)\n`;
                } else if (el.type === 'circle') {
                    code += `    draw.ellipse((${el.x}, ${el.y}, ${el.x + el.radius * 2}, ${el.y + el.radius * 2}), fill="${el.color}${alpha}")\n`;
                } else if (el.type === 'rect') {
                    code += `    draw.rectangle((${el.x}, ${el.y}, ${el.x + el.width}, ${el.y + el.height}), fill="${el.color}${alpha}")\n`;
                } else if (el.type === 'triangle') {
                    code += `    draw.polygon([(${el.x + el.width / 2}, ${el.y}), (${el.x}, ${el.y + el.height}), (${el.x + el.width}, ${el.y + el.height})], fill="${el.color}${alpha}")\n`;
                } else if (el.type === 'star') {
                    code += `    draw.polygon([${el.points.map(p => `(${el.x + p.x * el.scaleX}, ${el.y + p.y * el.scaleY})`).join(', ')}], fill="${el.color}${alpha}")\n`;
                }
                if (el.blur > 0) code += `    img = img.filter(ImageFilter.GaussianBlur(radius=${el.blur}))\n`;
            });
            code += `    img.save("output.png")\n\ncreate_image()`;
            break;
        case 'javascript':
            code = `const { createCanvas, loadImage } = require('canvas');\n\n`;
            code += `async function createImage() {\n    const canvas = createCanvas(${canvas.width}, ${canvas.height});\n    const ctx = canvas.getContext('2d');\n    const img = await loadImage('base.png');\n    ctx.drawImage(img, 0, 0, ${canvas.width}, ${canvas.height});\n`;
            elements.forEach((el) => {
                code += `    ctx.globalAlpha = ${el.opacity};\n`;
                if (el.blur > 0) code += `    ctx.filter = "blur(${el.blur}px)";\n`;
                if (el.type === 'text') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.font = "${el.size}px Arial";\n`;
                    code += `    ctx.fillText("${el.text}", ${el.x}, ${el.y});\n`;
                } else if (el.type === 'circle') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.beginPath();\n`;
                    code += `    ctx.arc(${el.x + el.radius}, ${el.y + el.radius}, ${el.radius}, 0, Math.PI * 2);\n    ctx.fill();\n`;
                } else if (el.type === 'rect') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.fillRect(${el.x}, ${el.y}, ${el.width}, ${el.height});\n`;
                } else if (el.type === 'triangle') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.beginPath();\n`;
                    code += `    ctx.moveTo(${el.x + el.width / 2}, ${el.y});\n`;
                    code += `    ctx.lineTo(${el.x}, ${el.y + el.height});\n`;
                    code += `    ctx.lineTo(${el.x + el.width}, ${el.y + el.height});\n    ctx.closePath();\n    ctx.fill();\n`;
                } else if (el.type === 'star') {
                    code += `    ctx.fillStyle = "${el.color}";\n    ctx.beginPath();\n`;
                    el.points.forEach((p, i) => {
                        const x = el.x + p.x * el.scaleX;
                        const y = el.y + p.y * el.scaleY;
                        if (i === 0) code += `    ctx.moveTo(${x}, ${y});\n`;
                        else code += `    ctx.lineTo(${x}, ${y});\n`;
                    });
                    code += `    ctx.closePath();\n    ctx.fill();\n`;
                }
                code += `    ctx.globalAlpha = 1;\n    ctx.filter = "none";\n`;
            });
            code += `    const fs = require('fs');\n    fs.writeFileSync('output.png', canvas.toBuffer('image/png'));\n}\n\ncreateImage();`;
            break;
        // Outras linguagens seguem o mesmo padrão, omitidas por brevidade
    }

    const zip = new JSZip();
    const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'lua' ? 'lua' : lang === 'csharp' ? 'cs' : lang === 'java' ? 'java' : 'php';
    zip.file(`script.${ext}`, code);
    elements.forEach((el, i) => {
        zip.file(`element_${i}_${el.type}.json`, JSON.stringify(el));
    });

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
                    tempCtx.drawImage(canvas.backgroundImage.getElement(), 0, 0, canvas.width, canvas.height);
                }
                tempCtx.globalAlpha = el.opacity;
                if (el.blur > 0) tempCtx.filter = `blur(${el.blur}px)`;
                if (el.type === 'text') {
                    tempCtx.font = `${el.size}px Arial`;
                    tempCtx.fillStyle = el.color;
                    tempCtx.fillText(el.text, el.x + i * 10, el.y);
                } else if (el.type === 'circle') {
                    tempCtx.fillStyle = el.color;
                    tempCtx.beginPath();
                    tempCtx.arc(el.x + el.radius + i * 10, el.y + el.radius, el.radius, 0, Math.PI * 2);
                    tempCtx.fill();
                } else if (el.type === 'rect') {
                    tempCtx.fillStyle = el.color;
                    tempCtx.fillRect(el.x + i * 10, el.y, el.width, el.height);
                } else if (el.type === 'triangle') {
                    tempCtx.fillStyle = el.color;
                    tempCtx.beginPath();
                    tempCtx.moveTo(el.x + el.width / 2 + i * 10, el.y);
                    tempCtx.lineTo(el.x + i * 10, el.y + el.height);
                    tempCtx.lineTo(el.x + el.width + i * 10, el.y + el.height);
                    tempCtx.closePath();
                    tempCtx.fill();
                } else if (el.type === 'star') {
                    tempCtx.fillStyle = el.color;
                    tempCtx.beginPath();
                    el.points.forEach((p, idx) => {
                        const x = el.x + p.x * el.scaleX + i * 10;
                        const y = el.y + p.y * el.scaleY;
                        if (idx === 0) tempCtx.moveTo(x, y);
                        else tempCtx.lineTo(x, y);
                    });
                    tempCtx.closePath();
                    tempCtx.fill();
                }
                tempCtx.globalAlpha = 1;
                tempCtx.filter = 'none';
                gifFrames.push(tempCanvas.toDataURL('image/png'));
            }
        });
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
