import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { PerfilUsuario, Usuario } from '../../core/models';

interface NavItem {
  label: string;
  path: string;
  perfis: PerfilUsuario[];
  badge?: number;
}

@Component({
  selector: 'app-painel-shell',
  templateUrl: './painel-shell.component.html',
  styleUrls: ['./painel-shell.component.css']
})
export class PainelShellComponent implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  avisosEntregador = 0;

  readonly nav: NavItem[] = [
    { label: 'Dashboard', path: '/painel/admin', perfis: ['admin', 'gerente'] },
    { label: 'Produtos', path: '/painel/admin/produtos', perfis: ['admin', 'gerente'] },
    { label: 'Mesas', path: '/painel/admin/mesas', perfis: ['admin', 'gerente'] },
    { label: 'Garçom', path: '/painel/garcom', perfis: ['garcom', 'admin', 'gerente'] },
    { label: 'Cozinha', path: '/painel/cozinha', perfis: ['cozinha', 'admin', 'gerente'] },
    { label: 'Caixa', path: '/painel/caixa', perfis: ['caixa', 'admin', 'gerente'] },
    { label: 'Despacho', path: '/painel/delivery', perfis: ['admin', 'gerente', 'caixa'] },
    { label: 'Minhas entregas', path: '/painel/entregador', perfis: ['entregador'] }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly auth: AuthService,
    private readonly notificacaoService: NotificacaoService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.auth.usuario$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((usuario) => {
          this.usuario = usuario;
          const entregador = this.auth.getEntregadorDoUsuario(usuario?.id);
          if (!entregador) {
            this.avisosEntregador = 0;
            return of([]);
          }
          return this.notificacaoService.naoLidas$(entregador.id);
        })
      )
      .subscribe((lista) => {
        this.avisosEntregador = lista.length;
      });

    timer(0, 2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.notificacaoService.refreshFromStorage());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  podeVer(item: NavItem): boolean {
    if (!this.usuario) {
      return false;
    }
    if (item.path === '/painel/entregador') {
      return this.usuario.perfil === 'entregador';
    }
    return (
      item.perfis.includes(this.usuario.perfil) ||
      this.usuario.perfil === 'admin' ||
      this.usuario.perfil === 'gerente'
    );
  }

  badge(item: NavItem): number {
    if (item.path === '/painel/entregador') {
      return this.avisosEntregador;
    }
    return 0;
  }

  sair(): void {
    this.auth.logout();
    void this.router.navigate(['/painel/login']);
  }
}
