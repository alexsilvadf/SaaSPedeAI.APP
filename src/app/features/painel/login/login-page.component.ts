import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  email = 'cozinha@chama.com';
  senha = '123456';
  erro = '';
  carregando = false;
  demos: Usuario[] = [];

  constructor(private readonly auth: AuthService, private readonly router: Router) {
    this.demos = this.auth.usuariosDemo();
    if (this.auth.estaAutenticado()) {
      const usuario = this.auth.getUsuario();
      if (usuario) {
        void this.router.navigateByUrl(this.auth.rotaInicialPorPerfil(usuario.perfil));
      }
    }
  }

  entrar(): void {
    this.erro = '';
    this.carregando = true;
    this.auth.login(this.email, this.senha).subscribe((resultado) => {
      this.carregando = false;
      if (!resultado.ok) {
        this.erro = resultado.mensagem ?? 'Falha no login';
        return;
      }
      const usuario = this.auth.getUsuario();
      if (usuario) {
        void this.router.navigateByUrl(this.auth.rotaInicialPorPerfil(usuario.perfil));
      }
    });
  }

  usar(demo: Usuario): void {
    this.email = demo.email;
    this.senha = demo.senha;
    this.entrar();
  }
}
