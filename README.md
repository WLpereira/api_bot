# API de Verificação de Chamados

API simples para verificação de chamados usando Node.js e Express.

## Requisitos

- Node.js
- npm ou yarn

## Instalação

1. Clone o repositório
```bash
git clone [URL_DO_SEU_REPOSITÓRIO]
```

2. Instale as dependências
```bash
npm install
```

3. Inicie o servidor
```bash
npm start
```

## Endpoints

### Verificar Chamado
- **POST** `/verificar-chamado`
- **Body**: `{ "numero": "123456" }`
- **Resposta**: 
  ```json
  {
    "existe": true,
    "dados": {
      // dados do chamado
    }
  }
  ```

### Health Check
- **GET** `/health`
- **Resposta**: "API está funcionando!"

## Deploy no Render

1. Crie uma conta no [Render](https://render.com)
2. Crie um novo Web Service
3. Conecte com seu repositório Git
4. Configure as seguintes variáveis:
   - Build Command: `npm install`
   - Start Command: `node index.js` 