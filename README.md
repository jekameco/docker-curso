# Comandos básicos de Docker

## Generar un contenedor con la imagen de Nginx

```bash
docker run -d --name pruebita -p 127.0.0.1:8080:80 nginx:stable-alpine
```

1. `docker run`: Genera y arranca el contenedor.
2. `-d`: Ejecuta el contenedor en segundo plano (*detached mode*).
3. `--name`: Asigna un nombre personalizado al contenedor (`pruebita`).
4. `127.0.0.1:8080`: El servicio local se accede en `localhost:8080` (puedes poner cualquier número de puerto disponible en tu máquina).
5. `:80`: Es el puerto interno en el que escucha la imagen dentro del contenedor; debe ser específicamente este (o el que tenga configurado la imagen), de lo contrario fallará la conexión.
6. `nginx:stable-alpine`: Imagen a usar. Se busca y descarga en nuestro Docker directamente desde Docker Hub.

---

## Mirar los contenedores activos

```bash
docker ps
```

---

## Detener y eliminar el contenedor

* **Detener el contenedor:**
  ```bash
  docker stop pruebita
  ```

* **Eliminar el contenedor (una vez detenido):**
  ```bash
  docker rm pruebita
  ```