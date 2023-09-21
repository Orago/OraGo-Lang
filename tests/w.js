import { Enum, SymbolEnum } from '../Enum.js';

const cats = new Enum('orange', 'siamese', 'bengal', 'tiger', 'calico');

console.log([cats.values])

const test = new SymbolEnum('oranjnge', 'siam5ese', 'ben4214gal', 'tigwa12er', 'cd');

console.log([test.valueOf()])