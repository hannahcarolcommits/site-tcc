// Relógio e Sistema de Logs
function updateClock() {
    const clock = document.getElementById('clock');
    if(clock) clock.textContent = new Date().toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);

function getCurrentTime() {
    return new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
}

function addLog(message) {
    const logContainer = document.getElementById('event-logs');
    if(!logContainer) return;
    const li = document.createElement('li');
    li.innerHTML = `<em>${getCurrentTime()}</em> - ${message}`;
    logContainer.prepend(li); // Adiciona sempre no topo
}

// 1. SIMULAÇÃO DE ANÁLISE DE ROTA
function analyzeRoute() {
    const select = document.getElementById('route-select');
    const box = document.getElementById('route-analysis');
    const map = document.getElementById('map-simulation');
    
    if(!select.value) return;

    // Efeito de carregamento
    box.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color: var(--accent);"></i> Cruzando dados com a Polícia Rodoviária...';
    
    // Limpa cores anteriores do mapa
    map.className = 'map-container';

    // Simula um tempo de processamento de IA (1.5 segundos)
    setTimeout(() => {
        const analyses = {
            'safe': '<strong style="color: #2ecc71"><i class="fa-solid fa-check-circle"></i> Risco Baixo</strong><br>Trecho coberto por câmeras e fiscalização. Histórico limpo nos últimos 30 dias.',
            'warning': '<strong style="color: #f1c40f"><i class="fa-solid fa-triangle-exclamation"></i> Risco Moderado</strong><br>Atenção no km 45 ao 60. Buracos na pista e ausência de sinal de rádio/celular.',
            'danger': '<strong style="color: #e74c3c"><i class="fa-solid fa-skull-crossbones"></i> ALTO RISCO DETECTADO</strong><br>Mancha criminal forte. Recomenda-se comboio ou aguardar escolta para passar.'
        };
        
        box.innerHTML = analyses[select.value];
        addLog(`Análise de IA concluída para a rota: ${select.options[select.selectedIndex].text}`);
        
        // Pinta o mapa conforme o perigo
        map.classList.add(`route-${select.value}`);
    }, 1500);
}

// 2. BUSCAR ABRIGO (ROTA DE FUGA)
function findSafeStops() {
    addLog('<strong>CÁLCULO DE ROTA DE FUGA ATIVADO.</strong>');
    
    // Mostra os pontos seguros no mapa
    document.querySelectorAll('.safe-point-marker').forEach(m => m.classList.remove('hidden'));
    
    // Desenha a linha até a PRF
    document.getElementById('escape-route').classList.remove('hidden');
    
    // Atualiza status do caminhão
    const status = document.getElementById('status-text');
    status.className = 'status-badge status-warning';
    status.innerHTML = '<i class="fa-solid fa-person-running"></i> Rota Alterada p/ Abrigo';
    
    addLog('<span style="color: #2ecc71;">Rota traçada para a Base PRF mais próxima (12km). Siga pelo acesso à direita.</span>');
}

// 3. COMUNICAÇÃO COM A BASE (CHAT)
function toggleChat() {
    const chat = document.getElementById('chat-modal');
    chat.classList.toggle('hidden');
    if(!chat.classList.contains('hidden')) {
        addLog('Janela de comunicação com a Base aberta.');
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msgBox = document.getElementById('chat-messages');
    
    if(input.value.trim() === '') return; // Não envia vazio

    // Minha mensagem
    msgBox.innerHTML += `<div class="msg my-msg">${input.value}</div>`;
    
    const textoEnviado = input.value;
    input.value = '';
    msgBox.scrollTop = msgBox.scrollHeight; // Rola pra baixo

    // Resposta automática da Base simulada (2 segundos depois)
    setTimeout(() => {
        let resposta = "Base copiou sua mensagem. Tudo sob controle no radar.";
        
        // Palavras chave
        if(textoEnviado.toLowerCase().includes('suspeito')) {
            resposta = "Atenção máxima! Estamos acompanhando pela câmera. Acelere para o próximo posto.";
        } else if(textoEnviado.toLowerCase().includes('parada')) {
            resposta = "Autorizado parada. Lembre-se de não abrir o baú sem autorização.";
        }
        
        msgBox.innerHTML += `<div class="msg base-msg">${resposta}</div>`;
        msgBox.scrollTop = msgBox.scrollHeight;
        addLog('Nova mensagem recebida da Central.');
    }, 2000);
}

// Permitir enviar chat com a tecla Enter
document.getElementById('chat-input')?.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') sendMessage();
});

// 4. MODO PERNOITE (SEGURANÇA NOTURNA)
let pernoiteAtivo = false;
function sleepMode() {
    pernoiteAtivo = !pernoiteAtivo;
    const mainArea = document.getElementById('main-area');
    const status = document.getElementById('status-text');
    const gpsMarker = document.getElementById('truck-marker');
    
    if(pernoiteAtivo) {
        mainArea.classList.add('night-mode');
        status.className = 'status-badge status-sleep';
        status.innerHTML = '<i class="fa-solid fa-moon"></i> Veículo Travado - Pernoite';
        gpsMarker.style.animation = 'none'; // Para de piscar
        gpsMarker.style.background = '#3498db';
        addLog('<strong>MODO PERNOITE ATIVADO.</strong> Baú trancado eletronicamente. Sensores de vibração ligados.');
    } else {
        mainArea.classList.remove('night-mode');
        status.className = 'status-badge status-ok';
        status.innerHTML = 'Rota Ativa - Seguro';
        gpsMarker.style.animation = 'pulse 1.5s infinite'; // Volta a piscar
        gpsMarker.style.background = 'var(--accent)';
        addLog('Modo pernoite desativado. Motor liberado para partida.');
    }
}

// 5. CHECK-IN MANUAL
function manualCheckin() {
    addLog('Sinal de satélite atualizado manualmente. Coordenadas OK.');
    const gpsMarker = document.getElementById('truck-marker');
    
    // Pisca verde pra confirmar
    gpsMarker.style.background = '#2ecc71';
    setTimeout(() => {
        if(!pernoiteAtivo) gpsMarker.style.background = 'var(--accent)';
    }, 1500);
}

// 6. BOTÃO DE PÂNICO (SOS)
function activateSOS() {
    document.getElementById('sos-overlay').classList.remove('hidden');
    
    const status = document.getElementById('status-text');
    status.className = 'status-badge status-danger';
    status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> EMERGÊNCIA ACIONADA';
    
    addLog('<strong style="color: #e74c3c;">BOTÃO DE PÂNICO PRESSIONADO. CORTE DE COMBUSTÍVEL EM 3 MINUTOS.</strong>');
    
    // Fecha o chat se estiver aberto pra focar na emergência
    document.getElementById('chat-modal').classList.add('hidden');
}

function cancelSOS() {
    // Falso cancelamento pra simular a segurança
    const senha = prompt("Insira a senha de contra-coação da transportadora:");
    
    if(senha === "1234" || senha === "cancelar") {
        document.getElementById('sos-overlay').classList.add('hidden');
        document.getElementById('status-text').className = 'status-badge status-ok';
        document.getElementById('status-text').innerHTML = 'Rota Ativa - Seguro';
        addLog('Emergência cancelada. Falso positivo registrado.');
    } else if(senha !== null) {
        alert("Senha incorreta. O bloqueio não pode ser interrompido sem a central.");
        addLog('<strong style="color: #e74c3c;">Falha ao cancelar SOS. Tentativa de senha inválida!</strong>');
    }
}