import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Mesa } from '../../../core/models';

@Component({
  selector: 'app-admin-mesas-page',
  templateUrl: './admin-mesas-page.component.html',
  styleUrls: ['./admin-mesas-page.component.css']
})
export class AdminMesasPageComponent implements OnInit, OnDestroy {
  mesas: Mesa[] = [];
  novoNumero = 16;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly catalogo: CatalogoService) {}

  ngOnInit(): void {
    this.catalogo.mesas$.pipe(takeUntil(this.destroy$)).subscribe((lista) => {
      this.mesas = [...lista].sort((a, b) => a.numero - b.numero);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  adicionar(): void {
    if (!this.novoNumero || this.mesas.some((mesa) => mesa.numero === this.novoNumero)) {
      return;
    }
    this.catalogo.salvarMesa({
      id: `mesa-${this.novoNumero}`,
      numero: this.novoNumero,
      status: 'livre'
    });
    this.novoNumero += 1;
  }

  liberar(mesa: Mesa): void {
    this.catalogo.setStatusMesa(mesa.id, 'livre');
  }
}
