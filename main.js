/* =========================================================
   1. GERENCIAMENTO DE TEMA (MODO CLARO / ESCURO) E MOBILE
   ========================================================= */
   function applySavedTheme() {
    const saved = localStorage.getItem('estrada-segura-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeUI(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('estrada-segura-theme', next);
    updateThemeUI(next);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) {
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    if (text) {
        text.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    }
}

function toggleMobileNav() {
    const menu = document.getElementById('nav-menu');
    if (menu) menu.classList.toggle('open');
}

function toggleAppSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/* =========================================================
   2. INTERATIVIDADE PORTAL (INDEX & SOBRE)
   ========================================================= */
function toggleDetalhes(card) {
    card.classList.toggle('expanded');
    const hint = card.querySelector('.card-hint');
    if (hint) {
        hint.innerHTML = card.classList.contains('expanded')
            ? 'Ocultar detalhes <i class="fa-solid fa-chevron-up"></i>'
            : 'Saiba mais <i class="fa-solid fa-chevron-down"></i>';
    }
}

function destacarSmart(card) {
    document.querySelectorAll('.smart-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
}

/* =========================================================
   3. BASE DE DADOS DE RODOVIAS, RUAS E ROTAS REAIS
   ========================================================= */
const ROADS_DATABASE = {
    sp330: {
        id: 'sp330',
        name: 'SP-330 • Rodovia Anhanguera (Campinas → Jundiaí)',
        city: 'Campinas / Valinhos / Vinhedo / Jundiaí - SP',
        risk: 'safe',
        riskLabel: 'Risco Baixo (Score 92/100)',
        signal: '4G/5G Total (99%)',
        details: 'Trecho monitorado por câmeras OCR e viaturas da Polícia Militar Rodoviária. Postos seguros a cada 18 km.',
        coords: [
            [-22.9056, -47.0608],
            [-22.9685, -47.0124],
            [-23.0302, -46.9835],
            [-23.1120, -46.9420],
            [-23.1857, -46.8978]
        ]
    },
    br050: {
        id: 'br050',
        name: 'BR-050 • Trecho Concedido (Uberaba → Uberlândia)',
        city: 'Triângulo Mineiro - MG',
        risk: 'safe',
        riskLabel: 'Risco Baixo (Score 95/100)',
        signal: '4G / Satélite (98%)',
        details: 'Pista duplicada com bases SAU a cada 35 km e baixo índice de sinistros nos últimos 90 dias.',
        coords: [
            [-19.7472, -47.9318],
            [-19.5120, -48.0450],
            [-19.2450, -48.1620],
            [-18.9186, -48.2772]
        ]
    },
    sp348: {
        id: 'sp348',
        name: 'SP-348 • Rodovia dos Bandeirantes (Km 35 ao 72)',
        city: 'Cajamar / Jundiaí / Itupeva - SP',
        risk: 'warning',
        riskLabel: 'Atenção Moderada (Score 74/100)',
        signal: '4G Estável (91%)',
        details: 'Fluxo intenso de carretas no período noturno. Atenção redobrada nas alças de acesso de Cajamar.',
        coords: [
            [-23.3560, -46.8760],
            [-23.2650, -46.9210],
            [-23.1890, -46.9650],
            [-23.0950, -47.0240]
        ]
    },
    br381: {
        id: 'br381',
        name: 'BR-381 • Fernão Dias (Mairiporã → Bragança Paulista)',
        city: 'Serra da Cantareira - SP/MG',
        risk: 'warning',
        riskLabel: 'Risco Moderado • Área de Sombra (Score 65/100)',
        signal: 'Oscilação na Serra (72%)',
        details: 'Trecho de serra com curvas fechadas, neblina frequente e pontos de sombra de sinal celular.',
        coords: [
            [-23.3186, -46.5867],
            [-23.2140, -46.5620],
            [-23.0890, -46.5480],
            [-22.9527, -46.5419]
        ]
    },
    sp021: {
        id: 'sp021',
        name: 'SP-021 • Rodoanel Mário Covas (Trecho Oeste/Sul)',
        city: 'Osasco / Barueri / Embu das Artes - SP',
        risk: 'danger',
        riskLabel: 'Alerta Elevado • Mancha Criminal (Score 48/100)',
        signal: '4G / Rastreador Híbrido',
        details: 'Alta incidência de bloqueadores de sinal (jammers) entre 21h e 04h. Proibida parada fora de bases.',
        coords: [
            [-23.4890, -46.8450],
            [-23.5420, -46.8320],
            [-23.6150, -46.8190],
            [-23.6850, -46.7950]
        ]
    },
    br116: {
        id: 'br116',
        name: 'BR-116 • Régis Bittencourt (Serra do Cafezal)',
        city: 'Juquitiba / Miracatu - SP',
        risk: 'danger',
        riskLabel: 'ALTO RISCO DETECTADO (Score 41/100)',
        signal: 'Sombra em Vales (64%)',
        details: 'Mancha criminal ativa para cargas de alto valor. Recomenda-se comboio monitorado.',
        coords: [
            [-23.9317, -47.0689],
            [-24.0450, -47.1850],
            [-24.1620, -47.3120],
            [-24.2775, -47.4603]
        ]
    }
};

/* =========================================================
   4. MAPA INTERATIVO REAL (LEAFLET.JS)
   ========================================================= */
let map = null;
let truckMarker = null;
let routePolyline = null;
let activeRouteCoords = ROADS_DATABASE.sp330.coords;
let routeStepIndex = 0;
let truckMoving = true;
let pernoiteAtivo = false;
let safeMarkersGroup = null;

function initRealMap() {
    const mapEl = document.getElementById('real-map');
    if (!mapEl || typeof L === 'undefined') return;

    map = L.map('real-map').setView(activeRouteCoords[0], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap • Estrada Segura'
    }).addTo(map);

    safeMarkersGroup = L.layerGroup().addTo(map);

    const truckIcon = L.divIcon({
        className: 'truck-leaflet-icon',
        html: '<i class="fa-solid fa-truck"></i>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });

    truckMarker = L.marker(activeRouteCoords[0], { icon: truckIcon })
        .addTo(map)
        .bindPopup('<strong>Volvo FH 540 (ABC-1234)</strong><br>Motorista: Carlos Mendes<br>Status: Monitorado');

    drawRouteOnMap('sp330');
    startTruckMovementLoop();
}

function drawRouteOnMap(routeKey) {
    if (!map) return;
    const road = ROADS_DATABASE[routeKey];
    if (!road) return;

    activeRouteCoords = road.coords;
    routeStepIndex = 0;

    if (routePolyline) {
        map.removeLayer(routePolyline);
    }

    const lineColor = road.risk === 'danger' ? '#ef4444' : (road.risk === 'warning' ? '#f59e0b' : '#0284c7');

    routePolyline = L.polyline(activeRouteCoords, {
        color: lineColor,
        weight: 6,
        opacity: 0.85
    }).addTo(map);

    truckMarker.setLatLng(activeRouteCoords[0]);
    map.fitBounds(routePolyline.getBounds(), { padding: [35, 35] });

    const label = document.getElementById('current-road-label');
    if (label) label.textContent = `Trecho ativo: ${road.name}`;
}

function startTruckMovementLoop() {
    setInterval(() => {
        if (!map || !truckMarker || !truckMoving || pernoiteAtivo) return;

        routeStepIndex = (routeStepIndex + 1) % activeRouteCoords.length;
        const nextCoord = activeRouteCoords[routeStepIndex];
        truckMarker.setLatLng(nextCoord);

        const speedEl = document.getElementById('live-speed');
        if (speedEl) {
            const randomSpeed = Math.floor(Math.random() * (84 - 68 + 1)) + 68;
            speedEl.textContent = `${randomSpeed} km/h`;
        }
    }, 2800);
}

function toggleTruckSimulation() {
    truckMoving = !truckMoving;
    const btn = document.getElementById('sim-toggle-btn');
    const speedEl = document.getElementById('live-speed');
    if (btn) {
        btn.innerHTML = truckMoving
            ? '<i class="fa-solid fa-pause"></i> Pausar Rota'
            : '<i class="fa-solid fa-play"></i> Retomar Rota';
    }
    if (!truckMoving && speedEl) speedEl.textContent = '0 km/h';
    addLog(truckMoving ? 'Simulação de deslocamento retomada.' : 'Simulação pausada pelo operador.');
}

function useRealLocation() {
    if (!navigator.geolocation) {
        openInfoPopup('GPS Indisponível', 'Seu navegador não suporta geolocalização.');
        return;
    }

    addLog('Solicitando coordenadas reais via GPS do dispositivo...');
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            if (map && truckMarker) {
                const userLatLng = [latitude, longitude];
                truckMarker.setLatLng(userLatLng);
                map.setView(userLatLng, 14);
                truckMarker.bindPopup('<strong>Sua Localização Real (GPS)</strong><br>Veículo sincronizado aqui!').openPopup();
            }
            const label = document.getElementById('current-road-label');
            if (label) label.textContent = `GPS Real Sincronizado: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`;
            addLog(`<span style="color: var(--status-safe);">GPS Real conectado (${latitude.toFixed(4)}, ${longitude.toFixed(4)}).</span>`);
        },
        () => {
            openInfoPopup('Permissão de Localização', 'Não foi possível obter o GPS real (permissão negada ou indisponível). O simulador continuará operando na malha rodoviária padrão.');
        }
    );
}

/* =========================================================
   5. CATÁLOGO DE RUAS E RODOVIAS + ANÁLISE PREDITIVA
   ========================================================= */
function renderRoadsCatalog() {
    const container = document.getElementById('roads-catalog');
    if (!container) return;

    container.innerHTML = '';
    Object.values(ROADS_DATABASE).forEach(road => {
        const badgeClass = road.risk === 'danger' ? 'status-danger' : (road.risk === 'warning' ? 'status-warn' : 'status-ok');
        const badgeText = road.risk === 'danger' ? 'Alto Risco' : (road.risk === 'warning' ? 'Moderado' : 'Seguro');

        const card = document.createElement('div');
        card.className = 'road-card';
        card.setAttribute('data-search', `${road.name} ${road.city}`.toLowerCase());
        card.innerHTML = `
            <div class="road-card-top">
                <h4>${road.name}</h4>
                <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="road-meta">
                <span><i class="fa-solid fa-location-dot" style="color: var(--accent-orange);"></i> ${road.city}</span>
                <span><i class="fa-solid fa-signal" style="color: var(--accent-cyan);"></i> Sinal: ${road.signal}</span>
                <p style="margin-top: 6px;">${road.details}</p>
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.65rem;" onclick="selectRoadFromCatalog('${road.id}')">
                <i class="fa-solid fa-map"></i> Carregar Trecho no Radar
            </button>
        `;
        container.appendChild(card);
    });
}

function filterRoads() {
    const term = document.getElementById('road-search').value.toLowerCase();
    document.querySelectorAll('.road-card').forEach(card => {
        const text = card.getAttribute('data-search');
        card.style.display = text.includes(term) ? 'flex' : 'none';
    });
}

function selectRoadFromCatalog(roadId) {
    const select = document.getElementById('route-select');
    if (select) select.value = roadId;

    // Volta para aba monitoramento
    document.querySelectorAll('.app-tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-monitoramento').classList.add('active');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.menu-btn').classList.add('active');

    setTimeout(() => {
        if (map) map.invalidateSize();
        analyzeRoute();
    }, 100);
}

function analyzeRoute() {
    const select = document.getElementById('route-select');
    const box = document.getElementById('route-analysis');
    if (!select || !box) return;

    const road = ROADS_DATABASE[select.value];
    if (!road) return;

    box.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color: var(--accent-orange);"></i> Consultando inteligência policial e telemetria...';

    setTimeout(() => {
        const color = road.risk === 'danger' ? '#ef4444' : (road.risk === 'warning' ? '#f59e0b' : '#10b981');
        const icon = road.risk === 'danger' ? 'fa-skull-crossbones' : (road.risk === 'warning' ? 'fa-triangle-exclamation' : 'fa-check-circle');

        box.style.borderLeftColor = color;
        box.innerHTML = `
            <strong style="color: ${color}"><i class="fa-solid ${icon}"></i> ${road.riskLabel}</strong><br>
            ${road.details}
        `;

        const sigEl = document.getElementById('signal-quality');
        if (sigEl) {
            sigEl.textContent = road.risk === 'danger' ? 'Oscilando' : 'Forte';
            sigEl.style.color = color;
        }

        drawRouteOnMap(road.id);
        addLog(`Rota carregada no GPS: <strong>${road.name}</strong>.`);
    }, 650);
}

/* =========================================================
   6. ROTA DE ABRIGO, PERNOITE E PONTOS DE APOIO
   ========================================================= */
function findSafeStops() {
    if (!map || !safeMarkersGroup) return;
    safeMarkersGroup.clearLayers();

    const current = activeRouteCoords[routeStepIndex] || activeRouteCoords[0];
    const prfLatLng = [current[0] + 0.025, current[1] + 0.032];
    const postoLatLng = [current[0] - 0.022, current[1] + 0.028];

    const shieldIcon = L.divIcon({
        className: 'poi-leaflet-icon',
        html: '<i class="fa-solid fa-building-shield"></i>',
        iconSize: [30, 30]
    });

    L.marker(prfLatLng, { icon: shieldIcon }).addTo(safeMarkersGroup)
        .bindPopup('<strong>Posto PRF Mais Próximo (8,4 km)</strong><br>Apoio policial 24h.').openPopup();

    L.marker(postoLatLng, { icon: shieldIcon }).addTo(safeMarkersGroup)
        .bindPopup('<strong>Parada Segura Credenciada (5,1 km)</strong><br>Pátio fechado e vigilância.');

    map.setView(prfLatLng, 12);
    addLog('<span style="color: var(--status-safe);">Pontos de abrigo e bases PRF plotados no mapa!</span>');
}

function routeToPoint(lat, lng, title) {
    selectRoadFromCatalog('sp330');
    setTimeout(() => {
        if (map && safeMarkersGroup) {
            safeMarkersGroup.clearLayers();
            const dest = [lat, lng];
            L.marker(dest).addTo(safeMarkersGroup)
                .bindPopup(`<strong>Destino Seguro: ${title}</strong><br>Rota prioritária traçada.`).openPopup();
            map.setView(dest, 13);
            addLog(`Destino seguro definido: <strong>${title}</strong>.`);
        }
    }, 150);
}

function sleepMode() {
    pernoiteAtivo = !pernoiteAtivo;
    const status = document.getElementById('status-text');
    const cargoStatus = document.getElementById('cargo-lock-status');
    const speedEl = document.getElementById('live-speed');

    if (pernoiteAtivo) {
        status.className = 'status-badge status-warn';
        status.innerHTML = '<i class="fa-solid fa-moon"></i> Modo Pernoite Ativo';
        if (cargoStatus) cargoStatus.textContent = 'Baú Blindado (Alerta)';
        if (speedEl) speedEl.textContent = '0 km/h';
        addLog('<strong>MODO PERNOITE ATIVADO.</strong> Sensores de porta, baú e desengate armados.');
        openInfoPopup('Modo Pernoite Armado', 'O veículo está imobilizado em perímetro monitorado. Qualquer tentativa de abertura do baú ou movimentação sem senha disparará a sirene SOS automaticamente.');
    } else {
        status.className = 'status-badge status-ok';
        status.innerHTML = '<i class="fa-solid fa-shield-check"></i> Rota Ativa - Perímetro Seguro';
        if (cargoStatus) cargoStatus.textContent = 'Baú Travado';
        addLog('Modo pernoite desativado. Ignição liberada para viagem.');
    }
}

/* =========================================================
   7. SOM DE SIRENE REAL (WEB AUDIO API) + PROTOCOLO SOS
   ========================================================= */
let audioCtx = null;
let sirenOscillator = null;
let sirenGain = null;
let sirenToneInterval = null;
let sirenMuted = false;
let fuelTimerInterval = null;

function startSirenSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        stopSirenSound();

        sirenOscillator = audioCtx.createOscillator();
        sirenGain = audioCtx.createGain();

        sirenOscillator.type = 'sawtooth';
        sirenOscillator.frequency.setValueAtTime(780, audioCtx.currentTime);
        sirenGain.gain.setValueAtTime(sirenMuted ? 0 : 0.25, audioCtx.currentTime);

        sirenOscillator.connect(sirenGain);
        sirenGain.connect(audioCtx.destination);
        sirenOscillator.start();

        let highTone = true;
        sirenToneInterval = setInterval(() => {
            if (!sirenOscillator || !audioCtx) return;
            const freq = highTone ? 980 : 660;
            sirenOscillator.frequency.exponentialRampToValueAtTime(freq, audioCtx.currentTime + 0.25);
            highTone = !highTone;
        }, 380);
    } catch (e) {
        console.warn('Áudio bloqueado pelo navegador:', e);
    }
}

