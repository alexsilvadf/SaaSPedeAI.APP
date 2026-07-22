import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, merge, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PedidoService } from '../../../core/services/pedido.service';
import { Pedido, StatusPedido } from '../../../core/models';

interface Etapa {
  status: StatusPedido;
  label: string;
}

@Component({
  selector: 'app-pedido-confirmado-page',
  templateUrl: './pedido-confirmado-page.component.html',
  styleUrls: ['./pedido-confirmado-page.component.css']
})
export class PedidoConfirmadoPageComponent implements OnInit, OnDestroy {
  pedido: Pedido | null = null;
  lojaSlug = '';
  etapas: Etapa[] = [];
  statusHighlight = false;
  aoVivo = true;

  private pedidoId = '';
  private statusAnterior: StatusPedido | null = null;
  private readonly destroy$ = new Subject<void>();
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    public readonly pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    this.lojaSlug = this.route.snapshot.paramMap.get('lojaSlug') ?? '';
    this.pedidoId = this.route.snapshot.paramMap.get('pedidoId') ?? '';

    this.aplicarPedido(this.pedidoService.getById(this.pedidoId));

    // Atualização imediata quando o PedidoService emite (mesma aba / BroadcastChannel / storage)
    this.pedidoService.pedidos$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.aplicarPedido(this.pedidoService.getById(this.pedidoId));
    });

    // Fallback: a cada 2s, enquanto o pedido estiver em andamento, sincroniza do storage
    timer(2000, 2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.aoVivo) {
          return;
        }
        this.pedidoService.refreshFromStorage();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }
  }

  voltarCardapio(): void {
    void this.router.navigate(['/', this.lojaSlug]);
  }

  labelPagamento(forma: string): string {
    const map: Record<string, string> = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      debito: 'Cartão de débito',
      credito: 'Cartão de crédito'
    };
    return map[forma] ?? forma;
  }

  isConcluida(status: StatusPedido): boolean {
    if (!this.pedido) {
      return false;
    }
    const ordem = this.etapas.map((etapa) => etapa.status);
    return ordem.indexOf(status) <= ordem.indexOf(this.pedido.status);
  }

  isAtual(status: StatusPedido): boolean {
    return this.pedido?.status === status;
  }

  private aplicarPedido(pedido: Pedido | null): void {
    if (!pedido) {
      void this.router.navigate(['/', this.lojaSlug || 'chama-burger']);
      return;
    }

    if (this.statusAnterior && this.statusAnterior !== pedido.status) {
      this.statusHighlight = true;
      if (this.highlightTimer) {
        clearTimeout(this.highlightTimer);
      }
      this.highlightTimer = setTimeout(() => {
        this.statusHighlight = false;
        this.cdr.markForCheck();
      }, 1200);
    }

    this.statusAnterior = pedido.status;
    this.pedido = { ...pedido };
    this.etapas = this.montarEtapas(pedido);
    this.aoVivo = !['finalizado', 'cancelado'].includes(pedido.status);
    this.cdr.detectChanges();
  }

  private montarEtapas(pedido: Pedido): Etapa[] {
    const base: Etapa[] = [
      { status: 'recebido', label: 'Pedido recebido' },
      { status: 'em_preparacao', label: 'Em preparação' },
      { status: 'pronto', label: 'Pronto' }
    ];
    if (pedido.tipo === 'delivery') {
      base.push({ status: 'saiu_entrega', label: 'Saiu para entrega' });
    }
    base.push({ status: 'finalizado', label: 'Finalizado' });
    return base;
  }
}
