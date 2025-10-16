package com.papeleria.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoRequest {

    @NotBlank
    private String nombre;

    private String descripcion;

    @NotNull
    @Positive
    private BigDecimal precioCompra;

    @NotNull
    @Positive
    private BigDecimal precioVenta;

    @NotNull
    @PositiveOrZero
    private Integer stock;

    @NotBlank
    private String categoria;
}
