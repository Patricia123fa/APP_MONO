# APP INTERNA MONOGNOMO 🍌

## Descripción

Aplicación interna de la empresa MonoGnomo para el registro de las horas dedicadas a cada uno de los proyectos realizados, la visualización de todos los proyectos realizados por meses, la gestión de los proyectos y la división del trabajo. Todo ello generando archivos CSV exportables y archivos PDF exportables para llevar el control de todos los aspectos empresariales relativos a los proyectos y empleados.

## Características implementadas

### Experiencia de Usuario (UX/UI) y PWA
- Responsiva: La aplicación es instalable en dispositivos móviles (iOS y Android) y escritorio.Cuenta con iconos personalizados y configuración de manifest.json optimizada.
- Interfaz construida con Tailwind CSS, adaptada a móviles y escritorio, con una identidad visual corporativa definida (Paleta de colores MonoGnomo).
- Feedback Visual e Interactivo: Uso de animaciones, modales de confirmación y notificaciones para confirmar acciones (ejemplo: al guardar horas).

### Gestión y Registro de Tiempos
- Sistema de filtrado en cascada: Selección de Empleado → Filtrado por Empresa → Selección de Proyecto → Asignación de Horas.
- Algoritmo de Prioridad: Las empresas se ordenan automáticamente según una lógica de negocio predefinida, mostrando primero las entidades más relevantes y más seleccionadas por los empleados.
- Selector de Tiempo Intuitivo: Interfaz personalizada para la selección de horas en intervalos de 15 minutos (0.25h), evitando errores de entrada manual.
- Validación de Datos: Bloqueo de envíos si faltan datos críticos (empleado, proyecto o horas en 0). También se valida en caso de que el proyecto que se intenta insertar ya exista.

### Backend y Gestión de Datos
- Arquitectura API: Backend desarrollado en PHP puro para máxima velocidad, gestionando peticiones GET y POST mediante acciones (action=add_entry, action=get_initial_data).
- Base de Datos Relacional Optimizada: Estructura SQL normalizada (workers, projects, entries).
- Uso de GROUP_CONCAT y GROUP BY para consultas eficientes, evitando duplicidad de datos en el frontend.
- Gestión de transacciones (PDO::beginTransaction) para asegurar la integridad de los datos al crear, editar o borrar registros complejos.
- Modo Offline/Caché: Estrategia de caché mediante Vite y hashes en nombres de archivo para asegurar que el usuario siempre carga la última versión tras un despliegue.

### Seguridad
- Autenticación: Sistema de Login que protege la interfaz de registro.
- Protección de API: Cabeceras CORS configuradas y limpieza de buffers (ob_clean) para evitar fugas de datos o errores de formato JSON.

## Tecnologías utilizadas
- React (hooks, useState, useMemo, etc.)
- TailwindCSS
- Fetch API para backend
- Backend PHP 
- Prettier
- Node.js

## Requisitos
- Node.js instalado
- npm o yarn
- Prettier (opcional)



