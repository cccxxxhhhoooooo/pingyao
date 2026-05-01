let currentSessionId = 'PY-' + Math.random().toString(36).substr(2, 9);

// 手动切换输入框收缩/展开
function toggleActionBar() {
    const actionBar = document.querySelector('.action-bar');
    actionBar.classList.toggle('collapsed');
}

function formatContent(text) {
    if (!text) return "";
    let processed = text
        .replace(/###\s+(.*?)(\n|$)/g, '<h3 class="font-bold text-[#8B3A3A] mb-2">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#8B3A3A]">$1</strong>');
    let paragraphs = processed.split(/\n\n+/);
    return paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
}

function newSession() {
    document.getElementById('chatBox').innerHTML = '';
    currentSessionId = 'PY-' + Math.random().toString(36).substr(2, 9);
    addMessage("bot", "🏮 往事清零，烟云重聚。客官请坐，新的一轮寻访已开启。关于平遥古城、晋商风云，您想听使者为您拨开哪段往事？");
    // 确保重置时输入框是展开的
    document.querySelector('.action-bar').classList.remove('collapsed');
}

function sendQuestion() {
    const input = document.getElementById('userInput');
    const question = input.value.trim();
    const showThink = document.getElementById('thinkToggle').checked;
    if (!question) return;

    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML += `<div class="flex justify-end mb-8"><div class="bg-[#5C3A1E] text-white p-5 rounded-2xl rounded-tr-none max-w-[75%] shadow-lg text-sm">${question}</div></div>`;
    input.value = '';

    const botContainer = document.createElement('div');
    botContainer.className = 'mb-10';
    chatBox.appendChild(botContainer);

    let thinkDiv = null;
    let answerDiv = document.createElement('div');
    answerDiv.className = 'answer-section';
    let fullText = "";

    fetch('/chat_stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, session_id: currentSessionId })
    })
    .then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let isThinking = false;

        function read() {
            return reader.read().then(({ done, value }) => {
                if (done) return;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                lines.forEach(line => {
                    const clean = line.replace(/^data:\s*/, '').trim();
                    if (!clean || clean === '[DONE]') return;
                    if (clean.includes('<think>')) {
                        isThinking = true;
                        if (showThink) {
                            thinkDiv = document.createElement('div');
                            thinkDiv.className = 'think-section';
                            thinkDiv.innerHTML = '<div class="font-bold text-[#8B3A3A] mb-2 tracking-widest text-xs">📜 使者正在翻阅古籍...</div>';
                            botContainer.appendChild(thinkDiv);
                        }
                    } else if (clean.includes('</think>')) {
                        isThinking = false;
                        botContainer.appendChild(answerDiv);
                    } else {
                        if (isThinking && showThink && thinkDiv) thinkDiv.innerHTML += clean;
                        else if (!isThinking) {
                            fullText += clean;
                            answerDiv.innerHTML = formatContent(fullText);
                        }
                    }
                });
                chatBox.scrollTop = chatBox.scrollHeight;
                return read();
            });
        }
        return read();
    });
}

function addMessage(role, text) {
    const chatBox = document.getElementById('chatBox');
    const div = document.createElement('div');
    div.className = 'mb-10';
    div.innerHTML = `<div class="answer-section">${text}</div>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
} 

document.addEventListener('DOMContentLoaded', newSession);