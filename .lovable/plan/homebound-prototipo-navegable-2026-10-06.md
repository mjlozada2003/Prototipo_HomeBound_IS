# HomeBound — Prototipo navegable

Plataforma colaborativa para reportar y buscar objetos y mascotas perdidos o encontrados. Todo en español.

## Identidad visual (basada en el logo)
- Fondo crema cálido, verde bosque (principal) y verde hoja (secundario).
- Tipografía redondeada y amigable (Nunito / Fredoka para títulos).
- El logo subido se usa en la cabecera y como favicon.
- Distinción clara: **Perdido** = etiqueta ámbar/terracota, **Encontrado** = etiqueta verde. Iconos distintos para **Mascotas** y **Objetos**.

## Páginas
- `/` Inicio: buscador, filtros y tarjetas de publicaciones recientes (HU-05, HU-06).
- `/publicacion/$id` Detalle: foto, datos, fecha, contacto, botón Compartir que copia el enlace (HU-07).
- `/publicar` Formulario con selector Perdido / Encontrado (HU-03, HU-04). Requiere sesión.
- `/auth` Registro e inicio de sesión (HU-01, HU-02).
- `/perfil` Mis publicaciones, marcar como resuelta, cerrar sesión.
- `/admin` Panel solo para Admin: contadores de activas, resueltas, perdidas, encontradas, mascotas y objetos (HU-08).

## Reglas del negocio
- Categoría obligatoria: Mascotas (perro, gato, otro) u Objetos (documentos, electrónicos, llaves, otros). La subcategoría depende de la categoría, así no se mezclan.
- Todos los campos obligatorios (título, descripción, categoría, tipo, fecha, foto, contacto en pérdidas); el botón no publica si falta algo y muestra qué falta.
- Evitar duplicados: el sistema rechaza una publicación del mismo usuario con mismo título, tipo, categoría y fecha.
- En hallazgos el contacto es opcional; en pérdidas es obligatorio.
- Mensaje de confirmación al registrarse y al publicar.

## Datos de ejemplo
Se precargan ~10 publicaciones variadas para que el prototipo se vea vivo en las pruebas con usuarios.

## Detalles técnicos
- Lovable Cloud: autenticación con correo/contraseña (nombre + correo + contraseña), confirmación automática para agilizar pruebas.
- Tablas: `profiles`, `user_roles` (rol admin separado), `posts` con restricción única para duplicados y validaciones en servidor.
- Almacenamiento de fotos en un bucket público.
- Admin protegido por rol verificado en servidor; el primer admin se asigna manualmente (se indicará cómo).
