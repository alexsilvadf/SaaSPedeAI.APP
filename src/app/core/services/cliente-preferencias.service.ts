import { Injectable } from '@angular/core';

const STORAGE_KEY = 'pedeai.cliente';

export interface PreferenciasCliente {
  nome: string;
  telefone: string;
  endereco?: string;
  complemento?: string;
  referencia?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientePreferenciasService {
  carregar(): PreferenciasCliente | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const dados = JSON.parse(raw) as PreferenciasCliente;
      if (!dados?.nome?.trim() || !dados?.telefone?.trim()) {
        return null;
      }
      return {
        nome: dados.nome.trim(),
        telefone: dados.telefone.trim(),
        endereco: dados.endereco?.trim() || undefined,
        complemento: dados.complemento?.trim() || undefined,
        referencia: dados.referencia?.trim() || undefined
      };
    } catch {
      return null;
    }
  }

  salvar(dados: PreferenciasCliente): void {
    const preferencias: PreferenciasCliente = {
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      endereco: dados.endereco?.trim() || undefined,
      complemento: dados.complemento?.trim() || undefined,
      referencia: dados.referencia?.trim() || undefined
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias));
  }

  limpar(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
