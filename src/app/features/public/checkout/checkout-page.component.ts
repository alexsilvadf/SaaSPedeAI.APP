import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CarrinhoService } from '../../../core/services/carrinho.service';
import { ClientePreferenciasService } from '../../../core/services/cliente-preferencias.service';
import { LojaService } from '../../../core/services/loja.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { DadosCliente, ItemCarrinho, Loja, TipoPedido } from '../../../core/models';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  loja: Loja | null = null;
  lojaSlug = '';
  tipo: TipoPedido = 'delivery';
  mesaId?: string;
  mesaNumero?: number;
  itens: ItemCarrinho[] = [];
  subtotal = 0;
  enviando = false;
  erro = '';
  dadosSalvos = false;

  form: DadosCliente = {
    nome: '',
    telefone: '',
    endereco: '',
    complemento: '',
    referencia: '',
    formaPagamento: 'pix',
    observacao: ''
  };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly lojaService: LojaService,
    private readonly carrinhoService: CarrinhoService,
    private readonly pedidoService: PedidoService,
    private readonly clientePreferencias: ClientePreferenciasService
  ) {}

  ngOnInit(): void {
    this.preencherDadosSalvos();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.lojaSlug = params.get('lojaSlug') ?? '';
      this.lojaService.getBySlug(this.lojaSlug).subscribe({
        next: (loja) => (this.loja = loja),
        error: () => void this.router.navigate(['/'])
      });
    });

    const sessao = this.carrinhoService.getSessao();
    this.tipo = sessao?.tipo ?? 'delivery';
    this.mesaId = sessao?.mesaId;
    this.mesaNumero = sessao?.mesaNumero;

    if (sessao) {
      this.carrinhoService.definirSessao(sessao);
    }

    combineLatest([this.carrinhoService.carrinho$, this.carrinhoService.subtotal$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([carrinho, subtotal]) => {
        this.itens = carrinho.itens;
        this.subtotal = subtotal;
        if (!this.enviando && !carrinho.itens.length) {
          void this.router.navigate(['/', this.lojaSlug || 'chama-burger']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get taxaEntrega(): number {
    if (this.tipo !== 'delivery' || !this.loja) {
      return 0;
    }
    return this.loja.taxaEntrega;
  }

  get total(): number {
    return this.subtotal + this.taxaEntrega;
  }

  get tituloCanal(): string {
    if (this.tipo === 'mesa' && this.mesaNumero) {
      return `Mesa ${this.mesaNumero}`;
    }
    if (this.tipo === 'retirada') {
      return 'Retirada';
    }
    return 'Entrega';
  }

  voltar(): void {
    void this.router.navigate(['/', this.lojaSlug]);
  }

  confirmar(): void {
    this.erro = '';

    if (!this.form.nome.trim() || !this.form.telefone.trim()) {
      this.erro = 'Informe nome e telefone para continuar.';
      return;
    }

    if (this.tipo === 'delivery' && !this.form.endereco?.trim()) {
      this.erro = 'Informe o endereço de entrega.';
      return;
    }

    if (!this.loja || !this.itens.length) {
      return;
    }

    this.enviando = true;

    const cliente: DadosCliente = {
      ...this.form,
      nome: this.form.nome.trim(),
      telefone: this.form.telefone.trim(),
      endereco: this.form.endereco?.trim(),
      complemento: this.form.complemento?.trim(),
      referencia: this.form.referencia?.trim(),
      observacao: this.form.observacao?.trim()
    };

    this.clientePreferencias.salvar({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      complemento: cliente.complemento,
      referencia: cliente.referencia
    });

    const pedido = this.pedidoService.criarPedido({
      lojaSlug: this.loja.slug,
      tipo: this.tipo,
      itens: this.itens,
      subtotal: this.subtotal,
      taxaEntrega: this.taxaEntrega,
      mesaId: this.mesaId,
      mesaNumero: this.mesaNumero,
      cliente
    });

    void this.router.navigate(['/', this.loja.slug, 'pedido', pedido.id]);
  }

  private preencherDadosSalvos(): void {
    const salvos = this.clientePreferencias.carregar();
    if (!salvos) {
      return;
    }

    this.dadosSalvos = true;
    this.form = {
      ...this.form,
      nome: salvos.nome,
      telefone: salvos.telefone,
      endereco: salvos.endereco ?? '',
      complemento: salvos.complemento ?? '',
      referencia: salvos.referencia ?? ''
    };
  }
}
