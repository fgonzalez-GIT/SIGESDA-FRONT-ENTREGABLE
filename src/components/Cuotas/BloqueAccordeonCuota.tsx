import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    AttachMoney as AttachMoneyIcon,
    SportsBasketball as SportsBasketballIcon,
    Percent as PercentIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { ItemCuota } from '../../types/cuota.types';
import { decimalToNumber, esItemQueDescuenta } from '../../utils/cuota.helpers';

interface BloqueAccordeonCuotaProps {
    panel: string;
    title: string;
    tipoBloque: 'BASE' | 'ACTIVIDAD' | 'RECARGO' | 'DESCUENTO';
    items: ItemCuota[];
    expanded: boolean;
    onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

const BloqueAccordeonCuota: React.FC<BloqueAccordeonCuotaProps> = ({
    panel,
    title,
    tipoBloque,
    items,
    expanded,
    onChange
}) => {
    // Calcular subtotal usando esItemQueDescuenta para determinar el signo correcto.
    // Los items con formula.descuenta=true siempre restan, aunque el monto almacenado sea positivo.
    const subtotal = items.reduce((acc, item) => {
        const valor = decimalToNumber(item.monto) * decimalToNumber(item.cantidad);
        return esItemQueDescuenta(item) ? acc - Math.abs(valor) : acc + valor;
    }, 0);

    // Colores por tipo de bloque
    const colorMap = {
        BASE: { primary: '#2e7d32', light: '#e8f5e9', bg: '#f1f8f4' },       // Verde oscuro (DEBE)
        ACTIVIDAD: { primary: '#1565c0', light: '#e3f2fd', bg: '#f0f7ff' },  // Azul (Neutral)
        RECARGO: { primary: '#43a047', light: '#e8f5e9', bg: '#f1fdf4' },    // Verde medio (DEBE)
        DESCUENTO: { primary: '#fb8c00', light: '#fff3e0', bg: '#fffaf0' }   // Naranja (HABER)
    };
    const colors = colorMap[tipoBloque];

    // Ícono por tipo de bloque
    const getIcon = () => {
        switch (tipoBloque) {
            case 'BASE':
                return <AttachMoneyIcon sx={{ color: colors.primary }} />;
            case 'ACTIVIDAD':
                return <SportsBasketballIcon sx={{ color: colors.primary }} />;
            case 'RECARGO':
                return <TrendingUpIcon sx={{ color: colors.primary }} />;
            case 'DESCUENTO':
                return <PercentIcon sx={{ color: colors.primary }} />;
        }
    };

    return (
        <Accordion
            expanded={expanded}
            onChange={onChange}
            sx={{
                border: `1px solid ${colors.light}`,
                borderRadius: 1,
                boxShadow: 'none',
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: '0 0 16px 0'
                },
                mb: 2
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    bgcolor: colors.bg,
                    borderBottom: expanded ? `1px solid ${colors.light}` : 'none',
                    minHeight: 56,
                    '&.Mui-expanded': {
                        minHeight: 56
                    },
                    '& .MuiAccordionSummary-content': {
                        margin: '12px 0',
                        '&.Mui-expanded': {
                            margin: '12px 0'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {getIcon()}
                        <Typography variant="subtitle2" fontWeight="bold" color={colors.primary}>
                            {title}
                        </Typography>
                    </Box>
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={subtotal >= 0 ? 'success.dark' : 'error.main'}
                        onClick={(e) => e.stopPropagation()}
                    >
                        Subtotal: ${Math.abs(subtotal).toFixed(2)}
                    </Typography>
                </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
                {items.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Sin ítems en esta categoría
                        </Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: colors.primary }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Concepto</TableCell>
                                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', minWidth: 100 }}>
                                    Debe (+)
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', minWidth: 100 }}>
                                    Haber (-)
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 80 }}>
                                    Cant.
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 100 }}>
                                    Info
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => {
                                const montoTotal = decimalToNumber(item.monto) * decimalToNumber(item.cantidad);
                                // Determinar si el ítem descuenta usando formula.descuenta (prioridad)
                                // o el código de categoría (fallback). No confiar solo en el signo del monto.
                                const esDescuento = esItemQueDescuenta(item);
                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{item.concepto}</TableCell>
                                        <TableCell align="right">
                                            {!esDescuento ? (
                                                <Typography color="success.dark" fontWeight="medium">
                                                    ${Math.abs(montoTotal).toFixed(2)}
                                                </Typography>
                                            ) : (
                                                <Typography color="text.disabled">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {esDescuento ? (
                                                <Typography color="error.main" fontWeight="medium">
                                                    ${Math.abs(montoTotal).toFixed(2)}
                                                </Typography>
                                            ) : (
                                                <Typography color="text.disabled">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">{decimalToNumber(item.cantidad)}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                {item.esAutomatico ? (
                                                    <Chip size="small" label="Auto" color="primary" variant="outlined" />
                                                ) : (
                                                    <Chip size="small" label="Manual" color="secondary" variant="outlined" />
                                                )}
                                                {item.porcentaje && (
                                                    <Chip size="small" label={`${decimalToNumber(item.porcentaje)}%`} color="info" variant="outlined" />
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

export default BloqueAccordeonCuota;
