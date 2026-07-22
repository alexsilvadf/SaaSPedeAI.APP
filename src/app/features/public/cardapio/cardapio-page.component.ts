import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { CarrinhoService } from '../../../core/services/carrinho.service';
import { CardapioService } from '../../../core/services/cardapio.service';
import { LojaService } from '../../../core/services/loja.service';
import { PedidoService } from '../../../core/services/pedido.service';
import {
  Categoria,
  ItemCarrinho,
  ItemCarrinhoAdicional,
  Loja,
  Pedido,
  Produto,
  TipoPedido
} from '../../../core/models';

interface GrupoProdutos {
  categoria: Categoria;
  produtos: Produto[];
}

@Component({
  selector: 'app-cardapio-page',
  templateUrl: './cardapio-page.component.html',
  styleUrls: ['./cardapio-page.component.css']
})
export class CardapioPageComponent implements OnInit, OnDestroy {
  loja: Loja | null = null;
  lojaSlug = '';
  categorias: Categoria[] = [];
  produtos: Produto[] = [];
  grupos: GrupoProdutos[] = [];
  busca = '';
  categoriaAtiva: string | null = null;
  carregando = true;
  erro = '';

  tipoPedido: TipoPedido = 'delivery';
  mesaNumero?: number;

  produtoSelecionado: Produto | null = null;
  modalAberto = false;
  carrinhoAberto = false;
  pedidosAberto = false;
  toastVisivel = false;

  quantidadeCarrinho = 0;
  subtotalCarrinho = 0;
  itensCarrinho: ItemCarrinho[] = [];
  meusPedidos: Pedido[] = [];
  pedidoAtivo: Pedido | null = null;

  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly lojaService: LojaService,
    private readonly cardapioService: CardapioService,
    private readonly carrinhoService: CarrinhoService,
    public readonly pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.carregando = true;
          this.erro = '';

          const lojaSlug = params.get('lojaSlug') ?? '';
          this.lojaSlug = lojaSlug;
          const mesaId = params.get('mesaId');
          const tipo: TipoPedido = mesaId ? 'mesa' : 'delivery';

