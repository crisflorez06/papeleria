import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { VentaService } from '../../services/venta.service';
import { VentaRequest, VentaResponse } from '../../models/venta.model';
import { MensajeService } from '../../services/mensaje.service';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { FiltroService } from '../../services/filtro.service';
import { DetalleVentaResponse } from '../../models/detalle-venta.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatExpansionModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css'],
})
export class VentasComponent implements OnInit {
  private ventaService = inject(VentaService);
  private mensajeService = inject(MensajeService);
  private filtroService = inject(FiltroService);
  private fb = inject(FormBuilder);

  // Datos generales
  public ventas: VentaResponse[] = [];
  public productosVendidos: {
    productoNombre: string;
    cantidadVendida: number;
    totalGenerado: number;
    fecha: string;
  }[] = [];
  public vistaProductos = false;

  public totalVentasEnTabla = 0;
  public totalElementos = 0;
  public size = 10;
  public index = 0;

  public filtrosVentas = {
    metodoPago: '',
    desde: '',
    hasta: '',
    minTotal: null,
    maxTotal: null,
  };

  // Filtros y estado para productos vendidos
  public filtrosProductos = {
    nombreProducto: '',
    desde: '',
    hasta: '',
  };

  public productosPaginados: DetalleVentaResponse[] = [];
  public totalProductosVendidos = 0;
  public indexProductos = 0;
  public sortColumnProductos = 'venta.fecha';
  public sortDirectionProductos: 'asc' | 'desc' = 'desc';

  public metodosPago: string[] = ['Efectivo', 'Tarjeta', 'Transferencia'];
  public sortColumn = 'fecha';
  public sortDirection: 'asc' | 'desc' = 'desc';
  public filtrosAbiertos = false;

  public nombresProductos: { id: number; nombre: string; precioVenta: number }[] = [];
  public totalModalVenta = 0;
  public ventaSeleccionada: VentaResponse | null = null;
  public ventaAEliminar: VentaResponse | null = null;

  formularioVenta = this.fb.nonNullable.group({
    metodoPago: ['Efectivo', Validators.required],
    detalles: this.fb.array(this.crearDetalleArray()),
  });

  private crearDetalleArray() {
    return [] as ReturnType<typeof this.crearDetalleForm>[];
  }

