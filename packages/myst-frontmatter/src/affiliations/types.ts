export interface Affiliation {
  id?: string;
  name?: string; // by default required but if only institution is provided, it's ok
  institution?: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string; // or region or province
  postal_code?: string;
  country?: string;
  collaboration?: boolean;
  isni?: string;
  ringgold?: number;
  ror?: string;
  doi?: string;
  url?: string;
  email?: string;
  phone?: string;
  fax?: string;
}
