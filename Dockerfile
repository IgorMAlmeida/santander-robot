FROM node:20.11.1

WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

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
    --no-install-recommends && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    apt-get autoremove && \
    mkdir -p /var/lib/apt/lists/partial

COPY package.json package-lock.json* ./

RUN npm install

RUN npx puppeteer browsers install chrome || true

RUN mkdir -p /usr/src/app/user_data && chmod -R 777 /usr/src/app/user_data

ENV DISPLAY=:99

COPY . .

EXPOSE 3050

CMD ["npm", "start"]
