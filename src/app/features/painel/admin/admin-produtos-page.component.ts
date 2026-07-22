import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Categoria, Produto } from '../../../core/models';

@Component({
  selector: 'app-admin-produtos-page',
  templateUrl: './admin-produtos-page.component.html',
  styleUrls: ['./admin-produtos-page.component.css']
})
export class AdminProdutosPageComponent implements OnInit, OnDestroy {
  produtos: Produto[] = [];
  categorias: Categoria[] = [];
  editando: Produto | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly catalogo: CatalogoService) {}

  ngOnInit(): void {
    this.catalogo.produtos$.pipe(takeUntil(this.destroy$)).subscribe((lista) => {
      this.produtos = lista;
    });
    this.catalogo.categorias$.pipe(takeUntil(this.destroy$)).subscribe((lista) => {
      this.categorias = [...lista].sort((a, b) => a.ordem - b.ordem);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  novo(): void {
    this.editando = {
      id: `prod-${Date.now()}`,
      categoriaId: this.categorias[0]?.id ?? '',
      nome: '',
      descricao: '',
      preco: 0,
      imagemUrl: 'assets/food/photos/burger-smash.jpg',
      disponivel: true,
      gruposAdicionais: []
    };
  }

  editar(produto: Produto): void {
    this.editando = { ...produto };
  }

  salvar(): void {
    if (!this.editando || !this.editando.nome.trim()) {
      return;
    }
    this.catalogo.salvarProduto({
      ...this.editando,
      nome: this.editando.nome.trim(),
      descricao: this.editando.descricao.trim()
    });
    this.editando = null;
  }

  cancelar(): void {
    this.editando = null;
  }

  toggle(produto: Produto): void {
    this.catalogo.toggleDisponibilidade(produto.id);
  }

  nomeCategoria(id: string): string {
    return this.categorias.find((item) => item.id === id)?.nome ?? id;
  }
}
