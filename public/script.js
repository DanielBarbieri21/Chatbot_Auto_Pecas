const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = content;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Rola para o final
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Adiciona a mensagem do usuário ao chat
  addMessage(message, true);
  userInput.value = ''; // Limpa o campo de entrada

  try {
    // Envia a mensagem para o back-end
    const response = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    if (data.error) {
      addMessage('Erro: ' + data.error);
    } else {
      addMessage(data.reply);
    }
  } catch (error) {
    addMessage('Erro ao conectar com o servidor');
    console.error(error);
  }
}

// Permite enviar a mensagem ao pressionar "Enter"
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});