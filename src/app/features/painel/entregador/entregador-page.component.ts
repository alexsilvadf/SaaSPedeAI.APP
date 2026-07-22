import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { Entregador, NotificacaoEntrega, Pedido } from '../../../core/models';

@Component({
  selector: 'app-entregador-page',
  templateUrl: './entregador-page.component.html',
  styleUrls: ['./entregador-page.component.css']
})
export class EntregadorPageComponent implements OnInit, OnDestroy {
  entregador: Entregador | null = null;
  minhasEntregas: Pedido[] = [];
  historico: Pedido[] = [];
  notificacoes: NotificacaoEntrega[] = [];
  toast: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private notificados = new Set<string>();

  constructor(
    private readonly auth: AuthService,
    private readonly pedidoService: PedidoService,
    private readonly notificacaoService: NotificacaoService
  ) {}

  ngOnInit(): void {
    this.entregador = this.auth.getEntregadorDoUsuario();

    if (!this.entregador) {
      return;
    }

    const entregadorId = this.entregador.id;

    combineLatest([
      this.pedidoService.pedidos$,
      this.notificacaoService.porEntregador$(entregadorId)
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([pedidos, notificacoes]) => {
        this.minhasEntregas = pedidos.filter(
          (pedido) =>
            pedido.entregadorId === entregadorId && pedido.status === 'saiu_entrega'
        );
        this.historico = pedidos
          .filter(
            (pedido) =>
              pedido.entregadorId === entregadorId && pedido.status === 'finalizado'
          )
          .slice(0, 8);
        this.notificacoes = notificacoes.filter((item) => !item.lida).slice(0, 5);

        for (const ntf of this.notificacoes) {
          if (!this.notificados.has(ntf.id)) {
            this.notificados.add(ntf.id);
            this.mostrarToast(ntf.mensagem);
          }
        }
      });

    timer(0, 2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pedidoService.refreshFromStorage();
        this.notificacaoService.refreshFromStorage();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  marcarEntregue(pedido: Pedido): void {
    if (!this.entregador) {
      return;
    }
    const atualizado = this.pedidoService.marcarEntreguePeloEntregador(
      pedido.id,
      this.entregador.id
    );
    if (atualizado) {
      this.mostrarToast(`Pedido ${pedido.id} marcado como entregue.`);
    }
  }

  dispensarNotificacao(id: string): void {
    this.notificacaoService.marcarLida(id);
  }

  marcarTodasLidas(): void {
    if (!this.entregador) {
      return;
    }
    this.notificacaoService.marcarTodasLidasDoEntregador(this.entregador.id);
  }

  private mostrarToast(mensagem: string): void {
    this.toast = mensagem;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toast = null;
    }, 4500);
  }
}