function stopSirenSound() {
    if (sirenToneInterval) {
        clearInterval(sirenToneInterval);
        sirenToneInterval = null;
    }
    if (sirenOscillator) {
        try {
            sirenOscillator.stop();
            sirenOscillator.disconnect();
        } catch (e) {}
        sirenOscillator = null;
    }
}

function toggleSirenMute() {
    sirenMuted = !sirenMuted;
    const btn = document.getElementById('mute-siren-btn');
    if (sirenGain && audioCtx) {
        sirenGain.gain.setValueAtTime(sirenMuted ? 0 : 0.25, audioCtx.currentTime);
    }
    if (btn) {
        btn.innerHTML = sirenMuted
            ? '<i class="fa-solid fa-volume-xmark"></i> Ativar Som da Sirene'
            : '<i class="fa-solid fa-volume-high"></i> Silenciar Sirene';
    }
}

function activateSOS() {
    const overlay = document.getElementById('sos-overlay');
    const status = document.getElementById('status-text');
    const chat = document.getElementById('chat-modal');

    if (overlay) overlay.classList.remove('hidden');
    if (chat) chat.classList.add('hidden');
    if (status) {
        status.className = 'status-badge status-danger';
        status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> PÂNICO SOS ATIVO';
    }

    sirenMuted = false;
    startSirenSound();
    startFuelCountdown();
    addLog('<strong style="color: #ef4444;">BOTÃO SOS ACIONADO! Sirene disparada e alerta enviado à PRF.</strong>');
}

