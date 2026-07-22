import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quantidade-input',
  templateUrl: './quantidade-input.component.html',
  styleUrls: ['./quantidade-input.component.css']
})
export class QuantidadeInputComponent {
  @Input() value = 1;
  @Input() min = 1;
  @Input() max = 99;
  @Output() valueChange = new EventEmitter<number>();

  diminuir(): void {
    if (this.value <= this.min) {
      return;
    }
    this.valueChange.emit(this.value - 1);
  }

  aumentar(): void {
    if (this.value >= this.max) {
      return;
    }
    this.valueChange.emit(this.value + 1);
  }
}
