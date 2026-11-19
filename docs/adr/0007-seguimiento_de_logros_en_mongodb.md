# Seguimiento de logros: MongoDB por usuario y juego frente a localStorage

> **Decisión**: Persistir los logros que sigue cada usuario en MongoDB, con un documento por usuario y juego que guarda la lista de `apiname`, y mostrarlos en una sección propia de la página del juego.
> **Fecha**: 2026-11-18

---

## Contexto

- El botón "Seguir" de cada logro bloqueado existía solo en la interfaz: el estado vivía en memoria y se perdía al recargar.
- Tenía que decidir dónde guardarlo y qué efecto tiene seguir un logro.
- El historial de búsquedas ya usa `localStorage`, así que había un precedente en el cliente.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| localStorage | Es lo más rápido de hacer y no toca el servidor | Se pierde al cambiar de navegador o de dispositivo. El servidor no puede listar ni ordenar lo seguido |
| ⭐ **MongoDB por usuario y juego** (un documento por usuario y juego con la lista de logros seguidos) | Se conserva entre dispositivos y encaja con el resto de datos del usuario. Seguir y dejar de seguir son operaciones atómicas e idempotentes (`$addToSet` y `$pull`), con un índice único `(userId, gameId)`. El orden de inserción de la lista da el último logro seguido de un juego | No guarda cuándo se siguió cada logro, así que no puedo saber cuál es el último entre todos los juegos |
| MongoDB por logro seguido (un documento por logro) | Una marca de tiempo por logro permitiría el último seguido en todos los juegos | Más documentos y más consultas por juego para lo que hoy necesito |

## Razonamiento

- Quiero que el seguimiento sobreviva a un cambio de dispositivo, y eso descarta **localStorage**.
- Entre las dos opciones de MongoDB, **MongoDB por usuario y juego** cubre lo que muestro hoy con una sola consulta por juego. **MongoDB por logro seguido** solo compensa si necesito el último logro entre todos los juegos, y todavía no lo necesito.
- El logro se identifica por su `apiname` (`Achievement.value`) y no por el nombre visible, que no es único ni estable.

## Decisión

**Elijo MongoDB por usuario y juego.**

| Pieza | Detalle |
|---|---|
| Rutas | Bajo `/api/v1/follows`: `GET /:gameId`, y `PUT` y `DELETE /:gameId/:achievement`, todas tras `ensureAuthenticated` |
| Interfaz | La página del juego tiene una sección "Siguiendo" encima de los logros pendientes. El hero del dashboard muestra el último logro seguido del juego actual |
| Cliente | Actualiza el botón al instante y deshace el cambio si la petición falla |

## Consecuencias

- "Último logro seguido" es por juego. Para uno global tendría que pasar a **MongoDB por logro seguido** o añadir marcas de tiempo.
- El dashboard solo pide el juego a Steam si hay algo seguido, para no gastar cuota ([ADR 0002](0002-steam_achievement_sync_cache_strategy.md)).
- Un logro seguido que se desbloquea después sigue guardado pero deja de mostrarse, porque solo cuento los que siguen bloqueados.
