import { CakeSlice, Coffee, Croissant, EggFried, IceCreamBowl, Sandwich, ShoppingBag } from 'lucide-react'
import { photo } from '../lib/format'
import type { Category, MenuItem, Variant } from '../types'

// La Sablée · Calle Real. Source: carta-optimizada.md (prices in COP); sections follow the printed carta.
// Hues stay inside the terracotta family (analogous on the colour wheel);
// each category reads as its food. Sheet ink/accent pairs are ≥4.5:1 (accent ≥3:1 as large text).
// A category with a single subcategory shows no chips.
export const CATEGORIES: Category[] = [
  {
    id: 'desayunos',
    name: 'Desayunos',
    icon: EggFried,
    subcategories: [
      { id: 'huevos', name: 'Huevos' },
      { id: 'brunch', name: 'Brunch' },
    ],
    sheet: '#A9472A',
    ink: '#FFF4EA',
    accent: '#FFD9BD',
  },
  {
    id: 'sandwiches',
    name: 'Sándwiches',
    icon: Sandwich,
    subcategories: [{ id: 'todos', name: 'Sándwiches' }],
    sheet: '#6E2A20',
    ink: '#FAEEE6',
    accent: '#F4B597',
  },
  {
    id: 'panaderia',
    name: 'Panadería',
    icon: Croissant,
    subcategories: [
      { id: 'croissants', name: 'Croissants' },
      { id: 'dulce-sal', name: 'Dulce y sal' },
    ],
    sheet: '#B9773F',
    ink: '#2B1B13',
    accent: '#3E1A08',
  },
  {
    id: 'waffles',
    name: 'Waffles y bowls',
    icon: IceCreamBowl,
    subcategories: [
      { id: 'waffles', name: 'Waffles' },
      { id: 'bowls', name: 'Bowls' },
    ],
    sheet: '#E0B36A',
    ink: '#2B1B13',
    accent: '#5E2810',
  },
  {
    id: 'postres',
    name: 'Postres',
    icon: CakeSlice,
    subcategories: [
      { id: 'tortas', name: 'Tortas' },
      { id: 'pasteleria', name: 'Pastelería' },
      { id: 'helados', name: 'Helados' },
    ],
    sheet: '#EBC9C0',
    ink: '#3A1E19',
    accent: '#8C2F25',
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: Coffee,
    subcategories: [
      { id: 'calientes', name: 'Calientes' },
      { id: 'frias', name: 'Frías' },
    ],
    sheet: '#7A4E35',
    ink: '#FBF1E6',
    accent: '#F6CBA8',
  },
  {
    id: 'llevar',
    name: 'Para llevar',
    icon: ShoppingBag,
    subcategories: [
      { id: 'tortas', name: 'Tortas enteras' },
      { id: 'panes', name: 'Panes' },
    ],
    sheet: '#4A3A30',
    ink: '#FBF1E6',
    accent: '#E9C29F',
  },
]

const TOPPINGS = 'Toppings: chocolate, arequipe, miel, leche condensada, frutos amarillos o rojos, yogurt griego, crema de quesos o queso crema.'
const ALMENDRAS = 'Cámbiala a leche de almendras por +$3.000.'

/** Lowest variant becomes the "desde" price. */
const from = (variants: Variant[]) => ({ variants, price: Math.min(...variants.map((v) => v.price)) })

type Raw = Omit<MenuItem, 'category' | 'sub' | 'img' | 'imgBlur' | 'imgBack'> & { photo: string; crop?: [number, number, number] }
const group = (category: string, sub: string, items: Raw[]): MenuItem[] =>
  items.map(({ photo: id, crop = [0.5, 0.5, 1.15], ...rest }) => ({ ...rest, category, sub, ...photo([id, ...crop]) }))

