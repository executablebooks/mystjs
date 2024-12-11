import type { SiUnit } from 'myst-spec-ext';
import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const siRole: RoleSpec = {
  name: 'si',
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const value = data.body as string;
    const match = value.match(
      /* In verbose regex, the following pattern looks like        e.g. -1000,000,000.192e24
      ^
      (-?               # Optional unary negative                  e.g. -
          (             # <<< Decimal group
          \d+             # Leading integers (1+)                  e.g.  1000
              (,\d+)*     # Grouped runs of integers (0+)          e.g.     [,000,000]
              (\.\d+)?    # Optional decimal with trailing integer e.g.             [.192]
          )?            # Decimal is optional >>>
          (e\d+)?       # Optional scientific exponent             e.g.                 [e24]
      )
      \s?
      <([\\a-zA-Z\s]+)>
      $
       */
      /^(-?(\d+(,\d+)*(\.\d+)?)?(e\d+)?)\s?<([\\a-zA-Z\s]+)>$/,
    );
    if (!match) {
      return [{ type: 'si', error: true, value }];
    }
    const number = match[1];
    const commands = match[match.length - 1];
    const parsed = [...commands.matchAll(/\\([a-zA-Z]+)/g)];
    const units = parsed.filter((c) => !!c).map(([, c]) => c);
    const translated = units.map((c) => UNITS[c] ?? c);
    const si: SiUnit = {
      type: 'si',
      number,
      unit: translated.join(''),
      units,
      alt: units.join(' '),
      value: `${number} ${translated.join('')}`,
    };
    return [si];
  },
};

const UNITS: Record<string, string> = {
  ampere: 'A',
  candela: 'cd',
  kelvin: 'K',
  kilogram: 'kg',
  metre: 'm',
  meter: 'm',
  mole: 'mol',
  second: 's',
  becquerel: 'Bq',
  degreeCelsius: '°C',
  coulomb: 'C',
  farad: 'F',
  gray: 'Gy',
  hertz: 'Hz',
  henry: 'H',
  joule: 'J',
  lumen: 'lm',
  katal: 'kat',
  lux: 'lx',
  newton: 'N',
  ohm: 'Ω',
  pascal: 'Pa',
  radian: 'rad',
  siemens: 'S',
  sievert: 'Sv',
  steradian: 'sr',
  tesla: 'T',
  volt: 'V',
  watt: 'W',
  weber: 'Wb',
  astronomicalunit: 'au',
  bel: 'B',
  dalton: 'Da',
  day: 'd',
  decibel: 'dB',
  degree: '°',
  electronvolt: 'eV',
  hectare: 'ha',
  hour: 'h',
  litre: 'L',
  liter: 'L',
  arcminute: '′', // minute (plane angle) U+2032
  minute: 'min', // minute (time)
  arcsecond: '″', // second (plane angle) U+2033
  neper: 'Np',
  tonne: 't',
  // SI prefixes
  yocto: 'y', // -24
  zepto: 'z', // -21
  atto: 'a', // -18
  femto: 'f', // -15
  pico: 'p', // -12
  nano: 'n', // -9
  micro: 'µ', // -6
  milli: 'm', // -3
  centi: 'c', // -2
  deci: 'd', // -1
  deca: 'da', // 1
  hecto: 'h', // 2
  kilo: 'k', // 3
  mega: 'M', // 6
  giga: 'G', // 9
  tera: 'T', // 12
  peta: 'P', // 15
  exa: 'E', // 18
  zetta: 'Z', // 21
  yotta: 'Y', // 24
  // Special
  angstrom: 'Å',
};
