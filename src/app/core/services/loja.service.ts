import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_LOJA } from '../data/mock-cardapio';
import { CatalogoService } from './catalogo.service';
import { Loja, Mesa } from '../models';

@Injectable({ providedIn: 'root' })
export class LojaService {
  constructor(private readonly catalogo: CatalogoService) {}

  getBySlug(slug: string): Observable<Loja> {
    if (slug !== MOCK_LOJA.slug) {
      return throwError(() => new Error('Loja não encontrada'));
    }
    return of({ ...MOCK_LOJA }).pipe(delay(100));
  }

  getMesa(mesaId: string): Observable<Mesa | undefined> {
    return this.catalogo.getMesa(mesaId);
  }
}
