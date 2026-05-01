FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages snowflake-connector-python

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY sf-proxy.py ./sf-proxy.py

RUN printf '#!/bin/sh\npython3 /app/sf-proxy.py &\nsleep 2\nexec node /app/server.js\n' > /app/start.sh && chmod +x /app/start.sh

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV SF_PROXY_URL="http://localhost:3001"
CMD ["/app/start.sh"]
