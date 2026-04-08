import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { BasePdfGenerator } from '@/utils/pdf/BasePdfGenerator';
import { personasApi } from '../../../services/personasApi';
import type { PersonasQueryParams } from '../../../types/persona.types';
import { getNombreCompleto } from '../../../types/persona.types';
import { formatDateES } from '@/utils/dateHelpers';

interface Props {
  filters?: PersonasQueryParams;
  filename?: string;
}

/**
 * Obtiene el estado de una persona
 */
const getEstado = (persona: any): string => {
  if (persona.estado) return persona.estado;
  return persona.activo ? 'ACTIVO' : 'INACTIVO';
};

/**
 * Obtiene los tipos de persona formateados
 */
const getTiposPersona = (persona: any): string => {
  if (!Array.isArray(persona.tipos)) return '-';
  return persona.tipos
    .map((t: any) => t.tipoPersona?.nombre || t.tipoPersona?.codigo || '')
    .filter(Boolean)
    .slice(0, 3)
    .join(', ') || '-';
};

/**
 * Obtiene el contacto principal de una persona
 */
const getContacto = (persona: any): string => {
  return persona.email || persona.telefono || '-';
};

/**
 * Obtiene la fecha de ingreso (preferir fecha de SOCIO)
 */
const getFechaIngreso = (persona: any): string => {
  const fechaSocio = persona.tipos?.find(
    (t: any) => t.tipoPersona?.codigo === 'SOCIO' && t.fechaIngreso
  )?.fechaIngreso;

  const fecha = fechaSocio || persona.fechaIngreso;
  return fecha ? formatDateES(fecha) : '-';
};

/**
 * Genera un reporte PDF de personas usando BasePdfGenerator
 */
const generarReportePersonasPdf = (personas: any[]) => {
  const pdf = new BasePdfGenerator();

  // Header del documento
  pdf.addHeader({
    leftTitle: 'REPORTE DE PERSONAS',
    rightData: {
      number: `Total: ${personas.length}`,
      date: new Date(),
    },
  });

  // Título destacado
  pdf.addTitleBox({
    title: `Listado de Personas - ${personas.length} registro${personas.length !== 1 ? 's' : ''}`,
  });

  // Tabla con los datos
  const headers = ['Nombre Completo', 'DNI', 'Tipos', 'Contacto', 'Estado', 'F. Ingreso'];
  const rows = personas.map((persona) => [
    getNombreCompleto(persona),
    persona.dni || '-',
    getTiposPersona(persona),
    getContacto(persona),
    getEstado(persona),
    getFechaIngreso(persona),
  ]);

  pdf.addTable({
    headers,
    rows,
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },   // Nombre
      1: { cellWidth: 70, halign: 'center' },      // DNI
      2: { cellWidth: 90, halign: 'left' },        // Tipos
      3: { cellWidth: 100, halign: 'left' },       // Contacto
      4: { cellWidth: 60, halign: 'center' },      // Estado
      5: { cellWidth: 70, halign: 'center' },      // F. Ingreso
    },
  });

  // Resumen al final
  if (personas.length > 0) {
    pdf.addSpace(20);
    pdf.addDivider();
    pdf.addSpace(10);

    const activos = personas.filter((p) => getEstado(p) === 'ACTIVO').length;
    const inactivos = personas.length - activos;

    pdf.addKeyValue('Total de Personas', personas.length, { fontSize: 10, labelWidth: 120 });
    pdf.addKeyValue('Personas Activas', activos, { fontSize: 10, labelWidth: 120 });
    pdf.addKeyValue('Personas Inactivas', inactivos, { fontSize: 10, labelWidth: 120 });
  }

  return pdf;
};

export const DownloadPdfButton: React.FC<Props> = ({
  filters,
  filename = 'reporte-personas'
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await personasApi.getAll(filters);
      const personas = response.data || [];

      // Generar PDF usando la nueva infraestructura
      const pdf = generarReportePersonasPdf(personas);
      pdf.save(filename);

    } catch (error) {
      console.error('Error generando PDF de personas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      size="large"
      startIcon={loading ? <CircularProgress size={18} /> : <GetAppIcon />}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? 'Generando...' : 'Descargar PDF'}
    </Button>
  );
};

export default DownloadPdfButton;
