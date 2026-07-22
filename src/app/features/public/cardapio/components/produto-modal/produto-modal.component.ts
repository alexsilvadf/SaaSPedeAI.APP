import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Adicional, GrupoAdicional, ItemCarrinhoAdicional, Produto } from '../../../../../core/models';

@Component({
  selector: 'app-produto-modal',
  templateUrl: './produto-modal.component.html',
  styleUrls: ['./produto-modal.component.css']
})
export class ProdutoModalComponent implements OnChanges {
  @Input() produto: Produto | null = null;
  @Input() aberto = false;
  @Output() fechar = new EventEmitter<void>();
  @Output() adicionar = new EventEmitter<{
    produto: Produto;
    quantidade: number;
    adicionais: ItemCarrinhoAdicional[];
    observacao: string;
  }>();

  quantidade = 1;
  observacao = '';
  selecionados: Record<string, string[]> = {};
  erroValidacao = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produto'] || (changes['aberto'] && this.aberto)) {
      this.resetState();
    }
  }

  get precoUnitarioComExtras(): number {
    if (!this.produto) {
      return 0;
    }
    return this.produto.preco + this.somaAdicionais();
  }

  get totalPedido(): number {
    return this.precoUnitarioComExtras * this.quantidade;
  }

  isSelecionado(grupoId: string, adicionalId: string): boolean {
    return (this.selecionados[grupoId] ?? []).includes(adicionalId);
  }

  toggleAdicional(grupo: GrupoAdicional, opcao: Adicional): void {
    const atuais = [...(this.selecionados[grupo.id] ?? [])];
    const index = atuais.indexOf(opcao.id);

    if (index >= 0) {
      atuais.splice(index, 1);
    } else if (grupo.max === 1) {
      atuais.splice(0, atuais.length, opcao.id);
    } else if (atuais.length < grupo.max) {
      atuais.push(opcao.id);
    }

    this.selecionados = { ...this.selecionados, [grupo.id]: atuais };
    this.erroValidacao = '';
  }

  confirmar(): void {
    if (!this.produto) {
      return;
    }

    for (const grupo of this.produto.gruposAdicionais) {
      const qtd = (this.selecionados[grupo.id] ?? []).length;
      if (grupo.obrigatorio && qtd < grupo.min) {
        this.erroValidacao = `Escolha ${grupo.min} opção em "${grupo.nome}".`;
        return;
      }
    }

    this.adicionar.emit({
      produto: this.produto,
      quantidade: this.quantidade,
      adicionais: this.montarAdicionais(),
      observacao: this.observacao
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fechar.emit();
    }
  }

  private resetState(): void {
    this.quantidade = 1;
    this.observacao = '';
    this.erroValidacao = '';
    this.selecionados = {};

    if (!this.produto) {
      return;
    }

    for (const grupo of this.produto.gruposAdicionais) {
      if (grupo.obrigatorio && grupo.opcoes.length && grupo.max === 1) {
        this.selecionados[grupo.id] = [grupo.opcoes[0].id];
      } else {
        this.selecionados[grupo.id] = [];
      }
    }
  }

  private somaAdicionais(): number {
    return this.montarAdicionais().reduce((soma, item) => soma + item.preco, 0);
  }

  private montarAdicionais(): ItemCarrinhoAdicional[] {
    if (!this.produto) {
      return [];
    }

    const lista: ItemCarrinhoAdicional[] = [];
    for (const grupo of this.produto.gruposAdicionais) {
      for (const id of this.selecionados[grupo.id] ?? []) {
        const opcao = grupo.opcoes.find((item) => item.id === id);
        if (opcao) {
          lista.push({
            adicionalId: opcao.id,
            nome: opcao.nome,
            preco: opcao.preco
          });
        }
      }
    }
    return lista;
  }
}
