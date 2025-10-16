package com.papeleria.config;

import com.papeleria.models.DetalleVenta;
import com.papeleria.models.Producto;
import com.papeleria.models.Venta;
import com.papeleria.repositories.ProductoRepository;
import com.papeleria.repositories.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Override
    public void run(String... args) throws Exception {
        if (productoRepository.count() == 0) {
            System.out.println("No hay productos en la base de datos. Creando datos de ejemplo con moneda colombiana...");

            Producto p1 = Producto.builder()
                    .nombre("Lápiz HB")
                    .descripcion("Lápiz de grafito para escritura y dibujo")
                    .precioCompra(new BigDecimal("500"))
                    .precioVenta(new BigDecimal("1000"))
                    .stock(100)
                    .categoria("Escritura")
                    .build();

            Producto p2 = Producto.builder()
                    .nombre("Cuaderno A4")
                    .descripcion("Cuaderno de 100 hojas cuadriculadas")
                    .precioCompra(new BigDecimal("2500"))
                    .precioVenta(new BigDecimal("4000"))
                    .stock(50)
                    .categoria("Papelería")
                    .build();

            Producto p3 = Producto.builder()
                    .nombre("Goma de borrar")
                    .descripcion("Goma de borrar blanca para lápiz")
                    .precioCompra(new BigDecimal("300"))
                    .precioVenta(new BigDecimal("800"))
                    .stock(200)
                    .categoria("Accesorios")
                    .build();

            productoRepository.saveAll(List.of(p1, p2, p3));

            System.out.println("Datos de ejemplo creados.");
        } else {
            System.out.println("La base de datos ya contiene datos de productos. No se crearán datos de ejemplo.");
        }

        if (ventaRepository.count() == 0) {
            System.out.println("No hay ventas en la base de datos. Creando datos de ejemplo...");

            List<Producto> productos = productoRepository.findAll();

            Venta v1 = Venta.builder()
                    .fecha(LocalDateTime.now().minusDays(1))
                    .metodoPago("Efectivo")
                    .total(new BigDecimal("0"))
                    .build();

            DetalleVenta dv1 = DetalleVenta.builder()
                    .producto(productos.get(0))
                    .cantidad(2)
                    .precioUnitario(productos.get(0).getPrecioVenta())
                    .subtotal(productos.get(0).getPrecioVenta().multiply(new BigDecimal("2")))
                    .build();
            v1.agregarDetalle(dv1);
            v1.setTotal(v1.getTotal().add(dv1.getSubtotal()));

            DetalleVenta dv2 = DetalleVenta.builder()
                    .producto(productos.get(1))
                    .cantidad(1)
                    .precioUnitario(productos.get(1).getPrecioVenta())
                    .subtotal(productos.get(1).getPrecioVenta())
                    .build();
            v1.agregarDetalle(dv2);
            v1.setTotal(v1.getTotal().add(dv2.getSubtotal()));

            ventaRepository.save(v1);

            System.out.println("Datos de ventas de ejemplo creados.");
        } else {
            System.out.println("La base de datos ya contiene datos de ventas. No se crearán datos de ejemplo.");
        }
    }
}
