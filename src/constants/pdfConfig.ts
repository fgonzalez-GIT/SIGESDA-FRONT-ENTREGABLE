/**
 * PDF Configuration
 *
 * Configuración centralizada para la generación de PDFs en todo el sistema.
 * Define constantes de diseño, colores del tema, información de la empresa,
 * y especificaciones de layout que garantizan consistencia visual.
 *
 * Fecha: 13/03/2026
 */

// ============================================================================
// CONFIGURACIÓN DE PÁGINA
// ============================================================================

/**
 * Dimensiones estándar de página A4 en puntos (points)
 * 1 punto = 1/72 pulgadas
 */
export const PAGE_CONFIG = {
    /** Ancho de página A4 en puntos */
    WIDTH: 595.28,
    /** Alto de página A4 en puntos */
    HEIGHT: 841.89,
    /** Margen estándar en todos los bordes */
    MARGIN: 40,
    /** Orientación por defecto */
    ORIENTATION: 'portrait' as const,
    /** Formato de página */
    FORMAT: 'a4' as const,
    /** Unidad de medida */
    UNIT: 'pt' as const,
} as const;

/**
 * Ancho del contenido (página menos márgenes)
 */
export const CONTENT_WIDTH = PAGE_CONFIG.WIDTH - 2 * PAGE_CONFIG.MARGIN; // 515.28pt

// ============================================================================
// COLORES DEL TEMA (MUI)
// ============================================================================

/**
 * Paleta de colores basada en el theme de Material-UI del sistema
 * Todos los colores en formato RGB (array de 3 números)
 */
export const PDF_COLORS = {
    /** Color primario del sistema (#2196F3) */
    primary: [33, 150, 243] as [number, number, number],

    /** Color primario claro (#E3F2FD) - Para fondos destacados */
    primaryLight: [227, 242, 253] as [number, number, number],

    /** Color de texto secundario (#9E9E9E) */
    secondary: [158, 158, 158] as [number, number, number],

    /** Paleta de grises */
    grey: {
        50: [250, 250, 250] as [number, number, number],
        100: [245, 245, 245] as [number, number, number],
        300: [224, 224, 224] as [number, number, number],
        500: [158, 158, 158] as [number, number, number],
        700: [97, 97, 97] as [number, number, number],
        900: [33, 33, 33] as [number, number, number],
    },

    /** Color de éxito (#4CAF50) */
    success: [76, 175, 80] as [number, number, number],

    /** Color de advertencia (#FF9800) */
    warning: [255, 152, 0] as [number, number, number],

    /** Color de error (#F44336) */
    error: [244, 67, 54] as [number, number, number],

    /** Color de información (#2196F3) */
    info: [33, 150, 243] as [number, number, number],

    /** Negro puro */
    black: [0, 0, 0] as [number, number, number],

    /** Blanco puro */
    white: [255, 255, 255] as [number, number, number],
} as const;

// ============================================================================
// TIPOGRAFÍA
// ============================================================================

/**
 * Tamaños de fuente estándar para diferentes elementos
 */
export const FONT_SIZES = {
    /** Títulos principales (ej: nombre de documento) */
    title: 20,

    /** Subtítulos de secciones */
    subtitle: 14,

    /** Encabezados de secciones */
    heading: 12,

    /** Texto normal */
    body: 10,

    /** Texto pequeño (ej: fechas, labels) */
    small: 9,

    /** Texto muy pequeño (ej: footer, notas) */
    caption: 8,

    /** Texto extra grande para destacar */
    display: 24,
} as const;

/**
 * Estilos de fuente disponibles en jsPDF
 */
export const FONT_STYLES = {
    normal: 'normal',
    bold: 'bold',
    italic: 'italic',
    bolditalic: 'bolditalic',
} as const;

/**
 * Familias de fuente disponibles
 */
export const FONT_FAMILIES = {
    helvetica: 'helvetica',
    times: 'times',
    courier: 'courier',
} as const;

// ============================================================================
// LAYOUT DEL HEADER
// ============================================================================

/**
 * Configuración del header de documentos
 * Layout 60/40: Lado izquierdo (logo/empresa) ocupa 60%, lado derecho (datos documento) ocupa 40%
 */
export const HEADER_CONFIG = {
    /** Proporción del lado izquierdo (logo y datos empresa) */
    leftRatio: 0.6,

    /** Proporción del lado derecho (número, fechas, etc) */
    rightRatio: 0.4,

    /** Altura mínima del header */
    minHeight: 120,

    /** Espaciado después del header */
    marginBottom: 20,
} as const;

/**
 * Calcula el ancho de cada columna del header
 */
export const getHeaderWidths = () => ({
    left: CONTENT_WIDTH * HEADER_CONFIG.leftRatio, // ~309pt
    right: CONTENT_WIDTH * HEADER_CONFIG.rightRatio, // ~206pt
    rightStart: PAGE_CONFIG.MARGIN + (CONTENT_WIDTH * HEADER_CONFIG.leftRatio),
});

