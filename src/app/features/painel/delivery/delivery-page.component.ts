import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { Entregador, Pedido } from '../../../core/models';

@Component({
  selector: 'app-delivery-page',
  templateUrl: './delivery-page.component.html',
  styleUrls: ['./delivery-page.component.css']
})
export class DeliveryPageComponent implements OnInit, OnDestroy {
  prontos: Pedido[] = [];
  emRota: Pedido[] = [];
  entregadores: Entregador[] = [];
  selecionados: Record<string, string> = {};
  mensagem = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly pedidoService: PedidoService,
    private readonly catalogo: CatalogoService
  ) {}

  ngOnInit(): void {
    combineLatest([this.pedidoService.pedidos$, this.catalogo.entregadores$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([pedidos, entregadores]) => {
        this.prontos = pedidos.filter(
          (pedido) => pedido.tipo === 'delivery' && pedido.status === 'pronto'
        );
        this.emRota = pedidos.filter((pedido) => pedido.status === 'saiu_entrega');
        this.entregadores = entregadores;
      });

    timer(0, 2500)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.pedidoService.refreshFromStorage());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  despachar(pedido: Pedido): void {
    const entregadorId = this.selecionados[pedido.id];
    const entregador = this.entregadores.find((item) => item.id === entregadorId);
    if (!entregador) {
      this.mensagem = 'Selecione um entregador disponível.';
      return;
    }
    this.pedidoService.atribuirEntregador(pedido.id, entregador.id, entregador.nome);
    this.mensagem = `${entregador.nome} foi notificado do pedido ${pedido.id}.`;
    delete this.selecionados[pedido.id];
  }

  toggleEntregador(id: string): void {
    this.catalogo.toggleEntregador(id);
  }
}
