import { Categoria, Entregador, Loja, Mesa, Produto, Usuario } from '../models';

export const MOCK_LOJA: Loja = {
  id: 'loja-1',
  slug: 'chama-burger',
  nome: 'Chama Burger',
  slogan: 'Fome boa começa aqui',
  logoUrl: 'assets/food/photos/logo.jpg',
  capaUrl: 'assets/food/photos/cover.jpg',
  aberta: true,
  horario: '11h – 23h',
  tempoEntregaMin: 35,
  taxaEntrega: 6.9
};

export const MOCK_MESAS: Mesa[] = [
  { id: 'mesa-1', numero: 1, status: 'livre' },
  { id: 'mesa-2', numero: 2, status: 'livre' },
  { id: 'mesa-3', numero: 3, status: 'livre' },
  { id: 'mesa-4', numero: 4, status: 'livre' },
  { id: 'mesa-5', numero: 5, status: 'livre' },
  { id: 'mesa-6', numero: 6, status: 'livre' },
  { id: 'mesa-7', numero: 7, status: 'livre' },
  { id: 'mesa-8', numero: 8, status: 'livre' },
  { id: 'mesa-12', numero: 12, status: 'livre' },
  { id: 'mesa-15', numero: 15, status: 'livre' }
];

export const MOCK_CATEGORIAS: Categoria[] = [
  { id: 'cat-destaques', nome: 'Destaques', ordem: 1 },
  { id: 'cat-burgers', nome: 'Burgers', ordem: 2 },
  { id: 'cat-porcoes', nome: 'Porções', ordem: 3 },
  { id: 'cat-bebidas', nome: 'Bebidas', ordem: 4 },
  { id: 'cat-sobremesas', nome: 'Sobremesas', ordem: 5 }
];

export const MOCK_USUARIOS: Usuario[] = [
  { id: 'u1', nome: 'Ana Admin', email: 'admin@chama.com', senha: '123456', perfil: 'admin' },
  { id: 'u2', nome: 'Bruno Garçom', email: 'garcom@chama.com', senha: '123456', perfil: 'garcom' },
  { id: 'u3', nome: 'Carla Cozinha', email: 'cozinha@chama.com', senha: '123456', perfil: 'cozinha' },
  { id: 'u4', nome: 'Diego Caixa', email: 'caixa@chama.com', senha: '123456', perfil: 'caixa' },
  { id: 'u5', nome: 'Edu Entregador', email: 'entrega@chama.com', senha: '123456', perfil: 'entregador' },
  { id: 'u6', nome: 'Lia Motoboy', email: 'lia@chama.com', senha: '123456', perfil: 'entregador' },
  { id: 'u7', nome: 'Rafa Bike', email: 'rafa@chama.com', senha: '123456', perfil: 'entregador' }
];

export const MOCK_ENTREGADORES: Entregador[] = [
  { id: 'ent-1', nome: 'Edu Entregador', telefone: '(11) 98888-0001', disponivel: true, usuarioId: 'u5' },
  { id: 'ent-2', nome: 'Lia Motoboy', telefone: '(11) 98888-0002', disponivel: true, usuarioId: 'u6' },
  { id: 'ent-3', nome: 'Rafa Bike', telefone: '(11) 98888-0003', disponivel: false, usuarioId: 'u7' }
];

