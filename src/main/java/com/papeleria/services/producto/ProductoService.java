package com.papeleria.services.producto;

import com.papeleria.dtos.ProductoRequest;
import com.papeleria.mappers.producto.ProductoMapper;
import com.papeleria.models.Producto;
import com.papeleria.repositories.ProductoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProductoMapper productoMapper;

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
        return productoRepository.save(producto);
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

    public Producto agregarCantidad(Long id, Integer cantidad) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con id: " + id));

        producto.setStock(producto.getStock() + cantidad);
        return productoRepository.save(producto);
    }

    private String normalizeNombre(String nombre) {
        return nombre == null ? null : nombre.trim();
    }
}
