# Gunakan image Node.js sebagai base image
FROM node:16

# Tentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json (jika ada) ke dalam container
COPY package*.json ./

# Install dependencies aplikasi
RUN npm install

# Salin seluruh kode aplikasi ke dalam container
COPY . .

# Tentukan perintah untuk menjalankan aplikasi tergantung mode
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Jika dalam mode development, expose port 3000 untuk development
EXPOSE 7052

# Gunakan nodemon untuk development
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npm run dev; else node npm run start; fi"]