function startFuelCountdown() {
    if (fuelTimerInterval) clearInterval(fuelTimerInterval);
    let seconds = 179;
    const el = document.getElementById('fuel-countdown');
    fuelTimerInterval = setInterval(() => {
        if (seconds <= 0) {
            clearInterval(fuelTimerInterval);
            if (el) el.textContent = 'BLOQUEADO';
            return;
        }
        seconds--;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        if (el) el.textContent = `${m}:${s}`;
    }, 1000);
}

function openCancelSOSModal() {
    const pinBox = document.getElementById('sos-pin-box');
    if (pinBox) {
        pinBox.classList.remove('hidden');
        document.getElementById('sos-pin-input').focus();
    }
}

function verifySOSPin() {
    const input = document.getElementById('sos-pin-input');
    const error = document.getElementById('sos-pin-error');
    if (!input) return;

    if (input.value === '1234') {
        stopSirenSound();
        if (fuelTimerInterval) clearInterval(fuelTimerInterval);
        document.getElementById('sos-overlay').classList.add('hidden');
        document.getElementById('sos-pin-box').classList.add('hidden');
        input.value = '';
        if (error) error.style.display = 'none';

        const status = document.getElementById('status-text');
        if (status) {
            status.className = 'status-badge status-ok';
            status.innerHTML = '<i class="fa-solid fa-shield-check"></i> Rota Ativa - Perímetro Seguro';
        }
        addLog('Alerta SOS desarmado com senha válida de contra-coação.');
    } else {
        if (error) error.style.display = 'block';
        addLog('Tentativa inválida de desarme do SOS!');
    }
}

