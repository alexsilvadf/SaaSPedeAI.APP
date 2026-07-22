import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { ItemCarrinho, Mesa, Pedido, Produto } from '../../../core/models';

@Component({
  selector: 'app-garcom-page',
  templateUrl: './garcom-page.component.html',
  styleUrls: ['./garcom-page.component.css']
})
export class GarcomPageComponent implements OnInit, OnDestroy {
  mesas: Mesa[] = [];
  produtos: Produto[] = [];
  pedidos: Pedido[] = [];
  mesaSelecionada: Mesa | null = null;
  produtoId = '';
  quantidade = 1;
  mensagem = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly catalogo: CatalogoService,
    private readonly pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    combineLatest([this.catalogo.mesas$, this.catalogo.produtos$, this.pedidoService.pedidos$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([mesas, produtos, pedidos]) => {
        this.mesas = [...mesas].sort((a, b) => a.numero - b.numero);
        this.produtos = produtos.filter((item) => item.disponivel);
        this.pedidos = pedidos;
        if (this.mesaSelecionada) {
          this.mesaSelecionada =
            this.mesas.find((mesa) => mesa.id === this.mesaSelecionada?.id) ?? null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selecionar(mesa: Mesa): void {
    this.mesaSelecionada = mesa;
    this.mensagem = '';
    this.produtoId = this.produtos[0]?.id ?? '';
  }

  pedidoDaMesa(mesa: Mesa): Pedido | null {
    if (!mesa.pedidoAtivoId) {
      return null;
    }
    return this.pedidoService.getById(mesa.pedidoAtivoId);
  }

  abrirMesa(): void {
    if (!this.mesaSelecionada || this.mesaSelecionada.status !== 'livre') {
      return;
    }
    const pedido = this.pedidoService.criarPedido({
      lojaSlug: 'chama-burger',
      tipo: 'mesa',
      itens: [],
      subtotal: 0,
      taxaEntrega: 0,
      mesaId: this.mesaSelecionada.id,
      mesaNumero: this.mesaSelecionada.numero,
      limparCarrinho: false,
      cliente: {
        nome: `Mesa ${this.mesaSelecionada.numero}`,
        telefone: '-',
        formaPagamento: 'dinheiro'
      }
    });
    this.mensagem = `Mesa ${this.mesaSelecionada.numero} aberta (${pedido.id})`;
  }

  adicionarItem(): void {
    if (!this.mesaSelecionada?.pedidoAtivoId || !this.produtoId) {
      this.mensagem = 'Abra a mesa antes de lançar itens.';
      return;
    }
    const produto = this.produtos.find((item) => item.id === this.produtoId);
    if (!produto) {
      return;
    }
    const item: ItemCarrinho = {
      id: `${produto.id}-${Date.now()}`,
      produtoId: produto.id,
      nome: produto.nome,
      imagemUrl: produto.imagemUrl,
      precoUnitario: produto.preco,
      quantidade: this.quantidade,
      observacao: '',
      adicionais: [],
      statusPreparo: 'pendente',
      lancadoEm: new Date().toISOString()
    };
    this.pedidoService.adicionarItensMesa(this.mesaSelecionada.pedidoAtivoId, [item]);
    if (this.mesaSelecionada.status === 'livre') {
      this.catalogo.setStatusMesa(this.mesaSelecionada.id, 'ocupada', this.mesaSelecionada.pedidoAtivoId);
    }
    this.mensagem = `${produto.nome} adicionado.`;
    this.quantidade = 1;
  }

  pedirConta(): void {
    if (!this.mesaSelecionada?.pedidoAtivoId) {
      return;
    }
    this.catalogo.setStatusMesa(
      this.mesaSelecionada.id,
      'aguardando_pagamento',
      this.mesaSelecionada.pedidoAtivoId
    );
    this.mensagem = 'Conta solicitada. Encaminhado ao caixa.';
  }

  labelStatus(status: string): string {
    const map: Record<string, string> = {
      livre: 'Livre',
      ocupada: 'Ocupada',
      aguardando_pagamento: 'Aguardando pagamento',
      reservada: 'Reservada'
    };
    return map[status] ?? status;
  }
}
