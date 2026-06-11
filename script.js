let filtroAtual = 'todos';
let publicacoes = [];

document.addEventListener('DOMContentLoaded', function() {
    carregarPublicacoes();
    configurarPrompt();
    atualizarEstatisticas();
});

function abrirModal() {
    document.getElementById('publicacaoModal').style.display = 'flex';
    document.getElementById('formPublicacao').reset();
    document.getElementById('preview').innerHTML = '';
    document.getElementById('preview').classList.remove('show');
}

function fecharModal() {
    document.getElementById('publicacaoModal').style.display = 'none';
}

function toggleMidiaUpload() {
    const tipo = document.getElementById('tipoMidia').value;
    const midiaUpload = document.getElementById('midiaUpload');
    
    midiaUpload.accept = tipo === 'foto' ? 'image/*' : 'video/*';
    midiaUpload.value = '';
    document.getElementById('preview').innerHTML = '';
    document.getElementById('preview').classList.remove('show');
}

function previewMidia() {
    const file = document.getElementById('midiaUpload').files[0];
    const tipo = document.getElementById('tipoMidia').value;
    const preview = document.getElementById('preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            let html = '<p><strong>Pré-visualização:</strong></p>';
            if (tipo === 'foto') {
                html += `<img src="${e.target.result}" alt="Preview">`;
            } else {
                html += `<video controls src="${e.target.result}"></video>`;
            }
            html += `<span class="info-arquivo">📁 ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)</span>`;
            preview.innerHTML = html;
            preview.classList.add('show');
        }
        reader.readAsDataURL(file);
    }
}


