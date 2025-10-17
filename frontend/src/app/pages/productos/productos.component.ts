import { Component, inject, OnInit } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

import { ProductoRequest, ProductoResponse } from '../../models/producto.model';
import { Page } from '../../core/types/page';
import { FiltroService } from '../../services/filtro.service';
import { take } from 'rxjs';
import { MensajeService } from '../../services/mensaje.service';
import { ProductoService } from '../../services/producto.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatExpansionModule, FormsModule, ReactiveFormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private mensajeService = inject(MensajeService);
  private apiErrorService = inject(ApiErrorService);
  public productos: ProductoResponse[] = [];
  modoCreacionProducto = false;
  public totalElementos = 0;
  public size = 10;
  public index = 0;
  public filtros = {
    nombre: '',
    categoria: null,
    estado: true,
  };

  public sortColumn = 'nombre';
  public sortDirection: 'asc' | 'desc' = 'asc';

  public filtrosAbiertos = false;

  private fb = inject(FormBuilder);
  formularioProducto: FormGroup;

  private filtroService = inject(FiltroService);
  nombresProductos: { id: number; nombre: string }[] = [];
  categoriasProductos: string[] = [];

  productoSeleccionado: ProductoResponse | null = null;

  productoParaSumar: ProductoResponse | null = null;
  cantidadAgregar: number | null = null;

  constructor() {
    this.formularioProducto = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [null],
      precioCompra: [null, [Validators.required, Validators.min(0)]],
      precioVenta: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.required, Validators.min(0)]],
      categoria: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.filtroService
      .getFiltros()
      .pipe(take(1))
      .subscribe({
        next: (filtros) => {
          this.nombresProductos = filtros.nombresProductos ?? [];
          this.categoriasProductos = filtros.categoriasProductos ?? [];
        },
        error: () => {
          this.nombresProductos = [];
          this.categoriasProductos = [];
        },
      });
  }

  abrirModalCrearProducto(): void {
    this.productoSeleccionado = null;
    this.modoCreacionProducto = true;
    this.formularioProducto.reset();
    this.apiErrorService.clearFormErrors(this.formularioProducto);
  }

  ordenarPor(columna: string): void {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columna;
      this.sortDirection = 'asc';
    }

    this.cargarProductos();
  }
  private cargarProductos(): void {
    this.productoService
      .obtenerTodos(this.index, this.size, this.filtros, this.sortColumn, this.sortDirection)
      .subscribe({
        next: (page) => {
          this.productos = page.content;
          this.totalElementos = page.totalElements;
        },
        error: (error) => {
          this.apiErrorService.handle(error, {
            contextMessage: 'Error al cargar los productos.',
          });
          this.productos = [];
          this.totalElementos = 0;
        },
      });
  }

  public cambiarPagina(event: PageEvent): void {
    this.index = event.pageIndex;
    this.size = event.pageSize;
    this.cargarProductos();
  }

  public aplicarFiltros(): void {
    this.index = 0; // resetear a primera página
    this.cargarProductos();
  }

  public limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      categoria: null,
      estado: true,
    };
    this.cargarProductos();
  }

  guardarProducto() {
    if (this.formularioProducto.invalid) {
      this.mensajeService.error('Por favor rellenar todos los campos');
      return;
    }

    this.apiErrorService.clearFormErrors(this.formularioProducto);

    //logica por si es edicion o creacion
    if (this.productoSeleccionado) {
      const productoActualizado: ProductoResponse = {
        ...this.productoSeleccionado,
        ...this.formularioProducto.value,
      };
      this.productoService.actualizar(productoActualizado.id!, productoActualizado).subscribe({
        next: () => {
          this.mensajeService.success('Producto actualizado con éxito');
          this.reiniciarFormularioProducto();
          this.cargarProductos();
        },
        error: (error) => {
          this.apiErrorService.handle(error, {
            form: this.formularioProducto,
            contextMessage: 'Error al actualizar el producto.',
          });
        },
      });
    } else {
      // Modo creación
      this.productoService.crearProducto(this.formularioProducto.value).subscribe({
        next: () => {
          this.mensajeService.success('Producto registrado con éxito');
          this.reiniciarFormularioProducto();
          this.cargarProductos();
        },
        error: (error) => {
          this.apiErrorService.handle(error, {
            form: this.formularioProducto,
            contextMessage: 'Error al registrar el producto.',
          });
        },
      });
    }
  }

  editarProducto(producto: ProductoResponse) {
    this.apiErrorService.clearFormErrors(this.formularioProducto);
    this.productoSeleccionado = producto;
    this.modoCreacionProducto = true;
    this.formularioProducto.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      stock: producto.stock,
      categoria: producto.categoria,
    });
  }

  cambiarEstado(producto: ProductoResponse) {
    this.productoService.cambiarEstadoProducto(producto.id!).subscribe({
      next: () => {
        this.mensajeService.success('Producto eliminado con éxito');
        this.cargarProductos();
      },
      error: (error) => {
        this.apiErrorService.handle(error, {
          contextMessage: 'Error al eliminar el producto.',
        });
      },
    });
  }

  ocultarFormularioProducto(): void {
    this.modoCreacionProducto = false;
    this.productoSeleccionado = null;
    this.formularioProducto.reset();
    this.apiErrorService.clearFormErrors(this.formularioProducto);
    this.cargarProductos();
    this.cerrarModalProducto();
  }

  abrirModalAgregarStock(producto: ProductoResponse) {
    this.productoParaSumar = producto;
  }

  confirmarAgregarStock() {
    if (!this.productoParaSumar || !this.cantidadAgregar || this.cantidadAgregar <= 0) {
      this.mensajeService.error('Debe ingresar una cantidad válida.');
      return;
    }

    this.productoService.sumarStock(this.productoParaSumar.id!, this.cantidadAgregar).subscribe({
      next: () => {
        this.mensajeService.success('Stock actualizado con éxito.');
        this.productoParaSumar = null;
        this.cantidadAgregar = null;
        this.cargarProductos();
      },
      error: (error) => {
        this.apiErrorService.handle(error, {
          contextMessage: 'Error al actualizar el stock.',
        });
      },
    });
  }

  cerrarModalAgregarStock() {
    const modal = document.getElementById('agregarStockModal');
    if (modal) {
      const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);
      bootstrapModal?.hide();
    }
    this.productoParaSumar = null;
    this.cantidadAgregar = null;
    this.cargarProductos();
  }

  productoAEliminar: ProductoResponse | null = null;

  confirmarEliminacion(): void {
    if (!this.productoAEliminar) return;

    this.cambiarEstado(this.productoAEliminar);
    this.productoAEliminar = null;
  }

  private cerrarModalProducto(): void {
    const modal = document.getElementById('productoModal');
    if (modal) {
      bootstrap.Modal.getOrCreateInstance(modal).hide();
    }
  }

  private reiniciarFormularioProducto(): void {
    this.productoSeleccionado = null;
    this.modoCreacionProducto = true;
    this.formularioProducto.reset();
    this.apiErrorService.clearFormErrors(this.formularioProducto);
  }
}
