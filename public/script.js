// Estado global
let cart = [];
let allProducts = [];
let currentMessages = [];

// Emojis para categorias
const categoryEmojis = {
  'Filtros': '🔍',
  'Óleos': '🛢️',
  'Freios': '🛑',
  'Correntes': '⛓️',
  'Baterias': '🔋',
  'Pneus': '🛞',
  'Suspensão': '🚗',
  'Ignição': '✨',
  'Correias': '〰️'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupCartIcon();
  setupFormListeners();
});

// Carregar produtos
async function loadProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/produtos');
    allProducts = await response.json();
    displayProducts(allProducts);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

// Exibir produtos
function displayProducts(products) {
  const grid = document.getElementById('produtos-grid');
  grid.innerHTML = '';

  if (products.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhum produto encontrado</p>';
    return;
  }

  products.forEach(produto => {
    const card = createProductCard(produto);
    grid.appendChild(card);
  });
}

// Criar card de produto
function createProductCard(produto) {
  const card = document.createElement('div');
  card.className = 'produto-card';
  const emoji = categoryEmojis[produto.categoria] || '🔧';
  const estoqueClass = produto.estoque > 50 ? 'estoque-alto' : 'estoque-baixo';
  const estoqueStatus = produto.estoque > 50 ? `${produto.estoque} em estoque` : `⚠️ Apenas ${produto.estoque}`;

  card.innerHTML = `
    <div class="produto-imagem">${emoji}</div>
    <div class="produto-info">
      <span class="produto-categoria">${produto.categoria}</span>
      <h3 class="produto-nome">${produto.nome}</h3>
      <p class="produto-descricao">${produto.descricao}</p>
      <div class="produto-footer">
        <div>
          <div class="produto-preco">R$ ${produto.preco.toFixed(2)}</div>
          <div class="produto-estoque ${estoqueClass}">${estoqueStatus}</div>
        </div>
        <button class="adicionar-btn" onclick="addToCart(${produto.id})">
          Adicionar
        </button>
      </div>
    </div>
  `;
  return card;
}

// Adicionar ao carrinho
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (product) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    updateCartCount();
    showNotification(`${product.nome} adicionado ao carrinho!`);
  }
}

// Remover do carrinho
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartCount();
  updateCartDisplay();
}

// Atualizar contador do carrinho
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}

// Setup icon de carrinho
function setupCartIcon() {
  const cartIcon = document.querySelector('.cart-icon');
  cartIcon.addEventListener('click', openCart);
}

// Abrir carrinho
function openCart() {
  const modal = document.getElementById('cart-modal');
  modal.style.display = 'block';
  updateCartDisplay();
}

// Fechar carrinho
function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
  const cartItemsDiv = document.getElementById('cart-items');
  const totalDiv = document.getElementById('cart-total');

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p style="text-align: center; padding: 2rem;">Seu carrinho está vazio</p>';
    totalDiv.textContent = '0.00';
    return;
  }

  cartItemsDiv.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.nome}</h4>
        <p>Quantidade: ${item.quantity}</p>
      </div>
      <div>
        <div class="cart-item-price">R$ ${(item.preco * item.quantity).toFixed(2)}</div>
        <button class="remove-item" onclick="removeFromCart(${item.id})">Remover</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
  totalDiv.textContent = total.toFixed(2);
}

// Finalizar compra
function checkout() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
  const message = `Você tem ${cart.length} tipo(s) de produto(s) no carrinho. Total: R$ ${total.toFixed(2)}`;

  // Falar com o chatbot sobre o pedido
  const userInput = document.getElementById('user-input');
  userInput.value = `Gostaria de fazer um pedido. ${message}`;
  sendMessage();

  closeCart();
  document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
}

// Chat - Enviar mensagem
async function sendMessage() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();

  if (!message) return;

  // Adiciona mensagem do usuário
  addMessage(message, true);
  userInput.value = '';
  userInput.focus();

  try {
    // Desabilita o botão enquanto processa
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Enviando...';

    const response = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    sendBtn.disabled = false;
    sendBtn.textContent = 'Enviar';

    if (data.error) {
      addMessage(`❌ Erro: ${data.error}`, false);
    } else {
      addMessage(data.reply, false);
    }
  } catch (error) {
    addMessage('❌ Erro ao conectar com o servidor. Tente novamente.', false);
    console.error('Erro:', error);
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Enviar';
  }
}

// Adicionar mensagem ao chat
function addMessage(content, isUser = false) {
  const chatBox = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = content;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  currentMessages.push({ content, isUser });
}

// Resetar conversa
async function resetChat() {
  try {
    await fetch('http://localhost:3000/chat/reset', { method: 'POST' });
    document.getElementById('chat-box').innerHTML = '';
    currentMessages = [];
    addMessage('Olá! Bem-vindo à AutoPeças Profissional. Como posso ajudá-lo hoje?', false);
    showNotification('Conversa resetada!');
  } catch (error) {
    console.error('Erro ao resetar:', error);
  }
}

// Notificação
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background-color: var(--success-color);
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    z-index: 3000;
    animation: slideUp 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Filtros de produtos
document.getElementById('search-input')?.addEventListener('input', filterProducts);
document.getElementById('category-filter')?.addEventListener('change', filterProducts);

function filterProducts() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('category-filter').value;

  const filtered = allProducts.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm) ||
                         product.descricao.toLowerCase().includes(searchTerm);
    const matchesCategory = !category || product.categoria === category;
    return matchesSearch && matchesCategory;
  });

  displayProducts(filtered);
}

// Fechar modal quando clicar fora
window.addEventListener('click', (event) => {
  const modal = document.getElementById('cart-modal');
  if (event.target === modal) {
    closeCart();
  }
});

// Setup formulário de contato
function setupFormListeners() {
  const form = document.querySelector('.contato-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Obrigado por entrar em contato! Responderemos em breve.');
      form.reset();
    });
  }
}

// Permite enviar mensagem com Enter
document.addEventListener('DOMContentLoaded', () => {
  const userInput = document.getElementById('user-input');
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});