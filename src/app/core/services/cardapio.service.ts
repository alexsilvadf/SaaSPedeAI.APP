import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogoService } from './catalogo.service';
import { Categoria, Produto } from '../models';

@Injectable({ providedIn: 'root' })
export class CardapioService {
  constructor(private readonly catalogo: CatalogoService) {}

  getCategorias(): Observable<Categoria[]> {
    return this.catalogo.getCategorias();
  }

  getProdutos(): Observable<Produto[]> {
    return this.catalogo.getProdutos();
  }

  getProduto(id: string): Observable<Produto | undefined> {
    return this.catalogo.getProduto(id);
  }

  filtrarProdutos(produtos: Produto[], termo: string, categoriaId?: string | null): Produto[] {
    return this.catalogo.filtrarProdutos(produtos, termo, categoriaId);
  }
}
