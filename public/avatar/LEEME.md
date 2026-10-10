# Imágenes del avatar

Copia aquí las imágenes originales del personaje y asígnalas a cada estado en
`config/avatar.ts`. Nombres sugeridos:

| Estado      | Archivo sugerido                       |
|-------------|----------------------------------------|
| neutral     | neutral.png                            |
| listening   | listening.png                          |
| thinking    | thinking.png o thinking-1.png, -2.png… |
| speaking    | speaking-1.png, speaking-2.png…        |
| happy       | happy.png                              |
| sad         | sad.png                                |
| curious     | curious.png                            |

Recomendaciones:
- Mismo tamaño de lienzo y mismo encuadre en todas las expresiones, para que el
  fundido entre estados no "salte".
- Fondo transparente (PNG/WebP con alfa).
- Unos 1024 × 1024 px es suficiente para pantallas Retina.
- Si el lienzo no es cuadrado, ajusta `aspectRatio` en `config/avatar.ts`.