/* =========================================================
   8. POPUPS SIMULADOS (RESGATE / AMBULÂNCIA / LAUDOS)
   ========================================================= */
let callTimerInterval = null;

function openEmergencyDispatchModal() {
    const modal = document.getElementById('dispatch-modal');
    const callBox = document.getElementById('active-call-box');
    if (callBox) callBox.classList.add('hidden');
    if (modal) modal.classList.remove('hidden');
}

function simulateEmergencyCall(serviceName, iconClass, color) {
    const callBox = document.getElementById('active-call-box');
    const nameEl = document.getElementById('call-target-name');
    const detailEl = document.getElementById('call-status-detail');
    const timerEl = document.getElementById('call-timer');
    const iconEl = document.getElementById('call-icon');

    if (!callBox) return;

    callBox.classList.remove('hidden');
    nameEl.textContent = `Chamando ${serviceName}...`;
    detailEl.textContent = 'Enviando telemetria, placa ABC-1234 e coordenadas GPS...';
    iconEl.className = `fa-solid ${iconClass}`;
    callBox.style.borderColor = color;

    let sec = 0;
    timerEl.textContent = '00:00';
    if (callTimerInterval) clearInterval(callTimerInterval);

    setTimeout(() => {
        nameEl.textContent = `Conectado: ${serviceName}`;
        detailEl.textContent = 'Protocolo #ES-2026-894 gerado. Viatura mais próxima deslocada!';
    }, 1500);

    callTimerInterval = setInterval(() => {
        sec++;
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
    }, 1000);

    addLog(`<strong>CHAMADA DE EMERGÊNCIA:</strong> Acionado ${serviceName} com envio de GPS.`);
}

