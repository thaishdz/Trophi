# Caché de logros en el servidor y en el cliente, y refresco a demanda del usuario

> **Decisión**: Guardar en MongoDB el schema de logros de cada juego (sin caducidad, renovado solo si el progreso trae un logro desconocido) y el progreso de cada jugador (30 minutos), y añadir un botón "Actualizar" sin cooldown. En el cliente, valores globales de caché en TanStack Query.
> **Fecha**: 2026-11-19

---

## Contexto

- La página de un juego hacía **dos llamadas a Steam en cada visita**: `GetPlayerAchievements` (progreso) y `GetSchemaForGame` (nombre, descripción e icono de cada logro). La búsqueda las repetía por cada juego encontrado.
- La caché del [ADR 0002](0002-steam_achievement_sync_cache_strategy.md) solo existía para la biblioteca ([ADR 0004](0004-games_library_cache_refresh.md)).
- Con caché, el usuario no ve al momento un logro recién desbloqueado ni un juego recién comprado.
- Cada persona ejecuta su propia instancia con su propia API key ([ADR 0002](0002-steam_achievement_sync_cache_strategy.md)): la cuota de Steam no se comparte.
- En el cliente, TanStack Query usaba sus valores por defecto. Las consultas sin `staleTime` propio (sesión, notas, guías, vídeos, logros seguidos y juegos guardados) **volvían a llamar a mi API** en cada cambio de página o al volver a la pestaña, aunque los datos no hubieran cambiado.

## Opciones para el schema de logros

| Opción | A favor | En contra |
|---|---|---|
| Sin caché | No requiere código | Una llamada a Steam por visita para un dato que casi nunca cambia |
| Caché por juego con caducidad (7 días) | Una copia por juego sirve a todos los usuarios | Caducidad arbitraria: casi todas las renovaciones sobran, y los logros nuevos tardan hasta 7 días en aparecer |
| ⭐ **Caché por juego sin caducidad, renovada por el progreso** | Una sola llamada por juego en la práctica. Los logros nuevos aparecen en cuanto se actualiza el progreso | Las correcciones de textos o iconos no se ven |

Cómo se detecta un schema desactualizado: `GetPlayerAchievements` devuelve todos los logros del juego con su `apiname`. Si alguno no está en el schema guardado, el juego ha añadido logros y se pide el schema de nuevo.

## Opciones para el refresco

| Opción | A favor | En contra |
|---|---|---|
| Solo caché automática | El usuario no hace nada | Tras jugar o comprar, espera hasta que caduca la copia sin saber por qué no aparece |
| Botón con cooldown | Protege una cuota compartida | Con una instancia por persona, solo limita al dueño de la cuota |
| ⭐ **Caché automática + botón sin cooldown** | El usuario decide cuándo quiere datos frescos y ve cuándo se actualizaron | Pulsar mucho gasta peticiones (el botón se desactiva mientras actualiza) |
| Stale-while-revalidate (renovar en segundo plano) | Nunca se espera a Steam si hay copia | Justo después de jugar muestra el progreso anterior. Errores fuera de la petición. El cliente ya lo hace con TanStack Query |

## Opciones para la caché del cliente

| Opción | A favor | En contra |
|---|---|---|
| Valores por defecto de TanStack Query (`staleTime` 0, `gcTime` 5 min, 3 reintentos, recarga al volver a la pestaña) | No requiere configuración | Cada cambio de página o vuelta a la pestaña repite peticiones de datos que no han cambiado. Lo que sale de pantalla se descarta a los 5 minutos aunque siga fresco |
| `staleTime` en cada hook | Ajuste fino por dato | Hay que acordarse en cada hook nuevo, y la configuración se repite |
| ⭐ **Valores globales en el `QueryClient`** | Una sola configuración para todas las consultas. Los hooks con caché más larga en el servidor conservan la suya | Un cambio hecho desde otra pestaña u otro dispositivo tarda hasta 5 minutos en verse |

## Razonamiento

