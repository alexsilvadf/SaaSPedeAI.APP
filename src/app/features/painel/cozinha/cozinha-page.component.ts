import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PedidoService } from '../../../core/services/pedido.service';
import { ItemCarrinho, Pedido } from '../../../core/models';

@Component({
  selector: 'app-cozinha-page',
  templateUrl: './cozinha-page.component.html',
  styleUrls: ['./cozinha-page.component.css']
})
export class CozinhaPageComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(public readonly pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.pedidoService.pedidos$.pipe(takeUntil(this.destroy$)).subscribe((lista) => {
      this.pedidos = lista.filter((pedido) => {
        if (!pedido.itens.length) {
          return false;
        }
        const temNovos = this.itensNovos(pedido).length > 0;
        const ativo =
          ['recebido', 'em_preparacao', 'pronto'].includes(pedido.status) || temNovos;
        return ativo;
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  itensNovos(pedido: Pedido): ItemCarrinho[] {
    return this.pedidoService.itensPendentesCozinha(pedido);
  }

  itensProntos(pedido: Pedido): ItemCarrinho[] {
    return this.pedidoService.itensJaPreparados(pedido);
  }

  temNovos(pedido: Pedido): boolean {
    return this.itensNovos(pedido).length > 0;
  }

  temProntos(pedido: Pedido): boolean {
    return this.itensProntos(pedido).length > 0;
  }

  avancar(pedido: Pedido): void {
    const novos = this.itensNovos(pedido);
    if (!novos.length) {
      return;
    }

    const temPendente = novos.some((item) => (item.statusPreparo ?? 'pendente') === 'pendente');
    const temPreparando = novos.some((item) => item.statusPreparo === 'preparando');

    if (temPendente && !temPreparando) {
      this.pedidoService.iniciarPreparoItensPendentes(pedido.id);
      return;
    }

    this.pedidoService.marcarItensNovosComoProntos(pedido.id);
  }

  labelAcao(pedido: Pedido): string {
    const novos = this.itensNovos(pedido);
    const temPendente = novos.some((item) => (item.statusPreparo ?? 'pendente') === 'pendente');
    const temPreparando = novos.some((item) => item.statusPreparo === 'preparando');
    const jaTemProntos = this.temProntos(pedido);

    if (temPendente && !temPreparando) {
      return jaTemProntos ? 'Iniciar preparo dos novos' : 'Iniciar preparo';
    }
    if (temPreparando || temPendente) {
      return jaTemProntos ? 'Marcar novos como prontos' : 'Marcar pronto';
    }
    return 'Aguardando';
  }

  canal(pedido: Pedido): string {
    if (pedido.tipo === 'mesa') {
      return `Mesa ${pedido.mesaNumero}`;
    }
    return pedido.tipo === 'delivery' ? 'Delivery' : 'Retirada';
  }

  horarioItem(item: ItemCarrinho): string {
    const raw = item.lancadoEm;
    if (!raw) {
      return '';
    }
    const data = new Date(raw);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  badgePedido(pedido: Pedido): string {
    if (this.temNovos(pedido) && this.temProntos(pedido)) {
      return 'Novos itens';
    }
    return this.pedidoService.labelStatus(pedido.status);
  }
}
