import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrlPipe } from './shared/pipes/brl.pipe';
import { QuantidadeInputComponent } from './shared/components/quantidade-input/quantidade-input.component';
import { CarrinhoFabComponent } from './shared/components/carrinho-fab/carrinho-fab.component';
import { CardapioPageComponent } from './features/public/cardapio/cardapio-page.component';
import { ProdutoCardComponent } from './features/public/cardapio/components/produto-card/produto-card.component';
import { ProdutoModalComponent } from './features/public/cardapio/components/produto-modal/produto-modal.component';
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

@NgModule({
  declarations: [
    AppComponent,
    BrlPipe,
    QuantidadeInputComponent,
    CarrinhoFabComponent,
    CardapioPageComponent,
    ProdutoCardComponent,
    ProdutoModalComponent,
    CheckoutPageComponent,
    PedidoConfirmadoPageComponent,
    PainelShellComponent,
    LoginPageComponent,
    CozinhaPageComponent,
    GarcomPageComponent,
    CaixaPageComponent,
    DeliveryPageComponent,
    EntregadorPageComponent,
    AdminDashboardPageComponent,
    AdminProdutosPageComponent,
    AdminMesasPageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