  private crearDetalleForm(productoId: number | null = null, cantidad = 1, productoNombre = '') {
    return this.fb.nonNullable.group({
      productoId: [productoId],
      productoNombre: [productoNombre, Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
    });
  }

  // Inicialización
  ngOnInit(): void {
    this.cargarVentas();
    this.filtroService.getFiltros().subscribe({
      next: (filtros) => {
        this.nombresProductos = filtros.nombresProductos ?? [];
      },
    });

    // Suscribirse a los cambios en los detalles para recalcular el total
    this.detalles.valueChanges.subscribe(
      (detalles: { productoId: number | null; cantidad: number }[]) => {
        this.totalModalVenta = detalles.reduce((total, detalle) => {
          const producto = this.nombresProductos.find(
            (p) => p.id === detalle.productoId
          );
          const precio = producto ? producto.precioVenta : 0;
          const cantidad = detalle.cantidad ? detalle.cantidad : 0;
          return total + precio * cantidad;
        }, 0);
      }
    );
  }

  // Cambio de vista
  alternarVista(): void {
    this.vistaProductos = !this.vistaProductos;
    if (this.vistaProductos) {
      this.cargarProductosVendidos();
    } else {
      this.cargarVentas();
    }
  }

  private cargarProductosVendidos(): void {
    this.ventaService
      .buscarProductos(
        this.indexProductos,
        this.size,
        this.filtrosProductos,
        this.sortColumnProductos,
        this.sortDirectionProductos
      )
      .subscribe({
        next: (page) => {
          this.productosPaginados = page.content;
          this.totalProductosVendidos = page.totalElements;
        },
        error: () => {
          this.mensajeService.error('Error al cargar los productos vendidos.');
          this.productosPaginados = [];
          this.totalProductosVendidos = 0;
        },
      });
  }

  public aplicarFiltrosProductos(): void {
    this.indexProductos = 0;
    this.cargarProductosVendidos();
  }

  public limpiarFiltrosProductos(): void {
    this.filtrosProductos = { nombreProducto: '', desde: '', hasta: '' };
    this.cargarProductosVendidos();
  }

  public cambiarPaginaProductos(event: PageEvent): void {
    this.indexProductos = event.pageIndex;
    this.size = event.pageSize;
    this.cargarProductosVendidos();
  }

  // Cargar ventas
  private cargarVentas(): void {
    this.ventaService
      .obtenerTodos(this.index, this.size, this.filtrosVentas, this.sortColumn, this.sortDirection)
      .subscribe({
        next: (page) => {
          this.ventas = page.ventas.content;
          this.totalElementos = page.ventas.totalElements;
          this.totalVentasEnTabla = page.totalGeneral;
        },
        error: () => {
          this.mensajeService.error('Error al cargar las ventas.');
          this.ventas = [];
          this.totalElementos = 0;
          this.totalVentasEnTabla = 0;
        },
      });
  }

  // Paginación
  public cambiarPagina(event: PageEvent): void {
    this.index = event.pageIndex;
    this.size = event.pageSize;
    this.cargarVentas();
  }

  // Filtros
  public aplicarFiltros(): void {
    this.index = 0;
    this.cargarVentas();
  }

  public limpiarFiltros(): void {
    this.filtrosVentas = { metodoPago: '', desde: '', hasta: '', minTotal: null, maxTotal: null };
    this.cargarVentas();
  }

  // Lógica de guardado (crear o actualizar)
  guardarVenta() {
    if (this.formularioVenta.invalid) {
      this.mensajeService.error('Por favor completa todos los campos.');
      return;
    }

    const ventaRequest: VentaRequest = this.formularioVenta.getRawValue() as VentaRequest;

    const operation = this.ventaSeleccionada
      ? this.ventaService.actualizarVenta(this.ventaSeleccionada.id, ventaRequest)
      : this.ventaService.crearVenta(ventaRequest);

    const successMessage = this.ventaSeleccionada
      ? 'Venta actualizada correctamente.'
      : 'Venta registrada correctamente.';

    operation.subscribe({
      next: () => {
        this.mensajeService.success(successMessage);
        this.cerrarModalVenta();
        if (this.vistaProductos) {
          this.cargarProductosVendidos();
        } else {
          this.cargarVentas();
        }
      },
      error: (err) => {
        this.mensajeService.error('Error al guardar la venta.');
        console.error(err);
      },
    });
  }

  // Abrir modal para crear
  abrirModalCrear(): void {
    this.ventaSeleccionada = null;
    this.detalles.clear();
    this.formularioVenta.reset({ metodoPago: 'Efectivo' });
    this.agregarDetalle(); // Agrega una fila por defecto
    this.abrirModalVenta();
  }

  // Abrir modal para editar
  abrirModalEditar(venta: VentaResponse): void {
    this.ventaSeleccionada = venta;
    this.detalles.clear();
    this.formularioVenta.patchValue({ metodoPago: venta.metodoPago });

    this.ventaService.obtenerDetallesPorVenta(venta.id).subscribe({
      next: (detalles) => {
        if (detalles.length === 0) {
          this.agregarDetalle();
        } else {
          detalles.forEach((detalle) => {
            this.detalles.push(
              this.crearDetalleForm(
                detalle.productoId,
                detalle.cantidad,
                detalle.productoNombre
              )
            );
          });
        }
        this.abrirModalVenta();
      },
      error: () => {
        this.mensajeService.error('Error al cargar los detalles para editar.');
      },
    });
  }

  confirmarEliminarVenta(): void {
    if (!this.ventaAEliminar) {
      return;
    }

    const ventaId = this.ventaAEliminar.id;

    this.ventaService.eliminarVenta(ventaId).subscribe({
      next: () => {
        this.mensajeService.success('Venta eliminada correctamente.');
        if (this.vistaProductos) {
          this.cargarProductosVendidos();
        } else {
          this.cargarVentas();
        }
        this.ventaAEliminar = null;
      },
      error: () => {
        this.mensajeService.error('Error al eliminar la venta.');
        this.ventaAEliminar = null;
      },
    });
  }

  cancelarEliminarVenta(): void {
    this.ventaAEliminar = null;
  }

  ordenarPor(columna: string): void {
    if (this.vistaProductos) {
      if (this.sortColumnProductos === columna) {
        this.sortDirectionProductos = this.sortDirectionProductos === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumnProductos = columna;
        this.sortDirectionProductos = 'asc';
      }
      this.cargarProductosVendidos();
    } else {
      if (this.sortColumn === columna) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = columna;
        this.sortDirection = 'asc';
      }
      this.cargarVentas();
    }
  }

  abrirModalVenta() {
    const modalEl = document.getElementById('ventaModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  cerrarModalVenta() {
    const modalEl = document.getElementById('ventaModal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    // Reiniciar el formulario
    this.detalles.clear();
    this.formularioVenta.reset({
      metodoPago: 'Efectivo',
    });
    this.ventaSeleccionada = null;
  }

  // Detalles del formulario
  get detalles(): FormArray {
    return this.formularioVenta.get('detalles') as FormArray;
  }

  agregarDetalle() {
    this.detalles.push(this.crearDetalleForm());
  }

  eliminarDetalle(i: number) {
    this.detalles.removeAt(i);
  }

  obtenerSubtotal(detalle: any): number {
    const productoId = detalle.get('productoId')?.value;
    const cantidad = detalle.get('cantidad')?.value || 0;
    const precio = this.obtenerPrecioProducto(productoId);
    return precio * cantidad;
  }

  obtenerPrecioProducto(productoId: number | null | undefined): number {
    if (!productoId) {
      return 0;
    }
    const producto = this.nombresProductos.find((p) => p.id === productoId);
    return producto ? producto.precioVenta : 0;
  }

  public productosFiltrados: { [index: number]: { id: number; nombre: string }[] } = {};

  filtrarProductos(index: number): void {
    const valor = this.detalles.at(index).get('productoNombre')?.value?.toLowerCase() || '';
    this.productosFiltrados[index] = this.nombresProductos.filter((p) =>
      p.nombre.toLowerCase().includes(valor)
    );
  }

  seleccionarProducto(event: any, index: number): void {
    const producto = this.nombresProductos.find((p) => p.nombre === event.option.value);
    if (producto) {
      this.detalles.at(index).patchValue({
        productoId: producto.id,
        productoNombre: producto.nombre,
      });
    }
  }
}