function endSimulatedCall() {
    if (callTimerInterval) clearInterval(callTimerInterval);
    document.getElementById('active-call-box').classList.add('hidden');
    closeModal('dispatch-modal');
    addLog('Chamada de emergência simulada encerrada.');
}

function openReportPopup(rota, distancia, ocorrencias, score) {
    openInfoPopup(
        `Laudo de Auditoria • ${rota}`,
        `
        <p><strong>Veículo:</strong> Volvo FH 540 • Placa ABC-1234</p>
        <p><strong>Distância Percorrida:</strong> ${distancia}</p>
        <p><strong>Eventos Registrados:</strong> ${ocorrencias}</p>
        <p><strong>Índice de Conformidade:</strong> <span style="color: var(--status-safe); font-weight: bold;">${score}</span></p>
        <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary);">Assinado digitalmente pelo sistema Estrada Segura Telemetria.</p>
        `
    );
}

function openInfoPopup(title, htmlBody) {
    const modal = document.getElementById('info-modal');
    if (!modal) return;
    document.getElementById('info-modal-title').innerHTML = `<i class="fa-solid fa-circle-info" style="color: var(--accent-orange);"></i> ${title}`;
    document.getElementById('info-modal-body').innerHTML = htmlBody;
    modal.classList.remove('hidden');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
}

