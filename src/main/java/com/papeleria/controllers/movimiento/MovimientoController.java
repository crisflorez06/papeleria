package com.papeleria.controllers.movimiento;

import com.papeleria.dtos.MovimientoResponse;
import com.papeleria.mappers.movimiento.MovimientoMapper;
import com.papeleria.models.Movimiento;
import com.papeleria.models.MovimientoTipo;
import com.papeleria.services.movimiento.MovimientoService;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {

    @Autowired
    private MovimientoService movimientoService;

    @Autowired
    private MovimientoMapper movimientoMapper;

    @GetMapping
    public ResponseEntity<?> listarMovimientos(
            @PageableDefault(size = 20, sort = "fechaMovimiento", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) MovimientoTipo tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        Page<Movimiento> movimientos = movimientoService.buscar(pageable, productoId, tipo, desde, hasta);
        if (movimientos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        Page<MovimientoResponse> response = movimientos.map(movimientoMapper::toResponse);
        return ResponseEntity.ok(response);
    }
}
