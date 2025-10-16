import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ProductoRequest, ProductoResponse } from '../models/producto.model';
import { environment } from '../../environments/environment';
import { Page } from '../core/types/page';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/productos`;

  obtenerTodos(
    page: number,
    size: number,
    filtros?: {
      nombre?: string;
      categoria?: null;
      estado?: boolean;
    },
    sort: string = 'nombre',
    direction: 'asc' | 'desc' = 'asc'
  ): Observable<Page<ProductoResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Page<ProductoResponse>>(this.apiUrl, { params, observe: 'response' }).pipe(
      map((response: HttpResponse<Page<ProductoResponse>>) => {
        if (response.status === 204) {
          return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: page,
            size: size,
          } as Page<ProductoResponse>;
        }
        return response.body as Page<ProductoResponse>;
      })
    );
  }

  crearProducto(producto: ProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(this.apiUrl, producto);
  }

  actualizar(id: number, producto: ProductoRequest): Observable<ProductoResponse> {
    return this.http.put<ProductoResponse>(`${this.apiUrl}/${id}`, producto);
  }

  cambiarEstadoProducto(id: number): Observable<ProductoResponse> {
    return this.http.patch<ProductoResponse>(`${this.apiUrl}/${id}/estado`, {});
  }

  sumarStock(id: number, cantidad: number): Observable<ProductoResponse> {
    return this.http.patch<ProductoResponse>(`${this.apiUrl}/${id}/agregar`, { cantidad });
  }
}
