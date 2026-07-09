// --- State ---
let currentSession = null;
let currentQuestionIndex = null;
let voices = [];
let speechSynth = window.speechSynthesis;
let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

// Chart Instances
let scoreChartInstance = null;
let timeChartInstance = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadSessions();
  populateVoices();
  
  if (speechSynth.onvoiceschanged !== undefined) {
    speechSynth.onvoiceschanged = populateVoices;
  }

  // Handle enter key in answer input
  document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  });
});

function nav(view) {
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-config').classList.add('hidden');
  document.getElementById('view-interview').classList.add('hidden');
  document.getElementById('view-report').classList.add('hidden');
  
  document.getElementById('nav-dashboard').classList.replace('text-white', 'text-surface-600');
  document.getElementById('nav-config').classList.replace('text-white', 'text-surface-600');
  
  document.getElementById(`view-${view}`).classList.remove('hidden');
  if (view !== 'interview' && view !== 'report') {
    document.getElementById(`nav-${view}`).classList.replace('text-surface-600', 'text-white');
  }
}

// --- Config ---
async function loadConfig() {
  const res = await fetch('/api/config');
  const config = await res.json();
  document.getElementById('config-provider').value = config.provider;
  document.getElementById('config-model').value = config.model;
  document.getElementById('config-key').value = config.apiKey || '';
  document.getElementById('config-baseurl').value = config.baseUrl || '';
  
  setTimeout(() => {
    if(config.ttsVoice && document.getElementById('config-voice').querySelector(`[value="${config.ttsVoice}"]`)) {
      document.getElementById('config-voice').value = config.ttsVoice;
    } else {
      document.getElementById('config-voice').value = 'auto';
    }
  }, 500);
}

async function saveConfig() {
  const payload = {
    provider: document.getElementById('config-provider').value,
    model: document.getElementById('config-model').value,
    apiKey: document.getElementById('config-key').value,
    baseUrl: document.getElementById('config-baseurl').value,
    ttsVoice: document.getElementById('config-voice').value,
  };
  await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const msg = document.getElementById('config-msg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
}

// --- Speech API ---
function getBestNaturalVoice(availableVoices) {
  const enVoices = availableVoices.filter(v => v.lang.startsWith('en'));
  if (enVoices.length === 0) return availableVoices[0] || null;

  const preferences = [
    'natural',    // Microsoft Edge Online Natural
    'google',     // Chrome Google Voices
    'enhanced',   // macOS Enhanced Siri voices
    'siri',       // Apple Siri voices
    'alex',       // macOS Alex
    'samantha',   // macOS Samantha
    'zira',       // Windows Zira
    'david'       // Windows David
  ];

  for (const pref of preferences) {
    const matched = enVoices.find(v => v.name.toLowerCase().includes(pref));
    if (matched) return matched;
  }

  return enVoices[0];
}

function populateVoices() {
  voices = speechSynth.getVoices();
  const voiceSelect = document.getElementById('config-voice');
  voiceSelect.innerHTML = '';
  
  const autoOpt = document.createElement('option');
  autoOpt.value = "auto";
  const bestVoice = getBestNaturalVoice(voices);
  autoOpt.textContent = bestVoice ? `Auto Select (${bestVoice.name})` : "Auto Select (Recommended)";
  voiceSelect.appendChild(autoOpt);
  
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

function speak(text, onEnd) {
  if (speechSynth.speaking) {
    speechSynth.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  let preferredVoiceName = document.getElementById('config-voice').value;
  
  if (!preferredVoiceName || preferredVoiceName === 'auto') {
    const bestVoice = getBestNaturalVoice(voices);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
  } else {
    const voice = voices.find(v => v.name === preferredVoiceName);
    if (voice) utterance.voice = voice;
  }
  
  if (onEnd) utterance.onend = onEnd;
  speechSynth.speak(utterance);
}

function stopSpeak() {
  if (speechSynth.speaking) {
    speechSynth.cancel();
  }
}

// --- STT ---
function initRecognition() {
  if (!SpeechRecognition) {
    alert("Speech Recognition API not supported in this browser. Please use Chrome/Edge or fallback to typing.");
    return false;
  }
  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      isRecording = true;
      document.getElementById('mic-btn').classList.replace('bg-surface-800', 'bg-white');
      document.getElementById('mic-btn').classList.replace('text-white', 'text-surface-950');
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const input = document.getElementById('answer-input');
      if (finalTranscript) {
         input.value = (input.value + " " + finalTranscript).trim();
      }
    };
    
    recognition.onerror = (e) => {
      console.error("Speech recognition error", e);
      stopRecording();
    };
    
    recognition.onend = () => {
      stopRecordingUI();
    };
  }
  return true;
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  stopSpeak();
  if (initRecognition()) {
    try {
      recognition.start();
    } catch(e){}
  }
}

function stopRecording() {
  if (recognition) {
    recognition.stop();
  }
  stopRecordingUI();
}

function stopRecordingUI() {
  isRecording = false;
  const btn = document.getElementById('mic-btn');
  btn.classList.replace('bg-white', 'bg-surface-800');
  btn.classList.replace('text-surface-950', 'text-white');
}


// --- Dashboard / Sessions ---
async function loadSessions() {
  const res = await fetch('/api/sessions');
  const sessions = await res.json();
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  
  if(sessions.length === 0) {
    list.innerHTML = `<div class="text-surface-600 text-sm text-center mt-8">No past sessions found. Ready to start your first one?</div>`;
    return;
  }
  
  sessions.forEach(s => {
    const scoreText = s.totalScore > 0 && s.completedQuestions > 0 ? Math.round(s.totalScore / s.completedQuestions) + '%' : 'N/A';
    const date = new Date(s.createdAt).toLocaleDateString();
    const isCompleted = s.status === 'completed';
    
    list.innerHTML += `
      <div class="bg-surface-900 p-5 rounded-2xl border border-surface-800 flex justify-between items-center group cursor-pointer hover:bg-surface-800 transition duration-200" onclick="resumeOrView('${s.id}')">
        <div>
          <h4 class="font-bold text-white text-lg">${s.role} <span class="text-xs font-semibold text-surface-400 ml-2 uppercase tracking-widest">${s.level}</span></h4>
          <div class="text-sm text-surface-600 mt-1 font-medium">${date} • ${s.completedQuestions}/${s.totalQuestions} Questions</div>
        </div>
        <div class="text-right">
          <div class="font-display font-bold text-2xl text-white group-hover:scale-105 transition-transform">${scoreText}</div>
          <div class="text-xs font-semibold tracking-wider uppercase ${isCompleted ? 'text-white' : 'text-surface-400'} mt-1">${s.status}</div>
        </div>
      </div>
    `;
  });
}

// --- Interview Flow ---
async function startInterview() {
  const role = document.getElementById('start-role').value || 'Software Engineer';
  const level = document.getElementById('start-level').value;
  const focusAreas = document.getElementById('start-focus').value;
  const totalQuestions = Number(document.getElementById('start-questions').value) || 5;
  
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, level, focusAreas, totalQuestions })
  });
  
  const session = await res.json();
  openInterviewRoom(session);
}

