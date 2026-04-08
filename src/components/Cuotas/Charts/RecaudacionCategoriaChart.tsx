import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Box, Typography } from '@mui/material';

interface RecaudacionData {
    categoria: string;
    cantidad: number;
    monto: number;
}

interface Props {
    data: Record<string, { cantidad: number; monto: number }>;
}

const COLORS: Record<string, string> = {
    ACTIVO: '#2196f3',
    ESTUDIANTE: '#4caf50',
    HONORARIO: '#ff9800',
    FUNDADOR: '#9c27b0',
    JUBILADO: '#607d8b',
    INFANTIL: '#e91e63',
    FAMILIAR: '#00bcd4'
};

export const RecaudacionCategoriaChart: React.FC<Props> = ({ data }) => {
    // Transformar objeto a array para Recharts
    const chartData: RecaudacionData[] = Object.entries(data).map(([categoria, valores]) => ({
        categoria: categoria.replace('_', ' '),
        cantidad: valores.cantidad,
        monto: valores.monto,
    }));

    // Filtrar categorías sin datos y ordenar por monto descendente
    const dataConValores = chartData
        .filter(item => item.cantidad > 0)
        .sort((a, b) => b.monto - a.monto);

    if (dataConValores.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography color="text.secondary">No hay datos para mostrar</Typography>
            </Box>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: 2
                    }}
                >
                    <Typography variant="subtitle2" fontWeight="bold">
                        {data.categoria}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cuotas: {data.cantidad}
                    </Typography>
                    <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {formatCurrency(data.monto)}
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataConValores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                    dataKey="categoria"
                    tick={{ fontSize: 12 }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={() => 'Monto Recaudado'}
                />
                <Bar
                    dataKey="monto"
                    name="Recaudado"
                    radius={[8, 8, 0, 0]}
                >
                    {dataConValores.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.categoria.toUpperCase().replace(' ', '_')] || '#2196f3'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default RecaudacionCategoriaChart;
