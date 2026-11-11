// An icon from indx-pixl that npm does not have yet (built after 1.7.0, not published): copied
// as convert-icons.js generates it. When the next @indxsearch/pixl is out, import
// Field_profile_template from it and delete this file.
import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};



const Field_profile_template: React.FC<IconProps> = ({
  color,
  size = 21,
}) => {
  const aspectRatio = 0.7142857142857143;
  const width = size;
  const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 7 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
    <path d="M0 0H1V1H0ZM2 0H3V1H2ZM4 0H5V1H4ZM6 0H7V1H6ZM0 2H1V3H0ZM2 2H5V3H2ZM6 2H7V3H6ZM0 4H1V5H0ZM2 4H3V5H2ZM4 4H5V5H4ZM6 4H7V5H6Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export { Field_profile_template };
