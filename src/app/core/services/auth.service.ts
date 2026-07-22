import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_ENTREGADORES, MOCK_USUARIOS } from '../data/mock-cardapio';
import { Entregador, PerfilUsuario, Usuario } from '../models';

const KEY_AUTH = 'pedeai.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(this.carregar());
  readonly usuario$ = this.usuarioSubject.asObservable();

  login(email: string, senha: string): Observable<{ ok: boolean; mensagem?: string }> {
    const usuario = MOCK_USUARIOS.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.senha === senha
    );

    if (!usuario) {
      return of({ ok: false, mensagem: 'E-mail ou senha inválidos.' }).pipe(delay(250));
    }

    const sessao = { ...usuario, senha: '' };
    this.usuarioSubject.next(sessao);
    localStorage.setItem(KEY_AUTH, JSON.stringify(sessao));
    return of({ ok: true }).pipe(delay(250));
  }

  logout(): void {
    this.usuarioSubject.next(null);
    localStorage.removeItem(KEY_AUTH);
  }

  getUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  estaAutenticado(): boolean {
    return !!this.usuarioSubject.value;
  }

  temPerfil(...perfis: PerfilUsuario[]): boolean {
    const usuario = this.usuarioSubject.value;
    return !!usuario && perfis.includes(usuario.perfil);
  }

  getEntregadorDoUsuario(usuarioId?: string): Entregador | null {
    const id = usuarioId ?? this.usuarioSubject.value?.id;
    if (!id) {
      return null;
    }
    return MOCK_ENTREGADORES.find((item) => item.usuarioId === id) ?? null;
  }

  rotaInicialPorPerfil(perfil: PerfilUsuario): string {
    const map: Record<PerfilUsuario, string> = {
      admin: '/painel/admin',
      gerente: '/painel/admin',
      garcom: '/painel/garcom',
      cozinha: '/painel/cozinha',
      caixa: '/painel/caixa',
      entregador: '/painel/entregador'
    };
    return map[perfil];
  }

  usuariosDemo(): Usuario[] {
    return MOCK_USUARIOS.map((item) => ({ ...item }));
  }

  private carregar(): Usuario | null {
    try {
      const raw = localStorage.getItem(KEY_AUTH);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