function publicar() {
    const nome = document.getElementById('nome').value.trim();
    const titulo = document.getElementById('titulo').value.trim();
    const categoria = document.getElementById('categoria').value;
    const tipoMidia = document.getElementById('tipoMidia').value;
    const descricao = document.getElementById('descricao').value.trim();
    const tagsInput = document.getElementById('tags').value;
    const midiaFile = document.getElementById('midiaUpload').files[0];

    // Validações
    if (!nome || !titulo || !descricao) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    if (!midiaFile) {
        alert('Por favor, selecione uma foto ou vídeo para compartilhar!');
        return;
    }

    if (tipoMidia === 'foto' && !midiaFile.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem (foto)!');
        return;
    }
    
    if (tipoMidia === 'video' && !midiaFile.type.startsWith('video/')) {
        alert('Por favor, selecione um arquivo de vídeo!');
        return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const reader = new FileReader();
    reader.onload = function(e) {
        const publicacao = {
            id: Date.now(),
            nome: nome,
            titulo: titulo,
            categoria: categoria,
            tipo: tipoMidia,
            descricao: descricao,
            tags: tags,
            midia: e.target.result,
            midiaNome: midiaFile.name,
            midiaTipo: midiaFile.type,
            midiaTamanho: midiaFile.size,
            data: new Date().toLocaleString('pt-BR'),
            likes: 0,
            curtido: false
        };

        salvarPublicacao(publicacao);
        fecharModal();
        
        // Forçar atualização completa
        carregarPublicacoes();
        atualizarEstatisticas();
        
        alert('✅ Publicação compartilhada com sucesso! Obrigado por contribuir com boas práticas!');
    };

    reader.readAsDataURL(midiaFile);
}

function salvarPublicacao(publicacao) {
    publicacoes = JSON.parse(localStorage.getItem('boasPraticas')) || [];
    publicacoes.unshift(publicacao);
    localStorage.setItem('boasPraticas', JSON.stringify(publicacoes));
}

function carregarPublicacoes() {
    publicacoes = JSON.parse(localStorage.getItem('boasPraticas')) || [];
    exibirPublicacoes();
}

function exibirPublicacoes() {
    const container = document.getElementById('publicacoes');
    container.innerHTML = '';

    const publicacoesFiltradas = publicacoes.filter(p => {
        if (filtroAtual === 'todos') return true;
        return p.tipo === filtroAtual;
    });

    if (publicacoesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="sem-publicacoes">
                <i class="fas fa-leaf"></i>
                <h3>Nenhuma publicação ainda</h3>
                <p>Seja o primeiro a compartilhar uma boa prática!</p>
                <button onclick="abrirModal()" class="btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-camera"></i> Compartilhar agora
                </button>
            </div>
        `;
        return;
    }

    publicacoesFiltradas.forEach(p => adicionarPublicacaoTela(p));
}

function adicionarPublicacaoTela(publicacao) {
    const container = document.getElementById('publicacoes');

    const card = document.createElement('div');
    card.className = 'publicacao-card';
    card.dataset.id = publicacao.id;
    card.dataset.tipo = publicacao.tipo;

    const tagsHtml = publicacao.tags && publicacao.tags.length > 0
        ? publicacao.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')
        : '';

    const midiaHtml = publicacao.tipo === 'foto'
        ? `<img src="${publicacao.midia}" alt="${publicacao.titulo}">`
        : `<video controls src="${publicacao.midia}"></video>`;

    card.innerHTML = `
        <div class="publicacao-header">
            <strong>${publicacao.nome}</strong>
            <span class="publicacao-categoria">${publicacao.categoria}</span>
        </div>
        <div class="publicacao-titulo">
            ${publicacao.titulo}
        </div>
        <div class="publicacao-midia">
            ${midiaHtml}
        </div>
        <div class="publicacao-descricao">
            ${publicacao.descricao}
        </div>
        ${tagsHtml ? `<div class="publicacao-tags">${tagsHtml}</div>` : ''}
        <div class="publicacao-footer">
            <span class="publicacao-data">
                <i class="far fa-calendar-alt"></i> ${publicacao.data}
            </span>
            <button class="btn-like ${publicacao.curtido ? 'curtido' : ''}" onclick="curtirPublicacao(this, ${publicacao.id})">
                <i class="fas fa-heart"></i> ${publicacao.likes}
            </button>
        </div>
    `;

    container.appendChild(card);
}

function curtirPublicacao(botao, id) {
    const publicacao = publicacoes.find(p => p.id === id);
    if (publicacao) {
        if (!publicacao.curtido) {
            publicacao.likes++;
            publicacao.curtido = true;
            botao.classList.add('curtido');
        } else {
            publicacao.likes--;
            publicacao.curtido = false;
            botao.classList.remove('curtido');
        }
        botao.innerHTML = `<i class="fas fa-heart"></i> ${publicacao.likes}`;
        localStorage.setItem('boasPraticas', JSON.stringify(publicacoes));
    }
}

function filtrarPublicacoes(tipo, elemento) {
    filtroAtual = tipo;
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('ativo');
    });
    elemento.classList.add('ativo');
    
    exibirPublicacoes();
}

function atualizarEstatisticas() {
    publicacoes = JSON.parse(localStorage.getItem('boasPraticas')) || [];
    
    const totalFotos = publicacoes.filter(p => p.tipo === 'foto').length;
    const totalVideos = publicacoes.filter(p => p.tipo === 'video').length;
    
    document.getElementById('total-publicacoes').textContent = publicacoes.length;
    document.getElementById('total-fotos').textContent = totalFotos;
    document.getElementById('total-videos').textContent = totalVideos;
    
    // Debug para verificar
    console.log('Estatísticas atualizadas:', {
        total: publicacoes.length,
        fotos: totalFotos,
        videos: totalVideos,
        publicacoes: publicacoes.map(p => ({ tipo: p.tipo, titulo: p.titulo }))
    });
}

function limparTodasPublicacoes() {
    if (confirm('⚠️ Tem certeza que deseja remover TODAS as publicações? Essa ação não pode ser desfeita!')) {
        localStorage.removeItem('boasPraticas');
        publicacoes = [];
        exibirPublicacoes();
        atualizarEstatisticas();
    }
}

function configurarPrompt() {
    const input = document.getElementById('inputComando');
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processarComando(this.value);
            this.value = '';
        }
    });

    input.addEventListener('focus', () => {
        document.querySelector('.comando-ajuda').style.opacity = '1';
    });
    
    input.addEventListener('blur', () => {
        document.querySelector('.comando-ajuda').style.opacity = '0.7';
    });
}

function processarComando(comando) {
    comando = comando.toLowerCase().trim();
    
    const comandos = {
        '/ajuda': () => {
            alert(`📋 COMANDOS DISPONÍVEIS:
                
/ajuda - Mostrar esta ajuda
/novo - Abrir formulário para nova publicação
/fotos - Filtrar apenas fotos
/videos - Filtrar apenas vídeos
/todos - Mostrar todas as publicações
/stats - Mostrar estatísticas
/limpar - Remover TODAS as publicações (cuidado!)

🌱 Compartilhe suas práticas sustentáveis!`);
        },
        '/novo': () => abrirModal(),
        '/fotos': () => {
            filtroAtual = 'foto';
            document.querySelectorAll('.filtro-btn')[1].click();
        },
        '/videos': () => {
            filtroAtual = 'video';
            document.querySelectorAll('.filtro-btn')[2].click();
        },
        '/todos': () => {
            filtroAtual = 'todos';
            document.querySelectorAll('.filtro-btn')[0].click();
        },
        '/stats': () => {
            atualizarEstatisticas();
            alert(`📊 ESTATÍSTICAS ATUAIS:
                
Total de publicações: ${publicacoes.length}
📸 Fotos: ${publicacoes.filter(p => p.tipo === 'foto').length}
🎥 Vídeos: ${publicacoes.filter(p => p.tipo === 'video').length}`);
        },
        '/limpar': () => limparTodasPublicacoes()
    };

    if (comandos[comando]) {
        comandos[comando]();
    } else if (comando) {
        alert(`❌ Comando não reconhecido: "${comando}"
            
Digite /ajuda para ver a lista de comandos disponíveis.`);
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('publicacaoModal');
    if (event.target === modal) {
        fecharModal();
    }
}

// ===== FUNÇÕES ADICIONADAS PARA A SEÇÃO DE CONTATO =====
function copiarTexto(texto, tipo) {
    // Tenta usar a API moderna
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(() => {
            alert(`📋 ${tipo} copiado com sucesso!`);
        }).catch(() => {
            fallbackCopiar(texto, tipo);
        });
    } else {
        fallbackCopiar(texto, tipo);
    }
}

function fallbackCopiar(texto, tipo) {
    // Método alternativo para navegadores mais restritos
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert(`📋 ${tipo} copiado!`);
    } catch (err) {
        alert('❌ Não foi possível copiar. Por favor, copie manualmente.');
    }
    document.body.removeChild(textarea);
}
