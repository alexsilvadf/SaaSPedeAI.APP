import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, PerfilGuard } from './core/guards/auth.guard';
import { CardapioPageComponent } from './features/public/cardapio/cardapio-page.component';
import { CheckoutPageComponent } from './features/public/checkout/checkout-page.component';
import { PedidoConfirmadoPageComponent } from './features/public/pedido/pedido-confirmado-page.component';
import { PainelShellComponent } from './features/painel/painel-shell.component';
import { LoginPageComponent } from './features/painel/login/login-page.component';
import { CozinhaPageComponent } from './features/painel/cozinha/cozinha-page.component';
import { GarcomPageComponent } from './features/painel/garcom/garcom-page.component';
import { CaixaPageComponent } from './features/painel/caixa/caixa-page.component';
import { DeliveryPageComponent } from './features/painel/delivery/delivery-page.component';
import { EntregadorPageComponent } from './features/painel/entregador/entregador-page.component';
import { AdminDashboardPageComponent } from './features/painel/admin/admin-dashboard-page.component';
import { AdminProdutosPageComponent } from './features/painel/admin/admin-produtos-page.component';
import { AdminMesasPageComponent } from './features/painel/admin/admin-mesas-page.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'chama-burger' },
  { path: 'painel/login', component: LoginPageComponent },
  {
    path: 'painel',
    component: PainelShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin' },
      {
        path: 'admin',
        component: AdminDashboardPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['admin', 'gerente'] }
      },
      {
        path: 'admin/produtos',
        component: AdminProdutosPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['admin', 'gerente'] }
      },
      {
        path: 'admin/mesas',
        component: AdminMesasPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['admin', 'gerente'] }
      },
      {
        path: 'cozinha',
        component: CozinhaPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['cozinha', 'admin', 'gerente'] }
      },
      {
        path: 'garcom',
        component: GarcomPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['garcom', 'admin', 'gerente'] }
      },
      {
        path: 'caixa',
        component: CaixaPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['caixa', 'admin', 'gerente'] }
      },
      {
        path: 'delivery',
        component: DeliveryPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['admin', 'gerente', 'caixa'] }
      },
      {
        path: 'entregador',
        component: EntregadorPageComponent,
        canActivate: [PerfilGuard],
        data: { perfis: ['entregador'] }
      }
    ]
  },
  { path: ':lojaSlug/checkout', component: CheckoutPageComponent },
  { path: ':lojaSlug/pedido/:pedidoId', component: PedidoConfirmadoPageComponent },
  { path: ':lojaSlug/mesa/:mesaId', component: CardapioPageComponent },
  { path: ':lojaSlug/cardapio', component: CardapioPageComponent },
  { path: ':lojaSlug', component: CardapioPageComponent },
  { path: '**', redirectTo: 'chama-burger' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
