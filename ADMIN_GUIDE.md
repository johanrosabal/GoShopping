# Guía Técnica Administrativa - Go-Shopping Elite
## Ecosistema Multi-Comercio

Este documento detalla la lógica de negocio, arquitectura y flujos implementados en la plataforma Go-Shopping para el manejo de múltiples comercios.

---

### 1. Arquitectura de Datos
La plataforma utiliza **Firebase Firestore** como base de datos principal, estructurada de la siguiente manera:

*   **`merchants`**: Perfiles de comercios. Incluye datos legales, de contacto, configuración de pagos (PayPal/SINPE) y horarios.
*   **`marketplace_plans`**: Definición de planes (Standard, Premium, Elite) con sus respectivas comisiones y beneficios.
*   **`products`**: Catálogo global. Cada producto tiene un `merchantId` que lo vincula a su dueño. Los productos del sistema usan `go-shopping-main`.
*   **`users`**: Perfiles de usuario con roles (`admin`, `merchant_admin`, `client`). El rol `merchant_admin` incluye un `merchantId`.

---

### 2. Flujo de Afiliación (Onboarding)
Ubicación: `/admin/merchants/new`

El proceso de dar de alta a un nuevo socio comercial sigue estos pasos lógicos:
1.  **Validación de Identidad**: Se capturan datos legales y comerciales. Se genera un **Folio de Socio** único de 6 dígitos (Ej: `000001`) mediante un contador atómico en Firestore.
2.  **Acceso Administrativo**: El sistema crea automáticamente una cuenta en *Firebase Authentication* para el administrador del comercio con el rol `merchant_admin`.
3.  **Selección de Plan**: El administrador elige el modelo de negocio. Esto determina las comisiones y pasarelas permitidas.
4.  **Pasarela de Afiliación**:
    *   **PayPal**: Si el pago es exitoso, el comercio se marca como `active` de inmediato.
    *   **SINPE**: El comercio queda en `pending` hasta que un Super Admin valide el comprobante.
5.  **Contrato Digital**: Al finalizar, el sistema genera un **PDF dinámico** utilizando `html2canvas` y `jsPDF` con todos los términos aceptados y datos legales.

---

### 3. Sistema de Carrito y Checkout Segmentado
Ubicación: `CartContext.tsx` y `/checkout`

Para soportar múltiples comercios en un solo carrito, se implementó la siguiente lógica:
*   **Agrupación**: El carrito permite agregar productos de diferentes comercios simultáneamente.
*   **Checkout por Pasos**: El sistema detecta cuántos comercios hay en el carrito y genera un **Stepper**.
*   **Pago Directo**: El cliente paga a cada comercio individualmente usando las pasarelas (PayPal/SINPE) configuradas por el propio comerciante en su perfil.
*   **Limpieza Inteligente**: Una vez pagado un comercio, el carrito elimina solo los ítems de ese `merchantId`, manteniendo el resto si el proceso se interrumpe.

---

### 4. Panel de Configuración del Comerciante
Ubicación: `/merchant/settings`

Los comerciantes tienen control total sobre su presencia:
*   **Brand Hero**: Pueden subir un Logo y un Banner cinematográfico para su página de inicio.
*   **Pasarelas Propias**: Configuración de `PayPal Client ID` (Sandbox/Live) y número SINPE.
*   **Horarios Dinámicos**: Control de apertura/cierre por día de la semana con un selector de 12h (AM/PM).
*   **Ecosistema Social**: Switches para activar/desactivar la visibilidad de WhatsApp, Instagram y Facebook.

---

### 5. Roles y Permisos
*   **Super Admin**: Acceso total. Puede crear comercios, editar planes, gestionar todos los pedidos y usuarios. Posee la facultad de activar/suspender cualquier entidad en el ecosistema.
*   **Merchant Admin**: Acceso limitado a su propia tienda. Gestiona sus productos, pedidos recibidos y configuración de marca. No puede alterar comisiones ni crear otros comercios.
*   **Client**: Usuario final. Puede comprar, chatear con soporte y gestionar sus direcciones.

---

### 6. Módulos de Control Administrativo
Ubicación: Panel Principal (`/admin`)

*   **📦 Gestión de Pedidos**: Central de operaciones donde se validan pagos manuales (SINPE), se actualizan estados de envío y se gestiona la logística global.
*   **💬 Soporte V.I.P. Chat**: Sistema de mensajería en tiempo real para resolución de disputas y atención directa al cliente.
*   **🏷️ Inventario Elite**: Control maestro de todos los productos de la plataforma. Permite edición masiva, control de stock mínimo y destacados.
*   **👥 Usuarios**: Directorio completo de la base de usuarios. Permite la gestión de roles y el bloqueo preventivo de cuentas.
*   **📁 Categorías**: Herramienta de arquitectura de información para organizar el catálogo global de productos.
*   **⚙️ Configuración Global**: Control de la identidad de Go-Shopping (Logo principal, RRSS de la plataforma y datos de contacto oficiales).
*   **🏪 Ecosistema Marketplace**: Directorio de socios comerciales. Es el punto de entrada para nuevas afiliaciones y control de salud de los comercios.
*   **💎 Planes de Negocio**: Gestor dinámico de suscripciones. Permite ajustar el costo de entrada y las comisiones por venta de forma atómica.

---

### 7. Mantenimiento y API
*   **API `/api/admin/create-user`**: Utiliza el Firebase Admin SDK para gestionar usuarios de forma segura desde el servidor, permitiendo asignar roles y `merchantId` sin que el usuario tenga que cerrar sesión.
*   **Servicios en `lib/services`**: Capa de abstracción para todas las operaciones de Firestore (merchants, products, orders).

---
*Documento generado por Antigravity AI - Abril 2026*
