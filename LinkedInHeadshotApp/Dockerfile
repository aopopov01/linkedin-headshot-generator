# React Native Development Environment
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    openjdk-17-jdk \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set up Android SDK (for React Native)
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose Metro bundler port
EXPOSE 8081

# Expose React Native debugger port
EXPOSE 8097

# Expose Expo ports if needed
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start Metro bundler
CMD ["npm", "start"]