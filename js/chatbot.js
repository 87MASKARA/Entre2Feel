document.addEventListener("DOMContentLoaded", () => {
    // Inject CSS for the chatbot
    const style = document.createElement('style');
    style.innerHTML = `
        .chatbot-container {
            position: fixed;
            bottom: 25px;
            left: 25px;
            z-index: 9999;
            font-family: 'DM Sans', sans-serif;
        }
        .chatbot-btn {
            background: #ffffff;
            color: var(--primary);
            border: 2px solid var(--primary);
            border-radius: 50%;
            width: 65px;
            height: 65px;
            box-shadow: 0 8px 25px rgba(26, 143, 160, 0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        .chatbot-btn:hover {
            transform: scale(1.1);
        }
        .chatbot-window {
            display: none;
            position: absolute;
            bottom: 85px;
            left: 0;
            width: 350px;
            height: 500px;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
            flex-direction: column;
            border: 1px solid var(--gray-100);
            transform-origin: bottom left;
            animation: chatPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes chatPop {
            0% { opacity: 0; transform: scale(0.5); }
            100% { opacity: 1; transform: scale(1); }
        }
        .chatbot-header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: #fff;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
        }
        .chatbot-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
        }
        .chatbot-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            background: #f8fafc;
        }
        .chat-msg {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 15px;
            font-size: 0.95rem;
            line-height: 1.4;
            word-wrap: break-word;
        }
        .chat-msg.bot {
            background: #fff;
            color: var(--text);
            border: 1px solid var(--gray-100);
            border-bottom-left-radius: 5px;
            align-self: flex-start;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }
        .chat-msg.user {
            background: var(--primary);
            color: #fff;
            border-bottom-right-radius: 5px;
            align-self: flex-end;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .chatbot-input-area {
            padding: 15px;
            background: #fff;
            border-top: 1px solid var(--gray-100);
            display: flex;
            gap: 10px;
        }
        .chatbot-input {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid var(--gray-100);
            border-radius: 20px;
            outline: none;
            transition: border 0.3s;
        }
        .chatbot-input:focus {
            border-color: var(--primary);
        }
        .chatbot-send {
            background: var(--primary);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        .chatbot-send:hover {
            background: var(--primary-dark);
        }
        .typing-indicator {
            display: none;
            padding: 10px 15px;
            background: #fff;
            border-radius: 15px;
            border-bottom-left-radius: 5px;
            align-self: flex-start;
            border: 1px solid var(--gray-100);
        }
        .typing-indicator span {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            margin: 0 2px;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Inject HTML for the chatbot
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.innerHTML = `
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">🤖</span>
                    <div>
                        <div style="font-size: 0.9rem;">BioPeptix IA Asesor</div>
                        <div style="font-size: 0.7rem; color: #7EE8E0;">En línea</div>
                    </div>
                </div>
                <button class="chatbot-close" id="chatbot-close">✕</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chat-msg bot">¡Hola! Soy tu asesor virtual experto en péptidos. ¿En qué te puedo ayudar hoy para optimizar tus resultados?</div>
                <div class="typing-indicator" id="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
            <div class="chatbot-input-area">
                <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Escribe tu mensaje aquí..." autocomplete="off" />
                <button class="chatbot-send" id="chatbot-send">➤</button>
            </div>
        </div>
        <button class="chatbot-btn" id="chatbot-btn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>
    `;
    document.body.appendChild(container);

    const chatbotBtn = document.getElementById('chatbot-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    let isOpen = false;

    function toggleChat() {
        isOpen = !isOpen;
        if(isOpen) {
            chatbotWindow.style.display = 'flex';
            chatbotInput.focus();
        } else {
            chatbotWindow.style.display = 'none';
        }
    }

    chatbotBtn.addEventListener('click', toggleChat);
    chatbotClose.addEventListener('click', toggleChat);

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg ' + sender;
        msgDiv.innerText = text;
        chatbotMessages.insertBefore(msgDiv, typingIndicator);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    async function sendMessage() {
        const text = chatbotInput.value.trim();
        if(!text) return;
        
        addMessage(text, 'user');
        chatbotInput.value = '';
        
        typingIndicator.style.display = 'block';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            typingIndicator.style.display = 'none';
            addMessage(data.reply, 'bot');
        } catch (error) {
            typingIndicator.style.display = 'none';
            addMessage('Lo siento, hubo un error de conexión. Por favor intenta nuevamente.', 'bot');
            console.error('Chat error:', error);
        }
    }

    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});
