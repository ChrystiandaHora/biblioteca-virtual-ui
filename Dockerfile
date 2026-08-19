# =============================================================================
# Interface Vue 3 — build em duas etapas.
#
# Etapa 1 compila o projeto com Node; etapa 2 serve apenas os arquivos
# estáticos com Nginx. A imagem final não carrega Node nem node_modules.
# =============================================================================

# ------------------------------- etapa de build ------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Copiar só os manifests antes do código aproveita o cache: mexer no código
# não reinstala as dependências.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O Vite embute as variáveis VITE_* no bundle em tempo de BUILD, não de
# execução. Por isso a URL da API entra como argumento de build.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ------------------------------ etapa de runtime -----------------------------
FROM nginx:1.27-alpine AS runtime

# Configuração própria: precisamos do fallback de SPA para as rotas do
# vue-router funcionarem em recarregamento direto.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Usa 127.0.0.1 explicitamente, e não `localhost`: dentro do container
# `localhost` resolve primeiro para ::1, o que dependeria do Nginx estar
# escutando em IPv6.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