async function resumeOrView(id) {
  const res = await fetch(`/api/sessions/${id}`);
  const session = await res.json();
  
  if (session.status === 'completed') {
    showReport(session);
  } else {
    openInterviewRoom(session);
  }
}

function openInterviewRoom(session) {
  currentSession = session;
  nav('interview');
  document.getElementById('interview-meta').textContent = `${session.role} (${session.level}) - ${session.completedQuestions}/${session.totalQuestions} Completed`;
  
  const history = document.getElementById('interview-history');
  history.innerHTML = '';
  
  session.questions.forEach((q, i) => {
    renderQuestion(q, i);
    if(q.answer) renderAnswer(q.answer);
    if(q.evaluation) renderEvaluation(q.evaluation);
  });
  
  if (session.status !== 'completed') {
    if (session.questions.length === 0 || session.questions[session.questions.length-1].answer) {
      triggerNextQuestion();
    }
  } else {
    showReport(session);
  }
}

function showLoader(text) {
  document.getElementById('interview-loader').classList.remove('hidden');
  document.getElementById('interview-loader-text').textContent = text;
}

function hideLoader() {
  document.getElementById('interview-loader').classList.add('hidden');
}

async function triggerNextQuestion() {
  showLoader("Generating Question...");
  try {
    const res = await fetch('/api/interview/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id })
    });
    const data = await res.json();
    currentSession = data.session;
    currentQuestionIndex = currentSession.questions.length - 1;
    const q = data.question;
    
    hideLoader();
    renderQuestion(q, currentQuestionIndex);
    speak(q.question);
    
  } catch (err) {
    hideLoader();
    alert("Error generating question.");
  }
}

let questionStartTime = null;

