import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PerfilUsuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.estaAutenticado()) {
      return true;
    }
    return this.router.parseUrl('/painel/login');
  }
}

@Injectable({ providedIn: 'root' })
export class PerfilGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const perfis = (route.data['perfis'] as PerfilUsuario[]) ?? [];
    if (!perfis.length || this.auth.temPerfil(...perfis) || this.auth.temPerfil('admin', 'gerente')) {
      return true;
    }
    const usuario = this.auth.getUsuario();
    if (!usuario) {
      return this.router.parseUrl('/painel/login');
    }
    return this.router.parseUrl(this.auth.rotaInicialPorPerfil(usuario.perfil));
  }
}
