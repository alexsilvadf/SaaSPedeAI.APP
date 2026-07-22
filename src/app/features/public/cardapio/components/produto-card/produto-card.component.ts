import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Produto } from '../../../../../core/models';

@Component({
  selector: 'app-produto-card',
  templateUrl: './produto-card.component.html',
  styleUrls: ['./produto-card.component.css']
})
export class ProdutoCardComponent {
  @Input() produto!: Produto;
  @Output() selecionar = new EventEmitter<Produto>();

  onSelect(): void {
    if (!this.produto.disponivel) {
      return;
    }
    this.selecionar.emit(this.produto);
  }
}