// ============================================================================
// INFORMACIÓN DE LA EMPRESA
// ============================================================================

/**
 * Datos de la organización/empresa para incluir en PDFs
 */
export const COMPANY_INFO = {
    /** Nombre de la organización */
    name: 'SIGESDA',

    /** Nombre completo/subtítulo */
    fullName: 'Sistema de Gestión de Socios y Actividades',

    /** Dirección física */
    address: 'Av. Principal 123',

    /** Ciudad y provincia */
    city: 'Ciudad, Provincia (CP)',

    /** Teléfono de contacto */
    phone: '(011) 1234-5678',

    /** Email de contacto */
    email: 'info@sigesda.com',

    /** Sitio web (opcional) */
    website: 'www.sigesda.com',
} as const;

// ============================================================================
// ESTILOS DE TABLAS
// ============================================================================

/**
 * Configuración estándar para tablas con jspdf-autotable
 */
export const TABLE_CONFIG = {
    /** Tema de la tabla */
    theme: 'grid' as const,

    /** Estilos generales de la tabla */
    styles: {
        fontSize: 9,
        cellPadding: 8,
        overflow: 'linebreak' as const,
        halign: 'left' as const,
    },

    /** Estilos del encabezado */
    headStyles: {
        fillColor: PDF_COLORS.grey[50],
        textColor: PDF_COLORS.black,
        fontStyle: 'bold' as const,
        lineWidth: 0.5,
        lineColor: PDF_COLORS.grey[300],
        halign: 'left' as const,
    },

    /** Estilos del cuerpo */
    bodyStyles: {
        textColor: PDF_COLORS.black,
        lineWidth: 0.5,
        lineColor: PDF_COLORS.grey[300],
    },

    /** Estilos de filas alternadas */
    alternateRowStyles: {
        fillColor: PDF_COLORS.grey[50],
    },

    /** Márgenes de la tabla */
    margin: {
        left: PAGE_CONFIG.MARGIN,
        right: PAGE_CONFIG.MARGIN,
    },
} as const;

// ============================================================================
// ESTILOS DE SECCIONES
// ============================================================================

/**
 * Configuración para cajas de título destacado (ej: "Cuota Socio - Marzo 2026")
 */
export const TITLE_BOX_CONFIG = {
    /** Color de fondo */
    backgroundColor: PDF_COLORS.primaryLight,

    /** Color del texto */
    textColor: PDF_COLORS.primary,

    /** Tamaño de fuente */
    fontSize: FONT_SIZES.subtitle,

    /** Estilo de fuente */
    fontStyle: FONT_STYLES.bold,

    /** Alto de la caja */
    height: 40,

    /** Radio de bordes redondeados */
    borderRadius: 3,

    /** Padding interno */
    padding: 8,

    /** Alineación del texto */
    align: 'center' as const,
} as const;

/**
 * Configuración para secciones de contenido
 */
export const SECTION_CONFIG = {
    /** Espaciado antes de la sección */
    marginTop: 20,

    /** Espaciado después del título de sección */
    marginBottom: 15,

    /** Color del título de sección */
    titleColor: PDF_COLORS.primary,

    /** Tamaño de fuente del título */
    titleFontSize: FONT_SIZES.heading,

    /** Espaciado entre elementos de la sección */
    itemSpacing: 12,
} as const;

// ============================================================================
// FOOTER
// ============================================================================

/**
 * Configuración del footer de documentos
 */
export const FOOTER_CONFIG = {
    /** Posición desde el final de la página */
    bottomMargin: 50,

    /** Altura del footer */
    height: 30,

    /** Color de la línea divisoria */
    dividerColor: PDF_COLORS.grey[300],

    /** Ancho de la línea divisoria */
    dividerWidth: 0.5,

    /** Tamaño de fuente */
    fontSize: FONT_SIZES.caption,

    /** Color del texto */
    textColor: PDF_COLORS.grey[500],
} as const;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene la posición Y del footer basándose en la altura de página
 */
export const getFooterY = () => PAGE_CONFIG.HEIGHT - FOOTER_CONFIG.bottomMargin;

/**
 * Calcula el alto disponible para contenido (excluyendo header y footer)
 */
export const getContentHeight = () =>
    PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN - FOOTER_CONFIG.height - HEADER_CONFIG.minHeight;

/**
 * Configuración completa exportada
 */
export const PDF_CONFIG = {
    page: PAGE_CONFIG,
    colors: PDF_COLORS,
    fonts: {
        sizes: FONT_SIZES,
        styles: FONT_STYLES,
        families: FONT_FAMILIES,
    },
    header: HEADER_CONFIG,
    company: COMPANY_INFO,
    table: TABLE_CONFIG,
    titleBox: TITLE_BOX_CONFIG,
    section: SECTION_CONFIG,
    footer: FOOTER_CONFIG,
    content: {
        width: CONTENT_WIDTH,
        height: getContentHeight(),
    },
} as const;

// Exportar tipo para TypeScript
export type PdfConfig = typeof PDF_CONFIG;
