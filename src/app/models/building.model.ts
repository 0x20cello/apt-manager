import { Apartment } from './apartment.model';

export interface Building {
  id: string;
  name: string;
  apartments: Apartment[];
}
