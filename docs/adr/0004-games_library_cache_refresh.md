# Biblioteca de juegos de Steam: persistencia en MongoDB y refresco en la misma petición

> **Decisión**: Guardar la biblioteca de juegos de cada usuario en una colección `GameLibrary` (clave `steamId`) y refrescarla desde Steam, dentro de la misma petición, cuando tenga más de 5 minutos. Si Steam falla y hay una copia guardada, se devuelve esa copia.
> **Fecha**: 2026-11-17

---

## Contexto

Cada búsqueda (`GET /search`) llamaba a `GetOwnedGames` de Steam para obtener la biblioteca completa y filtrarla con Fuse.js. Eso supone una petición a Steam por búsqueda, y el presupuesto de la Web API (~100.000 peticiones/día) se comparte entre todos los usuarios de la app (ADR 0002).

La biblioteca cambia poco, solo cuando el usuario compra o añade un juego, así que pedirla en cada búsqueda es un gasto innecesario.

## Opciones consideradas

### Opción A: No persistir (estado anterior)

**Ventajas:**
- No requiere código nuevo y los datos siempre están al día.

**Desventajas:**
- Una llamada a Steam por búsqueda. Consume presupuesto compartido y añade latencia a todas las búsquedas.
- Si Steam falla, la búsqueda falla.

### Opción B: Persistir y refrescar en la misma petición cuando caduca

**Ventajas:**
- Solo la primera búsqueda tras caducar la copia espera a Steam. El resto salen de la base de datos.
- Fácil de razonar y de testear: la respuesta sale siempre de datos validados en esa misma petición.
- Permite devolver una copia caducada si Steam falla.

**Desventajas:**
- La petición que refresca es más lenta que las demás.
- Dos búsquedas simultáneas con la copia caducada refrescan las dos, con dos llamadas a Steam. El resultado es el mismo.

### Opción C: Persistir y refrescar en segundo plano (stale-while-revalidate)

**Ventajas:**
- Ninguna petición espera a Steam si hay copia.

**Desventajas:**
- Más complejidad: refresco asíncrono y gestión de errores fuera de la petición.
- La respuesta puede mostrar datos caducados justo después de comprar un juego.

## Razonamiento

Con refresco en la misma petición, la espera afecta a una búsqueda de cada varias y, en conjunto, es menor que con el estado anterior, donde todas esperaban. Además, esa primera búsqueda ya es lenta por otro motivo: tras filtrar, se piden los logros de cada juego encontrado, una llamada a Steam por juego. El refresco en segundo plano ahorra esa espera a costa de una complejidad que no se justifica con el tráfico actual.

## Decisión

**Elegida: Opción B, persistir y refrescar en la misma petición.**

- Modelo `GameLibrary`: `steamId` (único), `games: [{ gameId, gameName }]` y `syncedAt`. La clave es `steamId` y no `userId` porque es lo que ya recibe `GameService.getGamesLibrary`.
- Caducidad: `GAME_LIBRARY_TTL_MS` = 5 minutos, igual que el cooldown de logros del ADR 0002.
- Si Steam falla y existe una copia, aunque esté caducada, se devuelve la copia. Si no hay copia, el error se propaga como antes.
- Interfaz: mientras busca, `SearchBox` muestra "Buscando…" y bloquea el botón. No hay modal.

## Cuándo revisar esta decisión

- Si la latencia de la búsqueda con copia caducada se nota en uso real, valorar el refresco en segundo plano (stale-while-revalidate).
- Si aparecen varios usuarios simultáneos y se ven llamadas duplicadas a Steam, valorar un bloqueo por `steamId`.
- Si la biblioteca crece hasta acercarse al límite de tamaño de un documento de MongoDB (16 MB), pasar a un documento por juego.

## Qué no está verificado

- La decisión se probó con tests unitarios (con mocks) y con una prueba visual manual. No medí la latencia real de `GetOwnedGames`, ni con bibliotecas muy grandes.
