import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CarrinhoService } from './carrinho.service';
import { CatalogoService } from './catalogo.service';
import { NotificacaoService } from './notificacao.service';
import {
  DadosCliente,
  ItemCarrinho,
  Pedido,
  StatusPedido,
  TipoPedido
} from '../models';

const STORAGE_PEDIDOS = 'pedeai.pedidos';
const CHANNEL_NAME = 'pedeai.pedidos.sync';

@Injectable({ providedIn: 'root' })
export class PedidoService implements OnDestroy {
  private readonly pedidosSubject = new BehaviorSubject<Pedido[]>(this.carregar());
  readonly pedidos$ = this.pedidosSubject.asObservable();

  private readonly channel: BroadcastChannel | null;
  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_PEDIDOS) {
      this.ngZone.run(() => this.sincronizarDoStorage());
    }
  };

  constructor(
    private readonly carrinhoService: CarrinhoService,
    private readonly catalogoService: CatalogoService,
    private readonly notificacaoService: NotificacaoService,
    private readonly ngZone: NgZone
  ) {
    this.channel = this.criarCanal();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorage);
    }

    if (this.channel) {
      this.channel.onmessage = () => {
        this.ngZone.run(() => this.sincronizarDoStorage());
      };
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.onStorage);
    }
    this.channel?.close();
  }

  listar(): Pedido[] {
    return this.pedidosSubject.value;
  }

  getById(id: string): Pedido | null {
    return this.pedidosSubject.value.find((pedido) => pedido.id === id) ?? null;
  }

  criarPedido(params: {
    lojaSlug: string;
    tipo: TipoPedido;
    itens: ItemCarrinho[];
    subtotal: number;
    taxaEntrega: number;
    cliente: DadosCliente;
    mesaId?: string;
    mesaNumero?: number;
    limparCarrinho?: boolean;
  }): Pedido {
    const agora = new Date().toISOString();
    const pedido: Pedido = {
      id: `PED-${Date.now().toString().slice(-6)}`,
      lojaSlug: params.lojaSlug,
      tipo: params.tipo,
      itens: params.itens.map((item) => ({
        ...item,
        statusPreparo: item.statusPreparo ?? 'pendente',
        lancadoEm: item.lancadoEm ?? agora
      })),
      subtotal: params.subtotal,
      taxaEntrega: params.tipo === 'delivery' ? params.taxaEntrega : 0,
      total:
        params.subtotal + (params.tipo === 'delivery' ? params.taxaEntrega : 0),
      criadoEm: agora,
      atualizadoEm: agora,
      status: 'recebido',
      cliente: { ...params.cliente },
      mesaId: params.mesaId,
      mesaNumero: params.mesaNumero,
      pago: false
    };

    this.persistir([pedido, ...this.pedidosSubject.value].slice(0, 100));

    if (params.mesaId) {
      this.catalogoService.setStatusMesa(params.mesaId, 'ocupada', pedido.id);
    }

    if (params.limparCarrinho !== false) {
      this.carrinhoService.limpar();
    }

    return pedido;
  }

  atualizarStatus(pedidoId: string, status: StatusPedido): Pedido | null {
    const lista = this.pedidosSubject.value.map((pedido) => {
      if (pedido.id !== pedidoId) {
        return pedido;
      }

      let itens = pedido.itens;
      if (status === 'em_preparacao') {
        itens = pedido.itens.map((item) =>
          (item.statusPreparo ?? 'pendente') === 'pendente'
            ? { ...item, statusPreparo: 'preparando' as const }
            : item
        );
      }
      if (status === 'pronto') {
        itens = pedido.itens.map((item) =>
          (item.statusPreparo ?? 'pendente') !== 'pronto'
            ? { ...item, statusPreparo: 'pronto' as const }
            : item
        );
      }

      return { ...pedido, itens, status, atualizadoEm: new Date().toISOString() };
    });
    this.persistir(lista);
    const pedido = lista.find((item) => item.id === pedidoId) ?? null;

    if (pedido?.mesaId && (status === 'finalizado' || status === 'cancelado')) {
      this.catalogoService.setStatusMesa(pedido.mesaId, 'livre');
    }

    return pedido;
  }

  /** Inicia o preparo apenas dos itens pendentes (novos). */
  iniciarPreparoItensPendentes(pedidoId: string): Pedido | null {
    const lista = this.pedidosSubject.value.map((pedido) => {
      if (pedido.id !== pedidoId) {
        return pedido;
      }
      const itens = pedido.itens.map((item) =>
        (item.statusPreparo ?? 'pendente') === 'pendente'
          ? { ...item, statusPreparo: 'preparando' as const }
          : item
      );
      return {
        ...pedido,
        itens,
        status: 'em_preparacao' as const,
        atualizadoEm: new Date().toISOString()
      };
    });
    this.persistir(lista);
    return lista.find((item) => item.id === pedidoId) ?? null;
  }

  /** Marca como prontos os itens que estão em preparo (ou pendentes da leva atual). */
  marcarItensNovosComoProntos(pedidoId: string): Pedido | null {
    const lista = this.pedidosSubject.value.map((pedido) => {
      if (pedido.id !== pedidoId) {
        return pedido;
      }
      const itens = pedido.itens.map((item) => {
        const status = item.statusPreparo ?? 'pendente';
        if (status === 'preparando' || status === 'pendente') {
          return { ...item, statusPreparo: 'pronto' as const };
        }
        return item;
      });
      const aindaTemPendente = itens.some(
        (item) => (item.statusPreparo ?? 'pendente') !== 'pronto'
      );
      return {
        ...pedido,
        itens,
        status: (aindaTemPendente ? 'em_preparacao' : 'pronto') as StatusPedido,
        atualizadoEm: new Date().toISOString()
      };
    });
    this.persistir(lista);
    return lista.find((item) => item.id === pedidoId) ?? null;
  }

  itensPendentesCozinha(pedido: Pedido): ItemCarrinho[] {
    return pedido.itens.filter((item) => (item.statusPreparo ?? 'pendente') !== 'pronto');
  }

  itensJaPreparados(pedido: Pedido): ItemCarrinho[] {
    return pedido.itens.filter((item) => (item.statusPreparo ?? 'pendente') === 'pronto');
  }

  marcarPago(pedidoId: string): Pedido | null {
    const lista = this.pedidosSubject.value.map((pedido) =>
      pedido.id === pedidoId
        ? { ...pedido, pago: true, atualizadoEm: new Date().toISOString() }
        : pedido
    );
    this.persistir(lista);
    return lista.find((item) => item.id === pedidoId) ?? null;
  }

  atribuirEntregador(pedidoId: string, entregadorId: string, entregadorNome: string): Pedido | null {
    const lista = this.pedidosSubject.value.map((pedido) =>
      pedido.id === pedidoId
        ? {
            ...pedido,
            entregadorId,
            entregadorNome,
            status: pedido.status === 'pronto' ? 'saiu_entrega' : pedido.status,
            atualizadoEm: new Date().toISOString()
          }
        : pedido
    );
    this.persistir(lista);
    const pedido = lista.find((item) => item.id === pedidoId) ?? null;

    if (pedido) {
      this.notificacaoService.notificarPedidoAtribuido({
        entregadorId,
        pedidoId: pedido.id,
        endereco: pedido.cliente.endereco,
        clienteNome: pedido.cliente.nome
      });
    }

    return pedido;
  }

  marcarEntreguePeloEntregador(pedidoId: string, entregadorId: string): Pedido | null {
    const pedido = this.getById(pedidoId);
    if (!pedido || pedido.entregadorId !== entregadorId) {
      return null;
    }
    return this.atualizarStatus(pedidoId, 'finalizado');
  }

  adicionarItensMesa(pedidoId: string, itens: ItemCarrinho[]): Pedido | null {
    const agora = new Date().toISOString();
    const lista = this.pedidosSubject.value.map((pedido) => {
      if (pedido.id !== pedidoId) {
        return pedido;
      }
      const novos = itens.map((item) => ({
        ...item,
        statusPreparo: 'pendente' as const,
        lancadoEm: item.lancadoEm ?? agora
      }));
      const novosItens = [...pedido.itens, ...novos];
      const subtotal = novosItens.reduce(
        (total, item) => total + item.precoUnitario * item.quantidade,
        0
      );
      const tinhaItensProntos = pedido.itens.some(
        (item) => (item.statusPreparo ?? 'pendente') === 'pronto'
      );
      return {
        ...pedido,
        itens: novosItens,
        subtotal,
        total: subtotal + pedido.taxaEntrega,
        // Novos itens voltam para a fila da cozinha como "recebido" se já havia itens prontos
        status:
          pedido.status === 'pronto' || tinhaItensProntos
            ? 'recebido'
            : pedido.status === 'finalizado'
              ? 'recebido'
              : pedido.status,
        atualizadoEm: agora
      };
    });
    this.persistir(lista);
    return lista.find((item) => item.id === pedidoId) ?? null;
  }

  labelStatus(status: StatusPedido): string {
    const map: Record<StatusPedido, string> = {
      recebido: 'Pedido recebido',
      em_preparacao: 'Em preparação',
      pronto: 'Pronto',
      saiu_entrega: 'Saiu para entrega',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado'
    };
    return map[status];
  }

  proximosStatus(pedido: Pedido): StatusPedido[] {
    if (pedido.tipo === 'delivery') {
      return this.fluxo(['recebido', 'em_preparacao', 'pronto', 'saiu_entrega', 'finalizado'], pedido.status);
    }
    return this.fluxo(['recebido', 'em_preparacao', 'pronto', 'finalizado'], pedido.status);
  }

  private fluxo(ordem: StatusPedido[], atual: StatusPedido): StatusPedido[] {
    const index = ordem.indexOf(atual);
    if (index < 0 || index >= ordem.length - 1) {
      return [];
    }
    return [ordem[index + 1]];
  }

  /** Recarrega pedidos do localStorage (útil entre abas). */
  refreshFromStorage(): void {
    this.sincronizarDoStorage();
  }

  private sincronizarDoStorage(): void {
    const lista = this.carregar();
    if (JSON.stringify(lista) === JSON.stringify(this.pedidosSubject.value)) {
      return;
    }
    this.pedidosSubject.next(lista);
  }

  private criarCanal(): BroadcastChannel | null {
    try {
      if (typeof BroadcastChannel === 'undefined') {
        return null;
      }
      return new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }

  private carregar(): Pedido[] {
    try {
      const raw = localStorage.getItem(STORAGE_PEDIDOS);
      const lista = raw ? (JSON.parse(raw) as Pedido[]) : [];
      return lista.map((pedido) => {
        const statusPedido = pedido.status ?? 'recebido';
        const itens = (pedido.itens ?? []).map((item) => {
          let statusPreparo = item.statusPreparo;
          if (!statusPreparo) {
            if (statusPedido === 'pronto' || statusPedido === 'saiu_entrega' || statusPedido === 'finalizado') {
              statusPreparo = 'pronto';
            } else if (statusPedido === 'em_preparacao') {
              statusPreparo = 'preparando';
            } else {
              statusPreparo = 'pendente';
            }
          }
          return {
            ...item,
            statusPreparo,
            lancadoEm: item.lancadoEm ?? pedido.criadoEm,
            adicionais: item.adicionais ?? []
          };
        });
        return {
          ...pedido,
          itens,
          subtotal: pedido.subtotal ?? pedido.total,
          taxaEntrega: pedido.taxaEntrega ?? 0,
          atualizadoEm: pedido.atualizadoEm ?? pedido.criadoEm,
          pago: pedido.pago ?? false,
          status: statusPedido,
          cliente: pedido.cliente ?? {
            nome: 'Cliente',
            telefone: '-',
            formaPagamento: 'pix'
          }
        };
      });
    } catch {
      return [];
    }
  }

  private persistir(lista: Pedido[]): void {
    this.pedidosSubject.next(lista);
    try {
      localStorage.setItem(STORAGE_PEDIDOS, JSON.stringify(lista));
      this.channel?.postMessage({ type: 'updated', at: Date.now() });
    } catch {
      // ignore
    }
  }
}
