import { Stock } from '../interfaces/stock.interface';

export class StocksResponseDto {
  items: Stock[];
  nextToken?: string;
}
