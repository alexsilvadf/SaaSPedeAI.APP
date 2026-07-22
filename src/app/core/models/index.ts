export type TipoPedido = 'delivery' | 'retirada' | 'mesa';

export type StatusMesa = 'livre' | 'ocupada' | 'aguardando_pagamento' | 'reservada';

export type StatusPedido =
  | 'recebido'
  | 'em_preparacao'
  | 'pronto'
  | 'saiu_entrega'
  | 'finalizado'
  | 'cancelado';

export type PerfilUsuario =
  | 'admin'
  | 'gerente'
  | 'garcom'
  | 'cozinha'
  | 'caixa'
  | 'entregador';

export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito';

export interface Loja {
  id: string;
  slug: string;
  nome: string;
  slogan: string;
  logoUrl: string;
  capaUrl: string;
  aberta: boolean;
  horario: string;
  tempoEntregaMin: number;
  taxaEntrega: number;
}

export interface Mesa {
  id: string;
  numero: number;
  status: StatusMesa;
  pedidoAtivoId?: string;
}

export interface Adicional {
  id: string;
  nome: string;
  preco: number;
  maxSelecoes?: number;
}

export interface GrupoAdicional {
  id: string;
  nome: string;
  obrigatorio: boolean;
  min: number;
  max: number;
  opcoes: Adicional[];
}

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
}

export interface Produto {
  id: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl: string;
  disponivel: boolean;
  destaque?: boolean;
  gruposAdicionais: GrupoAdicional[];
}

export type StatusPreparoItem = 'pendente' | 'preparando' | 'pronto';

export interface ItemCarrinhoAdicional {
  adicionalId: string;
  nome: string;
  preco: number;
}

export interface ItemCarrinho {
  id: string;
  produtoId: string;
  nome: string;
  imagemUrl: string;
  precoUnitario: number;
  quantidade: number;
  observacao: string;
  adicionais: ItemCarrinhoAdicional[];
  statusPreparo?: StatusPreparoItem;
  lancadoEm?: string;
}

export interface Carrinho {
  lojaSlug: string;
  itens: ItemCarrinho[];
}

export interface SessaoPedido {
  lojaSlug: string;
  tipo: TipoPedido;
  mesaId?: string;
  mesaNumero?: number;
}

export interface DadosCliente {
  nome: string;
  telefone: string;
  endereco?: string;
  complemento?: string;
  referencia?: string;
  formaPagamento: FormaPagamento;
  observacao?: string;
}

export interface Pedido {
  id: string;
  lojaSlug: string;
  tipo: TipoPedido;
  itens: ItemCarrinho[];
  total: number;
  subtotal: number;
  taxaEntrega: number;
  criadoEm: string;
  atualizadoEm: string;
  status: StatusPedido;
  cliente: DadosCliente;
  mesaId?: string;
  mesaNumero?: number;
  entregadorId?: string;
  entregadorNome?: string;
  pago: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
}

export interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  disponivel: boolean;
  usuarioId?: string;
}

export interface NotificacaoEntrega {
  id: string;
  entregadorId: string;
  pedidoId: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

export interface MovimentoCaixa {
  id: string;
  tipo: 'abertura' | 'venda' | 'sangria' | 'suprimento' | 'fechamento';
  valor: number;
  descricao: string;
  criadoEm: string;
  pedidoId?: string;
}
