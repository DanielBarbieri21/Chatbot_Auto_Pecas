require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Chave da API Gemini (carregada do arquivo .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// Validação da chave API
if (!GEMINI_API_KEY) {
  console.error('❌ ERRO: GEMINI_API_KEY não encontrada no arquivo .env');
  console.log('📝 Crie um arquivo .env baseado no .env.example e adicione sua chave da API');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Dados de produtos fictícios
const produtos = [
  { id: 1, nome: 'Filtro de Ar', categoria: 'Filtros', preco: 45.90, estoque: 150, descricao: 'Filtro de ar de alta qualidade para todos os modelos' },
  { id: 2, nome: 'Óleo do Motor 5W-30', categoria: 'Óleos', preco: 28.50, estoque: 200, descricao: 'Óleo sintetizado premium para motor' },
  { id: 3, nome: 'Pastilha de Freio', categoria: 'Freios', preco: 89.90, estoque: 120, descricao: 'Pastilha de freio com alta durabilidade' },
  { id: 4, nome: 'Corrente de Distribuição', categoria: 'Correntes', preco: 156.00, estoque: 80, descricao: 'Corrente de distribuição original' },
  { id: 5, nome: 'Bateria 60Ah', categoria: 'Baterias', preco: 320.00, estoque: 95, descricao: 'Bateria de carro 60Ah, 12V' },
  { id: 6, nome: 'Pneu Aro 16', categoria: 'Pneus', preco: 280.00, estoque: 200, descricao: 'Pneu aro 16 com 5 anos de garantia' },
  { id: 7, nome: 'Amortecedor Dianteiro', categoria: 'Suspensão', preco: 250.00, estoque: 60, descricao: 'Amortecedor de suspensão dianteiro' },
  { id: 8, nome: 'Vela de Ignição', categoria: 'Ignição', preco: 15.90, estoque: 300, descricao: 'Vela de ignição premium' },
  { id: 9, nome: 'Correia Serpentina', categoria: 'Correias', preco: 68.50, estoque: 140, descricao: 'Correia serpentina de alta durabilidade' },
  { id: 10, nome: 'Disco de Freio', categoria: 'Freios', preco: 120.00, estoque: 110, descricao: 'Disco de freio ventilado' }
];

// Histórico de mensagens para contexto
let conversationHistory = [];

// Rota para obter produtos
app.get('/api/produtos', (req, res) => {
  res.json(produtos);
});

// Rota para obter produto por ID
app.get('/api/produtos/:id', (req, res) => {
  const produto = produtos.find(p => p.id === parseInt(req.params.id));
  if (produto) {
    res.json(produto);
  } else {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

// Rota para chat com Gemini
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória' });
  }

  try {
    // Mantém histórico de conversa para melhor contexto
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Contexto do sistema
    const systemPrompt = `Você é um assistente especializado em auto peças da loja fictícia "AutoPeças Profissional". 
    
Você tem conhecimento sobre os seguintes produtos:
${produtos.map(p => `- ${p.nome}: R$ ${p.preco.toFixed(2)} (${p.estoque} em estoque) - ${p.descricao}`).join('\n')}

INSTRUÇÕES IMPORTANTES:
1. Sempre responda em português brasileiro
2. Seja profissional, amigável e eficiente
3. Recomende produtos baseado nas necessidades do cliente
4. Informe preços e disponibilidade quando perguntado
5. Para pedidos, explique o processo
6. Se não souber algo específico, ofereça ajuda para falar com um especialista
7. Use linguagem simples e clara
8. Responda de forma concisa mas informativa`;

    // Chamada à API Gemini
    try {
      // Formato mais simples possível para a API
      const fullPrompt = `${systemPrompt}\n\n--- Conversa Atual ---\nCliente: ${message}`;
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('Resposta inválida da API');
      }

      const reply = response.data.candidates[0].content.parts[0].text;

      // Adiciona resposta ao histórico
      conversationHistory.push({
        role: 'model',
        parts: [{ text: reply }]
      });

      // Limita histórico a 10 mensagens anteriores para economia de tokens
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }

      res.json({ reply });
    } catch (apiError) {
      console.error('Erro na API Gemini:', apiError.response?.status, apiError.message);
      
      // Fallback - resposta padrão quando API falha
      const reply = `Olá! Infelizmente tive um problema ao processar sua pergunta através da IA. 
Mas posso te ajudar com informações básicas sobre nossos produtos:

${message.toLowerCase().includes('prec') ? 'Nossos produtos variam de R$ 15,90 a R$ 320,00. Qual produto específico você gostaria de saber o preço?' : 
message.toLowerCase().includes('entrega') ? 'Entregamos em todo o Brasil com prazos de 3 a 7 dias úteis.' :
message.toLowerCase().includes('horas') || message.toLowerCase().includes('horário') ? 'Funcionamos de segunda a sexta das 8h às 18h, e sábado das 9h às 13h.' :
message.toLowerCase().includes('produto') ? 'Temos produtos em 9 categorias diferentes: Filtros, Óleos, Freios, Correntes, Baterias, Pneus, Suspensão, Ignição e Correias.' :
'Por favor, descreva melhor sua dúvida e farei de tudo para ajudá-lo!'}

Para uma conversa mais completa, recarregue a página e tente novamente.`;

      conversationHistory.push({
        role: 'model',
        parts: [{ text: reply }]
      });

      res.json({ reply });
    }
  } catch (error) {
    console.error('Erro na API Gemini:', error.response?.status, error.message);
    const errorMsg = error.response?.status === 404 
      ? 'Chave da API inválida ou expirada. Verifique a chave.'
      : 'Erro ao processar. Tente novamente em alguns segundos.';
    res.status(500).json({ error: errorMsg });
  }
});

// Rota para resetar conversa
app.post('/chat/reset', (req, res) => {
  conversationHistory = [];
  res.json({ message: 'Conversa resetada' });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚗 Servidor AutoPeças rodando em http://localhost:${port}`);
  console.log(`📱 Acesse o site em http://localhost:${port}`);
});