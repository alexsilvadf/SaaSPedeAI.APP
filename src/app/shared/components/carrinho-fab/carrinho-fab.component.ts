import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-carrinho-fab',
  templateUrl: './carrinho-fab.component.html',
  styleUrls: ['./carrinho-fab.component.css']
})
export class CarrinhoFabComponent {
  @Input() quantidade = 0;
  @Input() subtotal = 0;
  @Output() abrir = new EventEmitter<void>();

  get visivel(): boolean {
    return this.quantidade > 0;
  }
}
