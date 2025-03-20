document.addEventListener('DOMContentLoaded', () => {
    if (!window.fabric) {
        console.error('Fabric.js não foi carregado corretamente.');
        return;
    }

    // Configuração inicial do Canvas
    const canvas = new fabric.Canvas('canvas', {
        width: 800,
        height: 600,
        backgroundColor: '#333',
        preserveObjectStacking: true,
        selection: true,
        fireRightClick: true,
        hoverCursor: 'pointer',
        moveCursor: 'grab',
        stateful: true,
    });

    // Variáveis globais
    let selectedObject = null;
    let history = [];
    let historyIndex = -1;
    let images = []; // { fileName, object, isBackground, layer }
    let layers = []; // Gerenciamento de camadas
    let animationTimeline = []; // { object, keyframes: [{ frame, props }] }
    let currentFrame = 0;
    let isPlaying = false;
    let zoomLevel = 1;

    // Funções de utilidade
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    // Salvar estado no histórico
    const saveState = () => {
        history = history.slice(0, historyIndex + 1);
        const state = canvas.toJSON(['animationFrames', 'opacity', 'filters', 'rotation', 'skewX', 'skewY', 'strokeWidth', 'stroke', 'layer', 'keyframes']);
        state.images = images.map(img => ({ fileName: img.fileName, isBackground: img.isBackground, layer: img.layer }));
        state.timeline = animationTimeline;
        history.push(state);
        historyIndex++;
        updateLayersPanel();
    };

    // Desfazer e refazer
    const undo = () => {
        if (historyIndex > 0) {
            historyIndex--;
            loadState(history[historyIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            loadState(history[historyIndex]);
        }
    };

    const loadState = (state) => {
        canvas.loadFromJSON(state, () => {
            canvas.renderAll();
            images = [];
            state.images.forEach(img => {
                const obj = canvas.getObjects().find(o => o.layer === img.layer) || canvas.backgroundImage;
                images.push({ fileName: img.fileName, object: obj, isBackground: img.isBackground, layer: img.layer });
            });
            animationTimeline = state.timeline || [];
            updateLayersPanel();
            updateTimeline();
        });
    };

    // Carregar imagem
    const loadImage = (file, asBackground = false, layerIndex = null) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                const maxCanvasWidth = 2000;
                let scaleFactor = img.width > maxCanvasWidth ? maxCanvasWidth / img.width : 1;

                img.set({
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                    left: asBackground ? 0 : canvas.width / 2 - (img.width * scaleFactor) / 2,
                    top: asBackground ? 0 : canvas.height / 2 - (img.height * scaleFactor) / 2,
                    selectable: !asBackground,
                    layer: layerIndex !== null ? layerIndex : asBackground ? -1 : layers.length,
                });

                if (asBackground) {
                    canvas.setWidth(img.width * scaleFactor);
                    canvas.setHeight(img.height * scaleFactor);
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                        scaleX: scaleFactor,
                        scaleY: scaleFactor,
                        left: 0,
                        top: 0,
                    });
                    images.push({ fileName: file.name, object: img, isBackground: true, layer: -1 });
                } else {
                    canvas.add(img);
                    images.push({ fileName: file.name, object: img, isBackground: false, layer: img.layer });
                    layers.push(img);
                    canvas.setActiveObject(img);
                    selectedObject = img;
                    updateProperties();
                }
                saveState();
            }, { crossOrigin: 'anonymous' });
        };
        reader.readAsDataURL(file);
    };

    // Adicionar eventos
    const addEvent = (id, event, callback) => {
        const element = document.getElementById(id);
        if (element) element.addEventListener(event, callback);
        else console.warn(`Elemento com ID "${id}" não encontrado.`);
    };

    // Ferramentas de criação
    const addShape = (type, props) => {
        const shape = type === 'circle' ? new fabric.Circle(props) :
                     type === 'rect' ? new fabric.Rect(props) :
                     type === 'triangle' ? new fabric.Triangle(props) :
                     type === 'polygon' ? new fabric.Polygon(props.points, props) :
                     type === 'line' ? new fabric.Line(props.points, props) :
                     new fabric.IText('Novo Texto', props);
        shape.layer = layers.length;
        canvas.add(shape);
        layers.push(shape);
        canvas.setActiveObject(shape);
        selectedObject = shape;
        updateProperties();
        saveState();
    };

    addEvent('addText', 'click', () => addShape('text', {
        left: 100, top: 100, fontSize: 24, fill: '#ffffff', opacity: 1, fontFamily: 'Arial', textAlign: 'left'
    }));

    addEvent('addCircle', 'click', () => addShape('circle', {
        radius: 50, left: 150, top: 150, fill: '#ff0000', opacity: 1, stroke: '#000000', strokeWidth: 0
    }));

    addEvent('addRect', 'click', () => addShape('rect', {
        width: 100, height: 100, left: 150, top: 150, fill: '#00ff00', opacity: 1, stroke: '#000000', strokeWidth: 0
    }));

    addEvent('addTriangle', 'click', () => addShape('triangle', {
        width: 100, height: 100, left: 150, top: 150, fill: '#0000ff', opacity: 1, stroke: '#000000', strokeWidth: 0
    }));

    addEvent('addStar', 'click', () => addShape('polygon', {
        points: [{ x: 0, y: -50 }, { x: 14, y: -15 }, { x: 47, y: -15 }, { x: 23, y: 10 }, { x: 29, y: 45 },
                 { x: 0, y: 25 }, { x: -29, y: 45 }, { x: -23, y: 10 }, { x: -47, y: -15 }, { x: -14, y: -15 }],
        left: 150, top: 150, fill: '#ffff00', opacity: 1, stroke: '#000000', strokeWidth: 0, scaleX: 1, scaleY: 1
    }));

    addEvent('addLine', 'click', () => addShape('line', {
        points: [50, 100, 200, 100], left: 150, top: 150, stroke: '#ffffff', strokeWidth: 2, opacity: 1
    }));

    // Upload e Drag-and-Drop
    addEvent('uploadImage', 'click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => Array.from(e.target.files).forEach(file => loadImage(file, true));
        input.click();
    });

    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasContainer.style.borderColor = '#fff';
        });
        canvasContainer.addEventListener('dragleave', () => {
            canvasContainer.style.borderColor = '#4b5563';
        });
        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.style.borderColor = '#4b5563';
            Array.from(e.dataTransfer.files).forEach(file => {
                if (file.type.startsWith('image/')) loadImage(file, false);
            });
        });
    }

    // Carregar templates
    addEvent('loadTemplate', 'change', (e) => {
        const template = e.target.value;
        if (!template) return;
        fetch(`./assets/templates/${template}.json`)
            .then(response => response.json())
            .then(data => {
                canvas.clear();
                images = [];
                layers = [];
                animationTimeline = [];
                canvas.loadFromJSON(data, () => {
                    canvas.renderAll();
                    data.objects.forEach((obj, i) => {
                        if (obj.type === 'image') {
                            const imgObj = canvas.item(i);
                            images.push({ fileName: obj.src.split('/').pop(), object: imgObj, isBackground: false, layer: obj.layer || i });
                            layers.push(imgObj);
                        } else {
                            layers.push(canvas.item(i));
                        }
                    });
                    saveState();
                });
            })
            .catch(err => console.error('Erro ao carregar template:', err));
    });

    // Eventos do Canvas
    canvas.on({
        'selection:created': (e) => { selectedObject = e.target; updateProperties(); },
        'selection:updated': (e) => { selectedObject = e.target; updateProperties(); },
        'selection:cleared': () => { selectedObject = null; updateProperties(); },
        'mouse:dblclick': (e) => {
            const target = e.target;
            if (target && (target.type === 'text' || target.type === 'i-text')) {
                if (target.type === 'text') {
                    const iText = new fabric.IText(target.text, target.toObject());
                    canvas.remove(target);
                    canvas.add(iText);
                    layers[target.layer] = iText;
                    selectedObject = iText;
                    iText.enterEditing();
                    iText.selectAll();
                } else {
                    target.enterEditing();
                    target.selectAll();
                }
                canvas.renderAll();
                saveState();
            }
        },
        'text:editing:exited': () => { if (selectedObject) updateProperties(); saveState(); },
        'object:modified': saveState,
        'mouse:wheel': (opt) => {
            const delta = opt.e.deltaY;
            zoomLevel = clamp(zoomLevel + (delta > 0 ? -0.1 : 0.1), 0.1, 5);
            canvas.setZoom(zoomLevel);
            canvas.renderAll();
            opt.e.preventDefault();
            opt.e.stopPropagation();
        }
    });

    // Gerenciamento de propriedades
    const updateProperties = () => {
        if (!selectedObject) {
            document.querySelectorAll('#properties input, #properties select').forEach(el => el.value = '');
            return;
        }
        const props = {
            textInput: selectedObject.text || '',
            fontSize: selectedObject.fontSize || 24,
            fontFamily: selectedObject.fontFamily || 'Arial',
            width: Math.round(selectedObject.width * (selectedObject.scaleX || 1)) || 100,
            height: Math.round(selectedObject.height * (selectedObject.scaleY || 1)) || 100,
            color: selectedObject.fill || '#ffffff',
            opacity: Math.round((selectedObject.opacity || 1) * 100),
            blur: selectedObject.filters?.find(f => f instanceof fabric.Image.filters.Blur)?.blur || 0,
            brightness: selectedObject.filters?.find(f => f instanceof fabric.Image.filters.Brightness)?.value || 0,
            contrast: selectedObject.filters?.find(f => f instanceof fabric.Image.filters.Contrast)?.contrast || 0,
            animationFrames: selectedObject.animationFrames || 1,
            rotation: selectedObject.angle || 0,
            skewX: selectedObject.skewX || 0,
            skewY: selectedObject.skewY || 0,
            strokeWidth: selectedObject.strokeWidth || 0,
            strokeColor: selectedObject.stroke || '#000000',
            shadowOffsetX: selectedObject.shadow?.offsetX || 0,
            shadowOffsetY: selectedObject.shadow?.offsetY || 0,
            shadowBlur: selectedObject.shadow?.blur || 0,
            shadowColor: selectedObject.shadow?.color || '#000000',
        };
        Object.entries(props).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        });
    };

    const applyProperty = (id, prop, parse, extra = () => {}) => {
        addEvent(id, 'input', (e) => {
            if (!selectedObject) return;
            const value = parse(e.target.value, selectedObject);
            if (prop === 'filters') {
                selectedObject.filters = selectedObject.filters || [];
                const filterType = id === 'blur' ? fabric.Image.filters.Blur :
                                  id === 'brightness' ? fabric.Image.filters.Brightness :
                                  fabric.Image.filters.Contrast;
                selectedObject.filters = selectedObject.filters.filter(f => !(f instanceof filterType));
                if (value) selectedObject.filters.push(new filterType(id === 'blur' ? { blur: value } : { [id]: value }));
                selectedObject.applyFilters();
            } else if (prop === 'shadow') {
                selectedObject.set('shadow', new fabric.Shadow({
                    color: document.getElementById('shadowColor')?.value || '#000000',
                    offsetX: parseInt(document.getElementById('shadowOffsetX')?.value || 0),
                    offsetY: parseInt(document.getElementById('shadowOffsetY')?.value || 0),
                    blur: parseInt(document.getElementById('shadowBlur')?.value || 0),
                }));
            } else {
                selectedObject.set(prop, value);
                extra();
            }
            canvas.renderAll();
            saveState();
        });
    };

    const propertyEvents = [
        { id: 'textInput', prop: 'text', parse: v => v },
        { id: 'fontSize', prop: 'fontSize', parse: parseInt },
        { id: 'fontFamily', prop: 'fontFamily', parse: v => v },
        { id: 'width', prop: 'scaleX', parse: (v, obj) => document.getElementById('lockAspect')?.checked ? v / obj.width : v / obj.width, extra: () => {
            if (document.getElementById('lockAspect')?.checked) {
                selectedObject.scaleY = selectedObject.scaleX;
                document.getElementById('height').value = Math.round(selectedObject.height * selectedObject.scaleY);
            }
        }},
        { id: 'height', prop: 'scaleY', parse: (v, obj) => document.getElementById('lockAspect')?.checked ? v / obj.height : v / obj.height, extra: () => {
            if (document.getElementById('lockAspect')?.checked) {
                selectedObject.scaleX = selectedObject.scaleY;
                document.getElementById('width').value = Math.round(selectedObject.width * selectedObject.scaleX);
            }
        }},
        { id: 'color', prop: 'fill', parse: v => v },
        { id: 'opacity', prop: 'opacity', parse: v => parseInt(v) / 100 },
        { id: 'blur', prop: 'filters', parse: parseFloat },
        { id: 'brightness', prop: 'filters', parse: parseFloat },
        { id: 'contrast', prop: 'filters', parse: parseFloat },
        { id: 'animationFrames', prop: 'animationFrames', parse: parseInt },
        { id: 'rotation', prop: 'angle', parse: parseFloat },
        { id: 'skewX', prop: 'skewX', parse: parseFloat },
        { id: 'skewY', prop: 'skewY', parse: parseFloat },
        { id: 'strokeWidth', prop: 'strokeWidth', parse: parseInt, extra: () => selectedObject.set('stroke', document.getElementById('strokeColor')?.value || '#000000') },
        { id: 'strokeColor', prop: 'stroke', parse: v => v },
        { id: 'shadowOffsetX', prop: 'shadow', parse: parseInt },
        { id: 'shadowOffsetY', prop: 'shadow', parse: parseInt },
        { id: 'shadowBlur', prop: 'shadow', parse: parseInt },
        { id: 'shadowColor', prop: 'shadow', parse: v => v },
    ];
    propertyEvents.forEach(p => applyProperty(p.id, p.prop, p.parse, p.extra));

    // Gerenciamento de camadas
    const updateLayersPanel = () => {
        const layersPanel = document.getElementById('layersPanel');
        if (!layersPanel) return;
        layersPanel.innerHTML = '<h3>Camadas</h3>';
        layers.forEach((layer, index) => {
            const div = document.createElement('div');
            div.className = 'layer-item';
            div.innerHTML = `
                <span>${layer.type} (${index})</span>
                <button class="move-up" data-index="${index}">↑</button>
                <button class="move-down" data-index="${index}">↓</button>
                <button class="toggle-visibility" data-index="${index}">${layer.visible ? '👁️' : '👁️‍🗨️'}</button>
                <button class="delete-layer" data-index="${index}">🗑️</button>
            `;
            layersPanel.appendChild(div);
        });

        document.querySelectorAll('.move-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (index > 0) {
                    [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
                    layers[index].layer = index;
                    layers[index - 1].layer = index - 1;
                    canvas.moveTo(layers[index], index);
                    canvas.moveTo(layers[index - 1], index - 1);
                    saveState();
                }
            });
        });

        document.querySelectorAll('.move-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (index < layers.length - 1) {
                    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
                    layers[index].layer = index;
                    layers[index + 1].layer = index + 1;
                    canvas.moveTo(layers[index], index);
                    canvas.moveTo(layers[index + 1], index + 1);
                    saveState();
                }
            });
        });

        document.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                layers[index].visible = !layers[index].visible;
                btn.textContent = layers[index].visible ? '👁️' : '👁️‍🗨️';
                canvas.renderAll();
                saveState();
            });
        });

        document.querySelectorAll('.delete-layer').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                canvas.remove(layers[index]);
                images = images.filter(img => img.object !== layers[index]);
                layers.splice(index, 1);
                layers.forEach((l, i) => l.layer = i);
                saveState();
            });
        });
    };

    // Animação e Timeline
    const updateTimeline = () => {
        const timeline = document.getElementById('animationTimeline');
        if (!timeline) return;
        timeline.innerHTML = '<h3>Timeline</h3>';
        const maxFrames = Math.max(...layers.map(l => l.animationFrames || 1), 1);
        const frameDiv = document.createElement('div');
        frameDiv.className = 'timeline-frames';
        for (let i = 0; i < maxFrames; i++) {
            const frameBtn = document.createElement('button');
            frameBtn.textContent = i;
            frameBtn.className = i === currentFrame ? 'active' : '';
            frameBtn.addEventListener('click', () => {
                currentFrame = i;
                updateAnimationFrame();
                updateTimeline();
            });
            frameDiv.appendChild(frameBtn);
        }
        timeline.appendChild(frameDiv);

        layers.forEach((layer, index) => {
            const track = document.createElement('div');
            track.className = 'timeline-track';
            track.innerHTML = `<span>${layer.type} (${index})</span>`;
            for (let i = 0; i < (layer.animationFrames || 1); i++) {
                const keyframe = document.createElement('span');
                keyframe.className = 'keyframe';
                keyframe.dataset.layer = index;
                keyframe.dataset.frame = i;
                keyframe.addEventListener('click', () => addKeyframe(layer, i));
                track.appendChild(keyframe);
            }
            timeline.appendChild(track);
        });
    };

    const addKeyframe = (obj, frame) => {
        let anim = animationTimeline.find(a => a.object === obj);
        if (!anim) {
            anim = { object: obj, keyframes: [] };
            animationTimeline.push(anim);
        }
        anim.keyframes.push({
            frame,
            props: {
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
                opacity: obj.opacity,
            }
        });
        updateTimeline();
        saveState();
    };

    const updateAnimationFrame = () => {
        animationTimeline.forEach(anim => {
            const keyframes = anim.keyframes.filter(k => k.frame <= currentFrame).sort((a, b) => b.frame - a.frame);
            if (keyframes.length) {
                const { props } = keyframes[0];
                anim.object.set(props);
            }
        });
        canvas.renderAll();
    };

    const playAnimation = () => {
        if (isPlaying) return;
        isPlaying = true;
        const maxFrames = Math.max(...layers.map(l => l.animationFrames || 1), 1);
        const animate = () => {
            if (!isPlaying) return;
            currentFrame = (currentFrame + 1) % maxFrames;
            updateAnimationFrame();
            updateTimeline();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    };

    addEvent('playAnimation', 'click', () => playAnimation());
    addEvent('stopAnimation', 'click', () => isPlaying = false);
    addEvent('addKeyframe', 'click', () => {
        if (selectedObject) addKeyframe(selectedObject, currentFrame);
    });

    // Ferramentas de manipulação
    addEvent('centerElement', 'click', () => {
        if (selectedObject) {
            selectedObject.center();
            canvas.renderAll();
            saveState();
        }
    });

    addEvent('alignElements', 'click', () => {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length < 2) return alert('Selecione pelo menos dois elementos.');
        const reference = activeObjects[0];
        activeObjects.slice(1).forEach(obj => obj.set({ left: reference.left, top: reference.top }));
        canvas.renderAll();
        saveState();
    });

    addEvent('duplicateElement', 'click', () => {
        if (selectedObject) {
            selectedObject.clone((cloned) => {
                cloned.set({ left: selectedObject.left + 20, top: selectedObject.top + 20, layer: layers.length });
                canvas.add(cloned);
                layers.push(cloned);
                if (cloned.type === 'image') {
                    const imgData = images.find(img => img.object === selectedObject);
                    if (imgData) images.push({ fileName: imgData.fileName, object: cloned, isBackground: false, layer: cloned.layer });
                }
                canvas.setActiveObject(cloned);
                selectedObject = cloned;
                updateProperties();
                saveState();
            });
        }
    });

    addEvent('groupElements', 'click', () => {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 1) {
            const group = new fabric.Group(activeObjects, { layer: layers.length });
            canvas.discardActiveObject();
            activeObjects.forEach(obj => {
                canvas.remove(obj);
                layers.splice(layers.indexOf(obj), 1);
            });
            canvas.add(group);
            layers.push(group);
            canvas.setActiveObject(group);
            selectedObject = group;
            updateProperties();
            saveState();
        }
    });

    addEvent('ungroupElements', 'click', () => {
        if (selectedObject && selectedObject.type === 'group') {
            const items = selectedObject.getObjects();
            selectedObject.toActiveSelection();
            canvas.discardActiveObject();
            items.forEach(item => {
                item.layer = layers.length;
                canvas.add(item);
                layers.push(item);
            });
            canvas.requestRenderAll();
            saveState();
        }
    });

    // Zoom e Pan
    addEvent('zoomIn', 'click', () => {
        zoomLevel = clamp(zoomLevel + 0.1, 0.1, 5);
        canvas.setZoom(zoomLevel);
        canvas.renderAll();
    });

    addEvent('zoomOut', 'click', () => {
        zoomLevel = clamp(zoomLevel - 0.1, 0.1, 5);
        canvas.setZoom(zoomLevel);
        canvas.renderAll();
    });

    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;
    canvas.on('mouse:down', (opt) => {
        if (opt.e.altKey) {
            isPanning = true;
            lastPosX = opt.e.clientX;
            lastPosY = opt.e.clientY;
            canvas.setCursor('grabbing');
        }
    });
    canvas.on('mouse:move', (opt) => {
        if (isPanning) {
            const deltaX = opt.e.clientX - lastPosX;
            const deltaY = opt.e.clientY - lastPosY;
            canvas.relativePan({ x: deltaX, y: deltaY });
            lastPosX = opt.e.clientX;
            lastPosY = opt.e.clientY;
        }
    });
    canvas.on('mouse:up', () => {
        isPanning = false;
        canvas.setCursor('default');
    });

    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && selectedObject) {
            canvas.remove(selectedObject);
            images = images.filter(img => img.object !== selectedObject);
            layers.splice(layers.indexOf(selectedObject), 1);
            layers.forEach((l, i) => l.layer = i);
            selectedObject = null;
            canvas.renderAll();
            saveState();
        } else if (e.ctrlKey && e.key === 'z') undo();
        else if (e.ctrlKey && e.key === 'y') redo();
        else if (e.ctrlKey && e.key === 'c' && selectedObject) selectedObject.clone(cloned => window.copiedObject = cloned);
        else if (e.ctrlKey && e.key === 'v' && window.copiedObject) {
            window.copiedObject.clone(cloned => {
                cloned.set({ left: cloned.left + 20, top: cloned.top + 20, layer: layers.length });
                canvas.add(cloned);
                layers.push(cloned);
                if (cloned.type === 'image') {
                    const imgData = images.find(img => img.object === window.copiedObject);
                    if (imgData) images.push({ fileName: imgData.fileName, object: cloned, isBackground: false, layer: cloned.layer });
                }
                canvas.setActiveObject(cloned);
                selectedObject = cloned;
                updateProperties();
                saveState();
            });
        }
    });

    // Salvar e carregar projeto
    addEvent('saveProject', 'click', () => {
        const project = canvas.toJSON(['animationFrames', 'opacity', 'filters', 'rotation', 'skewX', 'skewY', 'strokeWidth', 'stroke', 'layer', 'keyframes']);
        project.images = images.map(img => ({ fileName: img.fileName, isBackground: img.isBackground, layer: img.layer }));
        project.timeline = animationTimeline;
    
        if (navigator.onLine) {
            const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project.json';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            navigator.serviceWorker.controller.postMessage({
                type: 'SAVE_OFFLINE_PROJECT',
                project,
            });
            alert('Projeto salvo offline. Será sincronizado quando a conexão retornar.');
        }
    });

    addEvent('loadProject', 'click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = JSON.parse(event.target.result);
                loadState(data);
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Exportação avançada
    addEvent('exportCode', 'click', async () => {
        if (!window.JSZip || !window.saveAs) {
            console.error('JSZip ou FileSaver.js não estão carregados.');
            return;
        }

        const lang = document.getElementById('exportLang')?.value;
        const objects = canvas.getObjects();
        const zip = new JSZip();
        let code = '';

        const maxWidth = Math.max(canvas.width, ...objects.map(obj => obj.left + (obj.width * (obj.scaleX || 1))));
        const maxHeight = Math.max(canvas.height, ...objects.map(obj => obj.top + (obj.height * (obj.scaleY || 1))));
        const hasAnimation = animationTimeline.length > 0;

        const exportImage = (img, index, isBackground) => {
            const obj = img.object;
            const width = Math.round(obj.width * (obj.scaleX || 1));
            const height = Math.round(obj.height * (obj.scaleY || 1));
            const opacity = obj.opacity || 1;
            let imgCode = '';
            if (lang === 'python') {
                imgCode += `    # ${isBackground ? 'Fundo' : 'Imagem'} ${index}: ${img.fileName}\n`;
                imgCode += `    img_${index} = Image.open("${img.fileName}").convert("RGBA")\n`;
                imgCode += `    img_${index} = img_${index}.resize((${width}, ${height}))\n`;
                if (opacity < 1) {
                    imgCode += `    alpha_${index} = img_${index}.split()[3]\n`;
                    imgCode += `    alpha_${index} = alpha_${index}.point(lambda p: int(p * ${opacity}))\n`;
                    imgCode += `    img_${index}.putalpha(alpha_${index})\n`;
                }
                imgCode += `    img.paste(img_${index}, (${Math.round(obj.left)}, ${Math.round(obj.top)}), img_${index})\n\n`;
            } else if (lang === 'javascript') {
                imgCode += `    // ${isBackground ? 'Fundo' : 'Imagem'} ${index}: ${img.fileName}\n`;
                imgCode += `    const img_${index} = await loadImage("${img.fileName}");\n`;
                imgCode += `    ctx.globalAlpha = ${opacity};\n`;
                imgCode += `    ctx.drawImage(img_${index}, ${Math.round(obj.left)}, ${Math.round(obj.top)}, ${width}, ${height});\n\n`;
            }
            return imgCode;
        };

        const exportShape = (obj, index) => {
            const alpha = Math.round((obj.opacity || 1) * 255).toString(16).padStart(2, '0');
            const fill = `${obj.fill || '#000000'}${alpha}`;
            const stroke = obj.stroke ? `${obj.stroke}${alpha}` : null;
            let shapeCode = `    # ${obj.type} ${index}\n`;
            if (lang === 'python') {
                if (obj.type === 'text' || obj.type === 'i-text') {
                    shapeCode += `    font_${index} = ImageFont.truetype("${obj.fontFamily || 'arial.ttf'}", ${obj.fontSize})\n`;
                    shapeCode += `    draw.text((${Math.round(obj.left)}, ${Math.round(obj.top)}), "${obj.text}", fill="${fill}", font=font_${index})\n`;
                } else if (obj.type === 'circle') {
                    const radius = Math.round(obj.radius * (obj.scaleX || 1));
                    shapeCode += `    draw.ellipse((${Math.round(obj.left)}, ${Math.round(obj.top)}, ${Math.round(obj.left + radius * 2)}, ${Math.round(obj.top + radius * 2)}), fill="${fill}", outline="${stroke}", width=${obj.strokeWidth || 0})\n`;
                } else if (obj.type === 'rect') {
                    const width = Math.round(obj.width * (obj.scaleX || 1));
                    const height = Math.round(obj.height * (obj.scaleY || 1));
                    shapeCode += `    draw.rectangle((${Math.round(obj.left)}, ${Math.round(obj.top)}, ${Math.round(obj.left + width)}, ${Math.round(obj.top + height)}), fill="${fill}", outline="${stroke}", width=${obj.strokeWidth || 0})\n`;
                } else if (obj.type === 'triangle') {
                    const width = Math.round(obj.width * (obj.scaleX || 1));
                    const height = Math.round(obj.height * (obj.scaleY || 1));
                    shapeCode += `    draw.polygon([(${Math.round(obj.left + width / 2)}, ${Math.round(obj.top)}), (${Math.round(obj.left)}, ${Math.round(obj.top + height)}), (${Math.round(obj.left + width)}, ${Math.round(obj.top + height)})], fill="${fill}", outline="${stroke}", width=${obj.strokeWidth || 0})\n`;
                } else if (obj.type === 'polygon') {
                    const points = obj.points.map(p => `(${Math.round(obj.left + p.x * (obj.scaleX || 1))}, ${Math.round(obj.top + p.y * (obj.scaleY || 1))})`).join(', ');
                    shapeCode += `    draw.polygon([${points}], fill="${fill}", outline="${stroke}", width=${obj.strokeWidth || 0})\n`;
                } else if (obj.type === 'line') {
                    shapeCode += `    draw.line((${Math.round(obj.x1)}, ${Math.round(obj.y1)}, ${Math.round(obj.x2)}, ${Math.round(obj.y2)}), fill="${stroke}", width=${obj.strokeWidth || 2})\n`;
                }
                if (obj.filters?.length) {
                    obj.filters.forEach(f => {
                        if (f.blur) shapeCode += `    img = img.filter(ImageFilter.GaussianBlur(radius=${f.blur}))\n`;
                        // Adicionar outros filtros conforme necessário
                    });
                }
            }
            return shapeCode;
        };

        switch (lang) {
            case 'python':
                if (hasAnimation) {
                    code = 'from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageSequence\nimport math\n\n';
                    code += 'def create_gif():\n';
                    code += `    frames = []\n`;
                    code += `    base_img = Image.new("RGBA", (${Math.ceil(maxWidth)}, ${Math.ceil(maxHeight)}), (0, 0, 0, 0))\n`;
                    code += '    draw = ImageDraw.Draw(base_img)\n\n';

                    images.filter(img => img.isBackground).forEach((img, i) => code += exportImage(img, i, true));
                    images.filter(img => !img.isBackground).forEach((img, i) => code += exportImage(img, i, false));

                    const maxFrames = Math.max(...layers.map(l => l.animationFrames || 1), 1);
                    animationTimeline.forEach((anim, i) => {
                        const keyframes = anim.keyframes.sort((a, b) => a.frame - b.frame);
                        for (let frame = 0; frame < maxFrames; frame++) {
                            code += `    frame_${i}_${frame} = base_img.copy()\n`;
                            code += `    draw_${i}_${frame} = ImageDraw.Draw(frame_${i}_${frame})\n`;
                            const kfBefore = keyframes.filter(k => k.frame <= frame).pop();
                            const kfAfter = keyframes.find(k => k.frame > frame);
                            let props = kfBefore ? { ...kfBefore.props } : anim.object.toObject();
                            if (kfBefore && kfAfter) {
                                const t = (frame - kfBefore.frame) / (kfAfter.frame - kfBefore.frame);
                                props.left = kfBefore.props.left + (kfAfter.props.left - kfBefore.props.left) * t;
                                props.top = kfBefore.props.top + (kfAfter.props.top - kfBefore.props.top) * t;
                                props.scaleX = kfBefore.props.scaleX + (kfAfter.props.scaleX - kfBefore.props.scaleX) * t;
                                props.scaleY = kfBefore.props.scaleY + (kfAfter.props.scaleY - kfBefore.props.scaleY) * t;
                                props.angle = kfBefore.props.angle + (kfAfter.props.angle - kfBefore.props.angle) * t;
                                props.opacity = kfBefore.props.opacity + (kfAfter.props.opacity - kfBefore.props.opacity) * t;
                            }
                            anim.object.set(props);
                            code += exportShape(anim.object, `${i}_${frame}`);
                            code += `    frames.append(frame_${i}_${frame})\n`;
                        }
                    });

                    objects.filter(obj => !animationTimeline.some(a => a.object === obj)).forEach((obj, i) => {
                        code += exportShape(obj, i);
                    });

                    code += `    frames[0].save("output.gif", save_all=True, append_images=frames[1:], duration=100, loop=0)\n\n`;
                    code += 'if __name__ == "__main__":\n    create_gif()\n';
                    zip.file('script_gif.py', code);
                } else {
                    code = 'from PIL import Image, ImageDraw, ImageFont, ImageFilter\n\n';
                    code += 'def create_image():\n';
                    code += `    img = Image.new("RGBA", (${Math.ceil(maxWidth)}, ${Math.ceil(maxHeight)}), (0, 0, 0, 0))\n`;
                    code += '    draw = ImageDraw.Draw(img)\n\n';

                    images.filter(img => img.isBackground).forEach((img, i) => code += exportImage(img, i, true));
                    images.filter(img => !img.isBackground).forEach((img, i) => code += exportImage(img, i, false));
                    objects.forEach((obj, i) => code += exportShape(obj, i));

                    code += '    img.save("output.png")\n\n';
                    code += 'if __name__ == "__main__":\n    create_image()\n';
                    zip.file('script.py', code);
                }
                images.forEach(img => {
                    const imgData = img.object.toDataURL({ format: 'png' });
                    zip.file(img.fileName, imgData.split(',')[1], { base64: true });
                });
                break;

            case 'javascript':
                // Implementação semelhante para JavaScript com animação (necessita de canvas e bibliotecas adicionais)
                break;
        }

        zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, `image_project_${hasAnimation ? 'gif' : 'static'}.zip`));
    });

    // Toggle Sidebar e outros controles
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            toggleBtn.querySelector('i')?.classList.toggle('fa-chevron-left');
            toggleBtn.querySelector('i')?.classList.toggle('fa-chevron-right');
        });
    }

    // Inicialização
    updateLayersPanel();
    updateTimeline();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('Service Worker registrado'))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    }
});