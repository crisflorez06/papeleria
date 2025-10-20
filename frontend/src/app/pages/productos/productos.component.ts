import { Component, inject, OnInit } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

import { MovimientoEntradaProductoRequest, ProductoRequest, ProductoResponse } from '../../models/producto.model';
import { Page } from '../../core/types/page';
import { FiltroService } from '../../services/filtro.service';
import { take } from 'rxjs';
import { MensajeService } from '../../services/mensaje.service';
import { ProductoService } from '../../services/producto.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatExpansionModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
  ],
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
  formularioMovimientos: FormGroup;

  public productosActivos: ProductoResponse[] = [];
  public productosFiltradosMovimientos: { [index: number]: { id: number; nombre: string }[] } = {};

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
    this.formularioMovimientos = this.fb.group({
      movimientos: this.fb.array([this.crearMovimientoFormGroup()]),
    });
  }

  get movimientosFormArray(): FormArray {
    return this.formularioMovimientos.get('movimientos') as FormArray;
  }

  private crearMovimientoFormGroup(): FormGroup {
    return this.fb.group({
      productoId: [null, Validators.required],
      productoNombre: ['', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      observacion: [''],
    });
  }

  private resetFormularioMovimientos(): void {
    this.apiErrorService.clearFormErrors(this.formularioMovimientos);
    const movimientos = this.movimientosFormArray;
    while (movimientos.length > 0) {
      movimientos.removeAt(0);
    }
    movimientos.push(this.crearMovimientoFormGroup());
    this.formularioMovimientos.markAsPristine();
    this.formularioMovimientos.markAsUntouched();
    this.formularioMovimientos.updateValueAndValidity();
    this.reconstruirProductosFiltrados();
  }

  private reconstruirProductosFiltrados(): void {
    const opciones = this.obtenerOpcionesProductos();
    this.productosFiltradosMovimientos = {};
    this.movimientosFormArray.controls.forEach((control, index) => {
      const filtro = control.get('productoNombre')?.value?.toLowerCase() ?? '';
      this.productosFiltradosMovimientos[index] =
        filtro === ''
          ? opciones
          : opciones.filter((producto) => producto.nombre.toLowerCase().includes(filtro));
    });
  }

  private obtenerOpcionesProductos(): { id: number; nombre: string }[] {
    if (!this.productosActivos) {
      return [];
    }
    return this.productosActivos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
    }));
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

  public abrirModalIngresarProductos(): void {
    this.resetFormularioMovimientos();
    this.cargarProductosActivos();
  }

  public agregarFilaMovimiento(): void {
    this.movimientosFormArray.push(this.crearMovimientoFormGroup());
    this.reconstruirProductosFiltrados();
  }

  public eliminarFilaMovimiento(index: number): void {
    if (this.movimientosFormArray.length === 1) {
      return;
    }
    this.movimientosFormArray.removeAt(index);
    this.reconstruirProductosFiltrados();
  }

  public filtrarProductosMovimiento(index: number): void {
    const control = this.movimientosFormArray.at(index) as FormGroup;
    const valor = control.get('productoNombre')?.value?.toLowerCase() ?? '';

    const productoSeleccionado = this.productosActivos.find(
      (producto) => producto.id === control.get('productoId')?.value,
    );

    if (productoSeleccionado && productoSeleccionado.nombre.toLowerCase() !== valor) {
      control.get('productoId')?.setValue(null);
    }

    const opciones = this.obtenerOpcionesProductos();
    this.productosFiltradosMovimientos[index] =
      valor === '' ? opciones : opciones.filter((prod) => prod.nombre.toLowerCase().includes(valor));
  }

  public seleccionarProductoMovimiento(event: MatAutocompleteSelectedEvent, index: number): void {
    const producto = this.productosActivos.find(
      (p) => p.nombre.toLowerCase() === event.option.value.toLowerCase(),
    );
    if (!producto) {
      return;
    }
    const control = this.movimientosFormArray.at(index) as FormGroup;
    control.patchValue(
      {
        productoId: producto.id,
        productoNombre: producto.nombre,
      },
      { emitEvent: false },
    );
    control.get('productoId')?.setErrors(null);
    control.get('productoNombre')?.setErrors(null);
    control.get('productoId')?.updateValueAndValidity({ onlySelf: true });
    control.get('productoNombre')?.updateValueAndValidity({ onlySelf: true });
    this.productosFiltradosMovimientos[index] = this.obtenerOpcionesProductos();
  }

  private cargarProductosActivos(): void {
    this.productoService
      .obtenerTodos(0, 1000, { estado: true, categoria: null }, 'nombre', 'asc')
      .pipe(take(1))
      .subscribe({
        next: (page) => {
          this.productosActivos = page.content;
          this.reconstruirProductosFiltrados();
        },
        error: (error) => {
          this.apiErrorService.handle(error, {
            contextMessage: 'Error al obtener productos activos.',
          });
          this.productosActivos = [];
          this.reconstruirProductosFiltrados();
        },
      });
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

  public confirmarIngresoMasivo(): void {
    if (this.formularioMovimientos.invalid) {
      this.formularioMovimientos.markAllAsTouched();
      this.mensajeService.error('Por favor completa los productos y cantidades antes de continuar.');
      return;
    }

    const movimientosFormValue = (this.formularioMovimientos.value.movimientos ??
      []) as MovimientoEntradaProductoRequest[];

    if (movimientosFormValue.length === 0) {
      this.mensajeService.error('Debe agregar al menos un producto.');
      return;
    }

    const productosYaAgregados = new Set<number>();
    const movimientos: MovimientoEntradaProductoRequest[] = [];

    for (let index = 0; index < movimientosFormValue.length; index++) {
      const movimiento = movimientosFormValue[index];
      const control = this.movimientosFormArray.at(index) as FormGroup;

      let productoId = Number(movimiento.productoId);
      const nombreIngresado = control.get('productoNombre')?.value?.trim() ?? '';

      if ((!productoId || !Number.isFinite(productoId)) && nombreIngresado) {
        const productoCoincidente = this.productosActivos.find(
          (producto) => producto.nombre.toLowerCase() === nombreIngresado.toLowerCase(),
        );
        if (productoCoincidente) {
          productoId = productoCoincidente.id;
          control.patchValue(
            {
              productoId: productoCoincidente.id,
              productoNombre: productoCoincidente.nombre,
            },
            { emitEvent: false },
          );
        }
      }

      if (!productoId || !Number.isFinite(productoId)) {
        const productoIdControl = control.get('productoId');
        const productoNombreControl = control.get('productoNombre');
        if (productoIdControl) {
          productoIdControl.setErrors({ ...(productoIdControl.errors ?? {}), required: true });
        }
        if (productoNombreControl) {
          productoNombreControl.setErrors({ ...(productoNombreControl.errors ?? {}), required: true });
        }
        this.mensajeService.error('Selecciona un producto válido en cada fila.');
        return;
      }

      const cantidad = Number(movimiento.cantidad);

      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        this.mensajeService.error('Cada producto debe tener una cantidad mayor a cero.');
        const cantidadControl = control.get('cantidad');
        if (cantidadControl) {
          cantidadControl.setErrors({ ...(cantidadControl.errors ?? {}), min: true });
        }
        return;
      }

      if (productosYaAgregados.has(productoId)) {
        this.mensajeService.error('No se puede repetir el mismo producto en la lista.');
        return;
      }

      productosYaAgregados.add(productoId);

      const observacion = control.get('observacion')?.value?.trim();

      movimientos.push({
        productoId,
        cantidad,
        observacion: observacion ? observacion : null,
      });
    }

    this.productoService.actualizarStockMasivo({ movimientos }).subscribe({
      next: () => {
        this.mensajeService.success('Stock actualizado con éxito.');
        this.cerrarModalIngresarProductos();
        this.cargarProductos();
        this.cargarProductosActivos();
      },
      error: (error) => {
        this.apiErrorService.handle(error, {
          form: this.formularioMovimientos,
          contextMessage: 'Error al actualizar el stock masivo.',
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

  public cerrarModalIngresarProductos(): void {
    const modal = document.getElementById('ingresarProductosModal');
    if (modal) {
      const instance = bootstrap.Modal.getInstance(modal) ?? bootstrap.Modal.getOrCreateInstance(modal);
      instance.hide();
    }
    setTimeout(() => {
      const algunModalAbierto = document.querySelector('.modal.show');
      if (!algunModalAbierto) {
        document.body.classList.remove('modal-open');
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
      }
    }, 200);
    this.resetFormularioMovimientos();
  }

  private reiniciarFormularioProducto(): void {
    this.productoSeleccionado = null;
    this.modoCreacionProducto = true;
    this.formularioProducto.reset();
    this.apiErrorService.clearFormErrors(this.formularioProducto);
  }
}
