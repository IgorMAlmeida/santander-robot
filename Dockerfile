# Use uma imagem base oficial do Node.js
FROM node:20.11.1
# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Instala as dependências do Puppeteer e do Express
# Nota: o Puppeteer precisa do Chrome, então estamos instalando dependências para o Chrome funcionar no Docker
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    curl \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-symbola \
    fonts-noto \
    fonts-freefont-ttf \
    xvfb \
    dbus \
    --no-install-recommends \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove \
    && mkdir -p /var/lib/apt/lists/partial


ENV DISPLAY=:99

# Copia os arquivos do projeto para o diretório de trabalho
COPY . .

# Instala todas as dependências do projeto, incluindo o Puppeteer e o Express
RUN npm install puppeteer browsers install chrome 
RUN npm install -g nodemon

# Expõe a porta que sua aplicação Express.js vai usar
EXPOSE 3050

# Comando para rodar a aplicação
CMD ["npm", "start"]
