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
const CHATWOOT_API_BASE_URL = process.env.CHATWOOT_API_BASE_URL || 'https://chat.dataplace.app';
const CHATWOOT_API_ACCESS_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN || 'yUCCgoLHHejJbK7WWGVFLq61';

// Função auxiliar para enviar mensagem ao Chatwoot
async function enviarMensagemChatwoot(inboxId, sourceId, mensagem) {
  if (CHATWOOT_API_BASE_URL === 'SUA_URL_DO_CHATWOOT' || CHATWOOT_API_ACCESS_TOKEN === 'SEU_TOKEN_DE_ACESSO') {
    console.warn('Configurações do Chatwoot não definidas.');
    return;
  }

  try {
    const accountId = 1; // Seu ID da conta do Chatwoot
    const chatwootApiUrl = `${CHATWOOT_API_BASE_URL}/client/api/v1/accounts/${accountId}/inboxes/${inboxId}/messages`;
    const messagePayload = {
      source_id: sourceId,
      message_type: 'outgoing',
      content: mensagem,
    };

    const headers = {
      'Content-Type': 'application/json',
      'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
    };

    await axios.post(chatwootApiUrl, messagePayload, { headers });
  } catch (error) {
    console.error('Erro ao enviar mensagem para o Chatwoot:', error);
  }
}

app.post('/webhook/chatwoot', async (req, res) => {
  try {
    const { conversation } = req.body;
    
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return res.status(200).json({ status: 'success' });
    }

    const mensagemAtual = conversation.messages[conversation.messages.length - 1].content;
    const inboxId = conversation.inbox_id;
    const sourceId = conversation.contact_inbox.source_id;

    // Verifica se é a primeira mensagem da conversa
    if (conversation.messages.length === 1) {
      const mensagemBoasVindas = "Olá! A Dataplace agradece seu contato. Como podemos ajudar?\n\n1 - Suporte\n2 - Comercial/Financeiro\n3 - Outros";
      await enviarMensagemChatwoot(inboxId, sourceId, mensagemBoasVindas);
      return res.status(200).json({ status: 'success' });
    }

    // Processa a resposta do usuário
    switch (mensagemAtual.trim()) {
      case '1':
        await enviarMensagemChatwoot(inboxId, sourceId, "Por favor, informe o número do seu chamado:");
        break;
      case '2':
      case '3':
        await enviarMensagemChatwoot(inboxId, sourceId, "Um de nossos colaboradores entrará em contato em breve. Obrigado!");
        break;
      default:
        // Verifica se a mensagem pode ser um número de chamado
        if (/^\d+$/.test(mensagemAtual.trim())) {
          try {
            const chamadosData = fs.readFileSync(chamadosPath, 'utf-8');
            const chamados = JSON.parse(chamadosData);
            const chamadoEncontrado = chamados.find(c => c.numero === mensagemAtual.trim());

            if (chamadoEncontrado) {
              await enviarMensagemChatwoot(inboxId, sourceId, "Chamado encontrado! Um de nossos técnicos entrará em contato em breve.");
            } else {
              await enviarMensagemChatwoot(inboxId, sourceId, "Chamado não encontrado. Por favor, abra um novo chamado através do link: https://suporte.dataplace.com.br");
            }
          } catch (error) {
            console.error('Erro ao verificar chamado:', error);
            await enviarMensagemChatwoot(inboxId, sourceId, "Desculpe, ocorreu um erro ao verificar o chamado. Por favor, tente novamente mais tarde.");
          }
        }
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