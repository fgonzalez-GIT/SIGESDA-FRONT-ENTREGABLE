import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';

interface DistribucionData {
    estado: string;
    cantidad: number;
    monto: number;
}

interface Props {
    data: Record<string, { cantidad: number; monto: number }>;
}

const COLORS: Record<string, string> = {
    PAGADO: '#4caf50',
    PENDIENTE: '#ff9800',
    VENCIDO: '#f44336',
    CANCELADO: '#9e9e9e',
    ANULADO: '#757575'
};

export const DistribucionEstadoChart: React.FC<Props> = ({ data }) => {
    // Transformar objeto a array para Recharts
    const chartData: DistribucionData[] = Object.entries(data).map(([estado, valores]) => ({
        estado,
        cantidad: valores.cantidad,
        monto: valores.monto,
    }));

    // Filtrar estados sin datos
    const dataConValores = chartData.filter(item => item.cantidad > 0);

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
                        {data.estado}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cantidad: {data.cantidad}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Monto: {formatCurrency(data.monto)}
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={dataConValores as any}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props: any) => `${props.estado} ${(props.percent * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {dataConValores.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.estado] || '#8884d8'}
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => {
                        const item = dataConValores.find(d => d.estado === value);
                        return `${value} (${item?.cantidad || 0})`;
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default DistribucionEstadoChart;
