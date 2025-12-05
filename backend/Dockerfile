FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg build-base

# Install yt-dlp
RUN python3 -m venv /venv && \
    /venv/bin/pip install yt-dlp && \
    ln -s /venv/bin/yt-dlp /usr/local/bin/yt-dlp

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Generate Drizzle client
RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "start"]
