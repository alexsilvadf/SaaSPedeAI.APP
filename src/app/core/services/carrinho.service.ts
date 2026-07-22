import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Carrinho, ItemCarrinho, ItemCarrinhoAdicional, Produto, SessaoPedido, TipoPedido } from '../models';

const STORAGE_KEY = 'pedeai.carrinho';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private readonly carrinhoSubject = new BehaviorSubject<Carrinho>(this.carregar());

  readonly carrinho$ = this.carrinhoSubject.asObservable();
  readonly quantidade$ = this.carrinho$.pipe(
    map((carrinho) => carrinho.itens.reduce((total, item) => total + item.quantidade, 0))
  );
  readonly subtotal$ = this.carrinho$.pipe(map((carrinho) => this.calcularSubtotal(carrinho)));

  private sessao: SessaoPedido | null = null;

  definirSessao(sessao: SessaoPedido): void {
    this.sessao = sessao;
    const atual = this.carrinhoSubject.value;
    if (atual.lojaSlug && atual.lojaSlug !== sessao.lojaSlug) {
      this.limpar();
    } else if (!atual.lojaSlug) {
      this.persistir({ ...atual, lojaSlug: sessao.lojaSlug });
    }
  }

  getSessao(): SessaoPedido | null {
    return this.sessao;
  }

  getTipoPedido(): TipoPedido {
    return this.sessao?.tipo ?? 'delivery';
  }

  adicionar(
    produto: Produto,
    quantidade: number,
    adicionais: ItemCarrinhoAdicional[],
    observacao: string
  ): void {
    if (!produto.disponivel || quantidade < 1) {
      return;
    }

    const lojaSlug = this.sessao?.lojaSlug ?? this.carrinhoSubject.value.lojaSlug;
    const precoUnitario =
      produto.preco + adicionais.reduce((soma, adicional) => soma + adicional.preco, 0);

    const item: ItemCarrinho = {
      id: `${produto.id}-${Date.now()}`,
      produtoId: produto.id,
      nome: produto.nome,
      imagemUrl: produto.imagemUrl,
      precoUnitario,
      quantidade,
      observacao: observacao.trim(),
      adicionais,
      statusPreparo: 'pendente',
      lancadoEm: new Date().toISOString()
    };

    const atual = this.carrinhoSubject.value;
    this.persistir({
      lojaSlug,
      itens: [...atual.itens, item]
    });
  }

  atualizarQuantidade(itemId: string, quantidade: number): void {
    const atual = this.carrinhoSubject.value;
    const itens =
      quantidade < 1
        ? atual.itens.filter((item) => item.id !== itemId)
        : atual.itens.map((item) =>
            item.id === itemId ? { ...item, quantidade } : item
          );

    this.persistir({ ...atual, itens });
  }

  remover(itemId: string): void {
    const atual = this.carrinhoSubject.value;
    this.persistir({
      ...atual,
      itens: atual.itens.filter((item) => item.id !== itemId)
    });
  }

  limpar(): void {
    this.persistir({ lojaSlug: this.sessao?.lojaSlug ?? '', itens: [] });
  }

  calcularSubtotal(carrinho: Carrinho = this.carrinhoSubject.value): number {
    return carrinho.itens.reduce(
      (total, item) => total + item.precoUnitario * item.quantidade,
      0
    );
  }

  private persistir(carrinho: Carrinho): void {
    this.carrinhoSubject.next(carrinho);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrinho));
    } catch {
      // ignore storage failures in private mode
    }
  }

  private carregar(): Carrinho {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { lojaSlug: '', itens: [] };
      }
      return JSON.parse(raw) as Carrinho;
    } catch {
      return { lojaSlug: '', itens: [] };
    }
  }
}