export const MENU: MenuItem[] = [
  // ── Desayunos ─────────────────────────────────────────────────────────
  ...group('desayunos', 'huevos', [
    {
      id: 'al-gusto',
      name: 'Al gusto',
      price: 17000,
      tagline: 'Tres huevos como los prefieras, con jamón y mozzarella.',
      description: '3 huevos pochados, revueltos, pericos o fritos, con jamón, queso mozzarella, pan francés y 1 topping.',
      ingredients: ['Huevos', 'Jamón', 'Mozzarella', 'Pan francés'],
      note: TOPPINGS,
      photo: '1652878530811-ab17edfcfff6',
    },
    {
      id: 'rancheros',
      name: 'Rancheros',
      price: 20000,
      tagline: 'Huevos revueltos con chorizo santarrosano y hogao.',
      description: '3 huevos revueltos con chorizo santarrosano, jamón, mozzarella y hogao, con pan francés y 1 topping.',
      ingredients: ['Huevos', 'Chorizo santarrosano', 'Jamón', 'Mozzarella', 'Hogao'],
      note: TOPPINGS,
      tags: ['casa'],
      photo: '1633372363856-f2fe2669a26e',
    },
    {
      id: 'omelettes',
      name: 'Omelettes',
      tagline: 'Americano o santarrosano, con pan francés y un topping.',
      description: 'Elige tu omelette. Siempre con pan francés y 1 topping.',
      ...from([
        { name: 'Americano — jamón, mozzarella, tocineta, maicitos, crema de quesos', price: 22000 },
        { name: 'Santarrosano — hogao, chorizo, crema de quesos, mozzarella', price: 22000 },
      ]),
      note: TOPPINGS,
      photo: '1646579933415-92109f9805df',
    },
    {
      id: 'tortilla',
      name: 'Tortilla española',
      price: 24000,
      tagline: 'Papa, chorizo santarrosano y cebolla caramelizada.',
      description: 'Huevos, chorizo santarrosano, papas, cebolla caramelizada y crema de quesos, con pan francés y 1 topping.',
      ingredients: ['Huevos', 'Papa', 'Chorizo santarrosano', 'Cebolla caramelizada', 'Crema de quesos'],
      note: TOPPINGS,
      photo: '1788462613199-779ba2bf4b70',
    },
  ]),
  ...group('desayunos', 'brunch', [
    {
      id: 'pannecook-huevos',
      group: 'Pannecook',
      name: 'Pannecook de huevos',
      tagline: 'Dos pochados en pan horneado, en tres versiones.',
      description: '2 huevos pochados servidos en pannecook, con crema de quesos y 1 topping.',
      ...from([
        { name: 'Benedictinos — holandesa, jamón, tocineta', price: 22000 },
        { name: 'Champiñones — guacamole, tomates secos', price: 22000 },
        { name: 'Tocineta — parmesano, champiñones, tomates secos', price: 22000 },
      ]),
      note: TOPPINGS,
      tags: ['casa'],
      photo: '1608039829572-78524f79c4c7',
    },
    {
      id: 'pannecook-pollo',
      group: 'Pannecook',
      name: 'Pannecook de pollo',
      price: 26000,
      tagline: 'Pollo y champiñones gratinados con parmesano.',
      description: 'Pannecook relleno de pollo y champiñones, gratinado con parmesano y mozzarella.',
      ingredients: ['Pollo', 'Champiñones', 'Parmesano', 'Mozzarella'],
      photo: '1683987143812-952dc1e75afa',
    },
    {
      id: 'cacerolas',
      group: 'Cacerolas',
      name: 'Cacerolas',
      tagline: 'Papas criollas en cazuela, de morrillo o de chicharrón.',
      description: 'Servidas en cazuela caliente con papas criollas.',
      ...from([
        { name: 'De morrillo — queso asado y huevo frito', price: 28000 },
        { name: 'De chicharrón La Fazenda — guacamole y pico de gallo', price: 28000 },
      ]),
      photo: '1601579112521-5d6badb0bf3c',
    },
  ]),

  // ── Sándwiches ────────────────────────────────────────────────────────
  ...group('sandwiches', 'todos', [
    { id: 'pavo', group: 'Aves', name: 'Jamón de pavo', price: 20000, tagline: 'El clásico de la casa, ligero y fresco.', description: 'Sándwich de jamón de pavo en pan artesanal.', photo: '1553909489-cd47e0907980' },
    { id: 'pollo-stroganoff', group: 'Aves', name: 'Pollo stroganoff', price: 26000, tagline: 'Pollo en salsa stroganoff, cremoso y tibio.', description: 'Sándwich de pollo en salsa stroganoff.', photo: '1670710029403-607db8eeec83' },
    { id: 'morillo', group: 'Res', name: 'Carne de morillo', price: 26000, tagline: 'Morrillo desmechado, jugoso y especiado.', description: 'Sándwich de carne de morrillo.', photo: '1667055251919-88fd6ff02e86' },
    { id: 'bondiola', group: 'Cerdo', name: 'Bondiola de cerdo', price: 26000, tagline: 'Bondiola La Fazenda, cocida lento.', description: 'Sándwich de bondiola de cerdo La Fazenda.', tags: ['casa'], photo: '1567529855370-57ecd066454c' },
    { id: 'chicharron', group: 'Cerdo', name: 'Chicharrón carnudo', price: 26000, tagline: 'Chicharrón La Fazenda, crujiente y carnudo.', description: 'Sándwich de chicharrón carnudo La Fazenda.', tags: ['casa'], photo: '1700937244987-92488ab2ada5' },
    { id: 'atun', group: 'Atún', name: 'Atún Van Camps', price: 24000, tagline: 'Ensalada de atún cremosa y crujiente.', description: 'Sándwich de atún Van Camps en pan artesanal.', photo: '1558985250-27a406d64cb3' },
    { id: 'vegetariano', group: 'Vegetariano', name: 'Vegetariano', price: 22000, tagline: 'Vegetales frescos y quesos en pan artesanal.', description: 'Sándwich de vegetales y quesos en pan artesanal.', tags: ['vegetariano'], photo: '1590301155505-471f05cd02db' },
  ]),

  // ── Panadería ─────────────────────────────────────────────────────────
  ...group('panaderia', 'croissants', [
    {
      id: 'croissant-clasico',
      group: 'Clásico',
      name: 'Croissant clásico',
      tagline: 'Hojaldre de mantequilla, solo o relleno.',
      description: 'Nuestro croissant de mantequilla, horneado cada mañana.',
      ...from([
        { name: 'Solo', price: 7000 },
        { name: 'De queso', price: 10000 },
        { name: 'De jamón y queso', price: 12000 },
      ]),
      tags: ['casa'],
      photo: '1695055424321-a090931a97f1',
      crop: [0.5, 0.5, 1.3],
    },
    {
      id: 'croissants-dulces',
      group: 'Dulce',
      name: 'Croissants dulces',
      price: 14000,
      tagline: 'Red velvet, Nutella, almendras o pistacho.',
      description: 'Croissant relleno, a elegir: red velvet, Nutella, almendras o muselina de pistachos.',
      tags: ['vegetariano'],
      photo: '1648141294401-ede697a33c02',
    },
    { id: 'croissant-huevos', group: 'Con huevo', name: 'Croissant con huevos', price: 18000, tagline: 'Dos huevos al gusto con tocineta La Fazenda.', description: 'Croissant con 2 huevos al gusto, tocineta La Fazenda y crema de quesos.', photo: '1709208702638-c0cb072a0142' },
    { id: 'croissant-serrano', group: 'Con huevo', name: 'Croissant serrano', price: 22000, tagline: 'Jamón serrano, queso pera y aguacate.', description: 'Croissant con 2 huevos, queso pera, jamón serrano, aguacate y crema de quesos.', photo: '1639667852145-466e29aa49fd' },
  ]),
  ...group('panaderia', 'dulce-sal', [
    { id: 'almojabana', group: 'Panes', name: 'Almojábana y pan de bono', price: 5000, tagline: 'Almojábana, pan de yuca o pan de bono, recién horneados.', description: 'Elige almojábana, pan de yuca o pan de bono.', tags: ['sin-gluten'], photo: '1559141680-d0bd7bc5af84' },
    { id: 'palito-queso', group: 'Hojaldres', name: 'Palito de queso', price: 8000, tagline: 'Hojaldre crujiente relleno de queso.', description: 'Palito de hojaldre relleno de queso.', tags: ['vegetariano'], photo: '1778449665117-2c607bbc7415' },
    { id: 'hojaldre', group: 'Hojaldres', name: 'Hojaldre salado', price: 10000, tagline: 'De pollo stroganoff o de carne de morrillo.', description: 'Hojaldre relleno, a elegir: pollo stroganoff o carne de morrillo.', photo: '1682263167429-0dbcf2c1e127' },
    {
      id: 'migaito',
      group: 'Para mojar',
      name: 'Migaito',
      price: 18000,
      tagline: 'Jarra de chocolate para mojar, a la colombiana.',
      description: 'Jarra de chocolate con waffle, pan brioche, galletas, mozzarella, queso paipa y masmelos.',
      ingredients: ['Chocolate', 'Waffle', 'Pan brioche', 'Queso paipa', 'Masmelos'],
      tags: ['compartir'],
      photo: '1706341842409-39f198ac6e4c',
    },
    {
      id: 'tostada-francesa',
      group: 'Para mojar',
      name: 'Tostada francesa',
      price: 22000,
      tagline: 'Brioche dorado con yogurt griego y fruta fresca.',
      description: 'Pan brioche, yogurt griego, fresa, kiwi, arándanos y banano.',
      ingredients: ['Pan brioche', 'Yogurt griego', 'Fresa', 'Kiwi', 'Arándanos', 'Banano'],
      tags: ['vegetariano'],
      photo: '1484723091739-30a097e8f929',
    },
  ]),

  // ── Waffles, bowls y postres ─────────────────────────────────────────────────────────────
  ...group('waffles', 'waffles', [
    { id: 'waffle-clasico', group: 'Dulces', name: 'Waffle clásico', price: 14000, tagline: 'Tradicional o de pan de yuca, con dos toppings.', description: 'Waffle tradicional o de pan de yuca, con 2 toppings.', note: TOPPINGS, photo: '1773533276932-4ee7ea1d6361' },
    { id: 'waffle-helado', group: 'Dulces', name: 'Waffle con helado', price: 20000, tagline: 'Helado, crema montada y dos toppings.', description: 'Waffle tradicional o de pan de yuca, con helado, crema montada y 2 toppings.', note: TOPPINGS, photo: '1562513872-634b8fae6dbe' },
    { id: 'waffle-frutas', group: 'Dulces', name: 'Waffle con frutas', price: 24000, tagline: 'Helado, crema y fruta fresca de temporada.', description: 'Helado, crema montada, fresa, kiwi, arándanos y banano, con 2 toppings.', note: TOPPINGS, photo: '1653838049829-be00b1f4d59d' },
    { id: 'waffle-huevos', group: 'Salados', name: 'Waffle con huevos', price: 22000, tagline: 'Tres huevos al gusto, jamón y mozzarella.', description: 'Waffle con 3 huevos al gusto, jamón, mozzarella y 1 topping.', note: TOPPINGS, photo: '1648071588112-10acf7295463' },
    { id: 'waffle-santarrosano', group: 'Salados', name: 'Waffle santarrosano', price: 22000, tagline: 'Con chorizo santarrosano y dos toppings.', description: 'Waffle con chorizo santarrosano y 2 toppings.', note: TOPPINGS, photo: '1715398068878-ec85eecd44b1' },
  ]),
  ...group('waffles', 'bowls', [
    { id: 'bowl-frutas', name: 'Bowl de frutas', price: 14000, tagline: 'Fruta fresca, granola y dos toppings.', description: 'Fresa, kiwi, arándanos, banano, granola y 2 toppings.', note: TOPPINGS, tags: ['vegetariano'], photo: '1575023497656-1b8d04dc6f75' },
    {
      id: 'bowl-yogurt',
      name: 'Bowl de yogurt',
      tagline: 'Yogurt, fruta fresca y granola crocante.',
      description: 'Fresa, kiwi, arándanos, banano, granola y 1 topping.',
      ...from([
        { name: 'Con yogurt Alpina', price: 20000 },
        { name: 'Con yogurt griego', price: 22000 },
      ]),
      note: TOPPINGS,
      tags: ['vegetariano'],
      photo: '1504712598893-24159a89200e',
    },
  ]),
  ...group('postres', 'tortas', [
    {
      id: 'torta-porcion',
      name: 'Torta por porción',
      price: 10000,
      tagline: 'Once sabores en vitrina, de almendras a red velvet.',
      description: 'Pregunta por los sabores del día.',
      ingredients: ['Almendras', 'Red velvet', 'Chocolate', 'Zanahoria', 'Coco', 'Guanábana', 'Yogurt griego', 'Vasca de queso', 'Ahuyama', 'Amapola', 'Genovesa'],
      photo: '1761637604809-735817ea2bd2',
    },
    { id: 'cheesecake', name: 'Cheesecake', price: 11000, tagline: 'De frutos rojos o de Oreo.', description: 'Cheesecake cremoso, a elegir: frutos rojos u Oreo.', photo: '1695088957420-c3b97d1f1138' },
    { id: 'pie', name: 'Pie de limón o maracuyá', price: 11000, tagline: 'Base crocante y crema ácida de fruta.', description: 'Pie de limón o de maracuyá.', photo: '1543508185-225c92847541' },
    { id: 'philadelphia', name: 'Philadelphia de moras', price: 11000, tagline: 'Crema de queso con mermelada de moras.', description: 'Postre de queso philadelphia con moras.', photo: '1533134242443-d4fd215305ad' },
    { id: 'flan', name: 'Flan de caramelo', price: 11000, tagline: 'Suave, casero y bañado en caramelo.', description: 'Flan casero de caramelo.', tags: ['sin-gluten'], photo: '1702728109878-c61a98d80491' },
    { id: 'rol-canela', name: 'Rol de canela', price: 11000, tagline: 'Masa suave, canela y glaseado.', description: 'Rol de canela con glaseado.', photo: '1593872571314-4a735d4b27b0', crop: [0.5, 0.42, 1.4] },
  ]),
  ...group('postres', 'pasteleria', [
    { id: 'tiramisu', group: 'Cremosos', name: 'Tiramisú', price: 11000, tagline: 'Café, mascarpone y cacao amargo.', description: 'Tiramisú clásico con café y cacao.', photo: '1568627175730-73d05bd69ca9' },
    { id: 'mousse', group: 'Cremosos', name: 'Mousse', price: 15000, tagline: 'Ligero, aireado y muy chocolatoso.', description: 'Mousse de la casa.', photo: '1574473322501-1e5e28104f27' },
    { id: 'eclair', group: 'Francesa', name: 'Eclair', price: 13000, tagline: 'Pasta choux rellena de crema.', description: 'Eclair de pasta choux con crema pastelera.', photo: '1616534900667-d1e0ec646975' },
    { id: 'opera', group: 'Francesa', name: 'Ópera de chocolate', price: 13000, tagline: 'Capas de bizcocho, café y ganache.', description: 'Ópera de chocolate y café.', photo: '1577660618074-40c460c56df4' },
    { id: 'milhojas', group: 'Francesa', name: 'Milhojas', price: 15000, tagline: 'Hojaldre crujiente y crema pastelera.', description: 'Milhojas de hojaldre y crema.', photo: '1593424731252-a846f98af7e6' },
    { id: 'macarons', group: 'Francesa', name: 'Macarons y profiteroles', price: 8000, tagline: 'Bocados franceses para el café.', description: 'Macarons y profiteroles.', tags: ['casa'], photo: '1569864358642-9d1684040f43' },
  ]),
  ...group('postres', 'helados', [
    {
      id: 'brownie',
      name: 'Brownie',
      tagline: 'Denso y tibio, solo o con helado.',
      description: 'Brownie de chocolate.',
      ...from([
        { name: 'Solo', price: 9000 },
        { name: 'Con helado', price: 16000 },
      ]),
      photo: '1624353365286-3f8d62daad51',
      crop: [0.5, 0.45, 1.2],
    },
    {
      id: 'canasta-helado',
      name: 'Canasta de helado',
      tagline: 'Con crema montada y un topping.',
      description: 'Canasta de helado con crema montada y 1 topping.',
      ...from([
        { name: 'Sencilla', price: 10000 },
        { name: 'Doble', price: 16000 },
      ]),
      note: TOPPINGS,
      photo: '1580915411954-282cb1b0d780',
    },
  ]),

  // ── Bebidas ───────────────────────────────────────────────────────────
  ...group('bebidas', 'calientes', [
    {
      id: 'espresso',
      group: 'Café',
      name: 'Espresso y macchiato',
      tagline: 'Espresso doble de origen, corto e intenso.',
      description: 'Café de origen colombiano.',
      ...from([
        { name: 'Espresso doble 4 oz', price: 5000 },
        { name: 'Macchiato', price: 7000 },
      ]),
      photo: '1585357351695-0bc221a9327a',
      crop: [0.5, 0.5, 1.4],
    },
    {
      id: 'americano',
      group: 'Café',
      name: 'Americano',
      tagline: 'Del clásico al campesino con panela y limón.',
      description: 'Café americano de origen.',
      ...from([
        { name: '7 oz', price: 5000 },
        { name: '9 oz', price: 6000 },
        { name: 'Campesino — panela y limón', price: 7000 },
        { name: 'Carajillo — aguardiente o whisky', price: 10000 },
      ]),
      photo: '1601282354526-5907ac4dfef2',
    },
    {
      id: 'capuccino',
      group: 'Café',
      name: 'Capuccino o latte',
      tagline: 'Espresso y leche sedosa, a tu manera.',
      description: 'Capuccino o latte con leche texturizada.',
      ...from([
        { name: '7 oz', price: 7000 },
        { name: '9 oz', price: 8000 },
        { name: 'Vainilla', price: 9000 },
        { name: 'Con crema montada', price: 10000 },
        { name: 'Con Baileys o whisky', price: 12000 },
      ]),
      note: ALMENDRAS,
      tags: ['casa'],
      photo: '1506188044630-210826194885',
      crop: [0.5, 0.5, 1.7],
    },
    {
      id: 'moka',
      group: 'Café',
      name: 'Moka',
      tagline: 'Café, chocolate y leche, sola o con crema.',
      description: 'Moka de café y chocolate.',
      ...from([
        { name: 'Sola', price: 8000 },
        { name: 'Con crema montada', price: 11000 },
      ]),
      note: ALMENDRAS,
      photo: '1618576230663-9714aecfb99a',
    },
    { id: 'affogato', group: 'Café', name: 'Affogato', price: 11000, tagline: 'Espresso doble sobre helado de vainilla.', description: 'Espresso doble servido sobre helado.', photo: '1638543284847-3a6bed3e1689' },
  ]),
  ...group('bebidas', 'calientes', [
    {
      id: 'chocolate',
      group: 'Chocolate',
      name: 'Chocolate y Milo',
      tagline: 'Chocolate espeso de taza o Milo caliente.',
      description: 'Chocolate de taza o Milo.',
      ...from([
        { name: 'Chocolate 9 oz', price: 7000 },
        { name: 'Milo', price: 8000 },
      ]),
      note: ALMENDRAS,
      photo: '1731274128962-fc9bdf355952',
      crop: [0.45, 0.42, 1.55],
    },
    {
      id: 'aguapanela',
      group: 'Infusiones',
      name: 'Aguapanela',
      tagline: 'Sola, con leche o con queso, como en casa.',
      description: 'Aguapanela caliente.',
      ...from([
        { name: 'Sola', price: 4000 },
        { name: 'Con leche', price: 5000 },
        { name: 'Con queso', price: 8000 },
      ]),
      tags: ['vegano'],
      photo: '1792426429975-feb157a0f07c',
    },
    {
      id: 'tes',
      group: 'Infusiones',
      name: 'Tés y aromáticas',
      tagline: 'Infusiones, chai y aromática con frutas.',
      description: 'Tés e infusiones.',
      ...from([
        { name: 'Infusión', price: 5000 },
        { name: 'Té con leche', price: 7000 },
        { name: 'Chai original', price: 8000 },
        { name: 'Aromática con frutas', price: 10000 },
      ]),
      photo: '1766228271521-adcb73044667',
    },
    {
      id: 'licor',
      group: 'Con licor',
      name: 'Calientes con licor',
      tagline: 'Canelazo o vino caliente para la tarde.',
      description: 'Bebidas calientes con licor.',
      ...from([
        { name: 'Canelazo', price: 10000 },
        { name: 'Vino caliente', price: 18000 },
      ]),
      photo: '1512589848202-673dfdab1972',
    },
  ]),
  ...group('bebidas', 'frias', [
    {
      id: 'frappe',
      group: 'Café frío',
      name: 'Frappé de café',
      tagline: 'Café helado y cremoso, con o sin licor.',
      description: 'Frappé de café.',
      ...from([
        { name: 'Clásico', price: 15000 },
        { name: 'Vainilla', price: 17000 },
        { name: 'Baileys o whisky', price: 20000 },
      ]),
      photo: '1589396575653-c09c794ff6a6',
    },
    { id: 'latte-frio', group: 'Café frío', name: 'Latte frío de vainilla', price: 12000, tagline: 'Espresso, leche fría y vainilla.', description: 'Latte frío de vainilla sobre hielo.', photo: '1694718256173-add57556cb49', crop: [0.5, 0.5, 1.25] },
    { id: 'frappe-milo', group: 'Frappés y malteadas', name: 'Frappé de Milo o chai', price: 13000, tagline: 'Para los que prefieren sin café.', description: 'Frappé de Milo o de chai.', photo: '1702564696095-ba5110856bf2' },
    { id: 'malteada', group: 'Frappés y malteadas', name: 'Malteada', price: 20000, tagline: 'Ocho sabores, de Oreo a red velvet.', description: 'Malteada cremosa.', ingredients: ['Chocolate', 'Café', 'Milo', 'Brownie', 'Red velvet', 'Moka', 'Oreo', 'Arequipe'], photo: '1579954115545-a95591f28bfc' },
    {
      id: 'jugo',
      group: 'Jugos y limonadas',
      name: 'Jugo natural',
      tagline: 'Fruta fresca en agua o en leche.',
      description: 'Jugo de fruta natural.',
      ...from([
        { name: 'En agua', price: 9000 },
        { name: 'En leche', price: 12000 },
      ]),
      photo: '1766391237554-6d7042d7fbc8',
    },
    {
      id: 'limonada',
      group: 'Jugos y limonadas',
      name: 'Limonadas',
      tagline: 'De panela, café, yerbabuena, cereza o coco.',
      description: 'Limonadas de la casa.',
      ...from([
        { name: 'Panela, café o yerbabuena', price: 9000 },
        { name: 'Cerezada o de coco', price: 13000 },
      ]),
      photo: '1583571560278-e6799a3b98da',
    },
    {
      id: 'sodas',
      group: 'Sodas',
      name: 'Sodas',
      tagline: 'Botella, michelada o refrescante de frutos.',
      description: 'Sodas y refrescos.',
      ...from([
        { name: 'Botella', price: 6000 },
        { name: 'Michelada', price: 8000 },
        { name: 'Refrescante de frutos rojos o amarillos', price: 12000 },
      ]),
      note: 'También: agua manantial $6.000 · Coca-Cola 400 ml $6.000 · té Hatsu $8.000.',
      photo: '1581636625402-29b2a704ef13',
    },
    {
      id: 'cerveza',
      group: 'Alcohol',
      name: 'Cerveza',
      tagline: 'Corona fría, sola o michelada.',
      description: 'Cerveza Corona.',
      ...from([
        { name: 'Corona', price: 12000 },
        { name: 'Michelada', price: 14000 },
      ]),
      photo: '1457382713369-161d1d986f54',
    },
  ]),

  // ── Para llevar ───────────────────────────────────────────────────────
  ...group('llevar', 'tortas', [
    {
      id: 'tortas-enteras',
      name: 'Tortas y postres enteros',
      tagline: 'Para celebrar en casa, de 6 a 16 porciones.',
      description: 'Encarga tu torta o postre entero.',
      ...from([
        { name: 'Torta ¼ lb — 6 a 8 porciones', price: 45000 },
        { name: 'Torta ½ lb — 12 a 16 porciones', price: 80000 },
        { name: 'Postre rectangular — 6 a 8 porciones', price: 66000 },
        { name: 'Cheesecake — 12 o 16 porciones', price: 88000 },
      ]),
      tags: ['compartir'],
      photo: '1588195538326-c5b1e9f80a1b',
    },
  ]),
  ...group('llevar', 'panes', [
    {
      id: 'masa-madre',
      name: 'Pan de masa madre',
      tagline: 'Fermentación lenta, corteza crujiente.',
      description: 'Pan de masa madre artesanal.',
      ...from([
        { name: 'Solo', price: 12000 },
        { name: 'Relleno', price: 16000 },
      ]),
      photo: '1767065888377-e5ffb4e39645',
    },
    {
      id: 'brioche',
      name: 'Pan brioche',
      tagline: 'De molde, relleno o para hamburguesa.',
      description: 'Pan brioche de mantequilla.',
      ...from([
        { name: 'Hamburguesa', price: 3000 },
        { name: 'Molde', price: 12000 },
        { name: 'Relleno', price: 16000 },
      ]),
      note: 'También: pan francés $3.000.',
      photo: '1620416328855-f56e4e98637b',
    },
    {
      id: 'galletas',
      name: 'Galletas, hojaldres y merengues',
      tagline: 'Para acompañar el café en casa.',
      description: 'Galletas, hojaldres y merengues por paquete.',
      ...from([
        { name: 'Galletas o merengues', price: 7000 },
        { name: 'Hojaldres', price: 8000 },
      ]),
      photo: '1639678111962-88fffeb071cb',
    },
  ]),
]

export const itemsOf = (categoryId: string) => MENU.filter((m) => m.category === categoryId)
