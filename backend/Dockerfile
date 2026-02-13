FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create a startup script that handles database initialization
RUN chmod +x /app/scripts/initdb.js || true

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', function(res){if (res.statusCode !== 200) throw new Error('Not ok')})" || exit 1

# Run initialization and start server
CMD sh -c "node scripts/initdb.js && npm start"
