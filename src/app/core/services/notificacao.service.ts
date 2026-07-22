import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificacaoEntrega } from '../models';

const KEY = 'pedeai.notificacoes.entrega';
const CHANNEL = 'pedeai.notificacoes.sync';

@Injectable({ providedIn: 'root' })
export class NotificacaoService implements OnDestroy {
  private readonly subject = new BehaviorSubject<NotificacaoEntrega[]>(this.carregar());
  readonly notificacoes$ = this.subject.asObservable();
  private readonly channel: BroadcastChannel | null;

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === KEY) {
      this.ngZone.run(() => this.refreshFromStorage());
    }
  };

  constructor(private readonly ngZone: NgZone) {
    this.channel = this.criarCanal();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorage);
    }
    if (this.channel) {
      this.channel.onmessage = () => this.ngZone.run(() => this.refreshFromStorage());
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.onStorage);
    }
    this.channel?.close();
  }

  porEntregador$(entregadorId: string) {
    return this.notificacoes$.pipe(
      map((lista) => lista.filter((item) => item.entregadorId === entregadorId))
    );
  }

  naoLidas$(entregadorId: string) {
    return this.porEntregador$(entregadorId).pipe(
      map((lista) => lista.filter((item) => !item.lida))
    );
  }

  notificarPedidoAtribuido(params: {
    entregadorId: string;
    pedidoId: string;
    endereco?: string;
    clienteNome?: string;
  }): void {
    const notificacao: NotificacaoEntrega = {
      id: `ntf-${Date.now()}`,
      entregadorId: params.entregadorId,
      pedidoId: params.pedidoId,
      titulo: 'Nova entrega para você',
      mensagem: `Pedido ${params.pedidoId} aguardando entrega${
        params.endereco ? ` em ${params.endereco}` : ''
      }${params.clienteNome ? ` · ${params.clienteNome}` : ''}.`,
      lida: false,
      criadoEm: new Date().toISOString()
    };
    this.persistir([notificacao, ...this.subject.value].slice(0, 50));
  }

  marcarLida(id: string): void {
    this.persistir(
      this.subject.value.map((item) => (item.id === id ? { ...item, lida: true } : item))
    );
  }

  marcarTodasLidasDoEntregador(entregadorId: string): void {
    this.persistir(
      this.subject.value.map((item) =>
        item.entregadorId === entregadorId ? { ...item, lida: true } : item
      )
    );
  }

  refreshFromStorage(): void {
    const lista = this.carregar();
    if (JSON.stringify(lista) !== JSON.stringify(this.subject.value)) {
      this.subject.next(lista);
    }
  }

  private carregar(): NotificacaoEntrega[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as NotificacaoEntrega[]) : [];
    } catch {
      return [];
    }
  }

  private persistir(lista: NotificacaoEntrega[]): void {
    this.subject.next(lista);
    try {
      localStorage.setItem(KEY, JSON.stringify(lista));
      this.channel?.postMessage({ type: 'updated' });
    } catch {
      // ignore
    }
  }

  private criarCanal(): BroadcastChannel | null {
    try {
      return typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
    } catch {
      return null;
    }
  }
}
