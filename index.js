const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/verificar-chamado', (req, res) => {
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ erro: 'Número do chamado não informado.' });
  }

  const chamados = JSON.parse(fs.readFileSync('chamados.json', 'utf-8'));
  const chamado = chamados.find(c => c.numero === numero);

  if (!chamado) {
    return res.status(404).json({ existe: false, mensagem: 'Chamado não encontrado.' });
  }

  return res.json({
    existe: true,
    dados: chamado
  });
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});