async function submitAnswer() {
  const input = document.getElementById('answer-input');
  const answer = input.value.trim();
  if(!answer) return;
  
  stopRecording();
  stopSpeak();
  
  const durationSeconds = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 30;
  
  input.value = '';
  renderAnswer(answer);
  
  currentQuestionIndex = currentSession.questions.length - 1;
  showLoader("Evaluating Answer...");
  
  try {
    const res = await fetch('/api/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId: currentSession.id, 
        questionId: currentQuestionIndex,
        answer,
        durationSeconds
      })
    });
    
    const data = await res.json();
    currentSession = data.session;
    const evaluation = data.evaluation;
    
    hideLoader();
    renderEvaluation(evaluation);
    speak(evaluation.feedback, () => {
      if (currentSession.status !== 'completed') {
        setTimeout(triggerNextQuestion, 1000);
      } else {
        setTimeout(() => showReport(currentSession), 1500);
      }
    });
    
  } catch (err) {
    hideLoader();
    alert("Error evaluating answer.");
  }
}

// --- Detailed Report Flow ---
function showReport(session) {
  currentSession = session;
  nav('report');
  
  document.getElementById('report-title-meta').textContent = `${session.role} (${session.level})`;
  
  const gradedQuestions = session.questions.filter(q => q.evaluation);
  const average = gradedQuestions.length > 0 
    ? Math.round(gradedQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) / gradedQuestions.length) 
    : 0;
    
  document.getElementById('report-score').textContent = `${average}%`;
  
  let scoreMsg = "Keep practicing, you'll get there!";
  if(average >= 90) scoreMsg = "Perfect performance! You're ready to ace the real thing.";
  else if(average >= 75) scoreMsg = "Excellent job! Solid conceptual knowledge.";
  else if(average >= 50) scoreMsg = "Good start! Focus on the suggested improvements.";
  document.getElementById('report-score-msg').textContent = scoreMsg;
  
  const answered = session.questions.filter(q => q.durationSeconds !== undefined);
  const avgDuration = answered.length > 0 ? Math.round(answered.reduce((acc, q) => acc + q.durationSeconds, 0) / answered.length) : 0;
  
  const mins = Math.floor(avgDuration / 60);
  const secs = avgDuration % 60;
  document.getElementById('report-pacing').textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  document.getElementById('report-status').textContent = session.status;
  document.getElementById('report-date').textContent = new Date(session.createdAt).toLocaleDateString();
  
  const qContainer = document.getElementById('report-questions-container');
  qContainer.innerHTML = '';
  
  session.questions.forEach((q, i) => {
    const strengths = (q.evaluation?.strengths || []).map(s => `<li class="flex items-start gap-2 text-surface-200 text-sm">
      <svg class="w-4 h-4 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
      <span>${s}</span>
    </li>`).join('');
    
    const improvements = (q.evaluation?.missingPoints || q.evaluation?.improvements || []).map(imp => `<li class="flex items-start gap-2 text-surface-400 text-sm">
      <svg class="w-4 h-4 text-surface-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      <span>${imp}</span>
    </li>`).join('');

    qContainer.innerHTML += `
      <div class="mono-card p-8 rounded-2xl relative overflow-hidden">
        <div class="flex justify-between items-start border-b border-surface-800 pb-4 mb-4">
          <div>
            <h4 class="font-bold text-lg text-white">Question ${i + 1}</h4>
            <p class="text-sm text-surface-400 mt-1 font-semibold uppercase tracking-wider">${q.category || "General"}</p>
          </div>
          <div class="text-right">
            <span class="text-xs uppercase font-bold tracking-widest text-surface-600 block">Score</span>
            <span class="text-2xl font-display font-bold text-white">${q.evaluation ? q.evaluation.score : "N/A"}/100</span>
          </div>
        </div>
        <p class="text-white font-medium text-base leading-relaxed mb-6">"${q.question}"</p>
        
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <span class="text-xs uppercase font-bold tracking-widest text-white block mb-3">Key Strengths</span>
            <ul class="space-y-2">
              ${strengths || '<li class="text-surface-600 text-sm">No specific strengths noted.</li>'}
            </ul>
          </div>
          <div>
            <span class="text-xs uppercase font-bold tracking-widest text-surface-400 block mb-3">Areas for Improvement</span>
            <ul class="space-y-2">
              ${improvements || '<li class="text-surface-600 text-sm">Perfect answer! No improvements required.</li>'}
            </ul>
          </div>
        </div>
        
        ${q.evaluation?.idealAnswer ? `
          <div class="mt-6 pt-6 border-t border-surface-800">
            <span class="text-xs uppercase font-bold tracking-widest text-surface-600 block mb-2">Ideal Response Guide</span>
            <p class="text-sm text-surface-400 leading-relaxed italic bg-surface-950 p-4 rounded-xl border border-surface-800">"${q.evaluation.idealAnswer}"</p>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  renderCharts(session);
}

function renderCharts(session) {
  const scores = session.questions.map((q, idx) => q.evaluation ? q.evaluation.score : 0);
  const times = session.questions.map((q, idx) => q.durationSeconds || 0);
  const labels = session.questions.map((_, idx) => `Q${idx + 1}`);
  
  if (scoreChartInstance) scoreChartInstance.destroy();
  if (timeChartInstance) timeChartInstance.destroy();
  
  const scoreCtx = document.getElementById('scoreChart').getContext('2d');
  scoreChartInstance = new Chart(scoreCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Score',
        data: scores,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        tension: 0.35,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#a1a1aa' } },
        x: { grid: { display: false }, ticks: { color: '#a1a1aa' } }
      }
    }
  });

  const timeCtx = document.getElementById('timeChart').getContext('2d');
  timeChartInstance = new Chart(timeCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Seconds',
        data: times,
        backgroundColor: '#ffffff',
        borderRadius: 4,
        barThickness: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#a1a1aa' } },
        x: { grid: { display: false }, ticks: { color: '#a1a1aa' } }
      }
    }
  });
}

