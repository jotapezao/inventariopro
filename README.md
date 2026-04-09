# 📦 Inventário Pro - Guia Mestre de Instalação e Manutenção

Este documento serve como a base de conhecimento central para o sistema **Inventário Pro**. Se você precisar subir o sistema em uma nova conta ou migrar de servidor, este guia contém tudo o que uma IA ou um desenvolvedor precisa saber.

## 🚀 Guia de Deploy no Railway (Passo a Passo)

Para subir o sistema do zero no Railway, siga esta ordem exata:

### 1. Conectar Repositório
Conecte o serviço ao repositório GitHub. O Railway detectará o arquivo `railway.toml` na raiz, que define os comandos de build e start.

### 2. Provisionar PostgreSQL
Adicione um banco de dados **PostgreSQL** ao seu projeto no Railway.
- O Railway criará automaticamente a variável `DATABASE_URL`. O sistema está configurado para ler essa variável e criar as tabelas automaticamente na primeira inicialização.

### 3. Configurar Volume Persistente (CRÍTICO) ⚠️
Sem isso, todas as fotos de produtos serão deletadas a cada novo deploy.
1. No serviço do backend, vá em **Settings** > **Volumes**.
2. Clique em **Add Volume**.
3. **Mount Path**: `/app/backend/uploads`
4. **Size**: 5GB (ou conforme sua necessidade).
- *Isso garante que a pasta de uploads sobreviva a reinicializações do servidor.*

### 4. Variáveis de Ambiente (Variables)
Configure as seguintes variáveis no serviço do backend:
| Variável | Descrição | Exemplo/Sugestão |
| :--- | :--- | :--- |
| `DATABASE_URL` | Link do Postgres (Gerado pelo Railway) | `postgresql://...` |
| `JWT_SECRET` | Chave para assinar tokens de login | `uma_frase_longa_e_aleatoria` |
| `PORT` | Porta do servidor | `8080` (O Railway define sozinha) |

---

## 🛠️ Detalhes da Tecnologia

- **Frontend**: React 19 (Vite) + Tailwind CSS 4.
- **Backend**: Node.js + Express.
- **Banco de Dados**: PostgreSQL com `pg-pool`.
- **Autenticação**: JWT (JSON Web Tokens).

### Estrutura de Pastas
- `/frontend`: Código fonte da interface React.
- `/backend`: API Express e lógica de banco de dados.
- `/backend/uploads`: Onde residem as fotos (montado como volume no Railway).

---

## 💾 Esquema do Banco de Dados

O banco de dados é inicializado automaticamente via `backend/src/database/db.js`. As principais tabelas são:
- `Usuarios`: Gestão de administradores e operadores.
- `Produtos`: Cadastro de itens com suporte a fotos e códigos.
- `Categorias` / `Tipos`: Hierarquia para organização dos materiais.
- `Movimentacoes`: Log completo de todas as entradas e saídas.
- `Solicitacoes`: Pedidos pendentes de aprovação (incluindo acessos públicos).
- `Configuracoes`: Chaves `chave/valor` para nome do sistema, cores e números de WhatsApp.

---

## 🤖 Manual para a Próxima IA (Contexto Técnico)

Se você é uma IA assumindo este projeto, aqui estão as decisões cruciais feitas até agora:

1.  **Sincronização de WhatsApp**: As configurações de `whatsapp_admin` e `whatsapp_notificacao` foram unificadas no frontend para evitar confusão. Sempre busque ambas ou use fallback caso uma esteja vazia.
2.  **Caminhos de Imagem**: O sistema usa caminhos relativos (ex: `uploads/produtos/foto.jpg`) no banco de dados. O frontend e o backend devem tratar isso com cautela para garantir que o prefixo `/` seja adicionado corretamente na exibição.
3.  **Temas Premium**: O design usa CSS Variables (`index.css`) integradas com o Tailwind. Evite usar cores fixas (como `bg-blue-500`) e prefira as variáveis dinâmicas (como `var(--accent)`).
4.  **Importação CSV**: A lógica de importação está em `importController.js`. Ela é tolerante a falhas e cria categorias/tipos automaticamente se eles não existirem na planilha.
5.  **Acesso Público**: A página `SolicitacaoPublica.jsx` permite que usuários sem login criem pedidos. Ela consome configurações da API `/api/configuracoes` que é exposta sem necessidade de token JWT.

---

## ⚙️ Rodando Localmente

1. Clone o repositório.
2. Na raiz: `npm run install:backend && npm run install:frontend`.
3. Configure um arquivo `.env` na pasta `/backend` com seu `DATABASE_URL` local.
4. Para rodar: `npm start` (na raiz).
