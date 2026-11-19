# Almacenamiento de métodos de autenticación: colección separada vs. array embebido

> **Decisión**: Guardar los métodos de autenticación (Steam, email) en una colección `AuthMethod` separada, referenciando a `User` mediante `userId`, en vez de un array embebido dentro del documento `User`.
> **Fecha**: 2026-08-07

---

## Contexto

- Trophi soporta varios métodos de autenticación por usuario (Steam OpenID e email/contraseña más adelante).
- El schema original embebía los métodos de auth como un array dentro del documento `User`:

  ```typescript
  authMethods: {
    type: [authMethodSchema] // steamId, email, passwordHash por entrada
  }
  ```

- El login por Steam requiere buscar "qué usuario tiene este **steamId**" sin saber de antemano quién es. Es el patrón de acceso principal que el schema tiene que soportar, y tiene que garantizar que un `steamId` o `email` nunca pertenezca a dos usuarios diferentes.
- Aunque de momento sea mi proyecto personal (el tráfico lo genero solo yo), la decisión toca **identidad/autenticación**. Me interesa diseñarlo bien ahora para no tener que migrar un modelo ya en producción si el proyecto escala a tener usuarios reales.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Array embebido en `User` | Sin queries ni joins extra: todo lo del usuario está en un solo documento. Sencillo leer el perfil completo de golpe | El `unique: true` de Mongoose sobre un campo de un subdocumento de array **no** garantiza unicidad a nivel de colección: solo evita duplicados *dentro del mismo array*, no entre distintos `User`. Garantizar unicidad real requeriría comprobaciones manuales en el código, vulnerables a *race conditions* (dos registros concurrentes con el mismo `steamId`) |
| ⭐ **Colección separada `AuthMethod` (referencia por `userId`)** | Índice único a nivel de base de datos sobre `steamId` / `email` en toda la colección: es la base de datos, y no el código, quien garantiza que no haya identidades duplicadas. *"Buscar el usuario por este steamId"* pasa a ser una consulta indexada sobre `AuthMethod`, no una búsqueda dentro de un array anidado | Una query extra (o un `populate`) para ir de `AuthMethod` a `User`. Crear un usuario por primera vez implica hacerlo en dos colecciones |

## Razonamiento

- El factor decisivo fue **dónde vive la garantía de unicidad**.
- Embeber los métodos mantiene las lecturas cómodas, pero traslada al código la responsabilidad de comprobar identidades duplicadas en cada escritura, incluso bajo peticiones concurrentes.
- Una colección separada con un índice único mueve esa garantía a la base de datos, que la aplica siempre, sin depender de que el código lo compruebe bien en cada caso.

## Decisión

**Elegida: colección separada `AuthMethod`.**

```typescript
const authMethodSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['steam', 'email'], required: true },
  steamId: { type: String, sparse: true },
  email: { type: String, sparse: true },
  passwordHash: String
});

authMethodSchema.index({ steamId: 1 }, { unique: true, sparse: true });
authMethodSchema.index({ email: 1 }, { unique: true, sparse: true });
```

## Cuándo revisar esta decisión

- Si la query extra se convierte en un cuello de botella (poco probable a la escala actual, pero a tener en cuenta con muchos usuarios concurrentes).
- Si se añaden más proveedores de autenticación y el schema `AuthMethod` se queda corto para representarlos.

## Para saber más

- [Multikey Indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/) — cómo MongoDB indexa campos array y las reglas de unicidad sobre ellos
- [Create an Index on an Array Field](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/create-multikey-index-basic/) — cómo crear un índice multikey paso a paso
- [Mongoose Unique values in nested array of objects](https://codemia.io/knowledge-hub/path/mongoose_unique_values_in_nested_array_of_objects) — por qué `unique: true` en un subdocumento de array no basta y hace falta validación manual
- [mongoose-unique-validator (ladjs fork)](https://github.com/ladjs/mongoose-unique-validator) — plugin para convertir errores E11000 de MongoDB en errores de validación de Mongoose
