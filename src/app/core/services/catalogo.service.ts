import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  MOCK_CATEGORIAS,
  MOCK_ENTREGADORES,
  MOCK_MESAS,
  MOCK_PRODUTOS
} from '../data/mock-cardapio';
import { Categoria, Entregador, Mesa, Produto, StatusMesa } from '../models';

const KEY_PRODUTOS = 'pedeai.produtos';
const KEY_CATEGORIAS = 'pedeai.categorias';
const KEY_MESAS = 'pedeai.mesas';
const KEY_ENTREGADORES = 'pedeai.entregadores';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly produtosSubject = new BehaviorSubject<Produto[]>(this.carregar(KEY_PRODUTOS, MOCK_PRODUTOS));
  private readonly categoriasSubject = new BehaviorSubject<Categoria[]>(
    this.carregar(KEY_CATEGORIAS, MOCK_CATEGORIAS)
  );
  private readonly mesasSubject = new BehaviorSubject<Mesa[]>(this.carregar(KEY_MESAS, MOCK_MESAS));
  private readonly entregadoresSubject = new BehaviorSubject<Entregador[]>(
    this.carregarEntregadores()
  );

  readonly produtos$ = this.produtosSubject.asObservable();
  readonly categorias$ = this.categoriasSubject.asObservable();
  readonly mesas$ = this.mesasSubject.asObservable();
  readonly entregadores$ = this.entregadoresSubject.asObservable();

  getCategorias(): Observable<Categoria[]> {
    return this.categorias$.pipe(
      map((lista) => [...lista].sort((a, b) => a.ordem - b.ordem)),
      delay(80)
    );
  }

  getProdutos(): Observable<Produto[]> {
    return this.produtos$.pipe(
      map((lista) => lista.map((item) => ({ ...item }))),
      delay(80)
    );
  }

  getProduto(id: string): Observable<Produto | undefined> {
    return this.getProdutos().pipe(map((lista) => lista.find((item) => item.id === id)));
  }

  filtrarProdutos(produtos: Produto[], termo: string, categoriaId?: string | null): Produto[] {
    const busca = termo.trim().toLowerCase();
    return produtos.filter((produto) => {
      const bateCategoria = !categoriaId || produto.categoriaId === categoriaId;
      const bateBusca =
        !busca ||
        produto.nome.toLowerCase().includes(busca) ||
        produto.descricao.toLowerCase().includes(busca);
      return bateCategoria && bateBusca;
    });
  }

  salvarProduto(produto: Produto): void {
    const lista = [...this.produtosSubject.value];
    const index = lista.findIndex((item) => item.id === produto.id);
    if (index >= 0) {
      lista[index] = { ...produto };
    } else {
      lista.push({ ...produto });
    }
    this.persistir(KEY_PRODUTOS, lista, this.produtosSubject);
  }

  toggleDisponibilidade(produtoId: string): void {
    const lista = this.produtosSubject.value.map((item) =>
      item.id === produtoId ? { ...item, disponivel: !item.disponivel } : item
    );
    this.persistir(KEY_PRODUTOS, lista, this.produtosSubject);
  }

  salvarCategoria(categoria: Categoria): void {
    const lista = [...this.categoriasSubject.value];
    const index = lista.findIndex((item) => item.id === categoria.id);
    if (index >= 0) {
      lista[index] = { ...categoria };
    } else {
      lista.push({ ...categoria });
    }
    this.persistir(KEY_CATEGORIAS, lista, this.categoriasSubject);
  }

  getMesas(): Observable<Mesa[]> {
    return this.mesas$.pipe(
      map((lista) => [...lista].sort((a, b) => a.numero - b.numero)),
      delay(50)
    );
  }

  getMesa(mesaId: string): Observable<Mesa | undefined> {
    return of(
      this.mesasSubject.value.find(
        (item) => item.id === mesaId || String(item.numero) === mesaId
      )
    ).pipe(delay(40));
  }

  atualizarMesa(mesaId: string, patch: Partial<Mesa>): void {
    const lista = this.mesasSubject.value.map((mesa) =>
      mesa.id === mesaId ? { ...mesa, ...patch } : mesa
    );
    this.persistir(KEY_MESAS, lista, this.mesasSubject);
  }

  setStatusMesa(mesaId: string, status: StatusMesa, pedidoAtivoId?: string): void {
    this.atualizarMesa(mesaId, {
      status,
      pedidoAtivoId: status === 'livre' ? undefined : pedidoAtivoId
    });
  }

  salvarMesa(mesa: Mesa): void {
    const lista = [...this.mesasSubject.value];
    const index = lista.findIndex((item) => item.id === mesa.id);
    if (index >= 0) {
      lista[index] = { ...mesa };
    } else {
      lista.push({ ...mesa });
    }
    this.persistir(KEY_MESAS, lista, this.mesasSubject);
  }

  getEntregadores(): Observable<Entregador[]> {
    return this.entregadores$.pipe(delay(40));
  }

  toggleEntregador(id: string): void {
    const lista = this.entregadoresSubject.value.map((item) =>
      item.id === id ? { ...item, disponivel: !item.disponivel } : item
    );
    this.persistir(KEY_ENTREGADORES, lista, this.entregadoresSubject);
  }

  private carregarEntregadores(): Entregador[] {
    const salvos = this.carregar(KEY_ENTREGADORES, MOCK_ENTREGADORES);
    return salvos.map((item) => {
      const base = MOCK_ENTREGADORES.find((mock) => mock.id === item.id);
      return {
        ...item,
        usuarioId: item.usuarioId ?? base?.usuarioId
      };
    });
  }

  private carregar<T>(key: string, fallback: T[]): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return fallback.map((item) => ({ ...item }));
      }
      return JSON.parse(raw) as T[];
    } catch {
      return fallback.map((item) => ({ ...item }));
    }
  }

  private persistir<T>(key: string, lista: T[], subject: BehaviorSubject<T[]>): void {
    subject.next(lista);
    try {
      localStorage.setItem(key, JSON.stringify(lista));
    } catch {
      // ignore
    }
  }
}