          return combineLatest([
            this.lojaService.getBySlug(lojaSlug),
            mesaId ? this.lojaService.getMesa(mesaId) : of(undefined),
            this.cardapioService.getCategorias(),
            this.cardapioService.getProdutos()
          ]).pipe(
            map(([loja, mesa, categorias, produtos]) => ({
              loja,
              mesa,
              categorias,
              produtos,
              tipo,
              lojaSlug
            })),
            catchError(() => {
              this.erro = 'Não encontramos essa loja. Confira o link e tente de novo.';
              this.carregando = false;
              return of(null);
            })
          );
        })
      )
      .subscribe((resultado) => {
        if (!resultado) {
          return;
        }

        this.loja = resultado.loja;
        this.categorias = resultado.categorias;
        this.produtos = resultado.produtos;
        this.tipoPedido = resultado.tipo;
        this.mesaNumero = resultado.mesa?.numero;
        this.categoriaAtiva = null;
        this.carregando = false;
        this.atualizarGrupos();
        this.atualizarMeusPedidos();

        this.carrinhoService.definirSessao({
          lojaSlug: resultado.lojaSlug,
          tipo: resultado.tipo,
          mesaId: resultado.mesa?.id,
          mesaNumero: resultado.mesa?.numero
        });
      });

    this.carrinhoService.quantidade$
      .pipe(takeUntil(this.destroy$))
      .subscribe((qtd) => (this.quantidadeCarrinho = qtd));

    this.carrinhoService.subtotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe((subtotal) => (this.subtotalCarrinho = subtotal));

    this.carrinhoService.carrinho$
      .pipe(takeUntil(this.destroy$))
      .subscribe((carrinho) => (this.itensCarrinho = carrinho.itens));

    this.pedidoService.pedidos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.atualizarMeusPedidos());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  get labelCanal(): string {
    if (this.tipoPedido === 'mesa' && this.mesaNumero) {
      return `Mesa ${this.mesaNumero}`;
    }
    if (this.tipoPedido === 'retirada') {
      return 'Retirada no balcão';
    }
    return 'Delivery';
  }

  get headline(): string {
    if (this.tipoPedido === 'mesa') {
      return 'Peça direto da mesa';
    }
    return 'O que vai matar sua fome?';
  }

  onBuscaChange(valor: string): void {
    this.busca = valor;
    this.atualizarGrupos();
  }

  selecionarCategoria(categoriaId: string | null): void {
    this.categoriaAtiva = categoriaId;
    this.atualizarGrupos();

    if (categoriaId) {
      const el = document.getElementById(`cat-${categoriaId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  abrirProduto(produto: Produto): void {
    this.produtoSelecionado = produto;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.produtoSelecionado = null;
  }

  adicionarAoCarrinho(event: {
    produto: Produto;
    quantidade: number;
    adicionais: ItemCarrinhoAdicional[];
    observacao: string;
  }): void {
    this.carrinhoService.adicionar(
      event.produto,
      event.quantidade,
      event.adicionais,
      event.observacao
    );
    this.fecharModal();
    this.mostrarToast();
  }

  abrirCarrinho(): void {
    this.carrinhoAberto = true;
  }

  fecharCarrinho(): void {
    this.carrinhoAberto = false;
  }

  onCarrinhoBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fecharCarrinho();
    }
  }

  atualizarQuantidadeItem(itemId: string, quantidade: number): void {
    this.carrinhoService.atualizarQuantidade(itemId, quantidade);
  }

  removerItem(itemId: string): void {
    this.carrinhoService.remover(itemId);
  }

  escolherModalidade(tipo: 'delivery' | 'retirada'): void {
    if (this.tipoPedido === 'mesa' || !this.loja) {
      return;
    }
    this.tipoPedido = tipo;
    this.carrinhoService.definirSessao({
      lojaSlug: this.loja.slug,
      tipo
    });
  }

  continuarPedido(): void {
    if (!this.loja || !this.itensCarrinho.length) {
      return;
    }
    this.fecharCarrinho();
    void this.router.navigate(['/', this.loja.slug, 'checkout']);
  }

  abrirMeusPedidos(): void {
    this.pedidosAberto = true;
  }

  fecharMeusPedidos(): void {
    this.pedidosAberto = false;
  }

  onPedidosBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fecharMeusPedidos();
    }
  }

  acompanharPedido(pedido: Pedido): void {
    this.fecharMeusPedidos();
    void this.router.navigate(['/', pedido.lojaSlug, 'pedido', pedido.id]);
  }

  irParaInicio(): void {
    void this.router.navigate(['/chama-burger']);
  }

  private atualizarMeusPedidos(): void {
    if (!this.lojaSlug) {
      this.meusPedidos = [];
      this.pedidoAtivo = null;
      return;
    }

    this.meusPedidos = this.pedidoService
      .listar()
      .filter((pedido) => pedido.lojaSlug === this.lojaSlug)
      .slice(0, 10);

    this.pedidoAtivo =
      this.meusPedidos.find(
        (pedido) => !['finalizado', 'cancelado'].includes(pedido.status)
      ) ?? null;
  }

  private atualizarGrupos(): void {
    const filtrados = this.cardapioService.filtrarProdutos(
      this.produtos,
      this.busca,
      this.categoriaAtiva
    );

    const categoriasVisiveis = this.categoriaAtiva
      ? this.categorias.filter((cat) => cat.id === this.categoriaAtiva)
      : this.categorias;

    this.grupos = categoriasVisiveis
      .map((categoria) => ({
        categoria,
        produtos: filtrados.filter((produto) => produto.categoriaId === categoria.id)
      }))
      .filter((grupo) => grupo.produtos.length > 0);
  }

  private mostrarToast(): void {
    this.toastVisivel = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisivel = false;
    }, 2200);
  }
}
