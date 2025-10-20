package com.papeleria.services.producto;

import com.papeleria.dtos.MovimientoEntradaProductoRequest;
import com.papeleria.dtos.ProductoRequest;
import com.papeleria.mappers.producto.ProductoMapper;
import com.papeleria.models.Producto;
import com.papeleria.services.movimiento.MovimientoService;
import com.papeleria.repositories.ProductoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProductoMapper productoMapper;

    @Autowired
    private MovimientoService movimientoService;

    public Page<Producto> buscarTodos(Pageable pageable, String nombre, String categoria, Boolean estado) {

        Specification<Producto> spec = Specification.where(ProductoSpecification.hasNombre(nombre))
                .and(ProductoSpecification.hasCategoria(categoria));

        if (estado != null && !estado) {
            spec = spec.and(ProductoSpecification.hasEstado(false));
        } else {
            spec = spec.and(ProductoSpecification.hasEstado(true));
        }

        return productoRepository.findAll(spec, pageable);
    }

    public Producto crearProducto(ProductoRequest productoRequest) {
        String nombreNormalizado = normalizeNombre(productoRequest.getNombre());
        if (productoRepository.existsByNombreIgnoreCase(nombreNormalizado)) {
            throw new IllegalArgumentException("Ya existe un producto con el nombre: " + nombreNormalizado);
        }

        productoRequest.setNombre(nombreNormalizado);
        Producto producto = productoMapper.toEntity(productoRequest);
        Producto productoGuardado = productoRepository.save(producto);

        if (productoGuardado.getStock() != null && productoGuardado.getStock() > 0) {
            movimientoService.registrarIngreso(productoGuardado, productoGuardado.getStock(), "Stock inicial del producto");
        }

        return productoGuardado;
    }

    public Producto actualizarProducto(Long id, ProductoRequest productoRequest) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con id: " + id));

        String nombreNormalizado = normalizeNombre(productoRequest.getNombre());
        productoRepository.findByNombreIgnoreCase(nombreNormalizado)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Ya existe un producto con el nombre: " + nombreNormalizado);
                });

        productoRequest.setNombre(nombreNormalizado);

        productoMapper.updateEntityFromRequest(productoRequest, producto);
        return productoRepository.save(producto);
    }

    public Producto cambiarEstadoProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con id: " + id));

        producto.setEstado(!producto.getEstado());
        return productoRepository.save(producto);
    }

    public Producto agregarCantidad(Long id, Integer cantidad, String observacion) {
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con id: " + id));

        producto.setStock(producto.getStock() + cantidad);
        Producto productoActualizado = productoRepository.save(producto);
        movimientoService.registrarIngreso(productoActualizado, cantidad, observacion);
        return productoActualizado;
    }

    private String normalizeNombre(String nombre) {
        return nombre == null ? null : nombre.trim();
    }

    public List<Producto> agregarCantidadMasivo(List<MovimientoEntradaProductoRequest> movimientos) {
        if (movimientos == null || movimientos.isEmpty()) {
            throw new IllegalArgumentException("Debe proporcionar al menos un producto para actualizar.");
        }

        Map<Long, Producto> productosPorId = productoRepository.findAllById(
                        movimientos.stream()
                                .map(movimiento -> {
                                    if (movimiento.getProductoId() == null) {
                                        throw new IllegalArgumentException("El identificador del producto es obligatorio.");
                                    }
                                    return movimiento.getProductoId();
                                })
                                .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Producto::getId, producto -> producto));

        movimientos.forEach(movimiento -> {
            Long productoId = movimiento.getProductoId();
            Producto producto = productosPorId.get(productoId);
            if (producto == null) {
                throw new EntityNotFoundException("Producto no encontrado con id: " + productoId);
            }

            Integer cantidad = movimiento.getCantidad();
            if (cantidad == null || cantidad <= 0) {
                throw new IllegalArgumentException("La cantidad debe ser mayor a cero para el producto con id: " + productoId);
            }

            producto.setStock(producto.getStock() + cantidad);
            movimientoService.registrarIngreso(producto, cantidad, movimiento.getObservacion());
        });

        return productoRepository.saveAll(productosPorId.values());
    }
}
