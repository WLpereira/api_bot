const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do Render ou 3000 localmente

app.use(express.json());

// Caminho absoluto para o arquivo JSON (melhor compatibilidade em cloud)
const chamadosPath = path.join(__dirname, 'chamados.json');

// Configurações do Chatwoot (USE VARIÁVEIS DE AMBIENTE EM PRODUÇÃO!)
const CHATWOOT_API_BASE_URL = process.env.CHATWOOT_API_BASE_URL || 'SUA_URL_DO_CHATWOOT';
const CHATWOOT_API_ACCESS_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN || 'SEU_TOKEN_DE_ACESSO';

// Endpoint para webhook do Chatwoot
app.post('/webhook/chatwoot', async (req, res) => {
  try {
    console.log('Webhook recebido:', req.body);
    
    const { conversation } = req.body;
    
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      console.log('Nova conversa criada:', conversation.id);

      // Pega o conteúdo da primeira mensagem
      const primeiraMensagem = conversation.messages[0].content;
      console.log('Conteúdo da primeira mensagem:', primeiraMensagem);

      let responseMessage = ''; // Mensagem de resposta para o Chatwoot

      // Lógica de teste: tentar encontrar um chamado com base no conteúdo da mensagem
      try {
        const chamadosData = fs.readFileSync(chamadosPath, 'utf-8');
        const chamados = JSON.parse(chamadosData);
        const chamadoEncontrado = chamados.find(c => c.numero === primeiraMensagem);

        if (chamadoEncontrado) {
          console.log(`Chamado encontrado com o número ${primeiraMensagem}:`, chamadoEncontrado);
          responseMessage = `Chamado encontrado! Detalhes: ${JSON.stringify(chamadoEncontrado)}`;
        } else {
          console.log(`Nenhum chamado encontrado com o número ${primeiraMensagem}.`);
          responseMessage = `Nenhum chamado encontrado com o número ${primeiraMensagem}.`;
        }
      } catch (readError) {
        console.error('Erro ao ler ou processar chamados.json:', readError);
        responseMessage = 'Erro interno ao verificar chamado.';
      }

      // Enviar resposta de volta para o Chatwoot
      const inboxId = conversation.inbox_id;
      const sourceId = conversation.contact_inbox.source_id; // Usar source_id como contact_identifier

      if (CHATWOOT_API_BASE_URL === 'SUA_URL_DO_CHATWOOT' || CHATWOOT_API_ACCESS_TOKEN === 'SEU_TOKEN_DE_ACESSO') {
        console.warn('As variáveis de ambiente CHATWOOT_API_BASE_URL ou CHATWOOT_API_ACCESS_TOKEN não estão configuradas. Não foi possível enviar mensagem para o Chatwoot.');
      } else {
        try {
          const chatwootApiUrl = `${CHATWOOT_API_BASE_URL}/client/api/v1/inboxes/${inboxId}/messages`;
          const messagePayload = {
            source_id: sourceId, // Usar source_id aqui
            message_type: 'outgoing',
            content: responseMessage,
          };

          const headers = {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
          };

          console.log('Enviando mensagem para o Chatwoot:', messagePayload);
          const chatwootResponse = await axios.post(chatwootApiUrl, messagePayload, { headers });
          console.log('Resposta da API do Chatwoot:', chatwootResponse.data);

        } catch (chatwootError) {
          console.error('Erro ao enviar mensagem para o Chatwoot:', chatwootError.response ? chatwootError.response.data : chatwootError.message);
        }
      }

    } else {
      console.log('Webhook recebido, mas sem dados de conversa ou mensagens.');
    }

    return res.status(200).json({ status: 'success', message: 'Webhook recebido e processado (teste).' });
  } catch (error) {
    console.error('Erro geral ao processar webhook:', error);
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