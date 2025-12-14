# Build stage
FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps support
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application with Vite
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
