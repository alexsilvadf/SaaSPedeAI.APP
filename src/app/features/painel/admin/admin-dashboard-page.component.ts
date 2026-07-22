import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { Pedido } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard-page',
  templateUrl: './admin-dashboard-page.component.html',
  styleUrls: ['./admin-dashboard-page.component.css']
})
export class AdminDashboardPageComponent implements OnInit, OnDestroy {
  abertos = 0;
  producao = 0;
  concluidos = 0;
  faturamento = 0;
  ticketMedio = 0;
  topProdutos: { nome: string; qtd: number }[] = [];
  recentes: Pedido[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly pedidoService: PedidoService,
    private readonly catalogo: CatalogoService
  ) {}

  ngOnInit(): void {
    combineLatest([this.pedidoService.pedidos$, this.catalogo.produtos$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([pedidos]) => {
        const hoje = new Date().toDateString();
        const doDia = pedidos.filter(
          (pedido) => new Date(pedido.criadoEm).toDateString() === hoje
        );

        this.abertos = doDia.filter((p) =>
          ['recebido', 'em_preparacao', 'pronto', 'saiu_entrega'].includes(p.status)
        ).length;
        this.producao = doDia.filter((p) => p.status === 'em_preparacao').length;
        this.concluidos = doDia.filter((p) => p.status === 'finalizado').length;
        this.faturamento = doDia
          .filter((p) => p.pago || p.status === 'finalizado')
          .reduce((soma, p) => soma + p.total, 0);
        this.ticketMedio = doDia.length ? this.faturamento / Math.max(this.concluidos, 1) : 0;
        this.recentes = doDia.slice(0, 8);

        const contagem = new Map<string, number>();
        doDia.forEach((pedido) => {
          pedido.itens.forEach((item) => {
            contagem.set(item.nome, (contagem.get(item.nome) ?? 0) + item.quantidade);
          });
        });
        this.topProdutos = [...contagem.entries()]
          .map(([nome, qtd]) => ({ nome, qtd }))
          .sort((a, b) => b.qtd - a.qtd)
          .slice(0, 5);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
