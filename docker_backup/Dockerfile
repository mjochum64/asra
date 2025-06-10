# Build-Stage
FROM node:18-alpine as build

WORKDIR /app

# Kopieren der Abhängigkeiten und Installation
COPY frontend/package*.json ./
RUN npm ci

# Kopieren des Quellcodes
COPY frontend/ .

# Produktions-Build erstellen
RUN npm run build

# Produktions-Stage
FROM nginx:alpine

# Kopieren der statischen Assets aus der Build-Stage
COPY --from=build /app/dist /usr/share/nginx/html

# Kopieren der benutzerdefinierten Nginx-Konfiguration
COPY infrastructure/nginx/default.conf /etc/nginx/conf.d/default.conf

# Port freigeben
EXPOSE 80

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]
