# Decisiones de arquitectura

**Español** | [English](en/README.md)

Resumen de los ADR agrupados por tema. Cada ADR recoge una decisión concreta en su fecha, con las opciones que se valoraron; este índice cuenta qué se decidió y cómo encajan entre sí.

## Steam: cuota y caché

La Web API de Steam tiene un límite diario por API key, así que casi todas las decisiones del servidor giran en torno a gastar pocas peticiones sin enseñar datos viejos.

| ADR | Decisión |
|---|---|
| [0002](0002-steam_achievement_sync_cache_strategy.md) | Usar la API key de la instancia, nunca la del usuario, y cachear en el servidor con un cooldown por `(usuario, juego)` |
| [0004](0004-games_library_cache_refresh.md) | Guardar la biblioteca en MongoDB, refrescarla en la misma petición cuando caduca y servir la copia si Steam falla |
| [0011](0011-cache_de_logros_y_refresco_manual.md) | Caducidad según lo que cambia cada dato: biblioteca 8 h, progreso 30 min y schema de logros sin caducidad (se renueva si el progreso trae un logro desconocido). Botón "Actualizar" a demanda |

**En conjunto:** una caché en MongoDB, una sola función (`readThrough`) para todos los datos de Steam, y el usuario decide cuándo quiere datos frescos.

## Identidad y autenticación

| ADR | Decisión |
|---|---|
| [0001](0001-auth_method_separate_collection.md) | Los métodos de login en una colección `AuthMethod` aparte, con índices únicos: la base de datos garantiza que un `steamId` o un email no pertenezcan a dos usuarios |
| [0003](0003-steamid_middleware.md) | Resolver el `steamId` una vez por petición en un middleware, en vez de en cada método |
| [0012](0012-sesiones_en_mongodb.md) | Sesiones de login en MongoDB con `connect-mongo` (30 días), para que sobrevivan a los reinicios de la API. JWT descartado: no permite cerrar sesión de verdad sin volver a guardar estado |

**En conjunto:** la identidad se valida en la base de datos y se resuelve una sola vez, preparada para añadir login por email. La sesión también vive en MongoDB.

## Datos del usuario

| ADR | Decisión |
|---|---|
| [0006](0006-juegos_guardados.md) | Juegos guardados en MongoDB, con el nombre tomado de la biblioteca del usuario en el servidor, para que no se pueda falsificar ni guardar un juego ajeno |
| [0007](0007-seguimiento_de_logros_en_mongodb.md) | Logros seguidos en MongoDB, un documento por usuario y juego, con operaciones atómicas e idempotentes |

**En conjunto:** lo que el usuario decide (qué guarda y qué sigue) vive en el servidor y sobrevive a un cambio de dispositivo.

## Interfaz

| ADR | Decisión |
|---|---|
| [0005](0005-game_covers_steam_cdn.md) | Portadas del CDN de imágenes de Steam a partir del `appid`, sin clave ni cuota. IGDB y otras APIs descartadas |
| [0008](0008-direccion_visual_oscura_y_tinte_por_juego.md) | Estilo oscuro con las portadas como protagonistas y el fondo teñido por los colores del juego actual |
| [0009](0009-resultados_de_busqueda_en_dialog_modal.md) | Resultados de búsqueda en un `<dialog>` nativo con una ficha por juego, sin pestañas |

**En conjunto:** la portada del juego es el centro de la interfaz, y se apoya en lo que ya da el navegador y Steam.

## Arquitectura

| ADR | Decisión |
|---|---|
| [0010](0010-inversion_de_control_descartada.md) | Inyección de dependencias manual por constructor. Un contenedor IoC queda descartado mientras no resuelva un problema real |
