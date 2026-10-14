# Tree Test UCOM

Herramienta de *tree testing* para la clase de Arquitectura de Información del Diplomado UCOM.

**Sitio:** https://giro54bo.github.io/tree-test-ucom/

## Cómo funciona

- **Sin cuentas.** Quien crea una prueba escribe el árbol de categorías y las tareas, y al publicar recibe dos enlaces:
  - un enlace para participantes (`?t=…`), y
  - un enlace privado de resultados (`?r=…#llave`). La llave va después del `#` y nunca sale del navegador.
- **Descartable.** Cada prueba vence en 1, 3 o 7 días. Al vencer deja de abrirse y se borra junto con sus resultados: el propio sitio limpia lo vencido en cada visita (como máximo una vez por hora por navegador).
- **Resultados cifrados.** Cada participante cifra sus respuestas en su navegador (ECDH P-256 + AES-GCM) con la llave pública de la prueba. La base de datos solo guarda texto cifrado; solo el enlace privado puede leerlo.

## Piezas

| Archivo | Qué hace |
|---|---|
| `index.html` | Toda la app: editor, prueba para participantes y resultados. Sin dependencias, salvo `qrcodejs` para el QR. |
| `firestore.rules` | Reglas de Firestore: crear y leer por id, nunca editar; lo vencido no se puede leer y cualquiera puede borrarlo. |
| `firestore.indexes.json` | Índice para encontrar resultados vencidos y exenciones de índice para los campos grandes. |
| `scripts/cleanup.mjs` | Borra pruebas y resultados vencidos usando solo la llave web pública (`node scripts/cleanup.mjs`). |
| `extras/cleanup-workflow.yml` | Opcional: para limpiar también cuando nadie usa el sitio, muévelo a `.github/workflows/` y corre la limpieza cada 6 horas con GitHub Actions. |

## Datos guardados

`tests/{id}`: `d` (la prueba en JSON), `pk` (llave pública), `expireAt`.
`tests/{id}/results/{auto}`: `c` (respuesta cifrada), `e` (llave efímera), `iv`, `expireAt`.

No se guardan cuentas, correos ni direcciones IP en la base de datos.

## Desplegar cambios

```bash
firebase deploy --only firestore --project tree-test-ucom
```

GitHub Pages publica `main` automáticamente.
