import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { MensajeService } from '../../services/mensaje.service';
import { ReporteGeneralResponse } from '../../models/reporte.model';
import { ProductoResponse } from '../../models/producto.model';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private mensajeService = inject(MensajeService);

  reporteGeneral: ReporteGeneralResponse | null = null;
  productosStockBajo: ProductoResponse[] = [];

  fechaInicio = '';
  fechaFin = '';
  cargando = false;

  ngOnInit(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
  }

  generarReportes(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeService.error('Debe seleccionar ambas fechas.');
      return;
    }

    this.cargando = true;

    this.reporteService.getReporteGeneral(this.fechaInicio, this.fechaFin).subscribe({
      next: (res) => {
        this.reporteGeneral = res as ReporteGeneralResponse;
        this.cargando = false;
      },

      error: () => {
        this.mensajeService.error('Error al cargar el reporte general.');
        this.cargando = false;
      },
    });

    this.reporteService.getProductosConStockBajo().subscribe({
      next: (res) => (this.productosStockBajo = res),
      error: () => this.mensajeService.error('Error al cargar el stock bajo.'),
    });
  }
}