- **Schema:** una caducidad por tiempo no aporta nada para un dato que el desarrollador define una vez. El caso que importa, los logros nuevos, lo detecta el propio progreso. Las correcciones de textos o iconos son cosméticas y muy raras; si hiciera falta, basta con borrar el documento del juego en `GameAchievementSchema`.
- **30 minutos para el progreso:** muchos logros requieren horas de juego, así que el progreso rara vez cambia en 5 minutos. Para ver al momento un logro recién desbloqueado está el botón "Actualizar".
- **8 horas para la biblioteca:** solo cambia cuando compro un juego. Paso de los 5 minutos del [ADR 0004](0004-games_library_cache_refresh.md) a 8 horas, y para un juego recién comprado está el botón "Actualizar" de la biblioteca.
- **Cooldown:** solo tiene sentido con una API key compartida entre muchos usuarios, y no es el caso.
- **Stale-while-revalidate:** Trophi sirve para seguir los logros que me quedan por desbloquear, y el momento clave es entrar justo después de jugar. Esta opción me enseñaría justo entonces el progreso anterior para ahorrar una espera cada 30 minutos.
- **Caché del cliente:** mis propias mutaciones actualizan la caché al momento (`setQueryData` o `invalidateQueries`), así que 5 minutos de `staleTime` no me enseñan datos viejos tras un cambio hecho en la app. Con una instancia por persona, el único caso que se retrasa es editar desde dos pestañas a la vez.
- **`gcTime` de 8 horas:** igual al `staleTime` más largo, el de la biblioteca. Con los 5 minutos por defecto, un dato todavía fresco se descartaba al salir de su página y se volvía a pedir.
- **Sin recarga al volver a la pestaña:** para pedir datos frescos están los botones "Actualizar".
- **Si Steam falla:** en una carga normal sirvo la copia guardada (como en el [ADR 0004](0004-games_library_cache_refresh.md)). Si el usuario pulsa "Actualizar", devuelvo el error: ha pedido datos frescos y una copia antigua le haría creer que se actualizaron.

## Decisión

**Schema: caché por juego sin caducidad, renovada por el progreso. Progreso: caché automática de 30 minutos. Biblioteca: caché automática de 8 horas. Ambos con botón "Actualizar" sin cooldown. Cliente: valores globales en el `QueryClient`.**

| Pieza | Detalle |
|---|---|
| Modelos | `GameAchievementSchema` (`gameId` único, sin caducidad) y `PlayerAchievements` (único por `(steamId, gameId)`, `PLAYER_ACHIEVEMENTS_TTL_MS` = 30 min). La biblioteca sigue en `GameLibrary`, con `GAME_LIBRARY_TTL_MS` = 8 h |
| Lógica común | `readThrough` (`services/cache/readThrough.ts`), usada por biblioteca, schema y progreso |
| Rutas nuevas | `POST /gameAchievements/:gameId/refresh`, `GET /library`, `POST /library/refresh` (con `syncedAt`) |
| Interfaz | Botón "Actualizar" y "Actualizado hace X" en la página del juego y en la biblioteca |
| Cliente | `client/src/config/queryClient.ts`: `staleTime` 5 min, `gcTime` 8 h, `retry` 1 y sin `refetchOnWindowFocus`. La biblioteca (8 h), la página del juego (30 min) y la sesión (sin reintentos) mantienen sus opciones |

## Consecuencias

- Un juego ya visitado no llama a Steam durante 30 minutos, y la búsqueda aprovecha la misma caché.
- Si Steam falla al renovar un schema desactualizado, se sirve la copia guardada y los logros nuevos aparecen en el siguiente intento.
- Las correcciones de textos o iconos de logros existentes no se reflejan solas.
- Moverse entre páginas ya cargadas no llama a mi API mientras los datos tengan menos de 5 minutos.
- Un cambio hecho desde otra pestaña u otro dispositivo puede tardar hasta 5 minutos en verse.
- Si Trophi pasa a tener muchos usuarios con una sola API key, hay que añadir cooldown al botón.
