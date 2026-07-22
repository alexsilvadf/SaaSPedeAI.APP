import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MovimentoCaixa } from '../models';

const KEY = 'pedeai.caixa';

interface EstadoCaixa {
  aberto: boolean;
  abertoEm?: string;
  saldo: number;
  movimentos: MovimentoCaixa[];
}

@Injectable({ providedIn: 'root' })
export class CaixaService {
  private readonly estadoSubject = new BehaviorSubject<EstadoCaixa>(this.carregar());
  readonly estado$ = this.estadoSubject.asObservable();

  get estado(): EstadoCaixa {
    return this.estadoSubject.value;
  }

  abrir(valorInicial: number): void {
    const movimento: MovimentoCaixa = {
      id: `cx-${Date.now()}`,
      tipo: 'abertura',
      valor: valorInicial,
      descricao: 'Abertura de caixa',
      criadoEm: new Date().toISOString()
    };
    this.persistir({
      aberto: true,
      abertoEm: movimento.criadoEm,
      saldo: valorInicial,
      movimentos: [movimento]
    });
  }

  registrarVenda(valor: number, pedidoId: string): void {
    if (!this.estado.aberto) {
      return;
    }
    const movimento: MovimentoCaixa = {
      id: `cx-${Date.now()}`,
      tipo: 'venda',
      valor,
      descricao: `Pagamento pedido ${pedidoId}`,
      criadoEm: new Date().toISOString(),
      pedidoId
    };
    const atual = this.estado;
    this.persistir({
      ...atual,
      saldo: atual.saldo + valor,
      movimentos: [movimento, ...atual.movimentos]
    });
  }

  sangria(valor: number, descricao: string): void {
    if (!this.estado.aberto || valor <= 0) {
      return;
    }
    const movimento: MovimentoCaixa = {
      id: `cx-${Date.now()}`,
      tipo: 'sangria',
      valor,
      descricao: descricao || 'Sangria',
      criadoEm: new Date().toISOString()
    };
    const atual = this.estado;
    this.persistir({
      ...atual,
      saldo: atual.saldo - valor,
      movimentos: [movimento, ...atual.movimentos]
    });
  }

  fechar(): void {
    if (!this.estado.aberto) {
      return;
    }
    const atual = this.estado;
    const movimento: MovimentoCaixa = {
      id: `cx-${Date.now()}`,
      tipo: 'fechamento',
      valor: atual.saldo,
      descricao: 'Fechamento de caixa',
      criadoEm: new Date().toISOString()
    };
    this.persistir({
      aberto: false,
      saldo: 0,
      movimentos: [movimento, ...atual.movimentos]
    });
  }

  private carregar(): EstadoCaixa {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as EstadoCaixa) : { aberto: false, saldo: 0, movimentos: [] };
    } catch {
      return { aberto: false, saldo: 0, movimentos: [] };
    }
  }

  private persistir(estado: EstadoCaixa): void {
    this.estadoSubject.next(estado);
    localStorage.setItem(KEY, JSON.stringify(estado));
  }
}
