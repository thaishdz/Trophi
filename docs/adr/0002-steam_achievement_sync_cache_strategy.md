# Sincronización de logros de Steam: propiedad de la API key y estrategia de caché

> **Decisión**: Usar solo la API key propia de la aplicación (nunca la del usuario) para sincronizar logros de perfiles públicos, con caché server-side y un cooldown de 5 minutos por `(usuario, juego)`.
> **Fecha**: 2026-08-07
> **Estado**: Activo

---

## Contexto

- Trophi permite al usuario elegir qué juegos quiere trackear para ver sus logros. El único dato necesario es lo que ya es público en su perfil de Steam: sus juegos y el estado de desbloqueo de logros. No hace falta actuar en nombre del usuario más allá de leer ese dato público.
- La Web API de Steam tiene un límite aproximado de 100.000 peticiones/día, compartido entre **toda la aplicación** (por API key), no por usuario. Ese presupuesto cubre la sincronización de todos los usuarios combinada, así que la estrategia de sincronización decide cuántos usuarios/juegos puede soportar la app antes del límite.
- Trophi está pensado para que cada persona lo ejecute en su propia instancia con su propia API key (en el `.env` del servidor), así que ese límite solo lo comparten los usuarios de una misma instancia, que normalmente es uno.
- El diseño original del schema asumía que la app guardaría la API key de Steam de cada usuario (cifrada). Eso planteaba un problema secundario: almacenarla como un secret de terceros (las API keys de Steam son personales y no deberían gestionarse a la ligera), con un esquema de cifrado y una clave maestra guardada por separado.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Guardar la API key de cada usuario (cifrada) | Encaja conceptualmente con "la clave es del usuario, que la aporte él" | `GetOwnedGames` / `GetPlayerAchievements` funcionan con la **key propia de la aplicación** para cualquier perfil público: la key del usuario no añade nada, porque la app nunca lee datos *privados*. Introduce una responsabilidad de seguridad: cifrado con una clave maestra que debe vivir fuera de la base de datos. No resuelve el *rate limit*: una sincronización intensiva seguiría sin cachear |
| API key de la app, sincronización en tiempo real (sin caché) | Siempre actualizado, sin desfase. Sencillo: no hace falta lógica de cooldown | Cada actualización de perfil consume una petición de las 100k/día; pocos usuarios activos refrescando con frecuencia podrían agotarlo |
| ⭐ **API key de la app, caché server-side con cooldown** | Los logros se miran al acabar una sesión de juego o en un momento puntual, no cada x segundos. El cooldown se aplica en el servidor, así que no se puede saltar llamando al endpoint directamente | Ligero desfase (hasta la duración del cooldown) tras desbloquear un logro. Requiere un campo `lastSyncedAt` y una comprobación en cada petición de sincronización |

## Razonamiento

Se resolvieron dos preguntas a la vez:

- **¿La key de quién?** La propia [documentación de Steam](https://developer.valvesoftware.com/wiki/Steam_Web_API#GetOwnedGames_.28v0001.29) confirma que `GetOwnedGames` y `GetPlayerAchievements` funcionan con la key de la app para cualquier perfil público. La key del usuario solo haría falta para leer *sus datos privados*, algo que no se necesita. Al comprobarlo, dejó de tener sentido guardar, cifrar o gestionar ninguna key de usuario.
- **¿Con qué frecuencia sincronizar?** Como el *rate limit* se comparte entre todos los usuarios de la instancia, sincronizar en tiempo real sin caché significa no controlar cuántas peticiones se gastan: dependería de cuánta gente use la app y con qué frecuencia. Con una caché server-side y un cooldown por `(usuario, juego)`, sé cuánto puedo llegar a gastar como mucho.
- **El valor del cooldown (5 minutos)** se eligió en base al número actual de usuarios del proyecto (solo yo). Ampliarlo implica que la base de usuarios crezca.

## Decisión

**Elegida: API key propia de la app + caché server-side, cooldown de 5 minutos por `(usuario, juego)`.**

```typescript
const SYNC_COOLDOWN_MINUTES = 5;

async function syncGameProgress(userId: string, appId: number, steamId64: string) {
  const existing = await GameProgress.findOne({ userId, appId });

  if (existing) {
    const minutesSinceSync = (Date.now() - existing.lastSyncedAt.getTime()) / 60000;
    if (minutesSinceSync < SYNC_COOLDOWN_MINUTES) {
      return existing; // sirve la copia cacheada, sin llamar a Steam
    }
  }

  const achievements = await fetchAchievementsFromSteam(appId, steamId64); // key propia de la app

  return GameProgress.findOneAndUpdate(
    { userId, appId },
    { achievements, lastSyncedAt: new Date() },
    { upsert: true, new: true }
  );
}
```

- No se pide, guarda ni cifra ninguna API key de Steam de ningún usuario en ningún punto del sistema.
- **Actualización:** el [ADR 0011](0011-cache_de_logros_y_refresco_manual.md) implementa esta caché, amplía el cooldown del progreso a 30 minutos y añade un botón para refrescar a demanda.

## Cuándo revisar esta decisión

- Si `usuarios_activos × juegos_trackeados × (24×60 / cooldown_minutos)` se acerca al límite de 100k/día: habría que recalcular el cooldown antes de que Steam empiece a dar errores.
- Si Steam cambia su política de *rate limit*.

## Para saber más

- [Steam Web API — GetOwnedGames (v0001)](https://developer.valvesoftware.com/wiki/Steam_Web_API#GetOwnedGames_.28v0001.29) — este endpoint funciona con la key de la app, siempre que el perfil sea público
- [Steam Web API Terms of Use](https://steamcommunity.com/dev/apiterms) — el límite oficial de 100.000 peticiones diarias por API key hasta ahora (2026)
