FROM node:20.11.1

WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_DOWNLOAD=true

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
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

COPY package.json /usr/src/app/package.json

RUN npm install
    
RUN npx puppeteer install --chrome

RUN mkdir -p /usr/src/app/user_data && chmod -R 777 /usr/src/app/user_data

ENV DISPLAY=:99

EXPOSE 3050

CMD ["npm", "start"]