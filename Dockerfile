# Usar uma imagem base oficial do Node.js
FROM node:18-alpine

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copiar o arquivo package.json e package-lock.json
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o código do projeto para dentro do contêiner
COPY . .

# Expor a porta na qual o aplicativo será executado
EXPOSE 3000

# Definir o comando padrão para iniciar o servidor
CMD ["npm", "start"]