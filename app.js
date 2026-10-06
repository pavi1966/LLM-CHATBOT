document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const modelSelect = document.getElementById('model-select');

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value.trim() !== '') {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    });

    // Handle Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Add user message to UI
        addMessage(text, 'user');
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Show loading indicator
        const loadingId = addLoading();

        const model = modelSelect.value;
        const startTime = performance.now();

        try {
            // Get current time in IST
            const now = new Date();
            const istDateTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'full', timeStyle: 'long' });
            
            const systemPrompt = `You are a highly efficient, direct, and factual AI assistant. Respond with the shortest possible, accurate answer. For simple facts, definitions, or questions like 'What is...', provide ONLY the exact answer without any introductory text, concluding remarks, or conversational filler. Do NOT repeat the user's question. Do NOT provide multiple interpretations unless the question is completely ambiguous. The current system date and time is ${istDateTime} in India (IST). Use this real-time information to accurately answer any questions about the current date or time directly.`;

            // Call local Ollama API
            // Note: Ollama needs to be running locally with the selected model pulled
            // (e.g. `ollama run llama3.2:3b`)
            // If you get CORS errors, you might need to start Ollama with:
            // OLLAMA_ORIGINS="*" ollama serve
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: text,
                    system: systemPrompt,
                    stream: false, // Using non-streaming for simplicity
                    options: {
                        temperature: 0.2, // Low temperature for more direct, factual answers
                        num_predict: 150 // Limit token generation for faster, shorter responses
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

            // Remove loading indicator
            removeMessage(loadingId);

            // Add AI response to UI
            addMessage(data.response, 'ai', timeTaken);

        } catch (error) {
            console.error('Error calling Ollama API:', error);
            removeMessage(loadingId);
            
            let errorMessage = "Sorry, I couldn't connect to the local AI model. ";
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage += "Please make sure Ollama is running locally (http://localhost:11434) and the model is installed.";
            } else {
                errorMessage += error.message;
            }
            
            addMessage(errorMessage, 'ai');
        }
    }

    function addMessage(text, sender, timeTaken = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `avatar ${sender}-avatar`;
        avatarDiv.textContent = sender === 'user' ? 'U' : 'AI';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Plain text for user and AI (escape HTML)
        const p = document.createElement('p');
        p.textContent = text;
        p.style.whiteSpace = 'pre-wrap';
        contentDiv.appendChild(p);

        if (timeTaken) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-meta';
            metaDiv.textContent = `${timeTaken} seconds`;
            contentDiv.appendChild(metaDiv);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);
        
        scrollToBottom();
    }

    function addLoading() {
        const id = 'loading-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        messageDiv.id = id;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar ai-avatar';
        avatarDiv.textContent = 'AI';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        
        contentDiv.appendChild(loadingDiv);
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);
        
        scrollToBottom();
        return id;
    }

    function removeMessage(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
