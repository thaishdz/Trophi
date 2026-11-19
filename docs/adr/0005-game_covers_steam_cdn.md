# Portadas de juegos: CDN de Steam por appid frente a IGDB y otras APIs

> **Decisión**: Obtener las portadas del CDN de imágenes de Steam, deduciendo la URL del `appid`: `library_600x900.jpg` como portada y `header.jpg` como respaldo. Descarto IGDB, que era la idea inicial.
> **Fecha**: 2026-11-17

---

## Contexto

- La tarjeta original planteaba obtener la portada de cada juego desde IGDB.
- `SteamService.getCoverGame` existía pero no lo llamaba nadie: usaba el buscador de la tienda de Steam y devolvía una miniatura diminuta.
- Antes de implementar hice un spike de alternativas.
- Ya tengo el `appid` de cada juego, y las alternativas que buscan por nombre ya dieron imprecisión en la búsqueda de juegos.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| IGDB | Datos y arte de calidad, con mapeo por identificador externo de Steam | Requiere credenciales de Twitch (`client_id` y `client_secret`) y renovar un token que caduca. No verifiqué los detalles de su API |
| ⭐ **CDN de imágenes de Steam por `appid`** | Sin clave, sin cuenta y sin token. No usa la Web API, así que no gasta la cuota del [ADR 0002](0002-steam_achievement_sync_cache_strategy.md). La URL se deduce del `appid`. Verificado con peticiones reales: Hades devuelve 200 `image/jpeg` para ambas imágenes | No todos los juegos tienen portada vertical. No verifiqué las condiciones de uso de Valve para estas imágenes |
| Steam Store `appdetails` (`header_image`) | Sin clave. Verificado: devuelve 200 con el JSON del juego | Una petición de red por juego, con su propio límite de tasa. Solo aporta la cabecera |
| SteamGridDB | Arte de la comunidad y acepta el `appid` de Steam | Necesita clave. No encontré sus condiciones de uso ni un límite numérico |
| RAWG | — | Búsqueda por nombre. El plan gratuito es solo para uso no comercial, con 20.000 peticiones al mes, y exige atribución con enlace activo (según resúmenes de terceros, no su documentación oficial) |
| TheGamesDB | — | Búsqueda por nombre y cuota mensual por clave. No confirmé el límite vigente ni su cobertura de PC |
| MobyGames | — | Búsqueda por nombre. La API gratuita es solo para uso sin ánimo de lucro (según su página de documentación) |

## Razonamiento

- El **CDN de Steam** es la única opción que no añade clave, token ni dependencia externa con cuota, y no obliga a adivinar el juego por nombre.
- **RAWG**, **TheGamesDB** y **MobyGames** buscan por nombre y limitan el uso no comercial.
- **SteamGridDB** mejora el arte, pero añade clave y condiciones sin verificar, así que queda como posible mejora posterior.
- **IGDB** exige credenciales de Twitch para algo que el propio `appid` resuelve.
- Cobertura medida con la biblioteca de pruebas (162 juegos): 156 con portada vertical (96 %), 3 solo con cabecera y 3 sin ninguna imagen (404 en ambas).

## Decisión

**Elegida: CDN de imágenes de Steam por `appid`.**

| Pieza | Detalle |
|---|---|
| URLs | `getCoverUrls(gameId)` (`services/steam/covers.ts`) devuelve `cover` y `coverFallback` sin hacer llamadas de red |
| API | `GameController` los incluye en cada juego devuelto por `/search` y `/gameAchievements/:gameId` |
| Cliente | Decide qué mostrar: `cover`, si falla `coverFallback` y, si falla también, un marcador sin imagen. Esto está pendiente (tarjeta "Estilo visual de GameCard con portada") |
| Limpieza | Elimino `SteamService.getCoverGame`, que no se usaba |

## Cuándo revisar esta decisión

- Si la cobertura baja de forma notable con otras bibliotecas, valorar SteamGridDB como complemento.
- Si Valve cambia la ruta o las condiciones del CDN.
- Si quiero arte que no exista en Steam (juegos de otras tiendas), valorar IGDB.

## Qué no está verificado

- Las condiciones de uso de Valve para las imágenes del CDN.
- La cobertura con bibliotecas distintas a la de pruebas.
- SteamGridDB, RAWG, TheGamesDB y MobyGames se investigaron solo por búsqueda web, sin llamar a sus APIs.
