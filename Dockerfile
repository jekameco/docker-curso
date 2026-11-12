# imagen a usar directamente de docker hub
FROM node:24-bookworm-slim 
#carpeta de trabajo dentro del contenedor
WORKDIR /app
#copiar los archivos de dependencias al contenedor
COPY package.json package-lock.json ./
# instalar dependencias de producción de forma limpia y sin dependencias de desarrollo
RUN npm ci --omit=dev
# copiar el resto de archivos de la aplicación al contenedor como usuario node ( por seguridad no root )
COPY --chown=node:node server.js ./
COPY --chown=node:node public ./public
# definir variable de entorno para producción
ENV NODE_ENV=production
# cambiar a usuario node para ejecutar la aplicación
USER node
# exponer el puerto 3000 para la aplicación
EXPOSE 3000
# comando para ejecutar la aplicación
CMD ["node", "server.js"]