// Generate high-resolution light-theme charts for PDF
function generatePDFChart(type, labels, dataPoints, yMax) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 300;
  tempCanvas.height = 150;
  tempCanvas.style.position = 'absolute';
  tempCanvas.style.left = '-9999px';
  document.body.appendChild(tempCanvas);

  const ctx = tempCanvas.getContext('2d');
  let config = {};

  if (type === 'line') {
    config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: dataPoints,
          borderColor: '#09090b',
          backgroundColor: 'rgba(9, 9, 11, 0.04)',
          tension: 0.35,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#09090b'
        }]
      },
      options: {
        responsive: false,
        animation: false,
        devicePixelRatio: 2,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: yMax, grid: { color: '#e4e4e7' }, ticks: { color: '#71717a', font: { family: 'Plus Jakarta Sans', size: 9 } } },
          x: { grid: { display: false }, ticks: { color: '#71717a', font: { family: 'Plus Jakarta Sans', size: 9 } } }
        }
      }
    };
  } else {
    config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: dataPoints,
          backgroundColor: '#27272a',
          borderRadius: 4,
          barThickness: 15
        }]
      },
      options: {
        responsive: false,
        animation: false,
        devicePixelRatio: 2,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#e4e4e7' }, ticks: { color: '#71717a', font: { family: 'Plus Jakarta Sans', size: 9 } } },
          x: { grid: { display: false }, ticks: { color: '#71717a', font: { family: 'Plus Jakarta Sans', size: 9 } } }
        }
      }
    };
  }

  const chart = new Chart(ctx, config);
  const imgData = tempCanvas.toDataURL('image/png');
  chart.destroy();
  tempCanvas.remove();
  return imgData;
}

