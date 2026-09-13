# Instrucciones para ejecutar el plan con Luna

Usa este texto en una tarea configurada con Luna. Este documento no cambia el modelo de la tarea actual ni inicia otra.

## Prompt inicial listo para copiar

Trabaja en C:/Users/adria/Desktop/proyectos/olovetools. Ejecuta por sublotes el plan docs/PLAN-MEJORAS-LUNA.md, apoyándote en docs/RESULTADOS-AUDITORIA.md y actualizando docs/ESTADO-HERRAMIENTAS.md.

Primero consulta instrucciones locales aplicables y git status. No sobrescribas cambios ajenos. Lee el resumen, los hallazgos transversales y el orden de lotes. No releas todo el repositorio ni todas las traducciones en cada sesión.

Empieza por L00 y luego ICON-01 de L01: establece las comprobaciones disponibles y corrige la correspondencia entre los iconos declarados en constants.ts y el mapa de ProjectCard.tsx. Son 28 tarjetas que caían a Box en la base auditada. Revalida la cifra porque el código puede haber cambiado. Comprueba los iconos en móvil/escritorio y no cierres esta tarea diciendo que has revisado los 62 motores.

Para cualquier sublote posterior:
1. Lee solo su ficha, los archivos de la herramienta y dependencias compartidas directamente relevantes.
2. Reproduce el fallo o verifica que la propuesta no existe ya. Si ya existe y funciona, registra «ya disponible».
3. Corrige fallos antes de añadir configuraciones; prioriza claridad y resultado útil.
4. Valida entrada normal, error, límites, cancelación cuando aplique, y descarga reabierta. Añade pruebas automatizadas de lógica cuando protejan comportamiento real.
5. Para diseño/animaciones mira navegador, móvil y movimiento reducido. Una compilación no demuestra que el efecto se vea bien.
6. Para SEO verifica HTML inicial y promesas reales. No inventes ratings, demanda, métricas o funciones.
7. Actualiza el registro: evidencia, commit, qué pasó y qué no pudo probarse. Conserva los pendientes.
8. Haz un commit pequeño por cambio coherente y sube los cambios terminados según la autorización de esta conversación. No hagas push forzado. No subas logs ni muestras grandes.
9. Antes de cerrar informa de problema, solución, pruebas y siguiente sublote concreto. No digas «todo funciona» mientras queden operaciones sin ejecutar.

No añadas automáticamente todas las propuestas: algunas ya están en el producto y otras son hipótesis que requieren validar utilidad o viabilidad. No emprendas nuevos servicios de pago, colaboración multiusuario, otras plataformas o refactors globales como parte incidental de una mejora.

Alcance de cada sesión: una herramienta multimedia/API compleja o hasta tres herramientas pequeñas. Termina ese sublote antes de ampliar. Si una API o permiso bloquea una prueba, deja constancia y sigue con trabajo independiente.

## Prompt de continuación

Continúa desde docs/ESTADO-HERRAMIENTAS.md. Resume en una frase el siguiente sublote pendiente, consulta su ficha en docs/PLAN-MEJORAS-LUNA.md y ejecútalo siguiendo las instrucciones de docs/PROMPT-LUNA.md. No repitas auditorías ya registradas salvo cambios relevantes o evidencia insuficiente. Finaliza con pruebas, commit y siguiente paso.

## Para mantener el coste controlado

- Un contexto acotado por sublote; evitar una orden de «rehaz todo» en una sola sesión.
- Reutilizar componentes, hooks, motores, fixtures y comprobadores existentes.
- No gastar una sesión en uniformar imports sin efecto funcional.
- Diferenciar pruebas unitarias rápidas de multimedia costosa; ejecutar las pertinentes al cambio.
- Una medición antes/después sirve más que varias rondas de retoque sin criterio.
- Guardar resultados persistentes para que la siguiente sesión no tenga que reconstruir la investigación.
- Reservar revisión adicional para casos difíciles de precisión, seguridad, memoria o proveedores.
- No hay una cifra de coste garantizada: depende del tamaño real de los cambios y de las pruebas necesarias.

