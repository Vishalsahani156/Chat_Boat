# redeploy trigger: recover backend after failed migration deploy (804c7b3)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# migrate is best-effort: a failed/pending migration must never block server startup
# (a blocking migration once reverted the whole backend to a pre-feature build).
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'prisma migrate deploy failed; starting with existing schema'; node dist/server.js"]
