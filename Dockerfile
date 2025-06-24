# Use a imagem oficial do Node.js como base
FROM node:20-slim

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# Construir o front-end (client)
RUN npm run build

# Expor a porta que a aplicação irá ouvir
EXPOSE 5000

# Comando para iniciar a aplicação em produção
CMD ["npm", "run", "start:prod"] 