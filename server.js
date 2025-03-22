require('dotenv').config(); // Carrega as variáveis do .env
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuração da API do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors()); // Permite requisições do front-end
app.use(express.json()); // Permite parsing de JSON nas requisições
app.use(express.static('public')); // Serve os arquivos estáticos do front-end

// Rota para processar mensagens do usuário
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória' });
  }

  try {
    // Configuração do prompt com contexto sobre "Vitte" e auto peças
    const prompt = `
      Você é um assistente especializado em auto peças da empresa Vitte. 
      Responda perguntas sobre peças de carros, como preços, disponibilidade, 
      compatibilidade ou detalhes técnicos. Seja útil e forneça respostas 
      claras e precisas. Se não souber algo, diga que precisa verificar com 
      a equipe da Vitte. Aqui está a mensagem do usuário: "${message}"
    `;

    // Chamada à API do ChatGPT
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Ou "gpt-4" se você tiver acesso
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message },
      ],
      max_tokens: 500, // Limite de tokens para a resposta
      temperature: 0.7, // Controla a criatividade (0 a 1)
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Erro na API do ChatGPT:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});