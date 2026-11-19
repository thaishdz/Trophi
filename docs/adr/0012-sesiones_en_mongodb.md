# Sesiones de login guardadas en MongoDB

> **Decisión**: Guardar las sesiones de `express-session` en MongoDB con `connect-mongo`, con una duración de 30 días, en lugar de en memoria. JWT queda descartado.
> **Fecha**: 2026-11-19

---

## Contexto

- Parecía que el usuario no se quedaba registrado. En realidad, `User` y `AuthMethod` sí se guardaban en MongoDB: lo que se perdía era **la sesión**.
- `express-session` no tenía `store` configurado, así que usaba el almacén por defecto, **en la memoria del proceso**. Cada reinicio de la API cerraba la sesión de todos los usuarios, y en desarrollo `ts-node-dev` reinicia la API cada vez que cambia un archivo del servidor.
- El navegador conservaba la cookie, pero el servidor ya no la reconocía: `/me` respondía 401 y la app volvía a la pantalla de login.
- La cookie no tenía `maxAge`, así que caducaba al cerrar el navegador.
- `SESSION_SECRET` se leía de `process.env` sin validarlo al arrancar.

## Opciones para guardar la sesión

| Opción | A favor | En contra |
|---|---|---|
| Memoria (por defecto) | No requiere nada | Se pierde en cada reinicio o despliegue. No se comparte entre instancias. `express-session` avisa de que no es para producción |
| ⭐ **MongoDB con `connect-mongo`** | Usa la base de datos que ya tengo, sin servicios nuevos. Sobrevive a reinicios. MongoDB borra las sesiones caducadas con un índice TTL. Cerrar sesión es borrar un documento | Una lectura en MongoDB por petición |
| Redis | Más rápido que MongoDB para sesiones | Un servicio más en Docker Compose y en el despliegue, para un volumen de usuarios que no lo necesita |
| JWT | El servidor no guarda estado. Cómodo para apps móviles o APIs consumidas por terceros | No se puede cerrar sesión de verdad (ver abajo). Cambia el login, los middlewares y los controladores. Más código propio de seguridad |

## Razonamiento

- **Cerrar sesión con JWT:** un token firmado es válido hasta que caduca, aunque el usuario pulse "Cerrar sesión". El cliente puede borrarlo, pero si alguien lo ha copiado sigue funcionando. Para revocarlo de verdad hay dos caminos:
  - una **lista de tokens revocados** (por su `jti`) que el servidor consulta en cada petición;
  - **tokens de acceso cortos** (5-15 minutos) más un ***refresh token*** guardado en el servidor, que es lo que se revoca al cerrar sesión. El token de acceso sigue valiendo hasta que caduca, unos minutos.

  Los dos caminos vuelven a guardar estado en el servidor, que era justo la ventaja de JWT. Con sesiones en MongoDB, cerrar sesión es borrar un documento y el efecto es inmediato.
- **Lo que JWT resuelve no me afecta:** Trophi tiene un solo frontend web y una sola API que comparten base de datos. No hay app móvil ni consumidores externos, y varias instancias de la API ya compartirían las sesiones a través de MongoDB.
- **Coste de JWT:** una versión mínima (token en cookie, 30 días, sin *refresh token*) son unas 150-250 líneas y alrededor de un día. La versión con *refresh token* y revocación son 2-3 días. Habría que tocar `passport.ts`, las rutas de `/auth`, `ensureAuthenticated`, `getSteamId` ([ADR 0003](0003-steamid_middleware.md)), los controladores que leen `req.user` y sus tests.
- **Riesgo del secreto:** con sesiones, `SESSION_SECRET` solo firma el id de la sesión, y para suplantar a alguien también hace falta su id, que es aleatorio. Con JWT, quien obtenga el secreto puede fabricar tokens válidos para cualquier usuario.
- **Redis:** sería la opción natural si las sesiones fueran un cuello de botella. Con el volumen de Trophi, una lectura por petición en MongoDB no lo es.
- **`express-session` se queda:** es el middleware que lee la cookie y entrega la sesión a Passport. `connect-mongo` solo cambia dónde se guarda.

## Decisión

**Sesiones de `express-session` en MongoDB con `connect-mongo`, con 30 días de duración. JWT descartado mientras no haya clientes que no sean el frontend web.**

| Pieza | Detalle |
|---|---|
| Almacén | Colección `sessions`, reutilizando el cliente de Mongoose (`clientPromise`) en vez de abrir otra conexión |
| Duración | Cookie con `maxAge` de 30 días y sesión guardada con el mismo `ttl`. MongoDB borra las caducadas con un índice TTL |
| Escrituras | `touchAfter` de 24 h: una sesión que no cambia se renueva como mucho una vez al día |
| Configuración | `SESSION_SECRET` se valida al arrancar junto con el resto de variables. El middleware vive en `config/session.ts` |

## Consecuencias

- Reiniciar o desplegar la API ya no cierra la sesión de nadie.
- El login dura 30 días aunque se cierre el navegador.
- Cerrar sesión, cuando exista el botón, será borrar la sesión y tendrá efecto inmediato.
- Cada petición autenticada sigue leyendo la sesión y el usuario de MongoDB.
- La cookie usa la configuración por defecto (`sameSite` sin fijar y sin `secure`). Funciona en local porque frontend y API están en `localhost`; para la demo queda pendiente ajustarla y usar un `SESSION_SECRET` largo y aleatorio.
- Si aparece una app móvil o consumidores externos de la API, hay que revisar esta decisión.