function downloadPDF() {
  const gradedQuestions = currentSession.questions.filter(q => q.evaluation);
  const average = gradedQuestions.length > 0 
    ? Math.round(gradedQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) / gradedQuestions.length) 
    : 0;
  
  const answered = currentSession.questions.filter(q => q.durationSeconds !== undefined);
  const avgDuration = answered.length > 0 ? Math.round(answered.reduce((acc, q) => acc + q.durationSeconds, 0) / answered.length) : 0;
  const mins = Math.floor(avgDuration / 60);
  const secs = avgDuration % 60;
  const pacingText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  
  const scoreImg = generatePDFChart('line', currentSession.questions.map((_, idx) => `Q${idx + 1}`), currentSession.questions.map((q, idx) => q.evaluation ? q.evaluation.score : 0), 100);
  const timeImg = generatePDFChart('bar', currentSession.questions.map((_, idx) => `Q${idx + 1}`), currentSession.questions.map((q, idx) => q.durationSeconds || 0), null);

  const printEl = document.createElement('div');
  printEl.className = "p-10 bg-white text-zinc-900 font-sans";
  printEl.style.width = "680px";
  printEl.style.color = "#09090b";
  printEl.style.backgroundColor = "#ffffff";
  printEl.style.padding = "30px";
  
  let questionsHtml = '';
  currentSession.questions.forEach((q, i) => {
    const strengths = (q.evaluation?.strengths || []).map(s => `<li style="margin-bottom: 6px;">• ${s}</li>`).join('');
    const improvements = (q.evaluation?.missingPoints || q.evaluation?.improvements || []).map(imp => `<li style="margin-bottom: 6px;">• ${imp}</li>`).join('');
    
    questionsHtml += `
      <div style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #e4e4e7; page-break-inside: avoid; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #09090b; font-family: 'Space Grotesk', sans-serif;">Question ${i + 1} (${q.category || 'General'})</h4>
          <span style="font-size: 15px; font-weight: 700; color: #18181b;">Score: ${q.evaluation ? q.evaluation.score : 'N/A'}/100</span>
        </div>
        <p style="font-size: 13.5px; color: #3f3f46; margin: 0 0 15px 0; line-height: 1.5; font-style: italic;">"${q.question}"</p>
        
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h5 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Key Strengths</h5>
            <ul style="margin: 0; padding: 0; list-style: none; font-size: 12.5px; color: #27272a; line-height: 1.4;">
              ${strengths || '<li style="color:#a1a1aa;">No specific strengths noted.</li>'}
            </ul>
          </div>
          <div style="flex: 1;">
            <h5 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Areas for Improvement</h5>
            <ul style="margin: 0; padding: 0; list-style: none; font-size: 12.5px; color: #52525b; line-height: 1.4;">
              ${improvements || '<li style="color:#a1a1aa;">No improvements required.</li>'}
            </ul>
          </div>
        </div>
        
        ${q.evaluation?.idealAnswer ? `
          <div style="margin-top: 15px; padding: 12px 16px; background: #f4f4f5; border-radius: 8px; border: 1px solid #e4e4e7;">
            <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 5px; letter-spacing: 0.05em;">Ideal Response Guide</span>
            <p style="margin: 0; font-size: 12px; color: #3f3f46; line-height: 1.45;">${q.evaluation.idealAnswer}</p>
          </div>
        ` : ''}
      </div>
    `;
  });

  printEl.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #09090b; padding-bottom: 20px; margin-bottom: 30px; font-family: 'Space Grotesk', sans-serif;">
      <div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #09090b; letter-spacing: -0.02em;">INTERVIEW COACH</h1>
        <h2 style="margin: 4px 0 0 0; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; font-family: 'Plus Jakarta Sans', sans-serif;">Performance Evaluation Report</h2>
      </div>
      <div style="text-align: right; font-family: 'Plus Jakarta Sans', sans-serif;">
        <span style="font-size: 11px; font-weight: 700; color: #09090b; tracking: 0.05em;">CODE MEDIA LABS</span>
        <span style="display: block; font-size: 10px; color: #71717a; margin-top: 2px;">codemedialabs.in</span>
      </div>
    </div>
    
    <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 35px; font-family: 'Plus Jakarta Sans', sans-serif;">
      <div style="flex: 1; padding: 15px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7; text-align: center;">
        <span style="display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 5px; letter-spacing: 0.05em;">Overall Score</span>
        <span style="font-size: 26px; font-weight: 700; color: #09090b; font-family: 'Space Grotesk', sans-serif;">${average}%</span>
      </div>
      <div style="flex: 1; padding: 15px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7; text-align: center;">
        <span style="display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 5px; letter-spacing: 0.05em;">Average Pacing</span>
        <span style="font-size: 26px; font-weight: 700; color: #09090b; font-family: 'Space Grotesk', sans-serif;">${pacingText}</span>
      </div>
      <div style="flex: 1; padding: 15px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7; text-align: center;">
        <span style="display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 5px; letter-spacing: 0.05em;">Target Profile</span>
        <span style="font-size: 13px; font-weight: 700; color: #09090b; display: block; margin-top: 4px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-family: 'Space Grotesk', sans-serif;">${currentSession.role}</span>
        <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #71717a; tracking: 0.05em;">${currentSession.level}</span>
      </div>
    </div>
    
    ${(scoreImg || timeImg) ? `
      <div style="display: flex; gap: 15px; margin-bottom: 40px; page-break-inside: avoid; font-family: 'Plus Jakarta Sans', sans-serif;">
        ${scoreImg ? `
          <div style="flex: 1; border: 1px solid #e4e4e7; border-radius: 12px; padding: 15px; text-align: center; background: #ffffff;">
            <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 10px; letter-spacing: 0.05em;">Score Trend</span>
            <img src="${scoreImg}" style="width: 100%; height: auto; max-height: 160px;" />
          </div>
        ` : ''}
        ${timeImg ? `
          <div style="flex: 1; border: 1px solid #e4e4e7; border-radius: 12px; padding: 15px; text-align: center; background: #ffffff;">
            <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 10px; letter-spacing: 0.05em;">Response Pacing</span>
            <img src="${timeImg}" style="width: 100%; height: auto; max-height: 160px;" />
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="margin-top: 30px;">
      <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; border-bottom: 2px solid #09090b; padding-bottom: 6px; margin-bottom: 20px; color: #09090b; letter-spacing: -0.01em;">Detailed Feedback</h3>
      ${questionsHtml}
    </div>
    
    <div style="margin-top: 40px; border-top: 1px solid #e4e4e7; padding-top: 15px; text-align: center; font-size: 10px; color: #71717a; font-family: 'Plus Jakarta Sans', sans-serif; page-break-inside: avoid; line-height: 1.5;">
      <span>Report generated by Interview Coach on ${new Date(currentSession.createdAt).toLocaleDateString()}</span><br/>
      <span style="font-weight: 600; color: #27272a; display: block; margin-top: 4px;">Designed & Developed by Code Media Labs • https://codemedialabs.in</span>
    </div>
  `;

  document.body.appendChild(printEl);

  const opt = {
    margin:       15,
    filename:     `interview-report-${currentSession.role.toLowerCase().replace(/\s+/g, '-')}-${currentSession.id.slice(0, 8)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(printEl).save().then(() => {
    printEl.remove();
  });
}

// --- Chat Rendering ---
function renderQuestion(q, index) {
  questionStartTime = Date.now();
  const expected = (q.expectedTopics || []).map(t => `<span class="inline-block bg-surface-900 text-surface-200 text-xs px-2.5 py-1 rounded-lg mt-2 mr-2 font-medium border border-surface-800">${t}</span>`).join('');
  const html = `
    <div class="flex flex-col mb-4 fade-in">
      <div class="flex items-end gap-3 mb-2">
        <div class="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-950 text-xs font-bold shadow-md flex-shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
        <div class="text-xs text-surface-600 font-bold tracking-widest uppercase">Question ${index+1}/${currentSession.totalQuestions}</div>
      </div>
      <div class="ml-12 bg-surface-900 border border-surface-800 text-slate-200 px-6 py-5 rounded-3xl rounded-tl-none max-w-[85%] shadow-sm">
        <p class="text-base leading-relaxed">${q.question}</p>
        <div class="mt-4 border-t border-surface-800 pt-3">
           <span class="text-xs font-semibold text-surface-600 uppercase tracking-wider">Expected Signals:</span><br/>
           ${expected}
        </div>
      </div>
    </div>
  `;
  document.getElementById('interview-history').insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

function renderAnswer(ans) {
  const html = `
    <div class="flex flex-col items-end mb-8 fade-in">
      <div class="bg-surface-100 text-surface-950 px-6 py-5 rounded-3xl rounded-tr-none max-w-[85%] font-medium shadow-md">
        <p class="text-base leading-relaxed">${ans}</p>
      </div>
    </div>
  `;
  document.getElementById('interview-history').insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

function renderEvaluation(eval) {
  const html = `
    <div class="flex flex-col mb-8 fade-in">
      <div class="ml-12 bg-surface-900 border border-surface-800 text-slate-300 px-6 py-5 rounded-3xl max-w-[85%] shadow-sm relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-white"></div>
        <div class="flex items-center gap-2 mb-3">
           <div class="text-xs font-bold uppercase tracking-widest text-white">Evaluation Score: ${eval.score}/100</div>
        </div>
        <p class="text-base leading-relaxed">${eval.feedback}</p>
      </div>
    </div>
  `;
  document.getElementById('interview-history').insertAdjacentHTML('beforeend', html);
  document.getElementById('interview-meta').textContent = `${currentSession.role} (${currentSession.level}) - ${currentSession.completedQuestions}/${currentSession.totalQuestions} Completed`;
  scrollToBottom();
}

function appendChatBubble(role, text) {
  const html = `
    <div class="flex flex-col mb-8 fade-in items-center">
      <span class="bg-surface-900 text-surface-400 text-xs px-4 py-2 rounded-full border border-surface-800 tracking-wider uppercase font-semibold shadow-sm">${text}</span>
    </div>
  `;
  document.getElementById('interview-history').insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById('interview-history');
  container.scrollTop = container.scrollHeight;
}
