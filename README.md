# 🗂️ Papelería – Sistema de Gestión Comercial

**Papelería** es un sistema **fullstack** para la gestión de operaciones básicas de un negocio minorista (como una papelería).  
El proyecto está diseñado con una **arquitectura clara**, separación frontend/backend y buenas prácticas de desarrollo, orientado a escenarios reales.

Forma parte de un conjunto de proyectos enfocados en **gestión operativa, control y trazabilidad**.

---

## 🧩 Funcionalidades principales

- Gestión de productos 
- Control de inventario 
- Registro y administración de ventas
- Registro de gastos 
- Movimientos de inventario 
- Reportes generales por rango de fechas 
- Detección de productos con stock bajo 
- Operaciones CRUD completas 
- Persistencia en base de datos relacional 

> El proyecto prioriza **estructura, mantenibilidad y claridad técnica** por encima de complejidad innecesaria.

---

## 🏗️ Arquitectura

El sistema sigue una arquitectura **fullstack desacoplada**:

- **Frontend:** Angular 
- **Backend:** Spring Boot (API REST) 
- **Base de datos:** MySQL 
- **Persistencia:** JPA / Hibernate 
- **Mapeo de datos:** MapStruct 
- **Documentación API:** Scalar 

### Esquema lógico

 [ Angular ] ---> [ Spring Boot API ] ---> [ MySQL ] 
La lógica de negocio está organizada por capas, facilitando escalabilidad y mantenimiento.

---

## 🔐 Seguridad y buenas prácticas

El proyecto aplica criterios adecuados para un repositorio público:

- Separación clara entre frontend y backend 
- Arquitectura por capas (controller, service, repository) 
- Uso de DTOs para exponer información 
- Configuración externa mediante variables de entorno 
- No se incluyen credenciales sensibles en el repositorio 

Para facilitar la configuración sin exponer secretos:
- `.env.example` con variables de entorno sugeridas
- `application.properties.example` como referencia de propiedades

> El enfoque es demostrar **criterio técnico real**, no solo funcionalidad visible.

---

## 📚 Documentación de la API

La API está documentada mediante **Scalar**, lo que permite explorar los endpoints y modelos de forma estructurada.

- Especificación OpenAPI disponible en: 
 `:8080/scalar`

---

## 🐳 Infraestructura y ejecución

El proyecto incluye soporte para **Docker** y **Docker Compose**, facilitando la ejecución del entorno de base de datos.

### Servicios disponibles vía Docker Compose

- MySQL 
- phpMyAdmin 

Esto permite levantar rápidamente el entorno sin configuración manual adicional.

---

## ⚙️ Ejecución del proyecto

### Requisitos

- Java 17 
- Maven 
- Docker (opcional, recomendado) 

### Pasos generales

1. Clonar el repositorio 
2. Configurar variables de entorno (base de datos) 
3. Levantar la base de datos (local o Docker) 
4. Ejecutar el backend con Maven 
5. Ejecutar el frontend Angular 

El frontend consume la API REST expuesta por el backend.

---

## 🧪 Estado del proyecto

- ✔️ Funcionalidades base implementadas 
- ✔️ Arquitectura definida 
- ✔️ Frontend y backend integrados 
- ✔️ Preparado para entornos reales 
- 🔄 En evolución y mejora continua 

Este proyecto **representa un desarrollo real**, no un ejemplo artificial.

---

## 🎯 Objetivo del proyecto

Este proyecto tiene como finalidad:

- Demostrar desarrollo **fullstack (Angular + Spring Boot)** 
- Aplicar arquitectura desacoplada 
- Implementar persistencia con **JPA / MySQL** 
- Mostrar organización, seguridad y criterio técnico 
- Servir como base para sistemas comerciales pequeños 

---

## 👨‍💻 Autor

**Cristian Flórez** 
Sitio web: https://crisflorezdev.vercel.app/

---

## 📄 Licencia

Este proyecto se distribuye bajo la **Licencia MIT**. 
Puedes usarlo como referencia, aprendizaje o base para otros desarrollos.
