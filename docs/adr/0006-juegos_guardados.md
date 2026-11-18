# Juegos guardados: nombre desde la biblioteca del usuario y progreso por ficha

> **Decisión**: Guardar juegos en MongoDB tomando el nombre de la biblioteca del propio usuario en el servidor, y pedir el progreso de cada juego guardado por separado al abrir la lista.
> **Fecha**: 2026-11-18

---

## Contexto

Además de los logros, quiero que el usuario pueda guardar un juego para seguirlo. Hay dos decisiones: de dónde sale el nombre del juego que se guarda y de dónde sale el progreso que muestra cada ficha.

## Opciones para el nombre del juego

### El cliente envía el nombre

**Ventajas:**
- El servidor no necesita consultar nada.

**Desventajas:**
- El nombre se puede falsificar y se podría guardar un juego que el usuario no tiene.

### El servidor lo toma de la biblioteca del usuario

**Ventajas:**
- Solo se pueden guardar juegos propios y el nombre es el real. La biblioteca ya está en MongoDB (ADR 0004).

**Desventajas:**
- Si la biblioteca está caducada, guardar puede lanzar una llamada a Steam.

## Opciones para el progreso de cada ficha

### Copia del progreso en MongoDB

**Ventajas:**
- La lista carga sin llamar a Steam.

**Desventajas:**
- Puede quedar desactualizada y necesito una política de refresco.

### Petición por juego a Steam al abrir la lista

**Ventajas:**
- Datos frescos y sin lógica de refresco.

**Desventajas:**
- Dos llamadas a Steam por juego guardado, con el límite compartido del ADR 0002. Escala mal con muchos juegos.

## Razonamiento

Que el servidor tome el nombre de la biblioteca del usuario me da la validación de pertenencia sin coste extra. Para el progreso elijo la petición por juego a Steam por simplicidad: con pocos juegos guardados el coste es asumible y evito diseñar el refresco. Lo dejo anotado como punto a revisar.

## Decisión

**Elijo que el servidor tome el nombre de la biblioteca del usuario y la petición por juego a Steam para el progreso.**

- Modelo `TrackedGame` con índice único `(userId, gameId)`. Rutas `GET /api/v1/tracked-games`, y `PUT` y `DELETE /api/v1/tracked-games/:gameId`.
- `PUT` es idempotente y responde 404 si el juego no está en la biblioteca del usuario.
- La API conserva el nombre `tracked-games`; la interfaz habla de "guardar".
- Cada ficha pide su progreso con la misma consulta que usa la página del juego, que el navegador conserva 5 minutos.

## Consecuencias

- Abrir la lista con muchos juegos dispara muchas peticiones a la vez. Si el uso crece, paso a la copia del progreso en MongoDB.
- Al guardar desde una búsqueda, el juego siempre está en la biblioteca ya consultada, así que no suma llamadas en el caso normal.
