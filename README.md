# Proyecto Podologia

Landing page demo para un centro de pedicuria y podologia, pensada para mostrar a clientes y reutilizar como base comercial para otros proyectos del mismo estilo.

## Demo

Proyecto estatico preparado para deploy rapido en Vercel o cualquier hosting simple.

## Caracteristicas

- Landing comercial enfocada en conversion por WhatsApp
- Diseno limpio, femenino, moderno y profesional
- Servicios renderizados dinamicamente desde `app.js`
- Secciones de testimonios, FAQ, espacio/local y cierre comercial
- Responsive para mobile, tablet y desktop
- Imagenes optimizadas en formato WebP
- SEO basico con meta description, Open Graph y JSON-LD
- Animaciones suaves al hacer scroll

## Tecnologias

- HTML
- CSS
- JavaScript vanilla

## Estructura

```text
.
|-- index.html
|-- style.css
|-- app.js
|-- README.md
`-- img/
```

## Personalizacion

La mayor parte del contenido editable esta centralizada en `app.js`, dentro del objeto `CLIENTE_DATA`.

Desde ahi podes cambiar:

- nombre del local
- telefono de WhatsApp
- telefono visible
- slogan
- meta description
- direccion
- Instagram
- mensaje de contacto
- servicios
- imagenes de cada servicio
- WhatsApp del desarrollador al pie

## Imagenes usadas

El proyecto usa imagenes en formato `.webp` para mejorar el rendimiento:

- `img/01_salud_para_tus_pies.webp`
- `img/Gemini_Generated_Image_fdx4jjfdx4jjfdx4.webp`
- `img/local-gabinete.webp`
- `img/servicio-podologia-clinica.webp`
- `img/servicio-pedicuria-estetica.webp`
- `img/servicio-esmaltado-semipermanente.webp`
- `img/servicio-spa-de-pies.webp`

## Como usarlo localmente

Como es un proyecto estatico, podes abrir `index.html` directamente en el navegador.

Si preferis levantar un servidor local, por ejemplo con VS Code:

1. Instalar la extension `Live Server`
2. Abrir el proyecto
3. Ejecutar `Open with Live Server`

## Deploy en Vercel

1. Subir el proyecto a GitHub
2. Entrar a `https://vercel.com`
3. Importar el repositorio
4. Dejar la configuracion por defecto como proyecto estatico
5. Hacer click en `Deploy`

## Estado del proyecto

Actualmente esta preparado como demo comercial funcional:

- diseno terminado
- contenido de venta trabajado
- imagenes integradas
- footer con contacto del desarrollador
- estructura lista para adaptar a clientes reales

## Proximos pasos sugeridos

- reemplazar datos demo por datos reales del cliente
- conectar dominio personalizado
- ajustar imagenes finales del local o gabinete
- sumar favicon
- crear una web personal del desarrollador para reemplazar el link temporal de WhatsApp

## Autor

Desarrollado por CAndy Escudero.

Si queres una landing similar, en esta demo hay un enlace de contacto directo por WhatsApp en el footer.
