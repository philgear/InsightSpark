# Use Go as the base since it's the heaviest dependency for GKE tools
FROM golang:1.22-bookworm

# 1. Install Node.js (for your Angular/Frontend builds)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# 2. Install Dart SDK
RUN apt-get update && apt-get install -y apt-transport-https wget gnupg && \
    wget -qO- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/dart.gpg && \
    echo 'deb [signed-by=/usr/share/keyrings/dart.gpg] https://storage.googleapis.com/download.dartlang.org/linux/debian stable main' > /etc/apt/sources.list.d/dart.list && \
    apt-get update && apt-get install -y dart

# 3. Install Google Cloud SDK (gcloud)
RUN curl -sSL https://sdk.cloud.google.com | bash
ENV PATH="/root/google-cloud-sdk/bin:${PATH}"

# Set up your workspace
WORKDIR /app
COPY . .

# Build your Angular frontend (resolves the 'dist' errors in Go)
RUN npm install --legacy-peer-deps && npx ng build --configuration=production

# Expose the GKE/MCP port
EXPOSE 8080