/* =========================================================
   9. CHAT COM A BASE, ABAS, RELÓGIO E LOGS
   ========================================================= */
function switchAppTab(evento, tabId) {
    document.querySelectorAll('.app-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.app-menu .menu-btn, .mob-nav-btn').forEach(btn => btn.classList.remove('active'));

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('active');

    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    if (tabId === 'tab-monitoramento' && map) {
        setTimeout(() => map.invalidateSize(), 120);
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-modal');
    if (chat) chat.classList.toggle('hidden');
}

function quickChat(text) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = text;
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msgBox = document.getElementById('chat-messages');
    if (!input || !msgBox || input.value.trim() === '') return;

    const texto = input.value;
    msgBox.innerHTML += `<div class="msg user-msg">${texto}</div>`;
    input.value = '';
    msgBox.scrollTop = msgBox.scrollHeight;

    setTimeout(() => {
        let resposta = '<strong>Base:</strong> QSL, motorista. Telemetria estável, prossiga com segurança.';
        const low = texto.toLowerCase();
        if (low.includes('suspeito')) {
            resposta = '<strong>Base:</strong> Alerta preventivo ativado! Mantenha velocidade constante e siga para o Posto PRF traçado no mapa.';
        } else if (low.includes('parada')) {
            resposta = '<strong>Base:</strong> Parada autorizada apenas nos pontos homologados da aba Pontos de Apoio.';
        } else if (low.includes('pista') || low.includes('trânsito')) {
            resposta = '<strong>Base:</strong> Congestionamento confirmado. Trava do baú reforçada remotamente.';
        }
        msgBox.innerHTML += `<div class="msg base-msg">${resposta}</div>`;
        msgBox.scrollTop = msgBox.scrollHeight;
    }, 1000);
}

function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);

function addLog(message) {
    const logContainer = document.getElementById('event-logs');
    if (!logContainer) return;
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const li = document.createElement('li');
    li.innerHTML = `<em>${hora}</em> - ${message}`;
    logContainer.prepend(li);
}

function clearLogs() {
    const logContainer = document.getElementById('event-logs');
    if (logContainer) logContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    updateClock();

    // Tabs da página inicial
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });

    // Inicializa mapa e lista de ruas no simulador
    initRealMap();
    renderRoadsCatalog();
});
