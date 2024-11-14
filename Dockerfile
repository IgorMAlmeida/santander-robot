# Use uma imagem base oficial do Node.js
FROM node:20.11.1

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Configura o Puppeteer para baixar o Chrome dentro do cache
ENV PUPPETEER_SKIP_DOWNLOAD=true

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

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

# Copia os arquivos do projeto para o diretório de trabalho
COPY package.json /usr/src/app/package.json

# Instala as dependências do projeto
RUN npm install

# Instala o Puppeteer no cache (sem baixar o Chrome novamente)
RUN npx puppeteer install --chrome

RUN mkdir -p /usr/src/app/user_data && chmod -R 777 /usr/src/app/user_data

# Configura o display para o Chrome headless
ENV DISPLAY=:99

# Expõe a porta que a aplicação vai usar
EXPOSE 3050

# Comando para rodar a aplicação
CMD ["npm", "start"]
