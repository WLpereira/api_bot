const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do Render ou 3000 localmente

app.use(express.json());

// Caminho absoluto para o arquivo JSON (melhor compatibilidade em cloud)
const chamadosPath = path.join(__dirname, 'chamados.json');

// Endpoint para webhook do Chatwoot
app.post('/webhook/chatwoot', (req, res) => {
  try {
    console.log('Webhook recebido:', req.body);
    
    // Aqui você pode processar os dados do webhook
    const { conversation } = req.body;
    
    if (conversation) {
      console.log('Nova conversa criada:', conversation.id);
      // Aqui você pode adicionar sua lógica de processamento
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ erro: 'Falha ao processar webhook' });
  }
});

// Rota para verificar chamado
app.post('/verificar-chamado', (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({ erro: 'Número do chamado não informado.' });
    }

    // Lê o arquivo de forma assíncrona (melhor para produção)
    const chamadosData = fs.readFileSync(chamadosPath, 'utf-8');
    const chamados = JSON.parse(chamadosData);
    const chamado = chamados.find(c => c.numero === numero);

    if (!chamado) {
      return res.status(404).json({ existe: false, mensagem: 'Chamado não encontrado.' });
    }

    return res.json({
      existe: true,
      dados: chamado
    });

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500).json({ erro: 'Falha interna no servidor.' });
  }
});

// Rota de health check (útil para o Render)
app.get('/health', (req, res) => {
  res.status(200).send('API está funcionando!');
});

app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});