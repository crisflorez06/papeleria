export interface ProductoMasVendido {
  productoId: number;
  nombre: string;
  cantidadVendida: number;
  totalGenerado: number;
}

export interface ReporteGeneralResponse {
  totalGanancias: number;
  totalDineroEnVentas: number;
  totalVentas: number;
  productosMasVendidos: ProductoMasVendido[];
}