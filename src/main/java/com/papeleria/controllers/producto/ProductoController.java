package com.papeleria.controllers.producto;

import com.papeleria.dtos.ProductoRequest;
import com.papeleria.dtos.ProductoResponse;
import com.papeleria.mappers.producto.ProductoMapper;
import com.papeleria.models.Producto;
import com.papeleria.services.producto.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private ProductoMapper productoMapper;

    @GetMapping
    public ResponseEntity<?> obtenerTodosLosProductos(
            @PageableDefault(size = 10, sort = "nombre", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) Boolean estado) {
        try {
            Page<Producto> productos = productoService.buscarTodos(
                    pageable, nombre, categoria, estado);

            if (productos.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No hay productos disponibles");
            }

            Page<ProductoResponse> response = productos.map(productoMapper::toResponse);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al obtener productos: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<ProductoResponse> crearProducto(@Valid @RequestBody ProductoRequest productoRequest) {
        Producto productoGuardado = productoService.crearProducto(productoRequest);
        ProductoResponse response = productoMapper.toResponse(productoGuardado);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponse> actualizarProducto(@PathVariable Long id, @Valid @RequestBody ProductoRequest productoRequest) {
        Producto productoActualizado = productoService.actualizarProducto(id, productoRequest);
        ProductoResponse response = productoMapper.toResponse(productoActualizado);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ProductoResponse> cambiarEstadoProducto(@PathVariable Long id) {
        Producto productoActualizado = productoService.cambiarEstadoProducto(id);
        ProductoResponse response = productoMapper.toResponse(productoActualizado);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/{id}/agregar")
    public ResponseEntity<ProductoResponse> agregarCantidad(@PathVariable Long id, @RequestBody Map<String, Integer> request) {

        Integer cantidad = request.get("cantidad");
        Producto productoActualizado = productoService.agregarCantidad(id, cantidad);
        ProductoResponse response = productoMapper.toResponse(productoActualizado);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
