 # Finases

Aplicación de gestión de finanzas personales creada con **Ionic React**, Vite y Capacitor.

Ionic se encarga de la interfaz multiplataforma usando React. Capacitor toma esa aplicación web y la empaqueta como aplicación nativa para Android o iOS. Por eso el desarrollo se hace principalmente en `src/`, mientras que Android Studio se usa para compilar y firmar el APK.

## Requisitos

- Node.js 20 o superior
- npm
- Ionic CLI, opcional para usar `ionic serve` e `ionic build`
- Android Studio y Android SDK para generar el APK
- Java 17 para Android

Instalar Ionic CLI:

```bash
npm install -g @ionic/cli
```

## Instalar y ejecutar

```bash
npm install
npm run dev
```

También puedes iniciar el proyecto con Ionic:

```bash
ionic serve
```

Para abrir la aplicación en el navegador:

```text
http://localhost:5173
```

## Flujo Ionic + Capacitor

El flujo correcto del proyecto es:

```text
Ionic React -> Vite build -> Capacitor sync -> Android Studio -> APK
```

Para compilar la parte web con Ionic:

```bash
ionic build
```

El comando equivalente usado por este proyecto es:

```bash
npm run build
```

## Crear el ícono de la aplicación

Capacitor necesita una imagen fuente para generar los tamaños nativos de Android e iOS.

### 1. Preparar la imagen fuente

Crea un archivo PNG cuadrado con estas características:

- Nombre: `icon-only.png`
- Ubicación: `resources/icon-only.png`
- Tamaño recomendado: `1024 x 1024 px`
- Fondo opaco, preferiblemente con el color café de Finases
- Símbolo central en verde lima
- Deja espacio libre alrededor del símbolo para que Android no lo recorte
- No uses texto pequeño, porque no será legible en el teléfono

El diseño debe funcionar también dentro de un círculo o una máscara adaptativa. Conserva el archivo original de 1024 px para futuras versiones.

### 2. Instalar el generador de recursos

Este comando instala la herramienta oficial para generar íconos y splash screens de Capacitor:

```bash
npm install --save-dev @capacitor/assets
```

### 3. Generar los recursos nativos

Con el archivo `resources/icon-only.png` creado, ejecuta:

```bash
npx capacitor-assets generate
```

La herramienta genera los tamaños necesarios para Android y iOS. No edites manualmente los archivos generados dentro de `android/` o `ios/`, porque se pueden sobrescribir al volver a ejecutar el comando.

### 4. Sincronizar Capacitor

```bash
npm run cap:sync
```

Este comando compila la aplicación y copia los recursos web y nativos actualizados.

## Crear el proyecto Android

Si todavía no existe la carpeta `android/`, créala desde Capacitor:

```bash
npx cap add android
npm run cap:sync
```

No se genera el APK directamente con `ionic serve`. Ese comando solo inicia la aplicación en el navegador. Para Android siempre debes compilar y sincronizar Capacitor.

Abrir Android Studio:

```bash
npx cap open android
```

También existe el comando combinado:

```bash
npm run cap:android
```

## Generar el APK

### Firma release propia

La aplicación no debe publicarse usando la firma `debug` de Android. Para poder instalar actualizaciones sobre la misma aplicación, conserva siempre estas dos cosas:

- `applicationId`: `com.finases.app`
- La misma clave de firma release (`finases-release.jks`)

Genera una clave una sola vez desde la carpeta `android`:

```bash
cd android
keytool -genkeypair -v -keystore finases-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias finases
```

Guarda la contraseña y la clave en un lugar seguro. Después crea `android/keystore.properties` a partir de `android/keystore.properties.example`:

```properties
storeFile=finases-release.jks
storePassword=TU_CONTRASENA_DEL_KEYSTORE
keyAlias=finases
keyPassword=TU_CONTRASENA_DE_LA_CLAVE
```

El archivo `keystore.properties` y el archivo `.jks` están ignorados por Git. No los subas al repositorio ni los pierdas: sin esta clave no podrás publicar actualizaciones de la misma aplicación.

### Crear el APK release

Desde la raíz del proyecto:

```bash
npm run android:release
```

El APK se genera normalmente en:

```text
android/app/build/outputs/apk/release/app-release.apk
```

También puedes abrir Android Studio y generar el APK desde `Build > Generate App Bundles or APKs > Generate Signed Bundle / APK`.

Importante: si el APK actualmente instalado fue creado con la firma `debug`, el primer APK release tiene otra firma y Android no permite actualizarlo encima. En ese caso debes desinstalar la versión debug una sola vez. Después instala el APK release y conserva siempre la misma clave release; las próximas actualizaciones no deberían desinstalar la aplicación ni borrar sus datos.

El `versionCode` debe aumentar en cada actualización. Actualmente está en `2` dentro de `android/app/build.gradle`.

Desde Android Studio:

1. Abre el proyecto Android.
2. Espera a que Gradle termine de sincronizar.
3. Ve a `Build > Generate App Bundles or APKs > Generate APKs`.
4. Selecciona la variante `debug` para pruebas.
5. El APK se encontrará normalmente en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Para una versión publicable, usa `release`, configura una clave de firma y no compartas el archivo de claves ni sus contraseñas.

## Identidad de la aplicación

La aplicación está configurada con:

```text
Nombre: finases
Id: com.finases.app
```

El identificador está definido en `capacitor.config.ts`. Debe mantenerse estable después de publicar la aplicación, porque Android lo usa para identificarla.

## Flujo recomendado después de cambiar el ícono

```bash
npm run build
npx capacitor-assets generate
npx cap sync android
npx cap open android
```

Comprueba el ícono en un dispositivo o emulador Android. Algunos launchers mantienen íconos en caché; si no cambia inmediatamente, desinstala la aplicación de prueba y vuelve a instalarla.

## Datos locales

Finases guarda los movimientos localmente en el dispositivo. Borrar los datos de la aplicación o desinstalarla puede eliminar esa información. Antes de publicar una versión real, conviene agregar exportación e importación de respaldos.

## Comandos disponibles

| Comando | Función |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila la aplicación web |
| `npm run lint` | Ejecuta ESLint |
| `npm run test.unit` | Ejecuta pruebas unitarias |
| `npm run test.e2e` | Ejecuta pruebas Cypress |
| `npm run cap:sync` | Compila y sincroniza Capacitor |
| `npm run cap:android` | Compila, sincroniza y abre Android Studio |
| `npm run android:release` | Compila y genera el APK release firmado |

## Estructura importante

```text
src/pages/Page.tsx              Pantallas y módulos financieros
src/store/financeStore.ts       Estado y movimientos locales
src/components/Menu.tsx         Menú lateral
src/theme/variables.css         Tema de Ionic
capacitor.config.ts             Configuración nativa
resources/icon-only.png         Imagen fuente del ícono
```
