FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 4000

# Beim Container-Start: Migrationen anwenden, danach Server starten.
# Fuer die allererste Inbetriebnahme kann optional "npm run seed" angehaengt werden,
# um Dummy-Daten zu erzeugen (siehe README).
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