export const MOCK_PRODUTOS: Produto[] = [
  {
    id: 'prod-1',
    categoriaId: 'cat-destaques',
    nome: 'Smash Flame',
    descricao: 'Dois smashs, cheddar derretido, cebola caramelizada e molho da casa no brioche tostado.',
    preco: 32.9,
    imagemUrl: 'assets/food/photos/burger-smash.jpg',
    disponivel: true,
    destaque: true,
    gruposAdicionais: [
      {
        id: 'grp-ponto',
        nome: 'Ponto da carne',
        obrigatorio: true,
        min: 1,
        max: 1,
        opcoes: [
          { id: 'adc-mal', nome: 'Mal passado', preco: 0 },
          { id: 'adc-ponto', nome: 'Ao ponto', preco: 0 },
          { id: 'adc-bem', nome: 'Bem passado', preco: 0 }
        ]
      },
      {
        id: 'grp-extras',
        nome: 'Extras',
        obrigatorio: false,
        min: 0,
        max: 4,
        opcoes: [
          { id: 'adc-bacon', nome: 'Bacon crocante', preco: 4.5 },
          { id: 'adc-ovo', nome: 'Ovo', preco: 3 },
          { id: 'adc-cheddar', nome: 'Cheddar extra', preco: 3.5 },
          { id: 'adc-jalapeno', nome: 'Jalapeño', preco: 2.5 }
        ]
      }
    ]
  },
  {
    id: 'prod-2',
    categoriaId: 'cat-destaques',
    nome: 'Combo Fome Zero',
    descricao: 'Smash Flame + batata rústica + refrigerante 350ml. O pedido que acaba com a dúvida.',
    preco: 44.9,
    imagemUrl: 'assets/food/photos/combo.jpg',
    disponivel: true,
    destaque: true,
    gruposAdicionais: [
      {
        id: 'grp-refri',
        nome: 'Refrigerante',
        obrigatorio: true,
        min: 1,
        max: 1,
        opcoes: [
          { id: 'adc-cola', nome: 'Cola', preco: 0 },
          { id: 'adc-guarana', nome: 'Guaraná', preco: 0 },
          { id: 'adc-limonada', nome: 'Limonada', preco: 1.5 }
        ]
      }
    ]
  },
  {
    id: 'prod-3',
    categoriaId: 'cat-burgers',
    nome: 'Classic Cheddar',
    descricao: 'Blend 160g, queijo cheddar, picles, alface americana e maionese defumada.',
    preco: 28.9,
    imagemUrl: 'assets/food/photos/burger-classic.jpg',
    disponivel: true,
    gruposAdicionais: [
      {
        id: 'grp-extras-2',
        nome: 'Extras',
        obrigatorio: false,
        min: 0,
        max: 3,
        opcoes: [
          { id: 'adc-bacon-2', nome: 'Bacon', preco: 4.5 },
          { id: 'adc-onion', nome: 'Onion rings', preco: 5 }
        ]
      }
    ]
  },
  {
    id: 'prod-4',
    categoriaId: 'cat-burgers',
    nome: 'Brasa BBQ',
    descricao: 'Costela desfiada, barbecue artesanal, cebola crispy e cream cheese.',
    preco: 36.5,
    imagemUrl: 'assets/food/photos/burger-bbq.jpg',
    disponivel: true,
    gruposAdicionais: []
  },
  {
    id: 'prod-5',
    categoriaId: 'cat-burgers',
    nome: 'Veggie Verde',
    descricao: 'Burger de grão-de-bico, abacate, rúcula e molho tahine. Sem fome e sem carne.',
    preco: 29.9,
    imagemUrl: 'assets/food/photos/burger-veggie.jpg',
    disponivel: false,
    gruposAdicionais: []
  },
  {
    id: 'prod-6',
    categoriaId: 'cat-porcoes',
    nome: 'Batata Brasa',
    descricao: 'Batatas rústicas com páprica defumada e maionese da casa.',
    preco: 18.9,
    imagemUrl: 'assets/food/photos/fries.jpg',
    disponivel: true,
    gruposAdicionais: [
      {
        id: 'grp-molho',
        nome: 'Molho extra',
        obrigatorio: false,
        min: 0,
        max: 2,
        opcoes: [
          { id: 'adc-cheddar-sauce', nome: 'Cheddar cremoso', preco: 4 },
          { id: 'adc-barbecue', nome: 'Barbecue', preco: 2.5 }
        ]
      }
    ]
  },
  {
    id: 'prod-7',
    categoriaId: 'cat-porcoes',
    nome: 'Onion Rings',
    descricao: 'Anéis crocantes com dip de mostarda e mel.',
    preco: 21.9,
    imagemUrl: 'assets/food/photos/onion-rings.jpg',
    disponivel: true,
    gruposAdicionais: []
  },
  {
    id: 'prod-8',
    categoriaId: 'cat-bebidas',
    nome: 'Milkshake de Chocolate',
    descricao: 'Cremoso, gelado e generoso. Ideal para acompanhar o smash.',
    preco: 16.9,
    imagemUrl: 'assets/food/photos/milkshake.jpg',
    disponivel: true,
    gruposAdicionais: []
  },
  {
    id: 'prod-9',
    categoriaId: 'cat-bebidas',
    nome: 'Refrigerante 350ml',
    descricao: 'Lata gelada para acompanhar o pedido.',
    preco: 7.5,
    imagemUrl: 'assets/food/photos/soda.jpg',
    disponivel: true,
    gruposAdicionais: []
  },
  {
    id: 'prod-10',
    categoriaId: 'cat-sobremesas',
    nome: 'Brownie Quente',
    descricao: 'Brownie com calda de chocolate e sorvete de creme.',
    preco: 19.9,
    imagemUrl: 'assets/food/photos/brownie.jpg',
    disponivel: true,
    destaque: true,
    gruposAdicionais: []
  }
];
