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

* **inicializar el contenedor (cuando se encuentra detenido):**
  ```bash
  docker start pruebita
  ```

* **reiniciar el contenedor (cuando falle):**
  ```bash
  docker restart pruebita
  ```

* **logs el contenedor**
  ```bash
  docker logs pruebita
  ```

* **ver detalles del contenedor**
  ```bash
  docker inspect pruebita
  ```

* **ver detalles de estadistica del contenedor**
  ```bash
  docker stats --no-stream pruebita
  ```

* **ejecutar comandos dentro del contenedor**
  ```bash
  docker exec -it pruebita sh
  ```
  1. `docker exec` : ejecutar algo denntro del contenedor
  2. `-it` : -i muestra que el comnado se siga ejecutando y no se cierre -t abrir una terminal para realizar lo que uno desee
  3. `sh` : un interprete de comandos ( originario de linux )

* **Generar imagen propia**
  ```bash
  docker build -t cofla-tareas:1.0 ./
  ```

  1. `docker build`: genera la imagen
  2. `-t confla-tarea:1.0` genera un nombre a la imagen con una etiqueta [nombre_imagen]:[etiqueta]
  3. `./`: contexto de la contruccion ( carpeta docker )

* **ver imagenes que tiene el docker**
  ```bash
  docker images
  ```

* **generar contenedor con la imagen creada ( mismo paso anterior )**
  ```bash
  docker run -d --name cofla-app -p 127.0.0.1:3000:3000 cofla-tareas:1.0
  ```

  `mientras el contenedor este activo los cambios que hagamos se mantendran, pero si detenemos el contenedor y volvemos a iniciarlo perdemos todo lo realizado anteriormente, para esto todos los cambios se deberian guardar en un volumen`