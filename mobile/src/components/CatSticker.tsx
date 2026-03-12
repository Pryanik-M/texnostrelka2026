import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  accent?: string;
};

export const CatSticker: React.FC<Props> = ({
  size = 96,
  color = '#f8fafc',
  accent = '#4de6c7',
}) => {
  const stroke = color;
  const highlight = accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="44" fill="none" stroke={stroke} strokeWidth="4" />
      <Path
        d="M32 40 L40 18 L52 36"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M88 40 L80 18 L68 36"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="46" cy="58" r="4" fill={highlight} />
      <Circle cx="74" cy="58" r="4" fill={highlight} />
      <Path
        d="M52 72 Q60 80 68 72"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M36 66 L16 62"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M36 74 L16 78"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M84 66 L104 62"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M84 74 L104 78"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
};
