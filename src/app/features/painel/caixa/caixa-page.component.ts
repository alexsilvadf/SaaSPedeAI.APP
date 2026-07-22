import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CaixaService } from '../../../core/services/caixa.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { MovimentoCaixa, Pedido } from '../../../core/models';

@Component({
  selector: 'app-caixa-page',
  templateUrl: './caixa-page.component.html',
  styleUrls: ['./caixa-page.component.css']
})
export class CaixaPageComponent implements OnInit, OnDestroy {
  aberto = false;
  saldo = 0;
  movimentos: MovimentoCaixa[] = [];
  aReceber: Pedido[] = [];
  valorAbertura = 100;
  valorSangria = 0;
  descSangria = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly caixa: CaixaService,
    private readonly pedidoService: PedidoService,
    private readonly catalogo: CatalogoService
  ) {}

  ngOnInit(): void {
    combineLatest([this.caixa.estado$, this.pedidoService.pedidos$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([estado, pedidos]) => {
        this.aberto = estado.aberto;
        this.saldo = estado.saldo;
        this.movimentos = estado.movimentos.slice(0, 12);
        this.aReceber = pedidos.filter(
          (pedido) =>
            !pedido.pago &&
            pedido.status !== 'cancelado' &&
            pedido.status !== 'finalizado' &&
            (pedido.tipo !== 'mesa' || pedido.itens.length > 0)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  abrir(): void {
    this.caixa.abrir(this.valorAbertura || 0);
  }

  fechar(): void {
    this.caixa.fechar();
  }

  sangria(): void {
    this.caixa.sangria(this.valorSangria, this.descSangria);
    this.valorSangria = 0;
    this.descSangria = '';
  }

  receber(pedido: Pedido): void {
    if (!this.aberto) {
      return;
    }
    this.pedidoService.marcarPago(pedido.id);
    this.caixa.registrarVenda(pedido.total, pedido.id);
    if (pedido.tipo === 'mesa' && pedido.mesaId) {
      this.pedidoService.atualizarStatus(pedido.id, 'finalizado');
      this.catalogo.setStatusMesa(pedido.mesaId, 'livre');
    } else if (pedido.status === 'pronto' && pedido.tipo === 'retirada') {
      this.pedidoService.atualizarStatus(pedido.id, 'finalizado');
    } else if (pedido.status === 'saiu_entrega') {
      this.pedidoService.atualizarStatus(pedido.id, 'finalizado');
    }
  }
}
