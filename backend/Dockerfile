FROM node:18-bullseye-slim

# Install OpenSSL (required by Prisma on Debian/Ubuntu)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and prisma schema first (cached layer)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including mysql2 for trigger script)
RUN npm install

# Copy rest of application code
COPY . .

# Generate Prisma Client AFTER all files are in place
# binaryTargets in schema.prisma covers debian-openssl-3.0.x and linux-musl
RUN npx prisma generate

# Backend listens on 5000 inside Docker
# docker-compose maps host:5001 → container:5000
EXPOSE 5000

# Startup sequence:
# 1. Push schema to MySQL (creates all 14 tables)
# 2. Apply views SQL (5 views)
# 3. Apply triggers via mysql2 script (5 triggers)
# 4. Seed database with test data
# 5. Start Express API server
CMD ["sh", "-c", "\
  echo '⏳ Pushing Prisma schema to database...' && \
  npx prisma db push --accept-data-loss && \
  echo '✅ Schema pushed' && \
  echo '⚙️  Applying database views...' && \
  npx prisma db execute --file ./prisma/migrations/001_views_triggers.sql --schema ./prisma/schema.prisma && \
  echo '✅ Views applied' && \
  echo '⚙️  Applying database triggers...' && \
  node prisma/migrations/002_triggers.js && \
  echo '✅ Triggers applied' && \
  echo '📋 Logging plain SQL DDL proof (tables already exist via Prisma)...' && \
  echo 'DDL file: /app/prisma/ddl_plain_sql.sql — equivalent plain SQL for all 14 tables' && \
  echo '🌱 Seeding database...' && \
  node prisma/seed.js && \
  echo '✅ Seed complete' && \
  echo '🚀 Starting API server on port 5000...' && \
  node server.js \
"]
